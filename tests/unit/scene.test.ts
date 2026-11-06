import { describe, expect, it } from 'vitest';
import { STAGE, hotspotStyle, sceneObjects, shouldReduceMotion } from '../../src/scenes/objects';
import { createRun } from '../../src/game/state';
import { move } from '../helpers';

describe('shared scene geometry and motion policy', () => {
  it('keeps every object in stage coordinates and maps it once to CSS percentages', () => {
    const run = createRun();
    for (const scene of ['cottage', 'threshold', 'garden', 'kitchen', 'studio', 'cabin', 'tower', 'greenhouse', 'account'] as const) {
      run.currentScene = scene;
      const objects = sceneObjects(run); expect(new Set(objects.map(object => object.id)).size).toBe(objects.length);
      for (const object of objects) {
        expect(object.x).toBeGreaterThan(0); expect(object.x).toBeLessThan(STAGE.width);
        expect(object.y).toBeGreaterThan(0); expect(object.y).toBeLessThan(STAGE.height);
        const css = hotspotStyle(object); expect(Number.parseFloat(css.left)).toBeCloseTo(object.x / 640 * 100);
        expect(Number.parseFloat(css.top)).toBeCloseTo(object.y / 360 * 100);
        expect(object.label.length).toBeGreaterThan(3); expect(object.command.type.length).toBeGreaterThan(0);
      }
    }
  });
  it('uses the same stable cap IDs when lighting changes', () => {
    let run = move(createRun(), { type: 'ENTER_SCENE', scene: 'garden' }); const before = sceneObjects(run);
    run = move(run, { type: 'TOGGLE_MUSHROOM', index: 2 }); const after = sceneObjects(run);
    expect(after.map(o => o.id)).toEqual(before.map(o => o.id)); expect(after[2].label).toBe('Cap 3: lit');
  });
  it('honors explicit overrides and system reduced motion', () => {
    expect(shouldReduceMotion('system', true)).toBe(true); expect(shouldReduceMotion('system', false)).toBe(false);
    expect(shouldReduceMotion('full', true)).toBe(false); expect(shouldReduceMotion('reduced', false)).toBe(true);
  });
});
