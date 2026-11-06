import { describe, expect, it } from 'vitest';
import { COTTAGE_INTERIOR_DOOR } from '../../src/content/cottage';
import { createRun } from '../../src/game/state';
import { sceneObjects } from '../../src/scenes/objects';
import { project, worldApproachBounds, worldLayout, worldObjectBounds } from '../../src/world/layout';
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
      expect(worldApproachBounds(rug, late)).toEqual(worldApproachBounds(rug, early));
    }
  });

  it('projects the doorway mark and its approach from the painted interior door', () => {
    const run = returnedVisit();
    const layout = worldLayout(run, 1280, 800);
    const prop = sceneObjects(run).find(object => object.id === 'cottage.door')!;
    const center = project(COTTAGE_INTERIOR_DOOR, layout.plane);
    const target = worldApproachBounds(prop, layout);
    expect(layout.door.x + layout.door.width / 2).toBeCloseTo(center.x);
    expect(layout.door.y + layout.door.height / 2).toBeCloseTo(center.y);
    expect(target.x + target.width / 2).toBeCloseTo(center.x);
    expect(target.y + target.height / 2).toBeCloseTo(center.y);
  });

  it.each([[360, 640], [390, 844], [844, 390], [1280, 800]])('keeps essential plaques reachable at %i × %i', (width, height) => {
    for (const run of [returnedVisit(), completedRun()]) {
      const layout = worldLayout(run, width, height);
      for (const prop of sceneObjects(run).filter(item => ['cottage.door', 'cottage.rug', 'account.ledger'].includes(item.id))) {
        const target = worldApproachBounds(prop, layout);
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
        expect(target.x).toBeGreaterThanOrEqual(16);
        expect(target.x + target.width).toBeLessThanOrEqual(width - 16);
        expect(target.y + target.height).toBeLessThanOrEqual(height - 108);
        if (prop.id === 'cottage.door' && width < 400) expect(worldObjectBounds(prop, layout)).not.toBeNull();
      }
    }
  });
});
