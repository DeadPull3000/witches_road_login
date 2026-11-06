import type { RunState } from '../game/state';
import type { Command } from '../game/commands';
export type Flourish = 'shadow' | 'inversion' | 'flower' | 'smoke' | 'unbinding' | 'receipt' | 'recognition' | 'standBy' | 'visitors' | 'finalStamp' | 'diagnostics' | 'sessionFlower';
export const FLOURISH_LABEL: Record<Flourish, string> = {
  shadow: 'shadow', inversion: 'tower', flower: 'bloom', smoke: 'chimney', unbinding: 'unbinding', receipt: 'receipt', recognition: 'recognition',
  standBy: 'test card', visitors: 'window visitors', finalStamp: 'final stamp', diagnostics: 'diagnostics', sessionFlower: 'session flower',
};
export function entryFlourish(run: RunState, command: Command | null): Flourish | null {
  if (command?.type === 'EXPIRE_SESSION' && run.currentScene === 'cottage') return 'sessionFlower';
  const arriving = command?.type === 'ENTER_SCENE' && command.scene === run.currentScene || command?.type === 'SIGN_OUT' && run.currentScene === 'cottage';
  if (!arriving) return null;
  if (['cottage', 'garden'].includes(run.currentScene) && run.rememberEnabled && run.milestones.hasSignedInOnce) return 'recognition';
  return run.currentScene === 'cottage' && run.puzzles.greenhouse.solved ? 'smoke' : null;
}
