import type { Command } from '../game/commands';
import type { SceneId } from '../content/scenes';
import { canSignIn, type Preferences, type RunState } from '../game/state';
import type { SceneObject } from '../scenes/objects';
import { INSTRUMENTS, instrumentFrame, isInstrumentScene, type InstrumentScene } from './instruments';
import { plaqueBounds, project, worldApproachBounds, type Point, type Rect, type WorldLayout } from './layout';
import { cottageKnockerLabel, roomDoor } from './navigation';
import { studioPlacement } from './studioLayout';
import { isPaintedTrial, trialTag } from './trialSurfaces';

type Objective = { id: string; label: string; marker: string; frame: Rect; command?: Command };
const instrumentMarks: Record<InstrumentScene, string> = {
  threshold: '◇', kitchen: '∪', studio: '◉', cabin: '✧', tower: '▱', greenhouse: '❧', garden: '✿', vision: '▤',
};
const exits: Record<Exclude<SceneId, 'cottage'>, Point> = {
  threshold: { x: 667, y: 439 }, kitchen: { x: 1510, y: 691 },
  studio: { x: 1400, y: 513 }, cabin: { x: 1584, y: 512 },
  tower: { x: 1480, y: 727 }, greenhouse: { x: 1438, y: 762 },
  garden: { x: 1120, y: 663 }, account: { x: 1400, y: 449 }, vision: { x: 1450, y: 636 },
};

export function roomObjective(run: RunState, layout: WorldLayout, objects: readonly SceneObject[], textSize: Preferences['textSize']): Objective {
  const scene = run.currentScene;
  if (isInstrumentScene(scene)) {
    const { width, height } = layout;
    const instrument = instrumentFrame(width, height, false, scene);
    const frame = scene === 'studio' ? studioPlacement(layout, textSize).tag
      : isPaintedTrial(scene) ? trialTag(scene, layout)
      : scene === 'garden' ? plaqueBounds({ ...instrument, y: instrument.y + instrument.height, height: 0 }, layout)
      : instrument;
    return { id: `${scene}.work`, label: INSTRUMENTS[scene].approach, marker: instrumentMarks[scene], frame };
  }
  if (scene === 'account') {
    const ledger = objects.find(object => object.id === 'account.ledger')!;
    return { id: ledger.id, label: ledger.label, marker: ledger.marker, frame: worldApproachBounds(ledger, layout) };
  }
  if (!run.arrival.aliasStamped) {
    return { id: 'cottage.card', label: 'Open borrowing card', marker: '▱', frame: plaqueBounds(layout.card, layout) };
  }
  const door = { id: 'cottage.door', marker: '⌂', frame: plaqueBounds(layout.door, layout) };
  if (run.puzzles.greenhouse.solved) {
    return canSignIn(run)
      ? { ...door, label: cottageKnockerLabel(run), command: { type: 'SIGN_IN' } }
      : { ...door, label: 'Approach the door stitch' };
  }
  return run.arrival.theftRecorded
    ? { ...door, label: 'Begin account recovery', command: { type: 'START_RECOVERY' } }
    : { ...door, label: 'Try the cottage door' };
}

export function roomExit(run: RunState, layout: WorldLayout) {
  const scene = run.currentScene;
  const door = roomDoor(run);
  if (scene === 'cottage' || !door) return null;
  const mount = layout.libraryDetails || scene === 'vision' && layout.framing === 'portrait' || scene === 'garden' && layout.profile === 'portrait'
    ? { x: layout.width * .72, y: layout.height * .31 }
    : project(exits[scene], layout.camera);
  return { ...door, frame: plaqueBounds({ ...mount, width: 0, height: 0 }, layout) };
}
