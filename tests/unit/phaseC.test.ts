import { describe, expect, it } from 'vitest';
import { createRun, DEFAULT_PREFERENCES, preferencesSchema, runSchema } from '../../src/game/state';
import { completedRun, move, solveCurrent, throughTrial } from '../helpers';

describe('kitchen reactions and studio controls', () => {
  it('never changes jug quantities or completion when the timer rings, including repeated cues', () => {
    let run = move(throughTrial('kitchen'), { type: 'JUG', move: 'fill-large' }); const volumes = [...run.puzzles.kitchen.volumes];
    run = move(run, { type: 'KITCHEN_TIMER' }); expect(run.puzzles.kitchen.volumes).toEqual(volumes); expect(run.puzzles.kitchen.solved).toBe(false);
    const revision = run.revision; run = move(run, { type: 'KITCHEN_TIMER' }); expect(run.revision).toBe(revision);
    expect(run.discoveries.filter(id => id === 'jen.timerMitt')).toHaveLength(1); expect(solveCurrent(run).puzzles.kitchen.solved).toBe(true);
    expect(() => move(createRun(), { type: 'KITCHEN_TIMER' })).toThrow(/kitchen/);
  });
  it('counts accepted pours across undo/reset without duplicating the pumpkin reward', () => {
    let run = throughTrial('kitchen');
    for (let i = 0; i < 3; i++) {
      run = move(run, { type: 'JUG', move: 'fill-large' }); run = move(run, { type: 'JUG', move: 'pour-large' });
      run = move(run, { type: 'RESET_PUZZLE' });
    }
    expect(run.puzzles.kitchen.pours).toBe(3); expect(run.discoveries.filter(id => id === 'jen.pumpkinWitness')).toHaveLength(1);
    expect(run.puzzles.kitchen.solved).toBe(false);
  });
  it('keeps mixer, speakers and reversed playback independent of the verification answer', () => {
    let run = throughTrial('studio'); run = move(run, { type: 'SET_CHANNEL', index: 2, enabled: true });
    run = move(run, { type: 'TOGGLE_SPEAKERS' }); run = move(run, { type: 'REVERSE_RECORD' });
    run = runSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(run.puzzles.studio.channels).toEqual([false, false, true]); expect(run.puzzles.studio.speakersOpen).toBe(false); expect(run.puzzles.studio.reversed).toBe(true);
    expect(run.puzzles.studio.solved).toBe(false); run = move(run, { type: 'DIAL_CODE', code: '23' });
    expect(run.puzzles.studio.solved).toBe(true); expect(run.discoveries).toContain('alice.protectionRefrain');
    run = move(run, { type: 'REVERSE_RECORD' }); run = move(run, { type: 'REVERSE_RECORD' });
    expect(run.discoveries.filter(id => id === 'alice.backwardRecord')).toHaveLength(1);
    expect(() => move(run, { type: 'SET_CHANNEL', index: 3, enabled: true })).toThrow();
    expect(() => move(createRun(), { type: 'REVERSE_RECORD' })).toThrow(/studio/);
  });
  it('loads old version-one runs and preferences without losing trial progress', () => {
    const old = JSON.parse(JSON.stringify(completedRun())); delete old.puzzles.kitchen.pours; delete old.puzzles.kitchen.timerDismissed;
    delete old.puzzles.studio.channels; delete old.puzzles.studio.speakersOpen; delete old.puzzles.studio.reversed;
    const loaded = runSchema.parse(old); expect(loaded.milestones.hasSignedInOnce).toBe(true); expect(loaded.puzzles.tower.solved).toBe(true);
    expect(loaded.puzzles.kitchen.pours).toBe(0); expect(loaded.puzzles.studio.channels).toEqual([false, false, false]);
    const pref = preferencesSchema.parse({ muted: false, motion: 'reduced', textSize: 'large', actionList: true });
    expect(pref.masterVolume).toBe(DEFAULT_PREFERENCES.masterVolume); expect(pref.muted).toBe(false);
    expect(preferencesSchema.safeParse({ ...pref, musicVolume: 9 }).success).toBe(false);
  });
});
