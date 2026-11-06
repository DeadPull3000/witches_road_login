import { useEffect, useRef, useState } from 'react';
import type { RunState } from '../game/state';
import type { Command } from '../game/commands';
import { entryFlourish, type Flourish } from '../scenes/cues';

export function nextWorldCue(previous: RunState, run: RunState, command: Command | null): Flourish | null {
  if (previous.runId !== run.runId) return null;
  if (previous.currentScene !== run.currentScene || previous.cottageView !== run.cottageView) return entryFlourish(run, command);
  if (!command) return null;
  if (command.type === 'TUNE_TELEVISION' && run.currentScene === 'cottage') {
    const from = previous.encounters.tvChannel, to = run.encounters.tvChannel;
    if (from !== 'off' && to !== 'off' && from !== to) return 'standBy';
    if (!previous.discoveries.includes('library.finalStamp') && run.discoveries.includes('library.finalStamp')) return 'finalStamp';
  }
  if (command.type === 'INSPECT_ENCOUNTER' && command.prop === 'cabinWindow' && run.currentScene === 'cabin' &&
    !previous.discoveries.includes('salem.windowVisitors') && run.discoveries.includes('salem.windowVisitors')) return 'visitors';
  if (command.type === 'SUBMIT_IDENTITY' && run.currentScene === 'vision' && !previous.puzzles.vision.solved && run.puzzles.vision.solved) return 'diagnostics';
  if (run.currentScene === 'cabin' && !previous.puzzles.cabin.shadowSeen && run.puzzles.cabin.shadowSeen) return 'shadow';
  if (run.currentScene === 'tower' && !previous.puzzles.tower.solved && run.puzzles.tower.solved) return 'inversion';
  if (run.currentScene === 'greenhouse' && !previous.puzzles.greenhouse.solved && run.puzzles.greenhouse.solved) return 'flower';
  if (run.currentScene === 'cottage' && !previous.milestones.unbindingCompleted && run.milestones.unbindingCompleted) return 'unbinding';
  if (run.currentScene === 'account' && !previous.milestones.bookRenewed && run.milestones.bookRenewed) return 'receipt';
  return null;
}

export function useWorldCues(run: RunState, command: Command | null, reduced: boolean, onTheftStart: () => void, onTheftEnd: () => void) {
  const previous = useRef(run), callbacks = useRef({ onTheftStart, onTheftEnd }); callbacks.current = { onTheftStart, onTheftEnd };
  const [theft, setTheft] = useState(false), [flourish, setFlourish] = useState<Flourish | null>(null);
  const theftTimer = useRef<ReturnType<typeof setTimeout> | null>(null), cueTimer = useRef<ReturnType<typeof setTimeout> | null>(null), playingTheft = useRef(false);
  const skipTheft = () => { if (theftTimer.current !== null) clearTimeout(theftTimer.current); theftTimer.current = null; playingTheft.current = false; setTheft(false); callbacks.current.onTheftEnd(); };
  const skipFlourish = () => { if (cueTimer.current !== null) clearTimeout(cueTimer.current); cueTimer.current = null; setFlourish(null); };
  useEffect(() => {
    const prior = previous.current; previous.current = run;
    const travelled = prior.runId !== run.runId || prior.currentScene !== run.currentScene || prior.cottageView !== run.cottageView;
    if (travelled) {
      if (theftTimer.current !== null) clearTimeout(theftTimer.current); theftTimer.current = null; playingTheft.current = false; setTheft(false); skipFlourish();
    }
    if (reduced) { if (playingTheft.current) skipTheft(); skipFlourish(); return; }
    if (!travelled && command?.type === 'SUBMIT_ATTEMPTED_SPELL' && !prior.arrival.theftRecorded && run.arrival.theftRecorded) {
      playingTheft.current = true; setTheft(true); callbacks.current.onTheftStart(); theftTimer.current = setTimeout(skipTheft, 1450);
    }
    const next = nextWorldCue(prior, run, command);
    if (next) { if (cueTimer.current !== null) clearTimeout(cueTimer.current); setFlourish(next); cueTimer.current = setTimeout(() => setFlourish(null), 1400); }
    else if (command?.type === 'TUNE_TELEVISION' && command.channel === 'off') skipFlourish();
  }, [run, command, reduced]);
  useEffect(() => () => { if (theftTimer.current !== null) clearTimeout(theftTimer.current); if (cueTimer.current !== null) clearTimeout(cueTimer.current); }, []);
  return { theft, flourish, skipTheft, skipFlourish };
}
