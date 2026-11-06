import { describe, expect, it } from 'vitest';
import { SCENES } from '../../src/content/scenes';
import { createRun } from '../../src/game/state';
import { cottageLayout, cover, EFFECT_PIXEL_BUDGET, project, renderResolution, unproject, worldLayout, type Rect } from '../../src/world/layout';
import { instrumentFrame } from '../../src/world/instruments';
import { trialTag, type PaintedTrial } from '../../src/world/trialSurfaces';

const sizes = [[360, 640], [390, 844], [844, 390], [768, 1024], [1024, 768], [1280, 800], [1920, 1080], [2560, 1080]];
describe('full-viewport cottage composition', () => {
  it.each(sizes)('covers %i × %i with reachable, uncut essential objects', (width, height) => {
    const layout = cottageLayout(width, height), background = layout.backgroundRect;
    expect(background.x).toBeLessThanOrEqual(.001); expect(background.y).toBeLessThanOrEqual(.001);
    expect(background.x + background.width).toBeGreaterThanOrEqual(width - .001);
    expect(background.y + background.height).toBeGreaterThanOrEqual(height - .001);
    for (const rect of [layout.actor, layout.door, layout.garden, layout.card]) {
      expect(rect.width).toBeGreaterThanOrEqual(44); expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(width); expect(rect.y + rect.height).toBeLessThanOrEqual(height);
    }
    const authoredDoor: Rect = layout.profile === 'portrait' ? { x: 465, y: 815, width: 145, height: 259 } : { x: 552, y: 420, width: 126, height: 215 };
    const paintedCenter = project({ x: authoredDoor.x + authoredDoor.width / 2, y: authoredDoor.y + authoredDoor.height / 2 }, layout.camera);
    expect(layout.door.x + layout.door.width / 2).toBeCloseTo(paintedCenter.x, 5);
    expect(layout.door.y + layout.door.height / 2).toBeCloseTo(paintedCenter.y, 5);
  });
  it('maps pointer positions back to the authored plane without a second coordinate formula', () => {
    for (const [width, height] of sizes) for (const point of [{ x: 0, y: 0 }, { x: 574, y: 956 }, { x: 1672, y: 941 }]) {
      const camera = cottageLayout(width, height).camera, result = unproject(project(point, camera), camera);
      expect(result.x).toBeCloseTo(point.x, 8); expect(result.y).toBeCloseTo(point.y, 8);
    }
  });
  it('uses uniform scaling and selects a portrait painting before the wide view loses its door', () => {
    expect(cottageLayout(390, 844).profile).toBe('portrait'); expect(cottageLayout(768, 1024).profile).toBe('portrait');
    expect(cottageLayout(1280, 800).profile).toBe('landscape');
    const camera = cover(390, 844, 1672, 941);
    expect(camera.scale).toBeCloseTo(844 / 941); expect(390 / (1672 * camera.scale)).toBeLessThan(.27);
  });
  it('bounds the effects framebuffer while keeping CSS interaction coordinates unchanged', () => {
    for (const [width, height] of sizes) {
      const resolution = renderResolution(width, height, 3);
      expect(width * height * resolution ** 2).toBeLessThanOrEqual(EFFECT_PIXEL_BUDGET + 1); expect(resolution).toBeLessThanOrEqual(1.5);
    }
    expect(renderResolution(390, 844, 3)).toBeGreaterThan(1); expect(renderResolution(1280, 800, 1)).toBeLessThan(1);
  });
});

describe('painted trial work surfaces', () => {
  const trials = ['threshold', 'kitchen', 'cabin', 'tower', 'greenhouse'] as const satisfies readonly PaintedTrial[];

  it('reserves the whole host rectangle on desktop and keeps each approach tag above the traveller’s kit', () => {
    for (const scene of trials) {
      const run = { ...createRun(), currentScene: scene };
      for (const [width, height] of [[1280, 720], [1440, 900], [844, 390], [390, 844], [360, 780], [640, 360]]) {
        const layout = worldLayout(run, width, height);
        const tag = trialTag(scene, layout);
        const bench = instrumentFrame(width, height, true, scene);
        expect(tag.x).toBeGreaterThanOrEqual(14);
        expect(tag.x + tag.width).toBeLessThanOrEqual(width - 14);
        expect(tag.height).toBe(44);
        expect(tag.y + tag.height).toBeLessThanOrEqual(height - 90);
        expect(bench.y + bench.height).toBeLessThanOrEqual(height - 100);
        if (width >= 1100) expect(bench.x + bench.width).toBeLessThanOrEqual(layout.actor.x - 23.9);
      }
    }
  });
});

describe('whole-Road camera framing', () => {
  it('covers every edge with uniform scale on phones, tablets, desktop and ultrawide screens', () => {
    for (const [width, height] of [...sizes, [2560, 1440]]) {
      for (const currentScene of SCENES) {
        for (const cottageView of currentScene === 'cottage' ? ['outside', 'inside'] as const : ['outside'] as const) {
          const layout = worldLayout({ ...createRun(), currentScene, cottageView }, width, height);
          const rect = layout.backgroundRect;
          expect(rect.x).toBeLessThanOrEqual(.001);
          expect(rect.y).toBeLessThanOrEqual(.001);
          expect(rect.x + rect.width).toBeGreaterThanOrEqual(width - .001);
          expect(rect.y + rect.height).toBeGreaterThanOrEqual(height - .001);
          const artWidth = rect.width / layout.camera.scale, artHeight = rect.height / layout.camera.scale;
          expect(artWidth).toBeCloseTo(Math.round(artWidth));
          expect(artHeight).toBeCloseTo(Math.round(artHeight));
          expect(rect.width / artWidth).toBeCloseTo(rect.height / artHeight);
        }
      }
    }
  });
  it('reframes the purple entrance and Alice’s mixing desk as the available width narrows', () => {
    const threshold = { ...createRun(), currentScene: 'threshold' as const };
    const studio = { ...createRun(), currentScene: 'studio' as const };
    for (const [width, height, framing] of [[390, 844, 'portrait'], [1024, 768, 'intermediate'], [1280, 800, 'landscape']] as const) {
      for (const [run, x] of [[threshold, 1672 * .38], [studio, 1672 * .24]] as const) {
        const layout = worldLayout(run, width, height);
        expect(layout.framing).toBe(framing);
        const focal = project({ x, y: 941 / 2 }, layout.camera);
        expect(focal.x).toBeGreaterThan(width * .08);
        expect(focal.x).toBeLessThan(width * .92);
      }
    }
  });
});
