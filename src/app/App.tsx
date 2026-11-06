import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { TRIALS } from '../content/scenes';
import type { RunState } from '../game/state';
import { GameSession } from '../game/session';
import { useRoadAudio } from '../audio/useRoadAudio';
import { useTrialDeadline } from '../effects/useTrialDeadline';
import { WorldGame } from '../world/WorldGame';
import { TrialClock } from '../world/TrialClock';
import { RoadMap } from '../world/RoadMap';
import { DiscoveryNotebook } from '../ui/DiscoveryNotebook';

type Panel = 'map' | 'journal' | 'settings' | 'journeys';
export function App({ session }: { session: GameSession }) {
  const { run, busy, status, message, preferences, collection, recoveryExport, lastCommand } = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const sound = useRoadAudio(session, run, preferences, lastCommand);
  useTrialDeadline(session, run, sound.ready);
  const [panel, setPanel] = useState<Panel | null>(null), [slots, setSlots] = useState<RunState[]>([]);
  const [slotStatus, setSlotStatus] = useState<'loading' | 'ready' | 'error'>('loading'), [slotAttempt, setSlotAttempt] = useState(0);
  const [fileError, setFileError] = useState('');
  const panelOrigin = useRef<{ element: HTMLElement | null; location: string } | null>(null), previousPanel = useRef<Panel | null>(null);
  const location = run.runId + ':' + run.currentScene + ':' + run.cottageView + ':' + run.phase;
  const seals = TRIALS.filter(id => run.puzzles[id].solved).length;
  useEffect(() => { if (!sound.ready || lastCommand?.type === 'TRIAL_TIMEOUT') setPanel(null); }, [sound.ready, lastCommand]);
  useEffect(() => { document.documentElement.dataset.motion = preferences.motion; document.documentElement.dataset.text = preferences.textSize; }, [preferences.motion, preferences.textSize]);
  useEffect(() => {
    if (previousPanel.current && panel === null) {
      const origin = panelOrigin.current;
      const samePlace = origin?.location === location, target = samePlace && origin.element?.isConnected && !origin.element.matches(':disabled') ? origin.element : document.querySelector<HTMLElement>('[data-world-surface]:not([hidden])') ?? document.getElementById('world-map-button') ?? document.querySelector<HTMLElement>('[data-testid="audio-entrance"] button');
      target?.focus({ preventScroll: true });
    }
    previousPanel.current = panel;
  }, [panel, location]);
  useEffect(() => {
    if (panel !== 'journeys') return;
    let current = true; setSlotStatus('loading'); setSlots([]);
    void session.listRuns().then(result => { if (current) { setSlots(result); setSlotStatus('ready'); } }).catch(() => { if (current) setSlotStatus('error'); });
    return () => { current = false; };
  }, [panel, session, slotAttempt]);
  const openPanel = (next: Panel) => { panelOrigin.current = { element: document.activeElement instanceof HTMLElement ? document.activeElement : null, location }; setFileError(''); setPanel(next); };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1_000_000) { setFileError('Maximum save size is 1 MB.'); return; }
    try { await session.importRun(await file.text()); setPanel(null); }
    catch { setFileError('This file could not be read. Your current journey is still open. Try the file again.'); }
  };
  const exportJourney = () => download('witches-road-save.json', session.exportRun());
  return <div className="world-app">
    <a href="#world-heading" className="skip-link">Skip to the current room</a>
    <WorldGame run={run} preferences={preferences} collection={collection} busy={busy} lastCommand={lastCommand} act={session.dispatch} sound={sound} message={message} status={status} panelOpen={panel !== null && sound.ready} openMap={() => openPanel('map')} openNotebook={() => openPanel('journal')} openSettings={() => openPanel('settings')} openJourneys={() => openPanel('journeys')} retrySave={() => void session.retrySave()} exportJourney={exportJourney} />
    {panel && sound.ready && <WorldDialog panel={panel} title={panel === 'map' ? 'Your folded Road map' : panel === 'journal' ? 'Your borrowing notebook' : panel === 'settings' ? 'Make yourself comfortable' : 'Saved journeys'} close={() => setPanel(null)}
      clock={run.trialClock && <TrialClock clock={run.trialClock} />}>
      {panel === 'map' && <RoadMap run={run} busy={busy} travel={async scene => { await session.dispatch({ type: 'ENTER_SCENE', scene }); setPanel(null); }} />}
      {panel === 'journal' && <div className="notebook-spread"><article><h3>Journey notes</h3><p>{run.alias ? `Notes for ${run.alias}` : 'A fresh page for the Road.'} · {seals} / 5 seals</p><ol className="journal-list">{run.journalEntries.filter(entry => !entry.startsWith('Hint ·')).map((entry, i) => <li key={i}>{entry}</li>)}</ol></article><DiscoveryNotebook found={[...collection, ...run.discoveries]} /></div>}
      {panel === 'settings' && <div className="settings-form"><label>Motion<select value={preferences.motion} onChange={e => void session.setPreferences({ motion: e.target.value as typeof preferences.motion })}><option value="system">Follow system preference</option><option value="reduced">Reduced motion</option><option value="full">Full motion</option></select></label><label>Text size<select value={preferences.textSize} onChange={e => void session.setPreferences({ textSize: e.target.value as typeof preferences.textSize })}><option value="normal">Normal</option><option value="large">Large</option></select></label><label className="checkbox-row"><input type="checkbox" checked={preferences.actionList} onChange={e => void session.setPreferences({ actionList: e.target.checked })} />Open the room object page on arrival</label><label className="checkbox-row"><input type="checkbox" checked={preferences.muted} onChange={e => sound.mute(e.target.checked)} />Mute audio</label><p className="aside">Adjust the room score, ambience and action sounds separately.</p><label htmlFor="masterVolume">Master volume<input id="masterVolume" type="range" min="0" max="1" step="0.05" value={preferences.masterVolume} onChange={e => void session.setPreferences({ masterVolume: Number(e.target.value) })} /></label><label htmlFor="ambienceVolume">Ambience volume<input id="ambienceVolume" type="range" min="0" max="1" step="0.05" value={preferences.ambienceVolume} onChange={e => void session.setPreferences({ ambienceVolume: Number(e.target.value) })} /></label><label htmlFor="musicVolume">Music volume<input id="musicVolume" type="range" min="0" max="1" step="0.05" value={preferences.musicVolume} onChange={e => void session.setPreferences({ musicVolume: Number(e.target.value) })} /></label><label htmlFor="effectsVolume">Effects volume<input id="effectsVolume" type="range" min="0" max="1" step="0.05" value={preferences.effectsVolume} onChange={e => void session.setPreferences({ effectsVolume: Number(e.target.value) })} /></label><button onClick={() => download('witches-road-save.json', session.exportRun())}>Export this journey</button><label>Import a saved journey<input type="file" accept=".json,application/json" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void importFile(file); }} /></label>{recoveryExport !== null && <button onClick={() => download('witches-road-recovery.json', JSON.stringify(recoveryExport, null, 2))}>Export retained recovery data</button>}</div>}
      {panel === 'journeys' && <><p>Each new journey gets its own slot. Completed trials stay with their original journey.</p><div className="button-row"><button className="primary" disabled={busy} onClick={async () => { await session.newJourney('story'); setPanel(null); }}>New story journey</button><button disabled={busy} onClick={async () => { await session.newJourney('showcase'); setPanel(null); }}>New showcase journey</button></div>{slotStatus === 'loading' && <p role="status">Opening the saved cards…</p>}{slotStatus === 'error' && <div role="alert"><p>Saved cards are unavailable while browser storage is offline. Your current journey remains open.</p><button onClick={() => setSlotAttempt(value => value + 1)}>Retry saved journeys</button></div>}<ul className="slot-list">{slots.map(slot => <li key={slot.runId}><div><b>{slot.alias ?? 'Unstamped card'}</b><small id={`saved-card-${slot.runId}`}>{slot.runId === run.runId ? 'CURRENT CARD · ' : ''}{slot.mode} · {TRIALS.filter(t => slot.puzzles[t].solved).length} / 5 seals</small></div><button aria-describedby={`saved-card-${slot.runId}`} disabled={busy} onClick={async () => { await session.resume(slot.runId); setPanel(null); }}>Resume {slot.alias ?? 'unstamped journey'}</button></li>)}</ul></>}
      {fileError && <p role="alert">{fileError}</p>}
    </WorldDialog>}
  </div>;
}

function WorldDialog({ panel, title, close, clock, children }: { panel: Panel; title: string; close: () => void; clock: ReactNode; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog className={`world-modal world-panel-${panel}`} ref={dialog} onClose={close} onCancel={event => { event.preventDefault(); close(); }} aria-labelledby="dialog-title" onKeyDown={event => {
    if (event.key !== 'Tab' || !dialog.current) return;
    const targets = [...dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')].filter(element => element.getClientRects().length > 0 && !element.closest('[hidden]'));
    const first = targets[0], last = targets.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first?.focus(); }
  }}><header><span className="dialog-bookmark" aria-hidden="true">W</span><h2 id="dialog-title">{title}</h2>{clock}<button onClick={close} aria-label="Close panel">×</button></header>{children}</dialog>;
}
function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
