import { Container, Graphics } from 'pixi.js';
import type { RunState } from '../game/state';
import type { WorldLayout } from './layout';

type ParticleKind = 'sparkle' | 'dust' | 'puff' | 'leaf' | 'wind' | 'scan';
type Region = readonly [left: number, top: number, width: number, height: number];
type Emitter = 'chimney' | readonly [number, number];
type Layer = { kind: ParticleKind; count: number; tint: string; region?: Region; emitter?: Emitter };
type ProfileId = Exclude<RunState['currentScene'], 'cottage'> | 'cottage-clearing' | 'cottage-interior';

const profiles = {
  'cottage-clearing': [
    { kind: 'puff', count: 9, tint: '#e3c6df', emitter: 'chimney' },
    { kind: 'leaf', count: 9, tint: '#b48852', region: [.02, .30, .94, .64] },
    { kind: 'sparkle', count: 19, tint: '#ffe1a2', region: [.05, .45, .9, .48] },
    { kind: 'wind', count: 3, tint: '#d2bdc9', region: [0, .54, 1, .35] },
  ],
  'cottage-interior': [
    { kind: 'dust', count: 19, tint: '#f4d3a7' },
    { kind: 'sparkle', count: 9, tint: '#f9b774', region: [.06, .38, .72, .47] },
  ],
  threshold: [
    { kind: 'dust', count: 18, tint: '#cfbca2', region: [.05, .11, .9, .64] },
    { kind: 'wind', count: 5, tint: '#ac9bb2', region: [0, .66, 1, .25] },
  ],
  kitchen: [
    { kind: 'puff', count: 8, tint: '#dce6d8', emitter: [.582, .45] },
    { kind: 'dust', count: 15, tint: '#f5dcb1' },
    { kind: 'sparkle', count: 8, tint: '#a5d8c9', region: [.12, .36, .63, .42] },
  ],
  studio: [
    { kind: 'dust', count: 23, tint: '#ffd499', region: [.10, .16, .85, .70] },
    { kind: 'sparkle', count: 7, tint: '#ffb161', region: [.11, .32, .59, .32] },
  ],
  cabin: [
    { kind: 'puff', count: 6, tint: '#c7accb', emitter: [.219, .252] },
    { kind: 'sparkle', count: 16, tint: '#d5a4e9', region: [.05, .28, .89, .59] },
  ],
  tower: [
    { kind: 'dust', count: 15, tint: '#e6d1ef' },
    { kind: 'leaf', count: 10, tint: '#d7c5a9', region: [.08, .18, .86, .67] },
    { kind: 'wind', count: 5, tint: '#bdb0e1', region: [0, .32, 1, .50] },
  ],
  greenhouse: [
    { kind: 'dust', count: 16, tint: '#e3e8a8' },
    { kind: 'leaf', count: 14, tint: '#a3b971', region: [.03, .16, .94, .76] },
    { kind: 'wind', count: 5, tint: '#dce4ac', region: [0, .32, 1, .53] },
  ],
  garden: [
    { kind: 'sparkle', count: 23, tint: '#a6f1d6', region: [.05, .25, .90, .67] },
    { kind: 'leaf', count: 9, tint: '#809d74', region: [.02, .18, .96, .74] },
    { kind: 'wind', count: 4, tint: '#a8bfd9', region: [0, .56, 1, .32] },
  ],
  vision: [
    { kind: 'dust', count: 15, tint: '#d3e3e9' },
    { kind: 'scan', count: 4, tint: '#b9d0d6', region: [.18, .29, .62, .46] },
    { kind: 'sparkle', count: 6, tint: '#e3f1ef', region: [.13, .40, .72, .35] },
  ],
  account: [
    { kind: 'dust', count: 22, tint: '#f2d6ac', region: [.09, .10, .82, .70] },
    { kind: 'leaf', count: 7, tint: '#d2bea3', region: [.15, .22, .70, .64] },
  ],
} satisfies Record<ProfileId, readonly Layer[]>;

const kinds: readonly ParticleKind[] = ['sparkle', 'dust', 'puff', 'leaf', 'wind', 'scan'];
const defaultRegion: Region = [.06, .12, .88, .78];
const fraction = (number: number) => number - Math.floor(number);

export function atmosphereId(scene: RunState['currentScene'], outside: boolean): ProfileId {
  return scene === 'cottage' ? outside ? 'cottage-clearing' : 'cottage-interior' : scene;
}

function particleArt(kind: ParticleKind) {
  const art = new Graphics();
  switch (kind) {
    case 'sparkle':
      return art.rect(-.7, -3, 1.4, 6).rect(-3, -.7, 6, 1.4).fill({ color: '#fff', alpha: .48 })
        .rect(-1, -1, 2, 2).fill('#fff');
    case 'dust':
      return art.rect(-1, -1, 2, 2).fill('#fff');
    case 'puff':
      return art.roundRect(-13, -8, 26, 16, 7).fill({ color: '#fff', alpha: .23 })
        .roundRect(-8, -5, 15, 10, 4).fill({ color: '#fff', alpha: .32 })
        .roundRect(-4, -3, 9, 5, 2).fill({ color: '#fff', alpha: .22 });
    case 'leaf':
      return art.poly([-5, 0, -2, -2, 2, -3, 6, -1, 3, 2, -1, 3]).fill('#fff')
        .moveTo(-5, 1).lineTo(4, -1).stroke({ color: '#282023', width: .65, alpha: .5 });
    case 'wind':
      return art.moveTo(-24, 2).quadraticCurveTo(2, -4, 25, 0).stroke({ color: '#fff', width: 1 })
        .moveTo(-14, 5).quadraticCurveTo(1, 2, 13, 4).stroke({ color: '#fff', width: 1, alpha: .45 });
    case 'scan':
      return art.rect(-21, 0, 42, 1.5).fill('#fff').rect(-13, 4, 26, 1).fill({ color: '#fff', alpha: .45 });
  }
}

function plumeAnchor(emitter: Emitter, layout: WorldLayout) {
  if (emitter === 'chimney') return layout.chimney;
  const { backgroundRect } = layout;
  const [x, y] = emitter;
  return { x: backgroundRect.x + x * backgroundRect.width, y: backgroundRect.y + y * backgroundRect.height };
}

/** Retains one small particle pool. Room changes update its palette and paths on the world ticker. */
export function createAtmosphere() {
  const container = new Container();
  container.eventMode = 'none';
  const definitions: readonly (readonly Layer[])[] = Object.values(profiles);
  const pools = Object.fromEntries(kinds.map(kind => {
    const max = Math.max(...definitions.map(layers => layers.find(layer => layer.kind === kind)?.count ?? 0));
    const particles = Array.from({ length: max }, () => particleArt(kind));
    container.addChild(...particles);
    return [kind, particles];
  })) as Record<ParticleKind, Graphics[]>;
  let current: ProfileId | null = null;
  let sceneStart = 0;
  let layers: readonly Layer[] = [];
  let count = 0;
  return {
    container,
    draw(id: ProfileId, layout: WorldLayout, elapsed: number, reduced: boolean, occluded: boolean) {
      if (id !== current) {
        current = id;
        sceneStart = elapsed;
        layers = profiles[id];
        count = layers.reduce((sum, layer) => sum + layer.count, 0);
        for (const pool of Object.values(pools)) for (const particle of pool) particle.visible = false;
        for (const { kind, count, tint } of layers) {
          for (let index = 0; index < count; index++) pools[kind][index].tint = tint;
        }
      }
      const time = reduced ? 1750 : elapsed - sceneStart;
      const unit = Math.min(1.45, Math.max(.84, Math.min(layout.width, layout.height) / 650));
      const opacity = occluded ? .65 : 1;
      for (const layer of layers) {
        const [left, top, width, height] = layer.region ?? defaultRegion;
        const source = layer.emitter && plumeAnchor(layer.emitter, layout);
        for (let index = 0; index < layer.count; index++) {
          const particle = pools[layer.kind][index];
          const seed = fraction((index + 1) * .618033989);
          const offset = fraction((index + 1) * .381966011 + .21);
          const phase = fraction(time / (6800 + 4700 * offset) + seed);
          const swing = Math.sin(phase * Math.PI * 2 + index);
          const fade = Math.sin(phase * Math.PI);
          let x = (left + seed * width) * layout.width, y = (top + offset * height) * layout.height;
          let scale = unit * (.64 + offset * .6), alpha = .30, rotation = 0;
          particle.visible = !reduced || layer.kind !== 'wind' && layer.kind !== 'scan';
          switch (layer.kind) {
            case 'puff':
              if (!source) break;
              x = source.x + (phase * 30 + swing * (4 + phase * 10)) * unit;
              y = source.y - phase * (68 + seed * 38) * unit;
              scale *= .37 + phase * 1.6;
              alpha = .64 * fade;
              rotation = swing * .24;
              break;
            case 'leaf':
              x = (left + fraction(seed + phase * .26) * width) * layout.width + swing * 11 * unit;
              y = (top + phase * height) * layout.height;
              rotation = phase * Math.PI * 2 + index;
              alpha = .68 * fade;
              break;
            case 'wind':
              x = (left + phase * width) * layout.width;
              y += swing * 6 * unit;
              scale *= 1.18;
              alpha = .20 * fade;
              break;
            case 'scan':
              y = (top + phase * height) * layout.height;
              alpha = .16 * fade;
              scale *= 1.45;
              break;
            case 'sparkle':
            case 'dust':
              x += swing * (layer.kind === 'dust' ? 24 : 13) * unit;
              y += Math.cos(phase * Math.PI * 2 + index) * 11 * unit;
              alpha = layer.kind === 'sparkle' ? .15 + Math.pow(fade, 5) * .67 : .22 + fade * .27;
              break;
          }
          particle.position.set(x, y);
          particle.scale.set(scale);
          particle.rotation = rotation;
          particle.alpha = alpha * opacity;
        }
      }
      return count;
    },
  };
}
