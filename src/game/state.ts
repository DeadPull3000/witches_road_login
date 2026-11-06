import { z } from 'zod';
import { CARDS, INITIAL_DECK, cabinMatches, greenhouseMatches, towerMatches, type Card } from '../puzzles/rules';
import { COVEN, SCENES, TRIALS, type SceneId } from '../content/scenes';
import { TV_CHANNELS } from '../content/encounters';
import { VISION_STATIONS, visionIdentityMatches } from '../content/vision';

export const CONTENT_VERSION = 'westview-1';
export const TRIAL_DURATION_MS = 5 * 60 * 1000;
const volume = z.tuple([z.number().int().min(0).max(3), z.number().int().min(0).max(5)]);
const lamps = z.tuple([z.number().int().min(0).max(1), z.number().int().min(0).max(1), z.number().int().min(0).max(1), z.number().int().min(0).max(1)]);
const deck = z.array(z.enum(CARDS)).length(5).refine(cards => new Set(cards).size === 5, 'Cards must be distinct');
const tokens = z.enum(['jen', 'alice', 'lilia', 'agatha', 'sharon']);
const initialVision = { selection: null, solved: false };
const initialEncounters = { tvChannel: 'off', tvLargeCaptions: false, portraitSeen: false, sessionExpired: false } as const;
export const preferencesSchema = z.object({
  motion: z.enum(['system', 'reduced', 'full']), textSize: z.enum(['normal', 'large']),
  muted: z.boolean(), actionList: z.boolean(),
  masterVolume: z.number().min(0).max(1).default(.65),
  ambienceVolume: z.number().min(0).max(1).default(.35),
  musicVolume: z.number().min(0).max(1).default(.55),
  effectsVolume: z.number().min(0).max(1).default(.6),
}).strict();
export type Preferences = z.infer<typeof preferencesSchema>;
export const DEFAULT_PREFERENCES: Preferences = { motion: 'system', textSize: 'normal', muted: false, actionList: false, masterVolume: .65, ambienceVolume: .35, musicVolume: .55, effectsVolume: .6 };

const baseRunSchema = z.object({
  schemaVersion: z.literal(1), contentVersion: z.literal(CONTENT_VERSION),
  runId: z.string().uuid(), revision: z.number().int().nonnegative(), seed: z.string().max(64),
  mode: z.enum(['story', 'showcase']), currentScene: z.enum(SCENES), phase: z.enum(['arrival', 'road', 'return', 'signedIn']),
  alias: z.string().min(1).max(24).nullable(),
  cottageView: z.enum(['outside', 'inside']).default('outside'),
  arrival: z.object({ aliasStamped: z.boolean(), theftRecorded: z.boolean() }).strict(),
  threshold: z.object({ placements: z.array(tokens.nullable()).length(5), opened: z.boolean() }).strict(),
  trialClock: z.object({ trial: z.enum(TRIALS), endsAt: z.number().int().positive() }).strict().nullable().default(null),
  milestones: z.object({ unbindingCompleted: z.boolean(), hasSignedInOnce: z.boolean(), bookRenewed: z.boolean() }).strict(),
  rememberEnabled: z.boolean(),
  puzzles: z.object({
    kitchen: z.object({ volumes: volume, history: z.array(volume).max(100), solved: z.boolean(), pours: z.number().int().min(0).max(100000).default(0), timerDismissed: z.boolean().default(false) }).strict(),
    studio: z.object({ attempt: z.string().regex(/^\d{0,2}$/), solved: z.boolean(), channels: z.tuple([z.boolean(), z.boolean(), z.boolean()]).default([false, false, false]), speakersOpen: z.boolean().default(true), reversed: z.boolean().default(false) }).strict(),
    cabin: z.object({ lamps, history: z.array(lamps).max(100), solved: z.boolean(), shadowSeen: z.boolean().default(false) }).strict(),
    tower: z.object({ deck, stage: z.enum(['arranging', 'confirming']), confirmation: z.array(z.enum(CARDS)).max(5), history: z.array(deck).max(100), memories: z.array(z.enum(['moon', 'distance', 'cup', 'key'])).max(4).refine(items => new Set(items).size === items.length, 'Memories must be distinct'), solved: z.boolean() }).strict(),
    greenhouse: z.object({ route: z.array(z.enum(['A', 'B', 'C', 'D', 'E'])).min(1).max(8), solved: z.boolean() }).strict(),
    garden: z.object({ lights: z.array(z.boolean()).length(8), history: z.array(z.array(z.boolean()).length(8)).max(100), solved: z.boolean() }).strict(),
    vision: z.object({ selection: z.enum(VISION_STATIONS).nullable(), solved: z.boolean() }).strict().default(initialVision),
  }).strict(),
  encounters: z.object({ tvChannel: z.enum(TV_CHANNELS), tvLargeCaptions: z.boolean(), portraitSeen: z.boolean(), sessionExpired: z.boolean() }).strict().default(initialEncounters),
  journalEntries: z.array(z.string().max(200)).max(500).transform(entries => entries.filter(entry => !entry.startsWith('Hint ·'))),
  discoveries: z.array(z.string().max(80)).max(100),
  // Retained only to read version-one saves; the hint command and UI were removed.
  hints: z.record(z.string(), z.number().int().min(0).max(3)).default({}),
  statistics: z.object({ moves: z.number().int().nonnegative(), assistedMoves: z.number().int().nonnegative() }).strict(),
}).strict();
export type RunState = z.infer<typeof baseRunSchema>;
export const runSchema = baseRunSchema.superRefine((run, ctx) => {
  const invalid = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (run.arrival.aliasStamped !== (run.alias !== null)) invalid('Alias stamp and alias disagree');
  if (run.arrival.theftRecorded && !run.arrival.aliasStamped) invalid('Theft requires a stamped alias');
  const placements = run.threshold.placements.filter(Boolean);
  if (new Set(placements).size !== placements.length) invalid('Duplicate coven tokens');
  if (run.threshold.opened && (!run.arrival.theftRecorded || !COVEN.every((token, i) => run.threshold.placements[i] === token.id))) invalid('Invalid threshold completion');
  let previous = run.threshold.opened;
  for (const trial of TRIALS) { if (run.puzzles[trial].solved && !previous) invalid(`Missing prerequisite for ${trial}`); previous = run.puzzles[trial].solved; }
  const clock = run.trialClock;
  if (clock && (!canEnter(run, clock.trial) || run.puzzles[clock.trial].solved)) invalid('Trial clock requires an open, unsolved trial');
  if (run.puzzles.kitchen.solved !== (run.puzzles.kitchen.volumes[1] === 4)) invalid('Invalid kitchen completion');
  if (run.puzzles.studio.solved && run.puzzles.studio.attempt !== '23') invalid('Invalid studio completion');
  if (run.puzzles.cabin.solved && !cabinMatches(run.puzzles.cabin.lamps)) invalid('Invalid cabin completion');
  const tower = run.puzzles.tower;
  if (new Set(tower.confirmation).size !== tower.confirmation.length) invalid('Duplicate confirmation cards');
  if ((tower.stage === 'confirming' || tower.solved) && !towerMatches(tower.deck)) invalid('Invalid tower arrangement');
  if (tower.solved && (tower.stage !== 'confirming' || tower.confirmation.length !== 5 || ![...tower.confirmation].reverse().every((card, i) => card === tower.deck[i]))) invalid('Invalid tower confirmation');
  const route = run.puzzles.greenhouse.route;
  const used = new Set<string>();
  for (let i = 1; i < route.length; i++) {
    const edge = [route[i - 1], route[i]].sort().join('');
    if (!['AB', 'BC', 'AC', 'AD', 'DE', 'AE', 'CD'].includes(edge) || used.has(edge)) invalid('Invalid vine path');
    used.add(edge);
  }
  if (route[0] !== 'C' || run.puzzles.greenhouse.solved !== greenhouseMatches(route)) invalid('Invalid greenhouse completion');
  if (run.puzzles.garden.solved && !run.puzzles.garden.lights.every(Boolean)) invalid('Invalid garden completion');
  if (run.rememberEnabled && !run.puzzles.garden.solved) invalid('Remember me requires a solved garden');
  const vision = run.puzzles.vision;
  if (vision.selection !== null && !canEnter(run, 'vision')) invalid('Reader selection requires an annex visit');
  if (vision.solved && (vision.selection === null || !visionIdentityMatches(vision.selection))) invalid('Invalid reader identification');
  if (run.encounters.tvChannel === 'diagnostic' && !run.puzzles.studio.solved) invalid('The diagnostic channel requires the studio seal');
  if (run.encounters.sessionExpired && (!run.milestones.hasSignedInOnce || run.phase === 'signedIn')) invalid('Invalid expired session');
  if (run.milestones.unbindingCompleted && !TRIALS.every(trial => run.puzzles[trial].solved)) invalid('Unbinding requires five trials');
  if (run.milestones.hasSignedInOnce && !canSignIn(run)) invalid('Invalid sign-in milestone');
  if (run.milestones.bookRenewed && !run.milestones.hasSignedInOnce) invalid('Renewal requires sign-in');
  if (run.phase === 'signedIn' && (!run.milestones.hasSignedInOnce || run.currentScene !== 'account')) invalid('Invalid account phase');
  if (run.currentScene === 'account' && run.phase !== 'signedIn') invalid('Account requires sign-in');
  if (run.phase === 'road' && !run.threshold.opened) invalid('Road requires threshold');
  if (run.phase === 'return' && !run.puzzles.greenhouse.solved) invalid('Return requires completed Road');
  if (!canEnter(run, run.currentScene)) invalid('Scene prerequisites missing');
  if (Object.keys(run.hints).some(id => !SCENES.includes(id as SceneId))) invalid('Unknown hint scene');
  if (new Set(run.discoveries).size !== run.discoveries.length) invalid('Duplicate discoveries');
});

export function canSignIn(run: Pick<RunState, 'alias' | 'arrival' | 'puzzles' | 'milestones'>): boolean {
  return Boolean(run.alias && run.arrival.aliasStamped && TRIALS.every(id => run.puzzles[id].solved) && run.milestones.unbindingCompleted);
}
export function currentUnsolvedTrial(run: RunState) {
  return TRIALS.find(trial => run.currentScene === trial && !run.puzzles[trial].solved);
}
export function canEnter(run: Pick<RunState, 'arrival' | 'threshold' | 'puzzles' | 'milestones' | 'phase' | 'discoveries'>, scene: SceneId): boolean {
  if (scene === 'cottage' || scene === 'garden') return true;
  if (scene === 'threshold') return run.arrival.theftRecorded;
  if (scene === 'account') return run.phase === 'signedIn' && run.milestones.hasSignedInOnce;
  if (scene === 'vision') return run.puzzles.studio.solved && run.discoveries.includes('vision.identityAnnex');
  const index = TRIALS.indexOf(scene);
  return index === 0 ? run.threshold.opened : index > 0 && run.puzzles[TRIALS[index - 1]].solved;
}
export function createRun(mode: RunState['mode'] = 'story'): RunState {
  return {
    schemaVersion: 1, contentVersion: CONTENT_VERSION, runId: crypto.randomUUID(), revision: 0, seed: 'curated-first-road',
    mode, currentScene: 'cottage', phase: 'arrival', alias: null, cottageView: 'outside',
    arrival: { aliasStamped: false, theftRecorded: false }, threshold: { placements: Array(5).fill(null), opened: false },
    trialClock: null,
    milestones: { unbindingCompleted: false, hasSignedInOnce: false, bookRenewed: false }, rememberEnabled: false,
    puzzles: {
      kitchen: { volumes: [0, 0], history: [], solved: false, pours: 0, timerDismissed: false }, studio: { attempt: '', solved: false, channels: [false, false, false], speakersOpen: true, reversed: false },
      cabin: { lamps: [0, 0, 0, 0], history: [], solved: false, shadowSeen: false },
      tower: { deck: [...INITIAL_DECK], stage: 'arranging', confirmation: [], history: [], memories: [], solved: false },
      greenhouse: { route: ['C'], solved: false }, garden: { lights: [true, false, false, false, true, false, false, false], history: [], solved: false }, vision: { ...initialVision },
    },
    encounters: { ...initialEncounters },
    journalEntries: ['Use a fictional borrowing alias. The library saves this journey in this browser.'], discoveries: [], hints: {}, statistics: { moves: 0, assistedMoves: 0 },
  };
}
export const cloneDeck = (deck: Card[]) => [...deck];
