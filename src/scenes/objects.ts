import type { RunState } from '../game/state';
import type { Command } from '../game/commands';
import { COTTAGE_INTERIOR_DOOR, ROOM_PROPS } from '../content/cottage';
import { NODES, NODE_LABELS } from '../puzzles/rules';
import { VINE_POSITIONS, vineStagePoint } from '../content/vines';
import { ENCOUNTERS, ENCOUNTER_IDS, encounterAvailable } from '../content/encounters';

export const STAGE = { width: 640, height: 360 } as const;
export type SceneObject = { id: string; label: string; x: number; y: number; width: number; height: number; marker: string; command: Command };
export function sceneObjects(run: RunState, collection: readonly string[] = []): SceneObject[] {
  const extras: SceneObject[] = ENCOUNTER_IDS.filter(prop => encounterAvailable(run, prop, collection)).map(prop => {
    const { scene, label, marker, x, y } = ENCOUNTERS[prop];
    return { id: `${scene}.${prop}`, label, marker, x, y, width: 46, height: 42, command: { type: 'INSPECT_ENCOUNTER', prop } };
  });
  return [...roomObjects(run), ...extras];
}
function roomObjects(run: RunState): SceneObject[] {
  if (run.currentScene === 'threshold' || run.currentScene === 'vision') return [];
  if (run.currentScene === 'account') return [
    { id: 'account.ledger', label: 'Inspect your borrowing ledger', x: 263, y: 183, width: 76, height: 38, marker: '▱', command: { type: 'INSPECT_PROP', prop: 'loanLedger' } },
    { id: 'account.slot', label: 'Inspect the return slot', x: 447, y: 179, width: 60, height: 45, marker: '↧', command: { type: 'INSPECT_PROP', prop: 'returnSlot' } },
    ...(run.milestones.bookRenewed ? [] : [{ id: 'account.renew', label: 'Renew this book', x: 356, y: 216, width: 60, height: 44, marker: '▣', command: { type: 'RENEW_BOOK' as const } }]),
  ];
  if (run.currentScene === 'greenhouse') return [
    ...NODES.map(node => { const [x, y] = vineStagePoint(VINE_POSITIONS[node]); return { id: `greenhouse.stone.${node}`, label: `Touch scene stone ${node} · ${NODE_LABELS[node]}`, x, y, width: 46, height: 38, marker: node, command: { type: 'TRACE_VINE' as const, node } }; }),
    { id: 'greenhouse.rio', label: 'Speak with Rio', x: 520, y: 245, width: 80, height: 160, marker: '✧', command: { type: 'INSPECT_PROP', prop: 'rio' } },
  ];
  if (run.currentScene === 'cottage' && run.cottageView === 'inside') return [
    ...ROOM_PROPS.map(prop => ({ id: `cottage.${prop.id}`, label: prop.label, x: prop.x, y: prop.y, width: 31, height: 32, marker: prop.marker, command: { type: 'INSPECT_PROP' as const, prop: prop.id } })),
    { id: 'cottage.rug', label: 'Inspect the embroidered rug', x: 260, y: 298, width: 190, height: 58, marker: '⌁', command: { type: 'INSPECT_PROP', prop: 'roomRug' } },
    { id: 'cottage.door', label: 'Inspect the cottage door', ...COTTAGE_INTERIOR_DOOR, marker: '⌂', command: { type: 'INSPECT_PROP', prop: 'door' } },
    { id: 'cottage.agatha', label: 'Inspect Agatha’s ribbon', x: 535, y: 245, width: 80, height: 160, marker: '✧', command: { type: 'INSPECT_PROP', prop: 'ribbon' } },
  ];
  if (run.currentScene === 'cabin') return [
    ...run.puzzles.cabin.lamps.map((lit, index) => ({ id: `cabin.lamp.${index}`, label: `Toggle scene lamp ${'ABCD'[index]}: ${lit ? 'lit' : 'unlit'}`, x: 115 + index * 69, y: 225, width: 43, height: 60, marker: 'ABCD'[index], command: { type: 'TOGGLE_LAMP' as const, index } })),
    { id: 'cabin.planchette', label: 'Inspect the planchette', x: 254, y: 260, width: 48, height: 30, marker: '◇', command: { type: 'INSPECT_PROP', prop: 'planchette' } },
    ...(run.puzzles.cabin.solved ? [] : [{ id: 'cabin.check', label: 'Ask the spirits to check', x: 254, y: 260, width: 48, height: 30, marker: '◇', command: { type: 'CHECK_LAMPS' as const } }]),
    { id: 'cabin.agatha', label: 'Speak with Agatha', x: 520, y: 245, width: 80, height: 160, marker: '✧', command: { type: 'INSPECT_PROP', prop: 'agathaCabin' } },
  ];
  if (run.currentScene === 'tower') return [
    { id: 'tower.envelope', label: 'Inspect the appointment envelope', x: 124, y: 265, width: 52, height: 30, marker: '✉', command: { type: 'INSPECT_PROP', prop: 'envelope' } },
    { id: 'tower.lilia', label: 'Speak with Lilia', x: 520, y: 245, width: 80, height: 160, marker: '✧', command: { type: 'INSPECT_PROP', prop: 'lilia' } },
  ];
  if (run.currentScene === 'kitchen') return [
    { id: 'kitchen.smallJug', label: 'Inspect the 3-cup jug', x: 228, y: 191, width: 40, height: 48, marker: '3', command: { type: 'INSPECT_PROP', prop: 'smallJug' } },
    { id: 'kitchen.largeJug', label: 'Inspect the 5-cup jug', x: 290, y: 184, width: 44, height: 61, marker: '5', command: { type: 'INSPECT_PROP', prop: 'largeJug' } },
    { id: 'kitchen.jen', label: 'Speak with Jen', x: 520, y: 245, width: 80, height: 160, marker: '✧', command: { type: 'INSPECT_PROP', prop: 'jen' } },
  ];
  if (run.currentScene === 'studio') return [
    { id: 'studio.record', label: run.puzzles.studio.reversed ? 'Play the record forwards' : 'Play the record backwards', x: 98, y: 224, width: 70, height: 40, marker: '↶', command: { type: 'REVERSE_RECORD' } },
    { id: 'studio.speakers', label: run.puzzles.studio.speakersOpen ? 'Close the speaker doors' : 'Open the speaker doors', x: 420, y: 155, width: 98, height: 55, marker: '♫', command: { type: 'TOGGLE_SPEAKERS' } },
    { id: 'studio.alice', label: 'Speak with Alice', x: 520, y: 245, width: 80, height: 160, marker: '✧', command: { type: 'INSPECT_PROP', prop: 'alice' } },
  ];
  if (run.currentScene === 'garden') return run.puzzles.garden.lights.map((lit, index) => {
    const angle = index * Math.PI / 4 - Math.PI / 2;
    return { id: `garden.cap.${index + 1}`, label: `Cap ${index + 1}: ${lit ? 'lit' : 'unlit'}`, x: 410 + Math.cos(angle) * 112, y: 268 + Math.sin(angle) * 47, width: 36, height: 36, marker: `${index + 1} · ${lit ? 'lit' : 'unlit'}`, command: { type: 'TOGGLE_MUSHROOM', index } };
  });
  return [
    { id: 'cottage.door', label: 'Inspect the cottage door', x: 232, y: 205, width: 55, height: 85, marker: '⌂', command: { type: 'INSPECT_PROP', prop: 'door' } },
    { id: 'cottage.agatha', label: 'Inspect Agatha’s ribbon', x: 492, y: 240, width: 83, height: 156, marker: '✧', command: { type: 'INSPECT_PROP', prop: 'ribbon' } },
    { id: 'cottage.garden', label: 'Visit the Remember me garden', x: 72, y: 296, width: 48, height: 45, marker: '❧', command: { type: 'ENTER_SCENE', scene: 'garden' } },
  ];
}
export function hotspotStyle(object: SceneObject) {
  return { left: `${object.x / STAGE.width * 100}%`, top: `${object.y / STAGE.height * 100}%`, width: `${object.width / STAGE.width * 100}%`, height: `${object.height / STAGE.height * 100}%` };
}
export function shouldReduceMotion(preference: 'system' | 'reduced' | 'full', systemReduced: boolean): boolean {
  return preference === 'reduced' || preference === 'system' && systemReduced;
}
export const COTTAGE_ASSETS = { background: '/assets/world/cottage-dusk.webp', agatha: '/assets/world/agatha-road.webp' } as const;
export const ILLUSTRATED_SCENES = ['cottage', 'threshold', 'garden', 'kitchen', 'studio', 'cabin', 'tower', 'greenhouse', 'account', 'vision'] as const;
export function sceneArt(scene: RunState['currentScene'], cottageView: RunState['cottageView'] = 'outside') {
  if (scene === 'vision') return { background: '/assets/vision/vision-annex-wide.webp', character: '/assets/vision/vision-pale.webp', name: 'Vision', label: 'WESTVIEW · THE DIAGNOSTIC ANNEX', x: 520, y: 331 };
  if (scene === 'garden') return { background: '/assets/garden/garden-moonrise-wide.webp', character: null, name: 'Agatha', label: 'THE REMEMBERING GARDEN', x: 520, y: 331 };
  if (scene === 'threshold') return { background: '/assets/threshold/coven-cellar.webp', character: COTTAGE_ASSETS.agatha, name: 'Agatha', label: 'THE COVEN · BELOW THE EVERYDAY', x: 520, y: 331 };
  if (scene === 'greenhouse') return { background: '/assets/greenhouse/greenhouse-earth.webp', character: '/assets/greenhouse/rio-road.webp', name: 'Rio', label: 'THE GREENHOUSE · SEED TO BLOOM', x: 520, y: 331 };
  if (scene === 'account') return { background: '/assets/library/library-afterhours.webp', character: null, name: 'The librarian', label: 'WESTVIEW PUBLIC LIBRARY · YOUR BORROWING DESK', x: 520, y: 331 };
  if (scene === 'cottage' && cottageView === 'inside') return { background: '/assets/cottage/cottage-room.webp', character: COTTAGE_ASSETS.agatha, name: 'Agatha', label: 'THE COTTAGE · EVERYTHING IN ITS PLACE', x: 535, y: 331 };
  if (scene === 'kitchen') return { background: '/assets/kitchen/kitchen-tide.webp', character: '/assets/kitchen/jen-road.webp', name: 'Jen', label: 'THE TIDE KITCHEN', x: 520, y: 331 };
  if (scene === 'studio') return { background: '/assets/studio/studio-amber.webp', character: '/assets/studio/alice-road.webp', name: 'Alice', label: 'TRACK FOUR · THE RECORDING ROOM', x: 520, y: 331 };
  if (scene === 'cabin') return { background: '/assets/cabin/cabin-violet.webp', character: COTTAGE_ASSETS.agatha, name: 'Agatha', label: 'THE CABIN · A SPIRIT IN THE WOODWORK', x: 520, y: 331 };
  if (scene === 'tower') return { background: '/assets/tower/tower-divination.webp', character: '/assets/tower/lilia-road.webp', name: 'Lilia', label: 'THE DIVINATION TOWER · OUT OF TIME', x: 520, y: 331 };
  return { background: COTTAGE_ASSETS.background, character: COTTAGE_ASSETS.agatha, name: 'Agatha', label: 'AT THE EDGE OF THE ROAD', x: 492, y: 326 };
}
export function sceneCaption(run: RunState): string {
  if (run.currentScene === 'vision') return run.puzzles.vision.solved ? '“At least one of us is a robot.” — Vision' : '“Two readers remember the same card. The library kept the paperwork.” — Vision';
  if (run.currentScene === 'cottage' && run.encounters.sessionExpired) return 'A red flower waits by the door. Your borrowing record is safe.';
  if (['cottage', 'garden'].includes(run.currentScene) && run.rememberEnabled && run.milestones.hasSignedInOnce) return `“Welcome back, ${run.alias}.” The little lights turn toward you.`;
  if (run.currentScene === 'threshold') return run.threshold.opened ? 'Five specialties. One coven. Sharon counts.' : 'Household things above. Something older below.';
  if (run.currentScene === 'greenhouse') return run.puzzles.greenhouse.solved ? 'Rio offers the red flower. “There. Something to take home.”' : '“Everything returns. Even library books.” — Rio';
  if (run.currentScene === 'account') return run.milestones.bookRenewed ? 'The receipt retraces your Road. “Another twenty-eight days.” — The librarian' : '“All that way to renew one book. We appreciate the dedication.” — The librarian';
  if (run.currentScene === 'cottage' && run.cottageView === 'inside') return run.puzzles.greenhouse.solved ? 'The room has not changed. You recognize what was always here.' : 'A cup, a record, a lamp, cards, a key and a red flower. Ordinary things.';
  if (run.currentScene === 'cottage' && run.puzzles.greenhouse.solved) return run.milestones.unbindingCompleted ? 'Your thread holds the door now. The knocker is ready.' : 'The chimney smoke curls back toward home. The same cottage waits.';
  if (run.currentScene === 'garden') return 'Eight small lights. A place to be remembered.';
  if (run.currentScene === 'kitchen') return run.puzzles.kitchen.solved ? '“Measured. Precisely. I approve.” — Jen' : run.puzzles.kitchen.pours >= 3 ? 'The pumpkin follows the stream with an increasingly suspicious look.' : '“Those are measuring vessels, not suggestions.” — Jen';
  if (run.currentScene === 'studio') return run.puzzles.studio.solved ? '“That one sounded like coming home.” — Alice' : run.puzzles.studio.reversed ? 'An orange spark leans against the groove.' : 'The needle rests on Track Four. Alice listens.';
  if (run.currentScene === 'cabin') return run.puzzles.cabin.solved ? '“Apparently human. How disappointing.” — Agatha' : run.puzzles.cabin.shadowSeen ? 'A second shadow waits behind Agatha. The lamps remain where you left them.' : 'Four lamps wait in the dark. Agatha watches the spirit candle.';
  if (run.currentScene === 'tower') return run.puzzles.tower.solved ? 'The tower seems to turn; the table holds its place. Lilia is smiling.' : run.puzzles.tower.stage === 'confirming' ? 'The opposite chair slides out. One table, two perspectives.' : '“My life comes to me out of order.” — Lilia';
  return run.arrival.theftRecorded ? '“Your password? Never seen it.” — Agatha' : 'Something about this place feels familiar.';
}
