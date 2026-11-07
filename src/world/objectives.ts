import type { SceneId } from '../content/scenes';
import type { EncounterId } from '../content/encounters';
import type { Command } from '../game/commands';
import { canSignIn, type RunState } from '../game/state';
import type { SceneObject } from '../scenes/objects';
import { INSTRUMENTS, isInstrumentScene } from './instruments';
import { centeredRect, drawnHitArea, paintedHitArea, projectRect, worldObjectBounds, type Rect, type WorldLayout } from './layout';
import { cottageKnockerLabel, roomDoor } from './navigation';
import type { PropKind } from './PropArtwork';
import { CABIN_PLANCHETTE, JUGS, cabinLampBounds, isPaintedTrial, trialObject } from './trialSurfaces';

type ObjectArt = PropKind | 'ring' | 'coven' | 'jug' | 'vine';
export type ObjectTarget = { frame: Rect; art?: ObjectArt; missingArt?: PropKind };
type Objective = ObjectTarget & { id: string; label: string; command?: Command };

function painted(rect: Rect, layout: WorldLayout, missingArt?: PropKind): ObjectTarget | null {
  const frame = paintedHitArea(projectRect(rect, layout.camera), layout);
  return frame && { frame, missingArt };
}
function drawn(rect: Rect, layout: WorldLayout, art: ObjectArt): ObjectTarget {
  return { frame: drawnHitArea(projectRect(rect, layout.camera), layout), art };
}

export function cottageStitch(layout: WorldLayout): Rect {
  const width = Math.min(76, layout.door.width * .66);
  return centeredRect({ x: layout.door.x + layout.door.width * .48, y: layout.knocker.y - Math.max(50, layout.door.height * .27) }, width, width * .5);
}
function cottageKnocker(layout: WorldLayout): ObjectTarget {
  const ring = centeredRect(layout.knocker, layout.camera.scale * 42, layout.camera.scale * 54);
  const frame = paintedHitArea(ring, layout);
  return frame ? { frame, missingArt: 'knocker' } : { frame: drawnHitArea(ring, layout), art: 'knocker' };
}
export function cottagePassage(layout: WorldLayout): ObjectTarget {
  const { x, y, width, height } = layout.door;
  const planks = { x, y: y + height * .42, width: width * .46, height: height * .53 };
  const frame = paintedHitArea(planks, layout);
  return frame ? { frame, missingArt: 'door' } : { frame: drawnHitArea(planks, layout), art: 'door' };
}
export function cottageWritingDesk(layout: WorldLayout): ObjectTarget | null {
  const desk = layout.cottageDetails
    ? { x: 153, y: 876, width: 385, height: 106 }
    : { x: 407, y: 501, width: 568, height: 122 };
  return painted(desk, layout, 'ledger');
}

const library = (layout: WorldLayout) => layout.framing === 'portrait' ? {
  ledger: { x: 334, y: 875, width: 168, height: 99 },
  stamp: { x: 530, y: 878, width: 82, height: 88 },
  slot: { x: 635, y: 902, width: 108, height: 62 },
  date: { x: 176, y: 887, width: 93, height: 67 },
} : {
  ledger: { x: 647, y: 410, width: 233, height: 100 },
  stamp: { x: 900, y: 407, width: 112, height: 92 },
  slot: { x: 1091, y: 427, width: 141, height: 69 },
  date: { x: 347, y: 410, width: 107, height: 80 },
};

const paintedTrialFallback = {
  threshold: 'coven', kitchen: 'jug', cabin: 'scroll', tower: 'cards', greenhouse: 'vine',
} as const;

function instrumentTarget(scene: keyof typeof INSTRUMENTS, layout: WorldLayout): ObjectTarget {
  if (isPaintedTrial(scene)) {
    const rect = trialObject[scene];
    if (scene === 'cabin') return drawn(layout.framing === 'portrait'
      ? { x: 672, y: 653, width: 68, height: 60 } : rect, layout, 'scroll');
    return painted(rect, layout) ?? drawn(rect, layout, paintedTrialFallback[scene]);
  }
  if (scene === 'garden') return drawn(layout.profile === 'portrait'
    ? { x: 144, y: 935, width: 578, height: 249 }
    : { x: 286, y: 541, width: 651, height: 241 }, layout, 'ring');
  if (scene === 'studio') {
    const mixer = { x: 154, y: 359, width: 344, height: 122 };
    return painted(mixer, layout, 'dial') ?? drawn(mixer, layout, 'dial');
  }
  const readers = layout.framing === 'portrait'
    ? { x: 246, y: 710, width: 491, height: 190 }
    : { x: 429, y: 344, width: 488, height: 181 };
  return painted(readers, layout, 'television') ?? drawn(readers, layout, 'television');
}

export function roomObjective(run: RunState, layout: WorldLayout): Objective {
  const scene = run.currentScene;
  if (isInstrumentScene(scene)) return { id: `${scene}.work`, label: INSTRUMENTS[scene].approach, ...instrumentTarget(scene, layout) };
  if (scene === 'account') return { id: 'account.ledger', label: 'Inspect your borrowing ledger', ...drawn(library(layout).ledger, layout, 'ledger') };
  if (!run.arrival.aliasStamped) return { id: 'cottage.card', label: 'Open borrowing card', frame: drawnHitArea(layout.card, layout), art: 'card' };
  const door = { id: 'cottage.door', ...cottageKnocker(layout) };
  if (run.puzzles.greenhouse.solved) {
    if (canSignIn(run)) return { ...door, label: cottageKnockerLabel(run), command: { type: 'SIGN_IN' } };
    return { id: door.id, label: 'Approach the door stitch', frame: drawnHitArea(cottageStitch(layout), layout) };
  }
  return run.arrival.theftRecorded
    ? { ...door, label: 'Begin account recovery', command: { type: 'START_RECOVERY' } }
    : { ...door, label: 'Try the cottage door' };
}

const passages: Partial<Record<SceneId, Rect>> = {
  threshold: { x: 553, y: 230, width: 225, height: 260 },
  cabin: { x: 1543, y: 232, width: 116, height: 392 },
  account: { x: 1380, y: 480, width: 232, height: 220 },
  vision: { x: 1240, y: 287, width: 222, height: 409 },
  garden: { x: 231, y: 181, width: 159, height: 120 },
};
const roadKeys: Partial<Record<SceneId, Rect>> = {
  kitchen: { x: 838, y: 516, width: 108, height: 64 },
  studio: { x: 678, y: 522, width: 100, height: 63 },
  tower: { x: 801, y: 679, width: 90, height: 63 },
  greenhouse: { x: 1058, y: 592, width: 124, height: 72 },
};

export function roomExit(run: RunState, layout: WorldLayout) {
  const scene = run.currentScene, door = roomDoor(run);
  if (scene === 'cottage' || !door) return null;
  const passage = layout.profile === 'portrait' && scene === 'garden' ? { x: 155, y: 378, width: 149, height: 143 }
    : layout.framing === 'portrait' && scene === 'account' ? { x: 807, y: 730, width: 127, height: 183 }
    : layout.framing === 'portrait' && scene === 'vision' ? { x: 815, y: 715, width: 125, height: 219 }
    : passages[scene];
  const target = passage && painted(passage, layout, 'door');
  const key = roadKeys[scene];
  return { ...door, ...(target || (key ? drawn(key, layout, 'key') : {
    frame: drawnHitArea({ x: layout.width - 100, y: layout.height * .53, width: 71, height: 54 }, layout), art: 'key' as const,
  })) };
}

function encounterTarget(prop: EncounterId, layout: WorldLayout): ObjectTarget | null {
  const portrait = layout.framing === 'portrait';
  switch (prop) {
    case 'television': return drawn(portrait
      ? { x: 406, y: 725, width: 135, height: 107 }
      : { x: 862, y: 334, width: 147, height: 119 }, layout, 'television');
    case 'portrait': return drawn(portrait
      ? { x: 158, y: 397, width: 112, height: 109 }
      : { x: 394, y: 99, width: 130, height: 132 }, layout, 'portrait');
    case 'rabbitPortrait': return layout.width >= 900 ? drawn({ x: 1427, y: 144, width: 112, height: 114 }, layout, 'portrait') : null;
    case 'sigilCard': return layout.width >= 900 ? drawn({ x: 737, y: 453, width: 126, height: 64 }, layout, 'card') : null;
    case 'caseDrawer': return painted(portrait ? { x: 864, y: 849, width: 101, height: 61 } : { x: 1540, y: 506, width: 115, height: 71 }, layout);
    case 'returnDate': {
      const { date } = library(layout);
      return painted(date, layout, 'dateStamp') ?? drawn(date, layout, 'dateStamp');
    }
    case 'visionIntercom': return painted(portrait ? { x: 137, y: 773, width: 101, height: 164 }
      : { x: 297, y: 395, width: 119, height: 164 }, layout, 'intercom');
    case 'gardenStone': return painted(layout.profile === 'portrait'
      ? { x: 314, y: 677, width: 130, height: 113 }
      : { x: 265, y: 384, width: 112, height: 91 }, layout);
    case 'cabinWindow': return painted({ x: 784, y: 138, width: 378, height: 305 }, layout);
    case 'kitchenCupboard': return painted({ x: 1099, y: 440, width: 250, height: 156 }, layout);
    case 'studioSpeaker': return painted({ x: 807, y: 252, width: 137, height: 211 }, layout);
  }
}

export function roomObjectTarget(object: SceneObject, layout: WorldLayout, run: RunState): ObjectTarget | null {
  const { command, id } = object;
  if (command.type === 'INSPECT_ENCOUNTER') return encounterTarget(command.prop, layout);
  if (command.type === 'TOGGLE_LAMP') return painted(cabinLampBounds(command.index), layout);
  if (id === 'cabin.check' || id === 'cabin.planchette' && run.puzzles.cabin.solved) return painted(CABIN_PLANCHETTE, layout);
  if (id === 'cottage.door') return cottageKnocker(layout);
  if (id === 'cottage.stitch') return { frame: drawnHitArea(cottageStitch(layout), layout) };
  if (id === 'cottage.garden') {
    const mushrooms = layout.profile === 'portrait' ? { x: 43, y: 1116, width: 108, height: 101 }
      : layout.height < 540 ? { x: 933, y: 538, width: 74, height: 58 }
      : { x: 64, y: 700, width: 103, height: 106 };
    return painted(mushrooms, layout, 'mushrooms') ?? { frame: drawnHitArea(layout.garden, layout), art: 'mushrooms' };
  }
  if (id === 'cottage.rug') {
    const rug = layout.cottageDetails ? { x: 236, y: 1115, width: 493, height: 234 }
      : layout.height < 540 ? { x: 948, y: 670, width: 141, height: 166 }
      : { x: 306, y: 671, width: 662, height: 164 };
    const frame = paintedHitArea(projectRect(rug, layout.camera), layout, layout.height < 540 ? layout.height - 36 : undefined);
    return frame && { frame };
  }
  if (id === 'account.slot') {
    const { slot } = library(layout);
    return painted(slot, layout, 'slot') ?? drawn(slot, layout, 'slot');
  }
  if (id === 'account.renew') return drawn(library(layout).stamp, layout, 'stamp');
  if (id === 'kitchen.smallJug') return painted(JUGS[0], layout);
  if (id === 'tower.envelope') return drawn({ x: 311, y: 706, width: 107, height: 58 }, layout, 'card');
  if (id === 'studio.record') return painted({ x: 138, y: 568, width: 258, height: 86 }, layout);
  if (id === 'studio.speakers') return painted({ x: 1316, y: 251, width: 131, height: 208 }, layout);
  if (isInstrumentScene(run.currentScene) && !['kitchen.jen', 'studio.alice', 'cabin.agatha', 'tower.lilia', 'greenhouse.rio'].includes(id)) return null;
  if (command.type === 'INSPECT_PROP' && command.prop.startsWith('room') && layout.width < 900) return null;
  const frame = worldObjectBounds(object, layout);
  return frame && { frame };
}
