import { SCENES, TRIALS, type SceneId } from '../content/scenes';
import { canEnter, canSignIn, type RunState } from '../game/state';
import type { Command } from '../game/commands';

const NAMES: Record<SceneId, string> = { cottage: 'The cottage', threshold: 'The threshold', kitchen: 'Jen’s kitchen', studio: 'Alice’s studio', cabin: 'Agatha’s cabin', tower: 'Lilia’s tower', greenhouse: 'Rio’s greenhouse', garden: 'Remember me garden', account: 'The borrowing desk', vision: 'Vision’s annex' };
const MARKS: Partial<Record<SceneId, string>> = { kitchen: 'RECOVER', studio: 'VERIFY', cabin: 'PROVE', tower: 'REMEMBER', greenhouse: 'ACCEPT' };
export function mapLocations(run: RunState) {
  return SCENES.filter(scene => scene !== 'vision' || canEnter(run, scene)).map(scene => ({ scene, label: NAMES[scene], mark: MARKS[scene] ?? (scene === 'garden' || scene === 'vision' ? 'OPTIONAL' : ''), available: canEnter(run, scene), current: run.currentScene === scene,
    sealed: TRIALS.includes(scene as typeof TRIALS[number]) && run.puzzles[scene as typeof TRIALS[number]].solved }));
}
export type Door = { label: string; command: Command };
export const cottageKnockerLabel = (run: RunState) => run.encounters.sessionExpired ? 'Resume library session' : run.rememberEnabled && run.milestones.hasSignedInOnce ? 'Continue to library' : 'Use the knocker · sign in';
export function roomDoor(run: RunState): Door | null {
  const scene = run.currentScene;
  if (scene === 'cottage') {
    if (canSignIn(run)) return { label: run.rememberEnabled && run.milestones.hasSignedInOnce ? 'Continue to library' : 'The library knocker', command: { type: 'SIGN_IN' } };
    return run.arrival.theftRecorded && !run.puzzles.greenhouse.solved ? { label: 'The coven threshold', command: { type: 'START_RECOVERY' } } : null;
  }
  if (scene === 'threshold') return run.threshold.opened ? { label: NAMES.kitchen, command: { type: 'ENTER_SCENE', scene: 'kitchen' } } : null;
  if (scene === 'garden') return { label: NAMES.cottage, command: { type: 'ENTER_SCENE', scene: 'cottage' } };
  if (scene === 'account') return { label: 'Sign out to the cottage', command: { type: 'SIGN_OUT' } };
  if (scene === 'vision') return { label: 'Return to the cottage television', command: { type: 'LEAVE_VISION' } };
  if (!run.puzzles[scene].solved) return null;
  const next = scene === 'greenhouse' ? 'cottage' : TRIALS[TRIALS.indexOf(scene) + 1];
  return { label: NAMES[next], command: { type: 'ENTER_SCENE', scene: next } };
}
export const locationName = (run: RunState) => run.currentScene === 'cottage' ? run.cottageView === 'outside' ? 'The cottage clearing' : 'Inside the cottage' : NAMES[run.currentScene];
