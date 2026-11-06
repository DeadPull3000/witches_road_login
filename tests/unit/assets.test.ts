import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ILLUSTRATED_SCENES, sceneArt } from '../../src/scenes/objects';
import { INTERIOR_PORTRAITS } from '../../src/world/layout';

describe('generated art packaging', () => {
  it('ships each runtime room and character as a WebP with the authored portrait dimensions', () => {
    const images = ILLUSTRATED_SCENES.flatMap(scene => {
      const { background, character } = sceneArt(scene, 'inside');
      return character ? [background, character] : [background];
    });
    for (const { url, width, height } of Object.values(INTERIOR_PORTRAITS)) {
      images.push(url);
      const source = readFileSync(new URL(`../../public${url.replace('.webp', '.png')}`, import.meta.url));
      expect(source.readUInt32BE(16)).toBe(width);
      expect(source.readUInt32BE(20)).toBe(height);
    }
    for (const path of new Set(images)) {
      expect(path).toMatch(/\.webp$/);
      const data = readFileSync(new URL(`../../public${path}`, import.meta.url));
      expect(data.toString('ascii', 0, 4)).toBe('RIFF');
      expect(data.toString('ascii', 8, 12)).toBe('WEBP');
    }
  });
  it('ships smaller full-screen runtime exports and keeps the original paintings and alpha sprite', () => {
    const pairs = [['cottage/cottage-dusk', 'world/cottage-dusk'], ['cottage/cottage-dusk-portrait', 'world/cottage-dusk-portrait'], ['cottage/agatha-road', 'world/agatha-road']];
    const sizes = pairs.map(([source, runtime]) => {
      const original = readFileSync(new URL(`../../public/assets/${source}.png`, import.meta.url)), exported = readFileSync(new URL(`../../public/assets/${runtime}.webp`, import.meta.url));
      expect(exported.subarray(0, 4).toString()).toBe('RIFF'); expect(exported.subarray(8, 12).toString()).toBe('WEBP'); expect(exported.length).toBeLessThan(original.length);
      return exported.length;
    });
    expect(sizes[0] + sizes[2]).toBeLessThan(4_000_000); expect(sizes[1] + sizes[2]).toBeLessThan(4_000_000);
    const portrait = readFileSync(new URL('../../public/assets/cottage/cottage-dusk-portrait.png', import.meta.url));
    expect(portrait.readUInt32BE(16)).toBe(940); expect(portrait.readUInt32BE(20)).toBe(1672);
  });
  it('ships Phase E interiors and a transparent Rio sprite', () => {
    for (const path of ['greenhouse/greenhouse-earth','cottage/cottage-room','library/library-afterhours','threshold/coven-cellar']) {
      const background = readFileSync(new URL(`../../public/assets/${path}.png`, import.meta.url)); expect(background.readUInt32BE(16)).toBe(1672); expect(background.readUInt32BE(20)).toBe(941);
    }
    const rio = readFileSync(new URL('../../public/assets/greenhouse/rio-road.png', import.meta.url)); expect(rio.readUInt32BE(16)).toBe(1024); expect(rio.readUInt32BE(20)).toBe(1536); expect(rio[25]).toBe(6);
  });
  it('ships the expected PNG dimensions with a true alpha channel on Agatha', () => {
    const agatha = readFileSync(new URL('../../public/assets/cottage/agatha-road.png', import.meta.url));
    const cottage = readFileSync(new URL('../../public/assets/cottage/cottage-dusk.png', import.meta.url));
    expect(agatha.subarray(1, 4).toString()).toBe('PNG'); expect(agatha.readUInt32BE(16)).toBe(1024); expect(agatha.readUInt32BE(20)).toBe(1536);
    expect(agatha[25]).toBe(6); // PNG color type 6 includes alpha; no opaque backdrop is required.
    expect(cottage.readUInt32BE(16)).toBe(1672); expect(cottage.readUInt32BE(20)).toBe(941);
    expect(agatha.length + cottage.length).toBeLessThan(6_000_000);
  });
  it('ships separate Jen/Alice sprites and their room backgrounds', () => {
    for (const folder of ['kitchen', 'studio']) {
      const actor = folder === 'kitchen' ? 'jen' : 'alice', room = folder === 'kitchen' ? 'kitchen-tide' : 'studio-amber';
      const sprite = readFileSync(new URL(`../../public/assets/${folder}/${actor}-road.png`, import.meta.url));
      const background = readFileSync(new URL(`../../public/assets/${folder}/${room}.png`, import.meta.url));
      expect(sprite.readUInt32BE(16)).toBe(1024); expect(sprite.readUInt32BE(20)).toBe(1536); expect(sprite[25]).toBe(6);
      expect(background.readUInt32BE(16)).toBe(1672); expect(background.readUInt32BE(20)).toBe(941);
    }
  });
  it('ships the cabin, tower and transparent full-body Lilia sprite', () => {
    for (const path of ['cabin/cabin-violet', 'tower/tower-divination']) {
      const background = readFileSync(new URL(`../../public/assets/${path}.png`, import.meta.url));
      expect(background.readUInt32BE(16)).toBe(1672); expect(background.readUInt32BE(20)).toBe(941);
    }
    const sprite = readFileSync(new URL('../../public/assets/tower/lilia-road.png', import.meta.url));
    expect(sprite.readUInt32BE(16)).toBe(1024); expect(sprite.readUInt32BE(20)).toBe(1536); expect(sprite[25]).toBe(6);
  });
});
