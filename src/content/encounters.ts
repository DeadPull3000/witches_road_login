import type { RunState } from '../game/state';
import type { SceneId } from './scenes';

export const TV_CHANNELS = ['off', 'local', 'sponsor', 'diagnostic'] as const;
export type TvChannel = typeof TV_CHANNELS[number];
export const TV_DIALS = {
  local: 'Westview local',
  sponsor: 'Sponsor channel',
  diagnostic: 'Diagnostic channel',
} as const satisfies Record<Exclude<TvChannel, 'off'>, string>;

export const ENCOUNTERS = {
  television: { scene: 'cottage', label: 'Approach the television', title: 'The cottage television', marker: '▣', x: 589, y: 213 },
  caseDrawer: { scene: 'cottage', label: 'Forgot username', title: 'Agnes’s case drawer', marker: '▱', x: 242, y: 222 },
  sigilCard: { scene: 'cottage', label: 'Inspect the covered borrowing card', title: 'The covered borrowing card', marker: '✧', x: 331, y: 222 },
  portrait: { scene: 'cottage', label: 'Inspect the framed portrait', title: 'The framed portrait', marker: '▧', x: 161, y: 113 },
  rabbitPortrait: { scene: 'cottage', label: 'Inspect the rabbit portrait', title: 'The rabbit portrait', marker: '♧', x: 557, y: 133 },
  gardenStone: { scene: 'garden', label: 'Look behind the mossy stone', title: 'The mossy stone', marker: '◆', x: 126, y: 194 },
  kitchenCupboard: { scene: 'kitchen', label: 'Inspect the kitchen cupboard', title: 'The kitchen cupboard', marker: '▧', x: 112, y: 126 },
  studioSpeaker: { scene: 'studio', label: 'Look behind the studio speaker', title: 'Behind the speaker', marker: '♫', x: 490, y: 175 },
  cabinWindow: { scene: 'cabin', label: 'Inspect the cabin window', title: 'The cabin window', marker: '▧', x: 383, y: 127 },
  visionIntercom: { scene: 'vision', label: 'Inspect the annex intercom', title: 'The annex intercom', marker: '♫', x: 145, y: 193 },
  returnDate: { scene: 'account', label: 'Inspect the return-date stamp', title: 'The return-date stamp', marker: '◫', x: 145, y: 161 },
} as const satisfies Record<string, { scene: SceneId; label: string; title: string; marker: string; x: number; y: number }>;

export type EncounterId = keyof typeof ENCOUNTERS;
export const ENCOUNTER_IDS = Object.keys(ENCOUNTERS) as EncounterId[];

export function encounterAvailable(run: RunState, prop: EncounterId, collection: readonly string[] = []): boolean {
  const entry = ENCOUNTERS[prop];
  if (!entry || entry.scene !== run.currentScene || entry.scene === 'cottage' && run.cottageView !== 'inside') return false;
  switch (prop) {
    case 'caseDrawer': return run.arrival.aliasStamped;
    case 'sigilCard': return run.puzzles.tower.solved;
    case 'cabinWindow': return run.puzzles.cabin.solved;
    case 'kitchenCupboard': return run.discoveries.includes('rabbit.first');
    case 'studioSpeaker': return run.discoveries.includes('rabbit.second') && run.puzzles.studio.speakersOpen;
    case 'rabbitPortrait': return run.discoveries.includes('rabbit.third') || collection.includes('rabbit.third');
    default: return true;
  }
}
