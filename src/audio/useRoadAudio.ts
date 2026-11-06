import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AudioEngine } from './engine';
import type { GameSession } from '../game/session';
import type { Command } from '../game/commands';
import { DEFAULT_PREFERENCES, type Preferences, type RunState } from '../game/state';
import chantUrl from './witches-road-chant.mp3?url';

export function useRoadAudio(session: GameSession, run: RunState, preferences: Preferences, lastCommand: Command | null) {
  const [engine] = useState(() => new AudioEngine(() => new AudioContext(), chantUrl));
  const status = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const [entered, setEntered] = useState(false), [starting, setStarting] = useState(false);
  const previous = useRef({ id: run.runId, revision: run.revision });
  useEffect(() => { engine.configure(preferences); }, [engine, preferences]);
  useEffect(() => { engine.setRoom(run.currentScene, run.puzzles.studio); }, [engine, run.currentScene, run.puzzles.studio]);
  useEffect(() => {
    const prior = previous.current; previous.current = { id: run.runId, revision: run.revision };
    if (prior.id !== run.runId || prior.revision === run.revision || !lastCommand) return;
    if (lastCommand.type === 'JUG') engine.effect(lastCommand.move.startsWith('pour') ? 'pour' : lastCommand.move.startsWith('fill') ? 'fill' : 'empty');
    if (lastCommand.type === 'DIAL_CODE') engine.effect(run.puzzles.studio.solved ? 'success' : 'dial');
    if (lastCommand.type === 'KITCHEN_TIMER') engine.effect('timer');
    if (lastCommand.type === 'TRIAL_TIMEOUT') engine.effect('shadow');
    if (lastCommand.type === 'TOGGLE_LAMP') engine.effect('lamp');
    if (lastCommand.type === 'CHECK_LAMPS') engine.effect(run.puzzles.cabin.solved ? 'success' : 'shadow');
    if (['MOVE_DECK', 'PICK_CONFIRM', 'CLEAR_CONFIRM'].includes(lastCommand.type)) engine.effect('card');
    if (lastCommand.type === 'REVEAL_MEMORY') engine.effect('memory');
    if (['SUBMIT_DECK', 'CONFIRM_DECK'].includes(lastCommand.type)) engine.effect('success');
    if (lastCommand.type === 'STAMP_ALIAS') engine.effect('dial');
    if (lastCommand.type === 'RENEW_BOOK') engine.effect('receipt');
    if (lastCommand.type === 'SUBMIT_ATTEMPTED_SPELL') engine.effect('memory');
    if (lastCommand.type === 'UNBIND') engine.effect('thread');
    if (['MATCH_COVEN', 'SIGN_IN'].includes(lastCommand.type)) engine.effect('success');
    if (lastCommand.type === 'TRACE_VINE' || lastCommand.type === 'TRACE_VINE_PATH') engine.effect(run.puzzles.greenhouse.solved ? 'flower' : 'lamp');
    if (lastCommand.type === 'TOGGLE_MUSHROOM' || lastCommand.type === 'REMEMBER_ME') engine.effect('lamp');
    if (lastCommand.type === 'TUNE_TELEVISION') engine.effect(lastCommand.channel === 'off' ? 'receipt' : 'dial');
    if (lastCommand.type === 'SUBMIT_IDENTITY') engine.effect('success');
    if (lastCommand.type === 'EXPIRE_SESSION') engine.effect('flower');
    if (lastCommand.type === 'INSPECT_ENCOUNTER' && lastCommand.prop === 'visionIntercom') engine.effect('memory');
    if (lastCommand.type === 'INSPECT_ENCOUNTER' && lastCommand.prop === 'cabinWindow') engine.effect('shadow');
  }, [engine, run, lastCommand]);
  useEffect(() => {
    const visibility = () => { void engine.setHidden(document.hidden); };
    document.addEventListener('visibilitychange', visibility); visibility();
    return () => { document.removeEventListener('visibilitychange', visibility); engine.dispose(); };
  }, [engine]);
  const enter = async () => {
    if (starting) return; setStarting(true);
    // resume() runs directly inside this explicit gesture, before any storage await.
    const update = { muted: false, masterVolume: preferences.masterVolume || DEFAULT_PREFERENCES.masterVolume,
      ...(preferences.musicVolume === 0 && preferences.ambienceVolume === 0 ? { musicVolume: DEFAULT_PREFERENCES.musicVolume, ambienceVolume: DEFAULT_PREFERENCES.ambienceVolume } : {}) };
    engine.configure({ ...preferences, ...update }); await engine.enable();
    if (engine.getSnapshot() === 'playing') { setEntered(true); void session.setPreferences(update); }
    setStarting(false);
  };
  const mute = (muted: boolean) => {
    engine.configure({ ...preferences, muted }); if (!muted) void engine.enable();
    void session.setPreferences({ muted });
  };
  return { status, mute, enter, starting, ready: entered && status !== 'blocked' && status !== 'unavailable', retry: () => void engine.enable() };
}
