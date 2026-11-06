import { project, type Point, type Rect, type WorldLayout } from './layout';

const tagMounts = {
  threshold: { x: 680, y: 802 },
  kitchen: { x: 700, y: 586 },
  cabin: { x: 678, y: 699 },
  tower: { x: 607, y: 748 },
  greenhouse: { x: 719, y: 818 },
} satisfies Record<string, Point>;

export type PaintedTrial = keyof typeof tagMounts;
export const cabinLampBounds = (index: number): Rect => ({ x: 224 + index * 168, y: 515 + (index % 2) * 7, width: 100, height: 137 });
export const CABIN_PLANCHETTE = { x: 559, y: 631, width: 105, height: 47 };

export function isPaintedTrial(scene: string): scene is PaintedTrial {
  return Object.hasOwn(tagMounts, scene);
}

/** Project the physical tag with the painting and keep its native hit area in reach when the edge crops. */
export function trialTag(scene: PaintedTrial, layout: WorldLayout): Rect {
  const { width, height, camera } = layout;
  const mount = project(tagMounts[scene], camera);
  const tagWidth = Math.min(205, width - 28);
  const maxY = height - (height < 540 ? 139 : 160);
  return {
    x: Math.min(width - tagWidth - 14, Math.max(14, mount.x - tagWidth / 2)),
    y: Math.min(maxY, Math.max(72, mount.y - 13)),
    width: tagWidth,
    height: 44,
  };
}
