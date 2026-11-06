import { useEffect } from 'react';
import type { GameSession } from '../game/session';
import { currentUnsolvedTrial, TRIAL_DURATION_MS, type RunState } from '../game/state';

export function useTrialDeadline(session: GameSession, run: RunState, ready: boolean) {
  const trial = currentUnsolvedTrial(run);
  const endsAt = run.trialClock?.endsAt;
  const { runId, revision } = run;

  useEffect(() => {
    if (endsAt === undefined) {
      if (ready && trial) void session.dispatch({ type: 'START_TRIAL_CLOCK', runId, trial });
      return;
    }
    let timeout: ReturnType<typeof setTimeout>;
    const check = () => {
      clearTimeout(timeout);
      const remaining = endsAt - Date.now();
      if (remaining <= 0) void session.dispatch({ type: 'TRIAL_TIMEOUT' });
      else timeout = setTimeout(check, Math.min(remaining, TRIAL_DURATION_MS));
    };
    check();
    document.addEventListener('visibilitychange', check);
    window.addEventListener('pageshow', check);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('pageshow', check);
    };
  }, [session, runId, trial, endsAt, ready, revision]);
}
