import { describe, expect, it } from 'vitest';
import { worldLayout } from '../../src/world/layout';
import { studioPlacement } from '../../src/world/studioLayout';
import { throughTrial } from '../helpers';

const studio = throughTrial('studio');

describe('Alice’s studio placement', () => {
  it.each([
    [1280, 720, 'normal', 'side'],
    [1440, 900, 'normal', 'side'],
    [844, 390, 'normal', 'compact'],
    [640, 360, 'normal', 'sheet'],
    [390, 844, 'normal', 'sheet'],
    [360, 780, 'large', 'sheet'],
    [1280, 720, 'large', 'sheet'],
  ] as const)('fits the desk, tag and host at %i × %i with %s text', (width, height, textSize, dock) => {
    const layout = worldLayout(studio, width, height);
    const placement = studioPlacement(layout, textSize);
    const { frame, benchWidth, actor, speaker, tag } = placement;
    expect(placement.dock).toBe(dock);
    expect(frame.x).toBeGreaterThanOrEqual(0);
    expect(frame.x + frame.width).toBeLessThanOrEqual(width);
    expect(frame.y + frame.height).toBeLessThanOrEqual(height - 100);
    expect(tag.x).toBeGreaterThanOrEqual(0);
    expect(tag.x + tag.width).toBeLessThanOrEqual(width);
    expect(tag.y + tag.height).toBeLessThanOrEqual(height - 90);
    if (dock === 'sheet') {
      const cropWidth = actor.width * .49, cropLeft = actor.x + actor.width * .24;
      expect(cropLeft).toBeGreaterThan(frame.x + benchWidth - 100);
      expect(cropLeft + cropWidth).toBeLessThan(frame.x + benchWidth);
      expect(actor.y + actor.height * .28).toBeLessThan(frame.y + placement.headingHeight + placement.speakerHeight);
    } else {
      expect(speaker.x - benchWidth).toBeGreaterThanOrEqual(dock === 'side' ? 24 : 18);
      expect(actor.x).toBeGreaterThan(frame.x + benchWidth);
      expect(actor.x + actor.width).toBeLessThanOrEqual(width);
    }
  });
});
