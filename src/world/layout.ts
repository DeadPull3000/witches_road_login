import type { RunState } from '../game/state';
import { sceneArt, type SceneObject } from '../scenes/objects';
import { COTTAGE_INTERIOR_DOOR } from '../content/cottage';
/** The camera and semantic hit areas consume the same, CSS-pixel geometry. */
export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };
export type Projection = { scale: number; x: number; y: number };
export type CottageLayout = {
  width: number; height: number; profile: 'portrait' | 'landscape';
  background: string; camera: Projection; backgroundRect: Rect;
  actor: Rect; door: Rect; garden: Rect; card: Rect; chimney: Point;
};

export const WORLD_ASSETS = {
  landscape: '/assets/world/cottage-dusk.webp',
  portrait: '/assets/world/cottage-dusk-portrait.webp',
  agatha: '/assets/world/agatha-road.webp',
} as const;
export const GARDEN_ASSETS = {
  landscape: { url: '/assets/garden/garden-moonrise-wide.webp', width: 1672, height: 941 },
  portrait: { url: '/assets/garden/garden-moonrise-tall.webp', width: 941, height: 1672 },
} as const;

export function cover(width: number, height: number, artWidth: number, artHeight: number): Projection {
  const scale = Math.max(width / artWidth, height / artHeight);
  return { scale, x: (width - artWidth * scale) / 2, y: (height - artHeight * scale) / 2 };
}
export function project(point: Point, camera: Projection): Point {
  return { x: point.x * camera.scale + camera.x, y: point.y * camera.scale + camera.y };
}
export function unproject(point: Point, camera: Projection): Point {
  return { x: (point.x - camera.x) / camera.scale, y: (point.y - camera.y) / camera.scale };
}
export function projectRect(rect: Rect, camera: Projection): Rect {
  return { ...project(rect, camera), width: rect.width * camera.scale, height: rect.height * camera.scale };
}
export const EFFECT_PIXEL_BUDGET = 500_000;
/** The still art stays at viewport resolution. Only the particles and scene details share this framebuffer. */
export function renderResolution(width: number, height: number, density: number) {
  return Math.min(Math.max(1, density), 1.5, Math.sqrt(EFFECT_PIXEL_BUDGET / (width * height)));
}
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
function framePainting(width: number, height: number, artWidth: number, artHeight: number, focusX: number, focusY: number): Projection {
  const { scale } = cover(width, height, artWidth, artHeight);
  return {
    scale,
    x: clamp(width / 2 - artWidth * focusX * scale, width - artWidth * scale, 0),
    y: clamp(height / 2 - artHeight * focusY * scale, height - artHeight * scale, 0),
  };
}
function hitArea(rect: Rect, width: number, height: number): Rect {
  const w = Math.min(width - 16, Math.max(44, rect.width)), h = Math.min(height - 16, Math.max(44, rect.height));
  return { x: clamp(rect.x + (rect.width - w) / 2, 8, width - w - 8), y: clamp(rect.y + (rect.height - h) / 2, 8, height - h - 8), width: w, height: h };
}

export function cottageLayout(width: number, height: number): CottageLayout {
  width = Math.max(240, width); height = Math.max(240, height);
  // The intermediate profile uses portrait art with a wider view of the clearing.
  // Below 1.1 the wide painting would crop away the cottage door.
  const profile = width / height < 1.1 ? 'portrait' : 'landscape';
  const portrait = profile === 'portrait', artWidth = portrait ? 940 : 1672, artHeight = portrait ? 1672 : 941;
  const camera = cover(width, height, artWidth, artHeight);
  if (portrait) {
    // Keep the threshold in view on both tablets and tall phones.
    camera.y = clamp(height * .66 - 1090 * camera.scale, height - artHeight * camera.scale, 0);
  }
  const backgroundRect = projectRect({ x: 0, y: 0, width: artWidth, height: artHeight }, camera);
  const rawDoor = projectRect(portrait ? { x: 465, y: 815, width: 145, height: 259 } : { x: 552, y: 420, width: 126, height: 215 }, camera);
  const door = hitArea(rawDoor, width, height);
  const actorHeight = portrait ? Math.min(height * .32, width * .8) : Math.min(height * .66, width * .37);
  const actorWidth = actorHeight * 2 / 3;
  const actor = { x: portrait ? width - actorWidth - width * .045 : width * .78 - actorWidth / 2, y: height * .91 - actorHeight, width: actorWidth, height: actorHeight };
  const garden = hitArea({ x: width * .07, y: height * (portrait ? .63 : .82), width: Math.min(140, width * .28), height: 54 }, width, height);
  const card = hitArea({ x: portrait ? width * .07 : width * .52, y: portrait ? height * .72 : height * .74, width: Math.min(154, width * .36), height: 68 }, width, height);
  const chimney = project(portrait ? { x: 265, y: 460 } : { x: 320, y: 117 }, camera);
  return { width, height, profile, background: WORLD_ASSETS[profile], camera, backgroundRect, actor, door, garden, card, chimney };
}

export function rectStyle(rect: Rect) { return { left: rect.x, top: rect.y, width: rect.width, height: rect.height }; }

type Framing = 'landscape' | 'intermediate' | 'portrait';
type CottageDetails = { desk: Projection; rug: Projection };
type LibraryDetails = { ledger: Rect; slot: Rect };
export type WorldLayout = CottageLayout & {
  outside: boolean; character: string | null; plane: Projection; framing: Framing;
  knocker: Point; cottageDetails?: CottageDetails; libraryDetails?: LibraryDetails;
};

export const INTERIOR_PORTRAITS = {
  cottage: { url: '/assets/cottage/cottage-room-portrait.webp', width: 981, height: 1602 },
  account: { url: '/assets/library/library-afterhours-portrait.webp', width: 941, height: 1672 },
  vision: { url: '/assets/vision/vision-annex-portrait.webp', width: 941, height: 1672 },
} as const;
// Camera centers picked from the paintings. The close-ups continue to own the working props.
const roomFocus: Record<Exclude<RunState['currentScene'], 'garden'>, Record<Framing, number>> = {
  cottage:    { landscape: .5, intermediate: .57, portrait: .5 },
  threshold:  { landscape: .49, intermediate: .43, portrait: .38 },
  kitchen:    { landscape: .5, intermediate: .49, portrait: .45 },
  studio:     { landscape: .47, intermediate: .36, portrait: .24 },
  cabin:      { landscape: .5, intermediate: .45, portrait: .42 },
  tower:      { landscape: .46, intermediate: .39, portrait: .33 },
  greenhouse: { landscape: .52, intermediate: .52, portrait: .47 },
  account:    { landscape: .5, intermediate: .57, portrait: .5 },
  vision:     { landscape: .48, intermediate: .44, portrait: .5 },
};
function attachPlane(camera: Projection, plane: Projection): Projection {
  return { ...project(plane, camera), scale: camera.scale * plane.scale };
}

export function worldLayout(run: RunState, width: number, height: number): WorldLayout {
  const base = cottageLayout(width, height), scene = run.currentScene, outside = scene === 'cottage' && run.cottageView === 'outside';
  const aspect = width / height, framing: Framing = aspect < .82 ? 'portrait' : aspect < 1.45 ? 'intermediate' : 'landscape';
  const knocker = { x: base.door.x + base.door.width / 2, y: base.door.y + base.door.height * .36 };
  if (outside) return { ...base, outside, character: WORLD_ASSETS.agatha, plane: cover(width, height, 640, 360), framing, knocker };
  if (scene === 'garden') {
    const art = GARDEN_ASSETS[base.profile], camera = cover(width, height, art.width, art.height);
    return { ...base, outside, background: art.url, character: null, camera, backgroundRect: projectRect({x:0,y:0,width:art.width,height:art.height},camera), plane:cover(width,height,640,360), framing, knocker };
  }
  const art = sceneArt(scene, run.cottageView);
  const portrait = framing === 'portrait' && (scene === 'cottage' || scene === 'account' || scene === 'vision') ? INTERIOR_PORTRAITS[scene] : null;
  const artWidth = portrait?.width ?? 1672, artHeight = portrait?.height ?? 941;
  const camera = framePainting(width, height, artWidth, artHeight, roomFocus[scene][framing], portrait ? .52 : .55);
  const backgroundRect = projectRect({ x: 0, y: 0, width: artWidth, height: artHeight }, camera);
  const plane = { scale: camera.scale * 1672 / 640, x: camera.x, y: camera.y };
  const layout = { ...base, outside, background: portrait?.url ?? art.background, character: art.character, camera, backgroundRect, plane, framing, knocker };
  if (scene === 'cottage') {
    if (portrait) {
      const cardPosition = project({ x: 178, y: 987 }, camera);
      return {
        ...layout,
        door: projectRect({ x: 580, y: 546, width: 196, height: 428 }, camera),
        knocker: project({ x: 750, y: 787 }, camera),
        card: hitArea({ ...cardPosition, width: Math.min(154, width * .36), height: 65 }, width, height),
        cottageDetails: {
          desk: attachPlane(camera, { x: -115, y: 535, scale: 1.72 }),
          rug: attachPlane(camera, { x: -290, y: 346, scale: 3 }),
        },
      };
    }
    return { ...layout, door: projectedObject(COTTAGE_INTERIOR_DOOR, plane), knocker: project({ x: 1268, y: 445 }, camera) };
  }
  if (scene === 'account' && portrait) {
    return { ...layout, libraryDetails: {
      ledger: projectRect({ x: 310, y: 930, width: 222, height: 66 }, camera),
      slot: projectRect({ x: 618, y: 896, width: 132, height: 70 }, camera),
    } };
  }
  return layout;
}
function projectedObject(object: Rect, plane: Projection): Rect {
  return projectRect({ ...object, x: object.x - object.width / 2, y: object.y - object.height / 2 }, plane);
}
/** Place the approach plaque by its prop. When the camera crops the prop, keep the plaque at the nearest edge. */
export function worldApproachBounds(object: SceneObject, layout: WorldLayout): Rect {
  return plaqueBounds(roomObjectRect(object, layout), layout);
}
export function plaqueBounds(prop: Rect, layout: WorldLayout): Rect {
  const width = Math.min(layout.framing === 'portrait' ? 160 : 184, layout.width - 32);
  const height = 48;
  return {
    x: clamp(prop.x + (prop.width - width) / 2, 16, layout.width - width - 16),
    y: clamp(prop.y + (prop.height - height) / 2, 60, layout.height - 156),
    width,
    height,
  };
}

/** Keep projected plaques legible when a narrow camera crops their objects together. */
export function placePlaque(preferred: Rect, occupied: readonly Rect[], layout: WorldLayout): Rect | null {
  const gap = 8;
  const { width, height } = preferred;
  const xs = [preferred.x, 14, layout.width - width - 14, ...occupied.flatMap(rect => [rect.x - width - gap, rect.x + rect.width + gap])];
  const ys = [preferred.y, 60, layout.height - height - 96, ...occupied.flatMap(rect => [rect.y - height - gap, rect.y + rect.height + gap])];
  const candidates = xs.flatMap(x => ys.map(y => ({ x, y, width, height })))
    .filter(rect => rect.x >= 14 && rect.x + width <= layout.width - 14 && rect.y >= 60 && rect.y + height <= layout.height - 96)
    .filter(rect => occupied.every(other =>
      rect.x + width + gap <= other.x || other.x + other.width + gap <= rect.x ||
      rect.y + height + gap <= other.y || other.y + other.height + gap <= rect.y));
  const distance = (rect: Rect) => (rect.x - preferred.x) ** 2 + (rect.y - preferred.y) ** 2;
  return candidates.sort((a, b) => distance(a) - distance(b))[0] ?? null;
}
export function worldEncounterBounds(object: SceneObject, layout: WorldLayout): Rect | null {
  if (object.command.type !== 'INSPECT_ENCOUNTER') return null;
  const { prop } = object.command;
  if (layout.width < 900 && ['caseDrawer', 'sigilCard', 'rabbitPortrait'].includes(prop)) return null;
  let anchor = project(object, layout.plane);
  if (layout.cottageDetails && prop === 'television') anchor = project({ x: 820, y: 905 }, layout.camera);
  if (layout.cottageDetails && prop === 'portrait') anchor = project({ x: 215, y: 422 }, layout.camera);
  if (prop === 'returnDate') anchor = project(layout.libraryDetails ? { x: 186, y: 892 } : { x: 380, y: 488 }, layout.camera);
  if (layout.framing === 'portrait' && prop === 'visionIntercom') anchor = project({ x: 182, y: 912 }, layout.camera);
  if (prop === 'gardenStone') anchor.y = layout.height * (layout.height < 540 ? .19 : .42);
  const width = prop === 'television' ? 130 : prop === 'returnDate' ? 156 : 142;
  return {
    x: clamp(anchor.x - width / 2, 16, layout.width - width - 16),
    y: clamp(anchor.y - 24, 64, layout.height - 160),
    width,
    height: 48,
  };
}
export function cottageDeskBounds(layout: WorldLayout): Rect | null {
  if (!layout.cottageDetails) return null;
  const position = project({ x: 255, y: 213 }, layout.cottageDetails.desk);
  return plaqueBounds({ ...position, width: 0, height: 0 }, layout);
}
function roomObjectRect(object: SceneObject, layout: WorldLayout): Rect {
  if (object.id === 'cottage.door' || object.id === 'cottage.stitch') return layout.door;
  if (object.id === 'account.ledger' && layout.libraryDetails) return layout.libraryDetails.ledger;
  if (object.id === 'account.slot' && layout.libraryDetails) return layout.libraryDetails.slot;
  if (object.id === 'account.renew' && layout.libraryDetails) return projectRect({ x: 450, y: 1075, width: 200, height: 55 }, layout.camera);
  const plane = object.id === 'cottage.rug' ? layout.cottageDetails?.rug : undefined;
  return projectedObject(object, plane ?? layout.plane);
}
/** Only place a direct target over a painted prop that is actually in frame. The object page always has every action. */
export function worldObjectBounds(object: SceneObject, layout: WorldLayout): Rect | null {
  if (object.id.endsWith('.agatha') || ['kitchen.jen','studio.alice','tower.lilia','greenhouse.rio'].includes(object.id)) return layout.actor;
  if (layout.cottageDetails && object.command.type === 'INSPECT_PROP' && object.command.prop.startsWith('room') && object.command.prop !== 'roomRug') return null;
  return visibleHitArea(roomObjectRect(object, layout), layout);
}
export function visibleHitArea(rect: Rect, layout: WorldLayout): Rect | null {
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > layout.width || rect.y + rect.height > layout.height) return null;
  return hitArea(rect, layout.width, layout.height);
}
