import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TRIALS } from '../../src/content/scenes';
import { applyCommand } from '../../src/game/commands';
import { runSchema, TRIAL_DURATION_MS } from '../../src/game/state';
import { move, solveCurrent, thresholdRun, throughTrial } from '../helpers';

const startedAt = 1_800_000_000_000;
const endsAt = startedAt + TRIAL_DURATION_MS;

beforeEach(() => { vi.spyOn(Date, 'now').mockReturnValue(startedAt); });
afterEach(() => { vi.restoreAllMocks(); });

describe('five-minute trial clock', () => {
  it.each(TRIALS)('starts %s with five minutes and stops its clock when sealed', trial => {
    const run = throughTrial(trial);
    expect(run.trialClock).toEqual({ trial, endsAt: startedAt + 300_000 });
    vi.mocked(Date.now).mockReturnValue(endsAt - 1);
    const solved = solveCurrent(run);
    expect(solved.puzzles[trial].solved).toBe(true);
    expect(solved.trialClock).toBeNull();
    expect(applyCommand(solved, { type: 'TRIAL_TIMEOUT' }, [], endsAt).state).toBe(solved);
    expect(move(solved, { type: 'ENTER_SCENE', scene: trial }).trialClock).toBeNull();
  });

  it('keeps one deadline through puzzle resets, side trips and returns', () => {
    const run = throughTrial('cabin');
    vi.mocked(Date.now).mockReturnValue(startedAt + 120_000);
    let visiting = move(run, { type: 'RESET_PUZZLE' });
    for (const scene of ['threshold', 'kitchen', 'garden', 'cottage', 'cabin'] as const) {
      visiting = move(visiting, { type: 'ENTER_SCENE', scene });
      expect(visiting.trialClock).toEqual(run.trialClock);
    }
    const result = applyCommand(visiting, { type: 'TRIAL_TIMEOUT' }, [], endsAt - 1);
    expect(result.state).toBe(visiting);
    expect(result.message).toBe('');
  });

  it.each(['story', 'showcase'] as const)('sends a late %s action back to the start in the same save slot', mode => {
    const run = { ...throughTrial('studio'), mode };
    const lastMove = { type: 'DIAL_CODE', code: '23' } as const;
    expect(applyCommand(run, lastMove, [], endsAt - 1).state.puzzles.studio.solved).toBe(true);
    const expired = applyCommand(run, lastMove, [], endsAt);
    expect(expired.timedOut).toBe(true);
    expect(expired.message).toContain('Alice’s trial ran out of time');
    expect(expired.state).toMatchObject({
      runId: run.runId, mode, alias: run.alias, revision: run.revision + 1, currentScene: 'cottage', phase: 'arrival',
      cottageView: 'outside', arrival: { aliasStamped: true, theftRecorded: false }, threshold: { opened: false },
      trialClock: null,
    });
    expect(expired.state.threshold.placements).toEqual(Array(5).fill(null));
    expect(TRIALS.some(trial => expired.state.puzzles[trial].solved)).toBe(false);
    expect(runSchema.safeParse(expired.state).success).toBe(true);
    expect(applyCommand(expired.state, { type: 'TRIAL_TIMEOUT' }, [], endsAt + 1).state).toBe(expired.state);
  });

  it('gives each next trial a full five minutes and leaves optional rooms and the threshold untimed', () => {
    const threshold = thresholdRun();
    expect(threshold.trialClock).toBeNull();
    expect(move(threshold, { type: 'ENTER_SCENE', scene: 'garden' }).trialClock).toBeNull();
    const solved = solveCurrent(throughTrial('kitchen'));
    const entry = startedAt + 295_000;
    expect(applyCommand(solved, { type: 'ENTER_SCENE', scene: 'studio' }, [], entry).state.trialClock)
      .toEqual({ trial: 'studio', endsAt: entry + TRIAL_DURATION_MS });
  });

  it('reads an old save and arms it once after playable entry', () => {
    const old = throughTrial('tower');
    Reflect.deleteProperty(old, 'trialClock');
    const restored = runSchema.parse(old);
    expect(restored.trialClock).toBeNull();
    const arm = { type: 'START_TRIAL_CLOCK', runId: restored.runId, trial: 'tower' } as const;
    expect(move(restored, { ...arm, runId: crypto.randomUUID() })).toBe(restored);
    expect(move(restored, { ...arm, trial: 'greenhouse' })).toBe(restored);
    const started = move(restored, arm);
    expect(started.trialClock).toEqual({ trial: 'tower', endsAt });
    expect(started.statistics).toEqual(restored.statistics);
    expect(move(started, arm)).toBe(started);
    expect(runSchema.safeParse({ ...started, trialClock: { trial: 'greenhouse', endsAt } }).success).toBe(false);
    expect(runSchema.safeParse({ ...started, trialClock: { trial: 'kitchen', endsAt } }).success).toBe(false);
  });
});
