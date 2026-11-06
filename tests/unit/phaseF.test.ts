import { describe, expect, it } from 'vitest';
import { DISCOVERY_IDS } from '../../src/content/discoveries';
import { encounterAvailable, type EncounterId } from '../../src/content/encounters';
import { COVEN, TRIALS } from '../../src/content/scenes';
import { replayVisionTransfers, VISION_INVENTORY, VISION_STATIONS, visionIdentityMatches } from '../../src/content/vision';
import { applyCommand, RuleError, type Command } from '../../src/game/commands';
import { canEnter, canSignIn, createRun, runSchema, type RunState } from '../../src/game/state';
import { mapLocations, roomDoor } from '../../src/world/navigation';
import { nextWorldCue } from '../../src/world/useWorldCues';
import { annexRun, completedRun, cottageInterior, move, solveCurrent, throughTrial } from '../helpers';

const inspect = (prop: EncounterId): Command => ({ type: 'INSPECT_ENCOUNTER', prop });
const room = (scene: RunState['currentScene']): Command => ({ type: 'ENTER_SCENE', scene });
const tune = (channel: RunState['encounters']['tvChannel']): Command => ({ type: 'TUNE_TELEVISION', channel });
const play = (run: RunState, ...commands: Command[]) => commands.reduce(move, run);

describe('Vision’s optional diagnostic annex', () => {
  it('replays only the named part on each slip and verifies exactly one of four readers', () => {
    expect(replayVisionTransfers()).toEqual({
      North: { casing: 'Ivory', module: 'M4' },
      East: { casing: 'Glass', module: 'M2' },
      South: { casing: 'Brass', module: 'M3' },
      West: { casing: 'Ebony', module: 'M1' },
    });
    expect(VISION_INVENTORY.North).toEqual({ casing: 'Brass', module: 'M1' });
    expect(VISION_STATIONS.filter(visionIdentityMatches)).toEqual(['West']);
  });

  it('requires the studio seal and the television for a first entry and always has an exit', () => {
    const fresh = cottageInterior(createRun());
    expect(() => move(fresh, tune('diagnostic'))).toThrow(RuleError);
    expect(() => move(fresh, { type: 'OPEN_VISION' })).toThrow(RuleError);
    const afterStudio = cottageInterior(throughTrial('cabin'));
    expect(canEnter(afterStudio, 'vision')).toBe(false);
    expect(mapLocations(afterStudio).some(place => place.scene === 'vision')).toBe(false);
    expect(() => move(afterStudio, room('vision'))).toThrow(RuleError);
    const entered = annexRun(afterStudio);
    expect(canEnter(entered, 'vision')).toBe(true);
    expect(roomDoor(entered)?.command).toEqual({ type: 'LEAVE_VISION' });
    const returned = move(entered, { type: 'LEAVE_VISION' });
    expect(returned).toMatchObject({ currentScene: 'cottage', cottageView: 'inside', phase: 'road' });
    expect(move(returned, room('vision')).currentScene).toBe('vision');
    expect(canSignIn(entered)).toBe(false);
    expect(canSignIn(annexRun(completedRun()))).toBe(true);
  });

  it('preserves selections across saves, rejects wrong or forged completions and emits the accepted cue once', () => {
    const entered = annexRun();
    for (const station of ['North', 'East', 'South'] as const) {
      const candidate = move(entered, { type: 'SELECT_IDENTITY', station });
      expect(runSchema.parse(candidate).puzzles.vision).toEqual({ selection: station, solved: false });
      expect(() => move(candidate, { type: 'SUBMIT_IDENTITY' })).toThrow('printed policy');
      expect(runSchema.safeParse({ ...candidate, puzzles: { ...candidate.puzzles, vision: { selection: station, solved: true } } }).success).toBe(false);
    }
    const selected = move(entered, { type: 'SELECT_IDENTITY', station: 'West' });
    const command = { type: 'SUBMIT_IDENTITY' } as const;
    const solved = move(selected, command);
    expect(nextWorldCue(selected, solved, command)).toBe('diagnostics');
    expect(runSchema.parse(solved).puzzles.vision.solved).toBe(true);
    expect(move(solved, command)).toBe(solved);
    expect(nextWorldCue(solved, solved, command)).toBeNull();
    expect(TRIALS.map(trial => solved.puzzles[trial].solved)).toEqual(TRIALS.map(trial => entered.puzzles[trial].solved));
  });

  it('loads version-one saves without optional fields using the fresh defaults', () => {
    const raw = JSON.parse(JSON.stringify(completedRun()));
    delete raw.puzzles.vision;
    delete raw.encounters;
    const restored = runSchema.parse(raw);
    expect(restored.puzzles.vision).toEqual({ selection: null, solved: false });
    expect(restored.encounters).toEqual(createRun().encounters);
    expect(canSignIn(restored)).toBe(true);
  });
});

describe('discovery prerequisites and replay', () => {
  it('keeps the three rabbit encounters in sequence and lets a later card wear the earned glasses', () => {
    const kitchen = throughTrial('kitchen'), studio = throughTrial('studio');
    expect(() => applyCommand(kitchen, inspect('kitchenCupboard'), ['rabbit.first'])).toThrow(RuleError);
    expect(() => applyCommand(studio, inspect('studioSpeaker'), ['rabbit.second'])).toThrow(RuleError);
    const newCard = cottageInterior(createRun());
    expect(encounterAvailable(newCard, 'rabbitPortrait')).toBe(false);
    expect(encounterAvailable(newCard, 'rabbitPortrait', ['rabbit.third'])).toBe(true);
    expect(applyCommand(newCard, inspect('rabbitPortrait'), ['rabbit.third']).state.discoveries).toEqual(['rabbit.clerkGlasses']);
  });

  it('keeps wrong-room inspections and premature session actions out of the run', () => {
    const run = createRun(), before = JSON.stringify(run);
    for (const command of [inspect('television'), inspect('caseDrawer'), inspect('cabinWindow'), inspect('returnDate'), { type: 'EXPIRE_SESSION' } as const, tune('sponsor')]) {
      expect(() => move(run, command)).toThrow(RuleError);
    }
    expect(JSON.stringify(run)).toBe(before);
  });

  it('keeps tuning and optional session expiry repeatable while deduplicating the recorded awards', () => {
    const start = cottageInterior(createRun()), local = move(start, tune('local')), sponsor = move(local, tune('sponsor'));
    expect(nextWorldCue(local, sponsor, tune('sponsor'))).toBe('standBy');
    expect(move(sponsor, tune('sponsor'))).toBe(sponsor);
    const off = play(sponsor, { type: 'TURN_TV_DIAL' }, tune('off'));
    expect(off.discoveries).toEqual(['wanda.standBy', 'wanda.toasterAd', 'volume.badKnob']);
    const renewed = move(completedRun(), { type: 'RENEW_BOOK' });
    const expired = move(renewed, { type: 'EXPIRE_SESSION' });
    expect(expired.encounters.sessionExpired).toBe(true);
    expect(expired.milestones).toEqual(renewed.milestones);
    expect(nextWorldCue(renewed, expired, { type: 'EXPIRE_SESSION' })).toBe('sessionFlower');
    const resumed = move(expired, { type: 'SIGN_IN' });
    expect(resumed).toMatchObject({ currentScene: 'account', encounters: { sessionExpired: false }, milestones: { bookRenewed: true } });
    const signedOff = play(cottageInterior(resumed), tune('local'), tune('off'));
    expect(signedOff.discoveries).toContain('library.finalStamp');
    expect(play(signedOff, tune('sponsor'), tune('off')).discoveries.filter(id => id === 'library.finalStamp')).toHaveLength(1);
  });

  it('earns every one of the 34 registered discoveries through accepted gameplay commands', () => {
    let run = play(createRun(), { type: 'STAMP_ALIAS', alias: 'Violet Finch' }, { type: 'INSPECT_PROP', prop: 'visibilityEye' }, { type: 'SUBMIT_ATTEMPTED_SPELL' }, { type: 'INSPECT_PROP', prop: 'ribbon' }, room('garden'), inspect('gardenStone'));
    run = solveCurrent(run);
    run = play(cottageInterior(run), inspect('caseDrawer'), inspect('portrait'), inspect('portrait'), tune('local'), tune('sponsor'), { type: 'TURN_TV_DIAL' }, { type: 'INSPECT_PROP', prop: 'roomRug' }, { type: 'START_RECOVERY' }, { type: 'INSPECT_PROP', prop: 'sharon' });
    COVEN.forEach((token, seat) => { run = move(run, { type: 'PLACE_TOKEN', seat, token: token.id }); });
    run = play(run, { type: 'MATCH_COVEN' }, room('kitchen'), { type: 'KITCHEN_TIMER' }, inspect('kitchenCupboard'));
    for (const jug of ['fill-small', 'pour-small', 'fill-small', 'pour-small', 'empty-large', 'pour-small'] as const) run = move(run, { type: 'JUG', move: jug });
    run = play(solveCurrent(run), room('studio'), { type: 'TOGGLE_SPEAKERS' }, { type: 'TOGGLE_SPEAKERS' }, inspect('studioSpeaker'), { type: 'REVERSE_RECORD' });
    run = play(solveCurrent(run), room('cabin'), { type: 'CHECK_LAMPS' });
    run = play(solveCurrent(run), inspect('cabinWindow'), room('tower'), { type: 'INSPECT_PROP', prop: 'envelope' });
    run = play(cottageInterior(solveCurrent(run)), inspect('sigilCard'), inspect('rabbitPortrait'));
    run = play(annexRun(run), inspect('visionIntercom'), { type: 'SELECT_IDENTITY', station: 'West' }, { type: 'SUBMIT_IDENTITY' }, { type: 'LEAVE_VISION' }, room('greenhouse'));
    run = play(cottageInterior(solveCurrent(run)), { type: 'INSPECT_PROP', prop: 'roomRug' }, { type: 'INSPECT_PROP', prop: 'roomFlower' }, { type: 'UNBIND' }, { type: 'SIGN_IN' }, inspect('returnDate'), { type: 'RENEW_BOOK' }, { type: 'EXPIRE_SESSION' });
    run = play(cottageInterior(run), tune('off'));
    expect(DISCOVERY_IDS).toHaveLength(34);
    expect([...run.discoveries].sort()).toEqual([...DISCOVERY_IDS].sort());
    expect(runSchema.parse(run).milestones.bookRenewed).toBe(true);
  });
});
