import { describe, expect, it } from 'vitest';
import { MEMORIES } from '../../src/content/memories';
import { DEFAULT_PREFERENCES, runSchema } from '../../src/game/state';
import { CARDS, towerSolution } from '../../src/puzzles/rules';
import { move, solveCurrent, throughTrial } from '../helpers';

describe('cabin and tower persistence', () => {
  it('records one harmless shadow while preserving lamps, history, prior seals and undo', () => {
    let run = move(throughTrial('cabin'), { type: 'TOGGLE_LAMP', index: 1 });
    const lamps = [...run.puzzles.cabin.lamps], history = structuredClone(run.puzzles.cabin.history);
    run = move(run, { type: 'CHECK_LAMPS' }); expect(run.puzzles.cabin.lamps).toEqual(lamps); expect(run.puzzles.cabin.history).toEqual(history);
    expect(run.puzzles.studio.solved).toBe(true); expect(run.puzzles.cabin.solved).toBe(false); expect(run.puzzles.cabin.shadowSeen).toBe(true);
    const revision = run.revision; expect(move(run, { type: 'CHECK_LAMPS' }).revision).toBe(revision);
    run = runSchema.parse(JSON.parse(JSON.stringify(run))); run = move(run, { type: 'UNDO' }); expect(run.puzzles.cabin.lamps).toEqual([0, 0, 0, 0]);
    run = move(run, { type: 'RESET_PUZZLE' }); expect(run.puzzles.cabin.shadowSeen).toBe(true);
    run = solveCurrent(run); expect(run.puzzles.cabin.solved).toBe(true); expect(run.discoveries.filter(id => id === 'evanora.possession')).toHaveLength(1);
  });
  it('defaults the new shadow field in older saves and keeps completed seals', () => {
    const old = JSON.parse(JSON.stringify(throughTrial('tower'))); delete old.puzzles.cabin.shadowSeen;
    const run = runSchema.parse(old); expect(run.puzzles.cabin.solved).toBe(true); expect(run.puzzles.cabin.shadowSeen).toBe(false);
    expect(DEFAULT_PREFERENCES.muted).toBe(false);
  });
  it('keeps nonlinear fragments independent of the password and persists each only once', () => {
    let run = throughTrial('tower'); const deck = [...run.puzzles.tower.deck];
    expect(MEMORIES.map(item => item.id)).toEqual(['key', 'moon', 'cup', 'distance']);
    for (const memory of MEMORIES) run = move(run, { type: 'REVEAL_MEMORY', memory: memory.id });
    expect(run.puzzles.tower.memories).toEqual(['key', 'moon', 'cup', 'distance']); expect(run.puzzles.tower.deck).toEqual(deck);
    expect(run.puzzles.tower.solved).toBe(false); expect(run.puzzles.cabin.solved).toBe(true);
    const revision = run.revision, notes = [...run.journalEntries];
    run = runSchema.parse(JSON.parse(JSON.stringify(run))); run = move(run, { type: 'REVEAL_MEMORY', memory: 'key' });
    expect(run.revision).toBe(revision); expect(run.journalEntries).toEqual(notes);
    run = move(run, { type: 'RESET_PUZZLE' }); expect(run.puzzles.tower.memories).toHaveLength(4);
    expect(runSchema.safeParse({ ...run, puzzles: { ...run.puzzles, tower: { ...run.puzzles.tower, memories: ['key', 'key'] } } }).success).toBe(false);
    expect(() => move(throughTrial('cabin'), { type: 'REVEAL_MEMORY', memory: 'key' })).toThrow(/tower/);
  });
  it('never auto-reveals the fragments and confirms the physical order exactly once in reverse', () => {
    let run = throughTrial('tower');
    for (const moveName of towerSolution(run.puzzles.tower.deck)) run = move(run, { type: 'MOVE_DECK', move: moveName });
    run = move(run, { type: 'SUBMIT_DECK' }); expect(run.puzzles.tower.memories).toEqual([]);
    run = move(run, { type: 'PICK_CONFIRM', card: 'Door' }); run = runSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(run.puzzles.tower.stage).toBe('confirming'); expect(run.puzzles.tower.confirmation).toEqual(['Door']);
    expect(() => move(run, { type: 'MOVE_DECK', move: 'cut' })).toThrow();
    run = move(run, { type: 'CLEAR_CONFIRM' });
    for (const card of CARDS) run = move(run, { type: 'PICK_CONFIRM', card });
    expect(() => move(run, { type: 'CONFIRM_DECK' })).toThrow(/opposite seat/);
    run = move(run, { type: 'CLEAR_CONFIRM' }); for (const card of [...CARDS].reverse()) run = move(run, { type: 'PICK_CONFIRM', card });
    run = move(run, { type: 'CONFIRM_DECK' }); expect(run.puzzles.tower.solved).toBe(true); expect(run.discoveries).toContain('lilia.towerInversion');
    expect(() => move(run, { type: 'CONFIRM_DECK' })).toThrow(/complete/);
  });
  it('keeps the appointment envelope in the journal without changing card order or trial gates', () => {
    let run = throughTrial('tower'); const deck = [...run.puzzles.tower.deck]; run = move(run, { type: 'INSPECT_PROP', prop: 'envelope' });
    const revision = run.revision; run = move(run, { type: 'INSPECT_PROP', prop: 'envelope' }); expect(run.revision).toBe(revision);
    expect(run.puzzles.tower.deck).toEqual(deck); expect(run.puzzles.tower.solved).toBe(false); expect(run.discoveries).toContain('lilia.futureNote');
    expect(run.journalEntries.some(entry => entry.includes('You will have already asked'))).toBe(true);
  });
});
