import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';
import { ConflictError, IndexedRepository, type LoadResult, type SaveRepository } from '../../src/persistence/repository';
import { applyCommand } from '../../src/game/commands';
import { GameSession } from '../../src/game/session';
import { DEFAULT_PREFERENCES, createRun, type Preferences, type RunState } from '../../src/game/state';
import { cottageInterior, move, thresholdRun, throughTrial } from '../helpers';

const connections: IndexedRepository[] = [];
const repository = () => { const repo = new IndexedRepository(`test-road-${crypto.randomUUID()}`); connections.push(repo); return repo; };
afterEach(async () => { await Promise.all(connections.splice(0).map(repo => repo.close())); });

describe('IndexedDB snapshots and atomic revisions', () => {
  it('saves the timeout in the active slot and retains the collection, preferences and other slots', async () => {
    const repo = repository(), other = thresholdRun(), trial = throughTrial('studio');
    trial.trialClock!.endsAt = Date.now() - 1;
    await repo.save(other, null);
    await repo.save(trial, null);
    await repo.savePreferences({ ...DEFAULT_PREFERENCES, motion: 'reduced' });
    const session = new GameSession(repo);
    await session.boot();
    await session.dispatch({ type: 'DIAL_CODE', code: '23' });
    const view = session.getSnapshot();
    expect(view.lastCommand?.type).toBe('TRIAL_TIMEOUT');
    expect(view.run).toMatchObject({ runId: trial.runId, currentScene: 'cottage', trialClock: null });
    expect(view.collection).toContain('agatha.passwordPearls');
    expect(view.preferences.motion).toBe('reduced');
    expect(await repo.loadActive()).toEqual({ kind: 'loaded', run: view.run });
    expect(await repo.load(other.runId)).toEqual({ kind: 'loaded', run: other });
  });

  it('keeps a seal earned before the deadline if a stale tab tries to expire that trial', async () => {
    const repo = repository(), trial = throughTrial('studio'), expiredAt = Date.now() - 1;
    trial.trialClock!.endsAt = expiredAt;
    await repo.save(trial, null);
    const stale = new GameSession(repo);
    await stale.boot();
    const winner = applyCommand(trial, { type: 'DIAL_CODE', code: '23' }, [], expiredAt - 1).state;
    await repo.save(winner, trial.revision);
    await stale.dispatch({ type: 'TRIAL_TIMEOUT' });
    expect(stale.getSnapshot()).toMatchObject({ status: 'conflict', run: winner, lastCommand: null });
    expect(await repo.loadActive()).toEqual({ kind: 'loaded', run: winner });
  });

  it('leaves the selected slot active when a different tab automatically saves a timeout', async () => {
    const repo = repository(), trial = throughTrial('cabin'), selected = createRun('showcase');
    trial.trialClock!.endsAt = Date.now() - 1;
    await repo.save(trial, null);
    const background = new GameSession(repo);
    await background.boot();
    await repo.save(selected, null);
    await background.dispatch({ type: 'TRIAL_TIMEOUT' });
    expect(await repo.loadActive()).toEqual({ kind: 'loaded', run: selected });
    expect(await repo.load(trial.runId)).toMatchObject({ kind: 'loaded', run: { currentScene: 'cottage', trialClock: null } });
  });

  it('publishes the durable discovery collection with its saved run and uses it in a new slot', async () => {
    const repo = repository(), session = new GameSession(repo);
    await session.boot();
    let hunt = throughTrial('studio');
    for (const [scene, prop] of [['garden', 'gardenStone'], ['kitchen', 'kitchenCupboard'], ['studio', 'studioSpeaker']] as const) {
      hunt = move(move(hunt, { type: 'ENTER_SCENE', scene }), { type: 'INSPECT_ENCOUNTER', prop });
    }
    await session.importRun(JSON.stringify(hunt));
    expect(session.getSnapshot().collection).toContain('rabbit.third');
    expect(await repo.getCollection()).toEqual(session.getSnapshot().collection);
    const replay = new GameSession(repo, cottageInterior(createRun()));
    await replay.boot();
    await replay.newJourney('story');
    await replay.dispatch({ type: 'SET_COTTAGE_VIEW', view: 'inside' });
    expect(replay.getSnapshot().run.discoveries).toHaveLength(0);
    await replay.dispatch({ type: 'INSPECT_ENCOUNTER', prop: 'rabbitPortrait' });
    expect(replay.getSnapshot().run.discoveries).toEqual(['rabbit.clerkGlasses']);
    expect((await repo.getCollection()).filter(id => id === 'rabbit.third')).toHaveLength(1);
  });
  it('round-trips meaningful moves, active slot and preferences', async () => {
    const repo = repository(); const run = createRun(); await repo.save(run, null);
    const next = move(run, { type: 'STAMP_ALIAS', alias: 'Violet' }); await repo.save(next, run.revision);
    expect(await repo.loadActive()).toEqual({ kind: 'loaded', run: next });
    await repo.savePreferences({ ...DEFAULT_PREFERENCES, motion: 'reduced' }); expect((await repo.getPreferences()).motion).toBe('reduced');
    expect(await repo.list()).toEqual([next]);
  });
  it('rejects a stale second tab without silently overwriting or replaying', async () => {
    const repo = repository(); const run = createRun(); await repo.save(run, null);
    const winner = move(run, { type: 'STAMP_ALIAS', alias: 'Alice' }); await repo.save(winner, 0);
    const stale = move(run, { type: 'STAMP_ALIAS', alias: 'Lilia' }); await expect(repo.save(stale, 0)).rejects.toBeInstanceOf(ConflictError);
    expect(await repo.load(run.runId)).toEqual({ kind: 'loaded', run: winner });
    await expect(repo.save(run, null)).rejects.toBeInstanceOf(ConflictError);
  });
  it('keeps a previous valid checkpoint when the newest snapshot is damaged', async () => {
    const name = `recovery-${crypto.randomUUID()}`; const repo = new IndexedRepository(name); connections.push(repo);
    const first = createRun(); await repo.save(first, null); const second = move(first, { type: 'STAMP_ALIAS', alias: 'Violet' }); await repo.save(second, 0);
    const db = await openDB(name); const record = await db.get('runs', first.runId); record.current = { broken: true }; await db.put('runs', record, first.runId); db.close();
    const result = await repo.load(first.runId); expect(result.kind).toBe('recovered');
    if (result.kind === 'recovered') { expect(result.run).toEqual(first); expect(result.raw).toEqual({ broken: true }); }
    const session = new GameSession(repo); await session.boot(); expect(session.getSnapshot().run.runId).not.toBe(first.runId);
    expect(session.getSnapshot().recoveryExport).toEqual({ broken: true });
    expect((await repo.load(first.runId)).kind).toBe('recovered');
  });
  it('retains wholly corrupt or unsupported originals instead of resetting them in place', async () => {
    const name = `corrupt-${crypto.randomUUID()}`; const repo = new IndexedRepository(name); connections.push(repo);
    const run = createRun(); await repo.save(run, null); const db = await openDB(name);
    await db.put('runs', { current: { ...run, contentVersion: 'future-version' }, previous: null }, run.runId); db.close();
    const session = new GameSession(repo); await session.boot(); expect(session.getSnapshot().run.runId).not.toBe(run.runId);
    expect(session.getSnapshot().recoveryExport).not.toBeNull(); expect((await repo.load(run.runId)).kind).toBe('corrupt');
  });
  it('records discoveries atomically and does not duplicate collection rewards', async () => {
    const name = `collection-${crypto.randomUUID()}`; const repo = new IndexedRepository(name); connections.push(repo);
    const run = thresholdRun(); await repo.save(run, null); const db = await openDB(name);
    expect(await db.get('collection', 'discoveries')).toEqual(['agatha.passwordPearls']); db.close();
    const newer = move(run, { type: 'ENTER_SCENE', scene: 'kitchen' }); await repo.save(newer, run.revision);
    const verify = await openDB(name); expect(await verify.get('collection', 'discoveries')).toEqual(['agatha.passwordPearls']); verify.close();
  });
});

class FailableRepository implements SaveRepository {
  run: RunState | null = null; fail = false; preferences = { ...DEFAULT_PREFERENCES }; collection: string[] = [];
  async loadActive(): Promise<LoadResult> { return this.run ? { kind: 'loaded', run: structuredClone(this.run) } : { kind: 'empty' }; }
  async load(): Promise<LoadResult> { return this.loadActive(); }
  async save(run: RunState, expected: number | null) {
    if (this.fail) throw new Error('QuotaExceededError');
    if (expected === null ? this.run?.runId === run.runId : !this.run || this.run.runId !== run.runId || this.run.revision !== expected) throw new ConflictError();
    this.run = structuredClone(run);
    this.collection = [...new Set([...this.collection, ...run.discoveries])];
    return this.collection;
  }
  async getCollection() { return this.collection; }
  async list() { return this.run ? [this.run] : []; }
  async setActive() {}
  async getPreferences() { return this.preferences; }
  async savePreferences(preferences: Preferences) { this.preferences = preferences; }
}

describe('serialized session and failure recovery', () => {
  it('clears transient cue commands when creating, importing or resuming another slot', async () => {
    const repo = repository(), session = new GameSession(repo); await session.boot(); const originalId = session.getSnapshot().run.runId;
    await session.dispatch({ type: 'STAMP_ALIAS', alias: 'Quiet reload' }); expect(session.getSnapshot().lastCommand?.type).toBe('STAMP_ALIAS');
    await session.newJourney('showcase'); expect(session.getSnapshot().lastCommand).toBeNull();
    await session.resume(originalId); expect(session.getSnapshot().run.alias).toBe('Quiet reload'); expect(session.getSnapshot().lastCommand).toBeNull();
    await session.dispatch({ type: 'SET_COTTAGE_VIEW', view: 'inside' }); await session.importRun(JSON.stringify(createRun())); expect(session.getSnapshot().lastCommand).toBeNull();
  });
  it('serializes rapid commands against their most recent accepted state', async () => {
    const repo = repository(); const session = new GameSession(repo); await session.boot();
    await Promise.all([session.dispatch({ type: 'STAMP_ALIAS', alias: 'Violet' }), session.dispatch({ type: 'SUBMIT_ATTEMPTED_SPELL' }), session.dispatch({ type: 'START_RECOVERY' })]);
    expect(session.getSnapshot().run.currentScene).toBe('threshold'); expect(session.getSnapshot().status).toBe('saved');
    expect((await repo.loadActive()).kind).toBe('loaded');
  });
  it('continues in memory on failed writes and retries from the original saved revision', async () => {
    const repo = new FailableRepository(), session = new GameSession(repo); await session.boot(); repo.fail = true;
    await session.dispatch({ type: 'STAMP_ALIAS', alias: 'Unsaved Violet' }); await session.dispatch({ type: 'SUBMIT_ATTEMPTED_SPELL' });
    expect(session.getSnapshot().status).toBe('unsaved'); expect(session.getSnapshot().run.arrival.theftRecorded).toBe(true); expect(repo.run?.revision).toBe(0);
    expect(JSON.parse(session.exportRun()).alias).toBe('Unsaved Violet');
    repo.fail = false; await session.retrySave(); expect(session.getSnapshot().status).toBe('saved'); expect(repo.run?.revision).toBe(2);
  });
  it('does not overwrite newer tab state when retrying an unsaved branch', async () => {
    const repo = new FailableRepository(), session = new GameSession(repo); await session.boot(); repo.fail = true;
    await session.dispatch({ type: 'STAMP_ALIAS', alias: 'Unsaved branch' });
    repo.run = move(repo.run!, { type: 'STAMP_ALIAS', alias: 'Other tab' }); repo.fail = false; await session.retrySave();
    expect(repo.run.alias).toBe('Other tab'); expect(session.getSnapshot().status).toBe('unsaved'); expect(session.getSnapshot().recoveryExport).not.toBeNull();
  });
  it('loads the winning tab on command conflict without replaying the stale action', async () => {
    const repo = new FailableRepository(), first = new GameSession(repo), second = new GameSession(repo); await first.boot(); await second.boot();
    await first.dispatch({ type: 'STAMP_ALIAS', alias: 'First tab' }); await second.dispatch({ type: 'STAMP_ALIAS', alias: 'Second tab' });
    expect(second.getSnapshot().status).toBe('conflict'); expect(second.getSnapshot().run.alias).toBe('First tab'); expect(repo.run?.alias).toBe('First tab');
  });
  it('clears an older local cue command when a conflict loads a foreign action', async () => {
    const repo = new FailableRepository(), session = new GameSession(repo); await session.boot();
    await session.dispatch({ type: 'STAMP_ALIAS', alias: 'Local page' }); expect(session.getSnapshot().lastCommand?.type).toBe('STAMP_ALIAS');
    repo.run = move(repo.run!, { type: 'SUBMIT_ATTEMPTED_SPELL' });
    await session.dispatch({ type: 'INSPECT_PROP', prop: 'visibilityEye' });
    expect(session.getSnapshot().status).toBe('conflict'); expect(session.getSnapshot().run.arrival.theftRecorded).toBe(true);
    expect(session.getSnapshot().lastCommand).toBeNull(); expect(session.getSnapshot().recoveryExport).not.toBeNull();
  });
  it('imports as a new slot, rejects malformed input and leaves the original intact', async () => {
    const repo = repository(), session = new GameSession(repo); await session.boot();
    await session.dispatch({ type: 'STAMP_ALIAS', alias: 'Original' }); const original = session.getSnapshot().run;
    await session.importRun('{ invalid'); expect(session.getSnapshot().run).toEqual(original);
    await session.importRun(JSON.stringify({ ...original, schemaVersion: 999 })); expect(session.getSnapshot().run).toEqual(original);
    await session.importRun(session.exportRun()); expect(session.getSnapshot().run.runId).not.toBe(original.runId);
    expect((await repo.list()).length).toBe(2); expect((await repo.load(original.runId)).kind).toBe('loaded');
  });
  it('keeps preferences and completed old slots when creating a new journey', async () => {
    const repo = repository(), session = new GameSession(repo); await session.boot(); await session.setPreferences({ motion: 'reduced' });
    const original = session.getSnapshot().run.runId; await session.newJourney('showcase');
    expect(session.getSnapshot().run.runId).not.toBe(original); expect(session.getSnapshot().run.mode).toBe('showcase');
    expect(session.getSnapshot().preferences.motion).toBe('reduced'); expect((await repo.list()).length).toBe(2);
    await session.resume(original); expect(session.getSnapshot().run.mode).toBe('story');
  });
});
