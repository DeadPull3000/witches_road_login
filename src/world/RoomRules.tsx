import { COVEN } from '../content/scenes';
import { STUDIO_CLUES } from '../puzzles/rules';
import { SPIRIT_STATEMENTS, type InstrumentScene } from './instruments';
import { TAROT_MEMORIES } from './trialLayout';
import { VISION_INSTRUCTIONS } from '../content/vision';
import { VisionRecords } from './VisionConsole';
import { PropNote } from './PropControl';

const rules = {
  threshold: {
    note: 'Read the coven inscription',
    title: 'Find everyone a seat.',
    text: 'Choose a token, then its seat. Match the printed specialties and symbols.',
  },
  kitchen: {
    note: 'Read Jen’s recipe',
    title: 'Exactly four cups.',
    text: 'Measure 4 cups in the 5-cup jug. Select a vessel, then use the tap, drain, or pour. Each pour continues until its source is empty or the other jug is full.',
  },
  studio: {
    note: 'Read the recording sleeve',
    title: 'Find the recording number.',
    text: 'A two-digit number from 00–99. Each printed lyric strip gives a remainder. Open the three channels to build the recording.',
  },
  cabin: {
    note: 'Read the spirit-table inscription',
    title: 'Agree with the spirits.',
    text: 'Lit means 1. Unlit means 0. All four statements must hold at once.',
  },
  tower: {
    note: 'Read Lilia’s table note',
    title: 'Put the memories in order.',
    text: 'CUT moves the first card to the end. QUARREL swaps the first two. All four memories must hold.',
  },
  greenhouse: {
    note: 'Read the vine-bed terms',
    title: 'A signature that grows.',
    text: 'Start at C · Seed and finish at D · Bloom. Follow every vine exactly once in one continuous line. Change vines only at a named stone. Draw from the current stone or activate a named stone.',
  },
  garden: {
    note: 'Read the garden sign',
    title: 'Leave a little light.',
    text: 'Light all eight caps. Each cap toggles itself and its two neighbors. The ring wraps around from 8 to 1. This never blocks the Road.',
  },
  vision: { note: 'Read the repair instructions', title: 'Which reader keeps the card?', text: VISION_INSTRUCTIONS },
} satisfies Record<InstrumentScene, { note: string; title: string; text: string }>;

const oppositeChair = {
  note: 'Read the opposite-chair note',
  title: 'Now, from the other seat.',
  text: 'The same physical cards are viewed from the opposite end. Choose their order from that seat.',
};
const inscriptions: Partial<Record<InstrumentScene, { label: string; lines: readonly string[] }>> = {
  threshold: { label: 'Printed keepsakes', lines: COVEN.map(token => `${token.name} · ${token.affinity} ${token.symbol}`) },
  studio: { label: 'Three lyric strips', lines: STUDIO_CLUES.map(clue => `Divide by ${clue.divisor} for a remainder of ${clue.remainder}.`) },
  cabin: { label: 'Four spirit statements', lines: SPIRIT_STATEMENTS },
  tower: { label: 'Four card memories', lines: TAROT_MEMORIES },
};
type Props = { scene: InstrumentScene; opposite?: boolean };
function ruleCopy(scene: InstrumentScene, opposite: boolean) {
  return scene === 'tower' && opposite ? oppositeChair : rules[scene];
}
export function InstrumentInstructions({ scene, opposite = false }: Props) {
  const { note, title, text } = ruleCopy(scene, opposite);
  return <PropNote label={note} art={scene === 'studio' || scene === 'tower' ? 'card' : undefined}>
    <h2>{title}</h2><p>{text}</p>
  </PropNote>;
}

/** The field notes transcribe the physical instructions in their reading order. */
export function RoomRules({ scene, opposite = false }: Props) {
  const { title, text } = ruleCopy(scene, opposite), inscription = inscriptions[scene];
  return <section className="room-rule-page" aria-labelledby="room-rule-title">
    <h2 id="room-rule-title">{title}</h2>
    <p>{text}</p>
    {inscription && <ol aria-label={inscription.label}>{inscription.lines.map(line => <li key={line}>{line}</li>)}</ol>}
    {scene === 'vision' && <VisionRecords />}
  </section>;
}
