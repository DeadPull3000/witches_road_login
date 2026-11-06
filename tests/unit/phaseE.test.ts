import { describe, expect, it } from 'vitest';
import { canSignIn, createRun, runSchema } from '../../src/game/state';
import { ROOM_PROPS } from '../../src/content/cottage';
import { VINE_CROSSING, VINE_POSITIONS, nodesAlongSegment, vineStagePoint } from '../../src/content/vines';
import { NODES, vineChoices, type Node } from '../../src/puzzles/rules';
import { entryFlourish } from '../../src/scenes/cues';
import { sceneArt, sceneObjects } from '../../src/scenes/objects';
import { completedRun, move, solveCurrent, throughTrial } from '../helpers';

const returnRun = () => move(solveCurrent(throughTrial('greenhouse')), { type: 'ENTER_SCENE', scene: 'cottage' });
describe('greenhouse gestures and final progression', () => {
  it('accepts every complete Euler stroke through the same rules as individual steps', () => {
    const trails: Node[][] = [], visit = (route: Node[]) => {
      if (route.length === 8) { if (route.at(-1) === 'D') trails.push(route); return; }
      for (const node of vineChoices(route)) visit([...route, node]);
    };
    visit(['C']); expect(trails.length).toBeGreaterThan(1);
    for (const trail of trails) {
      const start = throughTrial('greenhouse');
      const drawn = move(start, { type: 'TRACE_VINE_PATH', nodes: trail.slice(1), revision: start.revision });
      const clicked = trail.slice(1).reduce((run, node) => move(run, { type: 'TRACE_VINE', node }), start);
      expect(drawn.puzzles).toEqual(clicked.puzzles); expect(drawn.puzzles.greenhouse.solved).toBe(true); expect(canSignIn(drawn)).toBe(false);
    }
  });
  it('keeps an entire invalid or stale stroke atomic, and preserves partial strokes across reload/undo', () => {
    const start = throughTrial('greenhouse');
    expect(() => move(start, { type: 'TRACE_VINE_PATH', nodes: ['B', 'C'], revision: start.revision })).toThrow(/unused vine/);
    expect(start.puzzles.greenhouse.route).toEqual(['C']);
    let partial = move(start, { type: 'TRACE_VINE_PATH', nodes: ['B', 'A'], revision: start.revision });
    expect(() => move(partial, { type: 'TRACE_VINE_PATH', nodes: ['C'], revision: start.revision })).toThrow(/route changed/);
    partial = runSchema.parse(JSON.parse(JSON.stringify(partial))); partial = move(partial, { type: 'UNDO' });
    expect(partial.puzzles.greenhouse.route).toEqual(['C', 'B']); expect(partial.puzzles.tower.solved).toBe(true);
    expect(() => move(partial, { type: 'TRACE_VINE_PATH', nodes: [], revision: partial.revision })).toThrow();
    expect(() => move(createRun(), { type: 'TRACE_VINE_PATH', nodes: ['B'], revision: 0 })).toThrow(/greenhouse/);
  });
  it('never treats the vine crossing as a stone, including sparse pointer events', () => {
    expect(nodesAlongSegment(VINE_CROSSING, VINE_CROSSING)).toEqual([]);
    expect(nodesAlongSegment(VINE_POSITIONS.C, VINE_POSITIONS.D)).toEqual(['C', 'D']);
    expect(nodesAlongSegment(VINE_POSITIONS.A, VINE_POSITIONS.E)).toEqual(['A', 'E']);
    for (const node of NODES) { expect(nodesAlongSegment(VINE_POSITIONS[node], VINE_POSITIONS[node])).toEqual([node]); const [x,y] = vineStagePoint(VINE_POSITIONS[node]); expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(640); expect(y).toBeLessThan(360); }
  });
  it('keeps returning, inspecting and remembering separate from the required unbinding', () => {
    let run = returnRun(); expect(run.discoveries).toContain('road.returnSmoke'); expect(canSignIn(run)).toBe(false);
    run = move(run, { type: 'SET_COTTAGE_VIEW', view: 'inside' });
    run = move(run, { type: 'INSPECT_PROP', prop: 'roomRug' }); for (const prop of ROOM_PROPS) run = move(run, { type: 'INSPECT_PROP', prop: prop.id });
    expect(run.discoveries).toContain('road.rugMap'); expect(run.discoveries).toContain('road.propsAlreadyHere'); expect(canSignIn(run)).toBe(false);
    const revision = run.revision; run = move(run, { type: 'INSPECT_PROP', prop: 'roomRug' }); expect(run.revision).toBe(revision);
    run = move(run, { type: 'UNBIND' }); expect(canSignIn(run)).toBe(true); expect(run.discoveries.filter(id=>id==='agatha.unbinding')).toHaveLength(1);
    expect(move(run, { type: 'UNBIND' }).revision).toBe(run.revision);
  });
});
describe('familiar objects and remembered returns', () => {
  it('keeps the room art and prop positions unchanged between the first and return visits', () => {
    const before = move(createRun(), { type: 'SET_COTTAGE_VIEW', view: 'inside' }), after = move(returnRun(), { type: 'SET_COTTAGE_VIEW', view: 'inside' });
    expect(sceneArt(before.currentScene, before.cottageView).background).toBe(sceneArt(after.currentScene, after.cottageView).background);
    const familiar = (run: typeof before) => sceneObjects(run).filter(object => object.command.type !== 'INSPECT_ENCOUNTER');
    expect(familiar(before)).toEqual(familiar(after));
    const inspected = move(before, { type: 'INSPECT_PROP', prop: 'roomRug' }); expect(inspected.discoveries).not.toContain('road.rugMap');
    expect(() => move(createRun(), { type: 'INSPECT_PROP', prop: 'roomCup' })).toThrow(/inside/);
    const old = JSON.parse(JSON.stringify(completedRun())); delete old.cottageView;
    expect(runSchema.parse(old).cottageView).toBe('outside'); expect(runSchema.parse(old).milestones.hasSignedInOnce).toBe(true);
  });
  it('requires a first sign-in for recognition, and lets Forget/Remember preserve all seals', () => {
    let run = move(returnRun(), { type: 'ENTER_SCENE', scene: 'garden' }); run = solveCurrent(run);
    expect(run.rememberEnabled).toBe(true); expect(run.discoveries).not.toContain('rio.gardenRecognition');
    run = move(run, { type: 'ENTER_SCENE', scene: 'cottage' }); expect(run.discoveries).not.toContain('rio.gardenRecognition');
    run = move(move(run, { type: 'UNBIND' }), { type: 'SIGN_IN' }); run = move(run, { type: 'SIGN_OUT' });
    expect(run.discoveries).toContain('rio.gardenRecognition'); expect(entryFlourish(run, { type: 'SIGN_OUT' })).toBe('recognition');
    run = move(run, { type: 'ENTER_SCENE', scene: 'garden' }); run = move(run, { type: 'FORGET_ME' }); expect(canSignIn(run)).toBe(true); expect(run.puzzles.garden.solved).toBe(true);
    expect(entryFlourish(run, { type: 'ENTER_SCENE', scene: 'garden' })).toBeNull(); run = move(run, { type: 'REMEMBER_ME' });
    expect(run.rememberEnabled).toBe(true); expect(run.discoveries.filter(id=>id==='rio.gardenRecognition')).toHaveLength(1);
    expect(() => move(createRun(), { type: 'REMEMBER_ME' })).toThrow(/garden/);
  });
  it('stores the renewal before presentation, keeps it idempotent, and never replays entry cues on load', () => {
    let run = move(completedRun(), { type: 'RENEW_BOOK' }); run = runSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(run.milestones.bookRenewed).toBe(true); expect(run.discoveries).toContain('library.longReceipt');
    expect(move(run, { type: 'RENEW_BOOK' }).revision).toBe(run.revision);
    expect(entryFlourish(returnRun(), null)).toBeNull(); expect(entryFlourish(returnRun(), { type: 'ENTER_SCENE', scene: 'cottage' })).toBe('smoke');
    expect(entryFlourish(returnRun(), { type: 'SET_COTTAGE_VIEW', view: 'inside' })).toBeNull();
  });
});
