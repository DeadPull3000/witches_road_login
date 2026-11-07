import { describe, expect, it } from 'vitest';
import { createRun } from '../../src/game/state';
import { sceneObjects } from '../../src/scenes/objects';
import { project, worldLayout } from '../../src/world/layout';
import { roomObjective, roomObjectTarget } from '../../src/world/objectives';
import { completedRun, move } from '../helpers';

const firstVisit = () => move(createRun(), { type: 'SET_COTTAGE_VIEW', view: 'inside' });
const returnedVisit = () => move(move(completedRun(), { type: 'SIGN_OUT' }), { type: 'SET_COTTAGE_VIEW', view: 'inside' });

describe('cottage and library prop placement', () => {
  it('uses the same cottage art, door and rug placement when the room becomes familiar', () => {
    const first = firstVisit();
    const returned = returnedVisit();
    for (const [width, height, image] of [[1280, 800, '/assets/cottage/cottage-room.webp'], [390, 844, '/assets/cottage/cottage-room-portrait.webp']] as const) {
      const early = worldLayout(first, width, height);
      const late = worldLayout(returned, width, height);
      expect(late.background).toBe(image);
      expect(late.background).toBe(early.background);
      expect(late.backgroundRect).toEqual(early.backgroundRect);
      expect(late.door).toEqual(early.door);
      const rug = sceneObjects(first).find(prop => prop.id === 'cottage.rug')!;
      expect(sceneObjects(returned)).toContainEqual(rug);
      expect(roomObjectTarget(rug, late, returned)).toEqual(roomObjectTarget(rug, early, first));
    }
  });

  it('places the sign-in target on the painted knocker', () => {
    const run = returnedVisit();
    const layout = worldLayout(run, 1280, 800);
    const center = project({ x: 1268, y: 445 }, layout.camera);
    const { frame: target, art } = roomObjective(run, layout);
    expect(art).toBeUndefined();
    expect(target.x + target.width / 2).toBeCloseTo(center.x);
    expect(target.y + target.height / 2).toBeCloseTo(center.y);
  });

  it.each([[360, 640], [390, 844], [844, 390], [1280, 800]])('keeps essential objects reachable at %i × %i', (width, height) => {
    for (const run of [returnedVisit(), completedRun()]) {
      const layout = worldLayout(run, width, height);
      const extra = sceneObjects(run).find(prop => prop.id === (run.currentScene === 'account' ? 'account.slot' : 'cottage.rug'))!;
      for (const target of [roomObjective(run, layout).frame, roomObjectTarget(extra, layout, run)!.frame]) {
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
        expect(target.x).toBeGreaterThanOrEqual(0);
        expect(target.x + target.width).toBeLessThanOrEqual(width);
        expect(target.y + target.height).toBeLessThanOrEqual(height);
      }
    }
  });
});
