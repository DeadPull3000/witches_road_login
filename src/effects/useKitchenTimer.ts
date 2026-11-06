import { useEffect, useRef, useState } from 'react';
import type { RunState } from '../game/state';
import type { Command } from '../game/commands';

export function useKitchenTimer(run: RunState, act: (command: Command) => Promise<void>, enabled = true) {
  const [seconds, setSeconds] = useState(40);
  const active = useRef(enabled); active.current = enabled;
  const syncActivity = useRef<() => void>(() => {});
  useEffect(() => {
    if (run.currentScene !== 'kitchen' || run.puzzles.kitchen.solved || run.puzzles.kitchen.timerDismissed) return;
    let remaining = 40_000, last = performance.now(), fired = false, wasActive = active.current;
    setSeconds(40);
    const visibility = () => { last = performance.now(); wasActive = active.current; };
    syncActivity.current = visibility;
    const timer = setInterval(() => {
      const now = performance.now(); if (!document.hidden && active.current && wasActive) remaining -= now - last; last = now; wasActive = active.current;
      setSeconds(Math.max(0, Math.ceil(remaining / 1000)));
      if (remaining <= 0 && !fired) { fired = true; clearInterval(timer); void act({ type: 'KITCHEN_TIMER' }); }
    }, 250);
    document.addEventListener('visibilitychange', visibility);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility); syncActivity.current = () => {}; };
  }, [run.currentScene, run.runId, run.puzzles.kitchen.solved, run.puzzles.kitchen.timerDismissed, act]);
  useEffect(() => { syncActivity.current(); }, [enabled]);
  return seconds;
}
