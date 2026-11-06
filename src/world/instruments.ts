import type { SceneId } from '../content/scenes';
import type { RunState } from '../game/state';
import type { Command } from '../game/commands';
import { JUG_MOVES, jugMove, type JugMove, type JugState } from '../puzzles/rules';
import type { Rect } from './layout';
import { isPaintedTrial } from './trialSurfaces';

export const INSTRUMENTS = {
  threshold: { title: 'The coven circle', approach: 'Approach the coven circle', close: 'Step back from the circle', return: 'Return to the coven circle', inscription: 'FIVE SPECIALTIES · ONE COVEN' },
  kitchen: { title: 'Jen’s measuring counter', approach: 'Approach the kitchen counter', close: 'Step back from the counter', return: 'Return to the counter', inscription: 'THE TIDE KITCHEN · MEASURING VESSELS' },
  studio: { title: 'Alice’s recording desk', approach: 'Approach the recording desk', close: 'Step back from the desk', return: 'Return to the recording desk', inscription: 'TRACK FOUR · LIVE ROOM' },
  cabin: { title: 'Agatha’s spirit table', approach: 'Approach the spirit table', close: 'Step back from the table', return: 'Return to the spirit table', inscription: 'FOUR LAMPS · FOUR STATEMENTS' },
  tower: { title: 'Lilia’s card table', approach: 'Approach the card table', close: 'Step back from the card table', return: 'Return to the card table', inscription: 'ONE TABLE · TWO CHAIRS' },
  greenhouse: { title: 'Rio’s vine bed', approach: 'Approach the vine bed', close: 'Step back from the vine bed', return: 'Return to the vine bed', inscription: 'SEED TO BLOOM · TERMS OF PASSAGE' },
  garden: { title: 'The remembering ring', approach: 'Approach the mushroom ring', close: 'Step back from the ring', return: 'Return to the mushroom ring', inscription: 'REMEMBER ME · ALWAYS OPTIONAL' },
  vision: { title: 'The four diagnostic readers', approach: 'Approach the four readers', close: 'Step back from the readers', return: 'Return to the readers', inscription: 'WESTVIEW · SERVICE BENCH' },
} as const;
export type InstrumentScene = keyof typeof INSTRUMENTS;
export function isInstrumentScene(scene: SceneId): scene is InstrumentScene { return scene in INSTRUMENTS; }

/** The single DOM/SVG instrument plane owns its art and native targets. No independent canvas hit map. */
export function instrumentFrame(width: number, height: number, expanded: boolean, scene?: InstrumentScene): Rect {
  const portrait = width / height < 1.1, short = height < 540;
  if (expanded) {
    const x = portrait ? 18 : 28, y = short ? 12 : 88;
    let right = portrait ? width - 18 : width * .76;
    if (!portrait && scene && isPaintedTrial(scene)) {
      // Leave the current host's whole resting rectangle clear on wide screens.
      right = width >= 1100 ? width * .78 - Math.min(height * .66, width * .37) / 3 - 24 : width * .71;
    }
    return { x, y, width: Math.min(right - x, 1000), height: Math.max(100, height - y - (short ? 106 : 114)) };
  }
  if (scene === 'vision') return { x: width * (portrait ? .40 : .32), y: height * (portrait ? .48 : .49), width: Math.min(width * .49, 260), height: 44 };
  return { x: width * (portrait ? .04 : .055), y: height * (short ? .22 : scene === 'garden' ? portrait ? .52 : .49 : portrait ? .43 : .44), width: Math.min(width * (portrait ? .61 : .57), 840), height: Math.min(height * (portrait ? .26 : .32), portrait ? 210 : 260) };
}

/** Shared SVG anchors for vessels and their pour stream. Values are in the counter's 600 × 240 plane. */
export const VESSELS = [{ x: 130, y: 48, width: 140, height: 162, capacity: 3 }, { x: 340, y: 14, width: 160, height: 196, capacity: 5 }] as const;
export const VESSEL_VIEW = { x: 90, width: 450, height: 240 } as const;
export function pourStream(move: JugMove) {
  const from = move === 'pour-small' ? VESSELS[0] : VESSELS[1], to = move === 'pour-small' ? VESSELS[1] : VESSELS[0];
  return `M${from.x + from.width * .24},${from.y + 19} Q300,-15 ${to.x + to.width * .36},${to.y + 36}`;
}
export function jugActions(volumes: JugState, selected: 0 | 1, solved: boolean) {
  return JUG_MOVES.filter(move => move.endsWith(selected ? 'large' : 'small')).map(move => ({ move, disabled: solved || jugMove(volumes, move).every((value, index) => value === volumes[index]) }));
}

export type PourCue = { move: 'pour-small' | 'pour-large'; amount: number; revision: number };
/** Only a newly accepted pour in this visit can animate. Loads, rejected moves and foreign saves cannot. */
export function acceptedPour(previous: RunState, run: RunState, command: Command | null): PourCue | null {
  if (previous.runId !== run.runId || previous.currentScene !== 'kitchen' || run.currentScene !== 'kitchen' || previous.revision >= run.revision || command?.type !== 'JUG' || !command.move.startsWith('pour')) return null;
  const source = command.move === 'pour-small' ? 0 : 1, amount = previous.puzzles.kitchen.volumes[source] - run.puzzles.kitchen.volumes[source];
  return amount > 0 ? { move: command.move as PourCue['move'], amount, revision: run.revision } : null;
}

export const SPIRIT_STATEMENTS = ['Exactly one of A and B burns.', 'Exactly one of B and C burns.', 'C and D agree.', 'An odd number of A, C and D burn.'] as const;
export const COVEN_SEATS = [{ x: 50, y: 14 }, { x: 83, y: 43 }, { x: 71, y: 80 }, { x: 29, y: 80 }, { x: 17, y: 43 }] as const;
