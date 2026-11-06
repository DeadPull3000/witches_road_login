import { COVEN, TRIALS, type SceneId } from '../src/content/scenes';
import { applyCommand, type Command } from '../src/game/commands';
import { createRun, type RunState } from '../src/game/state';
import { gardenSolution, jugSolution, towerSolution, vineSolution } from '../src/puzzles/rules';

export const move = (state: RunState, command: Command) => applyCommand(state, command).state;
export function thresholdRun(): RunState {
  let state = createRun();
  state = move(state, { type: 'STAMP_ALIAS', alias: 'Violet Finch' });
  state = move(state, { type: 'SUBMIT_ATTEMPTED_SPELL' });
  state = move(state, { type: 'START_RECOVERY' });
  for (const [seat, token] of COVEN.entries()) state = move(state, { type: 'PLACE_TOKEN', seat, token: token.id });
  return move(state, { type: 'MATCH_COVEN' });
}
export function solveCurrent(state: RunState): RunState {
  const scene = state.currentScene;
  if (scene === 'kitchen' && !state.puzzles.kitchen.solved) {
    for (const op of jugSolution(state.puzzles.kitchen.volumes)) state = move(state, { type: 'JUG', move: op });
  } else if (scene === 'studio' && !state.puzzles.studio.solved) state = move(state, { type: 'DIAL_CODE', code: '23' });
  else if (scene === 'cabin' && !state.puzzles.cabin.solved) {
    for (const [index, target] of [1, 0, 1, 1].entries()) if (state.puzzles.cabin.lamps[index] !== target) state = move(state, { type: 'TOGGLE_LAMP', index });
    state = move(state, { type: 'CHECK_LAMPS' });
  } else if (scene === 'tower' && !state.puzzles.tower.solved) {
    if (state.puzzles.tower.stage === 'arranging') {
      for (const op of towerSolution(state.puzzles.tower.deck)) state = move(state, { type: 'MOVE_DECK', move: op });
      state = move(state, { type: 'SUBMIT_DECK' });
    }
    state = move(state, { type: 'CLEAR_CONFIRM' });
    for (const card of [...state.puzzles.tower.deck].reverse()) state = move(state, { type: 'PICK_CONFIRM', card });
    state = move(state, { type: 'CONFIRM_DECK' });
  } else if (scene === 'greenhouse' && !state.puzzles.greenhouse.solved) {
    while (!vineSolution(state.puzzles.greenhouse.route)) state = move(state, { type: 'UNDO' });
    const path = vineSolution(state.puzzles.greenhouse.route)!;
    for (const node of path.slice(state.puzzles.greenhouse.route.length)) state = move(state, { type: 'TRACE_VINE', node });
  } else if (scene === 'garden' && !state.puzzles.garden.solved) {
    for (const index of gardenSolution(state.puzzles.garden.lights)) state = move(state, { type: 'TOGGLE_MUSHROOM', index });
  }
  return state;
}
export function throughTrial(target: SceneId): RunState {
  let state = thresholdRun();
  for (const scene of TRIALS) {
    state = move(state, { type: 'ENTER_SCENE', scene });
    if (scene === target) return state;
    state = solveCurrent(state);
  }
  return state;
}
export function completedRun(): RunState {
  let state = solveCurrent(throughTrial('greenhouse'));
  state = move(state, { type: 'ENTER_SCENE', scene: 'cottage' });
  state = move(state, { type: 'UNBIND' });
  return move(state, { type: 'SIGN_IN' });
}
export function cottageInterior(run: RunState): RunState {
  if (run.currentScene !== 'cottage') run = move(run, { type: 'ENTER_SCENE', scene: 'cottage' });
  return move(run, { type: 'SET_COTTAGE_VIEW', view: 'inside' });
}
export function annexRun(run: RunState = throughTrial('cabin')): RunState {
  const tuned = move(cottageInterior(run), { type: 'TUNE_TELEVISION', channel: 'diagnostic' });
  return move(tuned, { type: 'OPEN_VISION' });
}
