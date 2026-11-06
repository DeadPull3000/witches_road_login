import { describe, expect, it } from 'vitest';
import { applyCommand, type Command } from '../../src/game/commands';
import { towerSolution } from '../../src/puzzles/rules';
import { canEnter, canSignIn, createRun, runSchema } from '../../src/game/state';
import { TRIALS } from '../../src/content/scenes';
import { completedRun, move, solveCurrent, thresholdRun, throughTrial } from '../helpers';

describe('required route and command boundaries', () => {
  it('reaches a usable account and renewal with every optional puzzle skipped', () => {
    let state = completedRun(); expect(canSignIn(state)).toBe(true); expect(state.currentScene).toBe('account');
    expect(state.puzzles.garden.solved).toBe(false); expect(state.rememberEnabled).toBe(false);
    expect(TRIALS.every(t => state.puzzles[t].solved)).toBe(true);
    state = move(state, { type: 'RENEW_BOOK' }); expect(state.milestones.bookRenewed).toBe(true);
    const revision = state.revision; state = move(state, { type: 'RENEW_BOOK' });
    expect(state.revision).toBe(revision); expect(state.discoveries.filter(id => id === 'library.longReceipt')).toHaveLength(1);
    state = move(state, { type: 'SIGN_OUT' }); expect(state.currentScene).toBe('cottage');
    state = move(state, { type: 'SIGN_IN' }); expect(state.milestones.bookRenewed).toBe(true);
  });
  it('requires the final unbinding and still permits retries at the knocker', () => {
    let state = solveCurrent(throughTrial('greenhouse')); state = move(state, { type: 'ENTER_SCENE', scene: 'cottage' });
    expect(canSignIn(state)).toBe(false); expect(() => move(state, { type: 'SIGN_IN' })).toThrow(/Unbind/);
    state = move(state, { type: 'UNBIND' }); expect(canSignIn(state)).toBe(true);
    expect(move(state, { type: 'UNBIND' }).revision).toBe(state.revision);
  });
  it('blocks route skipping, unbound actions and unknown commands without mutation', () => {
    const state = createRun(); const before = structuredClone(state);
    const illegal: Command[] = [{ type: 'ENTER_SCENE', scene: 'tower' }, { type: 'JUG', move: 'fill-small' }, { type: 'UNBIND' }, { type: 'SIGN_IN' }, { type: 'START_RECOVERY' }];
    for (const command of illegal) expect(() => applyCommand(state, command)).toThrow();
    expect(() => move(state, { type: 'UNKNOWN' } as unknown as Command)).toThrow(/Unknown/);
    expect(state).toEqual(before); expect(canEnter(state, 'garden')).toBe(true);
  });
  it('rejects the removed hint command and discards legacy hint notes when loading saves', () => {
    const state = createRun(); expect(() => move(state, { type: 'HINT' } as unknown as Command)).toThrow(/Unknown/);
    state.journalEntries.push('Hint · studio: Dial 23.'); state.hints = { studio: 3 };
    const loaded = runSchema.parse(state); expect(loaded.journalEntries.some(note => note.startsWith('Hint ·'))).toBe(false);
    expect(loaded.runId).toBe(state.runId);
  });
  it('keeps the attempted spell out of commands, snapshots and events', () => {
    let state = move(createRun(), { type: 'STAMP_ALIAS', alias: 'Violet' }); state = move(state, { type: 'SUBMIT_ATTEMPTED_SPELL' });
    expect(state.arrival.theftRecorded).toBe(true); expect(JSON.stringify(state)).not.toMatch(/passwordText|attemptedSpell|spellText/);
    expect(move(state, { type: 'SUBMIT_ATTEMPTED_SPELL' }).discoveries).toEqual(['agatha.passwordPearls']);
  });
  it('rejects invalid aliases and trimmed blanks but safely retains display text', () => {
    for (const alias of ['', '   ', '\u0000', 'x'.repeat(25)]) expect(() => move(createRun(), { type: 'STAMP_ALIAS', alias })).toThrow();
    expect(move(createRun(), { type: 'STAMP_ALIAS', alias: ' <script>x</script> ' }).alias).toBe('<script>x</script>');
  });
  it('matches labeled tokens and displaces a duplicate placement', () => {
    let state = move(createRun(), { type: 'STAMP_ALIAS', alias: 'Violet' }); state = move(state, { type: 'SUBMIT_ATTEMPTED_SPELL' }); state = move(state, { type: 'START_RECOVERY' });
    state = move(state, { type: 'PLACE_TOKEN', seat: 0, token: 'sharon' });
    state = move(state, { type: 'PLACE_TOKEN', seat: 4, token: 'sharon' });
    expect(state.threshold.placements[0]).toBeNull(); expect(state.threshold.placements[4]).toBe('sharon');
    expect(() => move(state, { type: 'MATCH_COVEN' })).toThrow(/wrong seat/); expect(thresholdRun().threshold.opened).toBe(true);
  });
  it('records opening discoveries only at their valid locations and never uses them as extra gates', () => {
    let state = createRun(); state = move(state, { type: 'INSPECT_PROP', prop: 'ribbon' }); expect(state.discoveries).toEqual([]);
    state = move(state, { type: 'INSPECT_PROP', prop: 'visibilityEye' });
    state = move(state, { type: 'STAMP_ALIAS', alias: 'Violet' }); state = move(state, { type: 'SUBMIT_ATTEMPTED_SPELL' });
    state = move(state, { type: 'INSPECT_PROP', prop: 'ribbon' }); state = move(state, { type: 'INSPECT_PROP', prop: 'ribbon' });
    expect(state.discoveries).toEqual(['agatha.visibilityEye', 'agatha.passwordPearls', 'agatha.ribbonTrail']);
    state = move(state, { type: 'START_RECOVERY' }); expect(() => move(state, { type: 'INSPECT_PROP', prop: 'visibilityEye' })).toThrow(/cottage/);
    state = move(state, { type: 'INSPECT_PROP', prop: 'sharon' }); expect(state.discoveries).toContain('sharon.greenThumb');
    expect(state.threshold.opened).toBe(false);
  });
});

describe('interruption, resets and optional recognition', () => {
  it('restores the tower confirmation stage and rejects the original seat order', () => {
    let state = throughTrial('tower');
    for (const op of towerSolution(state.puzzles.tower.deck)) state = move(state, { type: 'MOVE_DECK', move: op });
    state = move(state, { type: 'SUBMIT_DECK' });
    state = runSchema.parse(JSON.parse(JSON.stringify(state)));
    for (const card of state.puzzles.tower.deck) state = move(state, { type: 'PICK_CONFIRM', card });
    expect(() => move(state, { type: 'CONFIRM_DECK' })).toThrow(/opposite seat/);
    state = move(state, { type: 'CLEAR_CONFIRM' });
    state = solveCurrent(state); expect(state.puzzles.tower.solved).toBe(true);
    expect(() => move(state, { type: 'UNDO' })).toThrow(/complete/);
  });
  it('lets the player undo a dead end one edge at a time', () => {
    let state = throughTrial('greenhouse'); for (const node of ['D', 'E', 'A', 'D'] as const) state = move(state, { type: 'TRACE_VINE', node });
    state = move(state, { type: 'UNDO' }); expect(state.puzzles.greenhouse.route).toEqual(['C', 'D', 'E', 'A']);
    expect(solveCurrent(state).puzzles.greenhouse.solved).toBe(true);
  });
  it('keeps garden recognition optional, scoped to the run and independently forgettable', () => {
    let state = move(createRun(), { type: 'ENTER_SCENE', scene: 'garden' }); state = solveCurrent(state);
    expect(state.rememberEnabled).toBe(true); expect(state.milestones.hasSignedInOnce).toBe(false); expect(canSignIn(state)).toBe(false);
    state = move(state, { type: 'FORGET_ME' }); expect(state.rememberEnabled).toBe(false); expect(state.puzzles.garden.solved).toBe(true);
    expect(createRun().rememberEnabled).toBe(false);
  });
  it('resets only the active unsolved puzzle and keeps prior seals', () => {
    let state = throughTrial('cabin'); state = move(state, { type: 'TOGGLE_LAMP', index: 2 }); state = move(state, { type: 'RESET_PUZZLE' });
    expect(state.puzzles.cabin.lamps).toEqual([0, 0, 0, 0]); expect(state.puzzles.kitchen.solved).toBe(true); expect(state.puzzles.studio.solved).toBe(true);
  });
  it('bounds undo history while preserving solvability', () => {
    let state = throughTrial('cabin'); for (let i = 0; i < 120; i++) state = move(state, { type: 'TOGGLE_LAMP', index: i % 4 });
    expect(state.puzzles.cabin.history).toHaveLength(100); expect(solveCurrent(state).puzzles.cabin.solved).toBe(true);
  });
  it('validates completion consistency and blocks corrupt or unsupported snapshots', () => {
    const badVersion = { ...createRun(), contentVersion: 'unknown' }; expect(runSchema.safeParse(badVersion).success).toBe(false);
    const state = createRun(); state.puzzles.kitchen.solved = true; expect(runSchema.safeParse(state).success).toBe(false);
    const malformed = thresholdRun(); malformed.puzzles.kitchen.volumes = [9, -1]; expect(runSchema.safeParse(malformed).success).toBe(false);
    const badRoute = throughTrial('greenhouse'); badRoute.puzzles.greenhouse.route = ['C', 'B', 'C']; expect(runSchema.safeParse(badRoute).success).toBe(false);
  });
});
