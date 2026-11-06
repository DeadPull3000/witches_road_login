import { useEffect, useState, type ReactNode } from 'react';
import { SCENE_INFO, type Trial } from '../content/scenes';
import { TRIAL_DURATION_MS, type RunState } from '../game/state';
import './trialClock.css';

const FACES: Record<Trial, { name: string; engraving: ReactNode }> = {
  kitchen: {
    name: 'Pressure dial',
    engraving: <><path d="M11 23a9 9 0 1 1 18 0M13 19l2 1m5-6v3m7 2-2 1M20 22l4-4M16 28h8" /><circle cx="20" cy="22" r="1.3" /></>,
  },
  studio: {
    name: 'Reel counter',
    engraving: <><circle cx="20" cy="20" r="10" /><circle cx="20" cy="20" r="2" /><circle cx="20" cy="14.5" r="1.8" /><circle cx="15.2" cy="23" r="1.8" /><circle cx="24.8" cy="23" r="1.8" /></>,
  },
  cabin: {
    name: 'Spirit candle',
    engraving: <><path d="M17 21h6v9h-6zM13 30h14M20 11c6 4 3 8 0 8s-5-3 0-8Z" /><path d="M10 19l3-2m14 0 3 2" /></>,
  },
  tower: {
    name: 'Moon dial',
    engraving: <><path d="M20 11a9 9 0 1 0 9 12 8 8 0 0 1-9-12ZM27 12v6m-3-3h6M13 14h1m14 13h1" /></>,
  },
  greenhouse: {
    name: 'Seed clock',
    engraving: <><path d="M13 11h14M13 29h14M15 11c0 7 10 10 10 18M25 11c0 7-10 10-10 18M16 27l4-4 4 4M18 15h4" /><path d="M9 24c3 0 4-2 4-5-3 0-4 2-4 5Zm22-8c-3 0-4 2-4 5 3 0 4-2 4-5Z" /></>,
  },
};

const totalSeconds = TRIAL_DURATION_MS / 1000;
const secondsLeft = (endsAt: number) => Math.ceil(Math.max(0, Math.min(TRIAL_DURATION_MS, endsAt - Date.now())) / 1000);

export function TrialClock({ clock }: { clock: NonNullable<RunState['trialClock']> }) {
  const { trial, endsAt } = clock;
  const [seconds, setSeconds] = useState(() => secondsLeft(endsAt));
  useEffect(() => {
    let tick: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(tick);
      const remaining = secondsLeft(endsAt);
      setSeconds(remaining);
      if (remaining) tick = setTimeout(update, Math.min(1000, Math.max(1, endsAt - Date.now() - (remaining - 1) * 1000)));
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => { clearTimeout(tick); document.removeEventListener('visibilitychange', update); };
  }, [endsAt]);
  const { name, engraving } = FACES[trial];
  const display = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const urgent = seconds <= 30;
  return <figure className="trial-clock" data-clock-face={trial} data-urgent={urgent || undefined} title={`${name} · the clock keeps running when you leave the room`}>
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle className="trial-clock-track" cx="20" cy="20" r="17" />
      <circle className="trial-clock-remaining" cx="20" cy="20" r="17" pathLength="100" strokeDasharray={`${100 * seconds / totalSeconds} 100`} transform="rotate(-90 20 20)" />
      <g className="trial-clock-engraving">{engraving}</g>
    </svg>
    <figcaption>
      <span className="trial-clock-name">{name}</span>
      <div role="timer" aria-live="off" aria-label={`${SCENE_INFO[trial].character}’s trial time remaining`}><time dateTime={`PT${seconds}S`}>{display}</time></div>
      <span className="sr-only" role="status">{urgent && seconds > 0 ? 'Thirty seconds or less remain in this trial.' : ''}</span>
    </figcaption>
  </figure>;
}
