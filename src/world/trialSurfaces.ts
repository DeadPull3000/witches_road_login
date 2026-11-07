import type { Rect } from './layout';

export const COVEN_MAT = { x: 286, y: 573, width: 700, height: 232 };
export const JUGS = [
  { x: 434, y: 415, width: 101, height: 140 },
  { x: 635, y: 393, width: 121, height: 167 },
] as const;
export const TAROT_SPREAD = { x: 370, y: 660, width: 416, height: 54 };
export const VINE_BED = { x: 306, y: 556, width: 730, height: 254 };

export const trialObject = {
  threshold: COVEN_MAT,
  kitchen: JUGS[1],
  cabin: { x: 845, y: 595, width: 156, height: 82 },
  tower: TAROT_SPREAD,
  greenhouse: VINE_BED,
} satisfies Record<string, Rect>;

export type PaintedTrial = keyof typeof trialObject;
export const cabinLampBounds = (index: number): Rect => ({ x: 224 + index * 168, y: 515 + (index % 2) * 7, width: 100, height: 137 });
export const CABIN_PLANCHETTE = { x: 559, y: 631, width: 105, height: 47 };

export function isPaintedTrial(scene: string): scene is PaintedTrial {
  return Object.hasOwn(trialObject, scene);
}
