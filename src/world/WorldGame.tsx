import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { artUrl } from 'virtual:road-art';
import type { Command } from '../game/commands';
import type { Preferences, RunState } from '../game/state';
import type { useRoadAudio } from '../audio/useRoadAudio';
import { AudioEntrance } from '../ui/AudioEntrance';
import { ArrivalCard } from '../ui/ArrivalCard';
import { SCENE_INFO } from '../content/scenes';
import { ENCOUNTERS, type EncounterId } from '../content/encounters';
import { sceneCaption, sceneObjects, shouldReduceMotion, type SceneObject } from '../scenes/objects';
import { CottageDetails } from '../scenes/CottageDetails';
import { vineChoices } from '../puzzles/rules';
import { FLOURISH_LABEL } from '../scenes/cues';
import { useOvenChime } from '../effects/useOvenChime';
import { cottageDeskBounds, placePlaque, plaqueBounds, projectRect, rectStyle, visibleHitArea, worldApproachBounds, worldEncounterBounds, worldLayout, worldObjectBounds, type Point, type Rect } from './layout';
import { locationName } from './navigation';
import { roomExit, roomObjective } from './objectives';
import { ObjectPlaque } from './ObjectPlaque';
import { useWorldCues } from './useWorldCues';
import type { WorldRenderer, WorldVisual } from './renderer';
import { InstrumentStage } from './InstrumentStage';
import { RecordingStage } from './RecordingStage';
import { studioPlacement } from './studioLayout';
import { TrialRoomProps } from './TrialRoomProps';
import { TrialClock } from './TrialClock';
import { CABIN_PLANCHETTE, cabinLampBounds, isPaintedTrial } from './trialSurfaces';
import { INSTRUMENTS, instrumentFrame, isInstrumentScene } from './instruments';
import { FINALE_SURFACES, FinaleStage, type FinaleKind } from './FinaleStage';
import { RoomRules } from './RoomRules';
import { EncounterStage } from './EncounterStage';
import { RoadEmblem } from '../ui/RoadEmblem';
import './world.css';
import './panels.css';
import './instruments.css';
import './roadTrials.css';
import './finale.css';
import './encounters.css';
import './trialSurfaces.css';
import './parchment.css';
import './objectPlaques.css';

type Surface = 'work' | 'rug' | 'objects' | 'encounter' | null;

type Props = {
  run: RunState; preferences: Preferences; collection: readonly string[]; busy: boolean; lastCommand: Command | null;
  act: (command: Command) => Promise<void>; sound: ReturnType<typeof useRoadAudio>;
  message: string; status: string; panelOpen: boolean; openMap: () => void; openNotebook: () => void; openSettings: () => void; openJourneys: () => void;
  retrySave: () => void; exportJourney: () => void;
};
function useViewport() {
  const measure = () => ({ width: Math.round(window.visualViewport?.width ?? innerWidth), height: Math.round(window.visualViewport?.height ?? innerHeight), left: window.visualViewport?.offsetLeft ?? 0, top: window.visualViewport?.offsetTop ?? 0, density: devicePixelRatio });
  const [viewport, setViewport] = useState(measure);
  useLayoutEffect(() => {
    const resize = () => setViewport(previous => { const next = measure(); return Object.keys(next).every(key => next[key as keyof typeof next] === previous[key as keyof typeof previous]) ? previous : next; });
    window.addEventListener('resize', resize); window.visualViewport?.addEventListener('resize', resize); window.visualViewport?.addEventListener('scroll', resize); resize();
    return () => { window.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('scroll', resize); };
  }, []);
  return viewport;
}

export function WorldGame({ run, preferences, collection, busy, lastCommand, act, sound, message, status, panelOpen, openMap, openNotebook, openSettings, openJourneys, retrySave, exportJourney }: Props) {
  const viewport = useViewport();
  const layout = useMemo(() => worldLayout(run, viewport.width, viewport.height), [run.currentScene, run.cottageView, viewport.width, viewport.height]);
  const [systemReduced, setSystemReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const reduced = shouldReduceMotion(preferences.motion, systemReduced);
  const root = useRef<HTMLElement>(null), host = useRef<HTMLDivElement>(null), mounted = useRef<WorldRenderer | null>(null);
  const paper = useRef<HTMLDivElement>(null), workPaper = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLElement | null>(null), pendingArrival = useRef(true), restoreOrigin = useRef(false);
  const objectReturn = useRef<Exclude<Surface, 'objects'>>(null);
  const closingAnchor = useRef<string | null>(null);
  const [surface, setSurface] = useState<Surface>(preferences.actionList ? 'objects' : null);
  const [encounter, setEncounter] = useState<EncounterId | null>(null);
  const [renderer, setRenderer] = useState<'loading' | 'ready' | 'fallback'>('loading'), [attempt, setAttempt] = useState(0);
  const [missing, setMissing] = useState<Set<string>>(() => new Set());
  const [paused, setPaused] = useState(() => document.hidden);
  const instrument = isInstrumentScene(run.currentScene) ? run.currentScene : null;
  const paintedTrial = instrument && isPaintedTrial(instrument) ? instrument : null;
  const returning = run.currentScene === 'cottage' && run.puzzles.greenhouse.solved;
  const arrival = run.currentScene === 'cottage' && !returning;
  const primaryFinale = run.currentScene === 'account' ? 'desk' : returning ? 'door' : null;
  const finale: FinaleKind | null = surface === 'rug' && run.currentScene === 'cottage' && run.cottageView === 'inside' ? 'rug' : surface === 'work' ? primaryFinale : null;
  const paperOpen = surface === 'objects' || surface === 'work' && arrival;
  const geometryKey = `${viewport.width}:${viewport.height}:${viewport.left}:${viewport.top}:${preferences.textSize}`;
  const spellOrigin = useRef<Point | null>(null), sceneKey = `${run.runId}:${run.currentScene}:${run.currentScene === 'cottage' ? `${run.cottageView}:${run.phase}` : ''}`;
  const { theft, flourish, skipTheft, skipFlourish } = useWorldCues(run, lastCommand, reduced);
  const visual = useRef<WorldVisual>({ layout, run, reduced, theft, flourish, spellOrigin: null, occluded: true });
  visual.current = { layout, run, reduced, theft, flourish, spellOrigin: spellOrigin.current, occluded: panelOpen || surface !== null || !sound.ready };
  function open(next: Exclude<Surface, null>, trigger?: HTMLElement) {
    if (next === 'objects' && surface !== 'objects') objectReturn.current = surface;
    if (surface !== 'objects') origin.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setSurface(next);
  }
  function close() {
    if (surface === 'encounter' && encounter) {
      closingAnchor.current = `${run.currentScene}.${encounter}`;
      if (flourish === 'standBy' || flourish === 'visitors' || flourish === 'finalStamp') skipFlourish();
    } else closingAnchor.current = finale === 'rug' ? 'cottage.rug' : primaryFinale === 'door' ? 'cottage.door' : primaryFinale === 'desk' ? 'account.ledger' : null;
    restoreOrigin.current = true;
    setSurface(null);
  }
  const dispatch = useCallback(async (command: Command) => {
    if (command.type === 'SUBMIT_ATTEMPTED_SPELL') {
      const input = root.current?.querySelector('#spell')?.getBoundingClientRect(), bounds = root.current?.getBoundingClientRect();
      if (input && bounds) spellOrigin.current = { x: input.left - bounds.left + input.width / 2, y: input.top - bounds.top + input.height / 2 };
    }
    await act(command);
  }, [act]);
  function approachEncounter(prop: EncounterId, trigger: HTMLElement) {
    setEncounter(prop);
    open('encounter', trigger);
    void dispatch({ type: 'INSPECT_ENCOUNTER', prop });
  }
  function inspect(object: SceneObject, trigger: HTMLElement) {
    if (object.command.type === 'INSPECT_ENCOUNTER') {
      approachEncounter(object.command.prop, trigger);
      return;
    }
    if (object.command.type === 'RENEW_BOOK') open('work', trigger);
    if (object.command.type === 'INSPECT_PROP') {
      const { prop } = object.command;
      if (prop === 'roomRug') open('rug', trigger);
      else if (prop === 'door' && (returning || arrival && !run.arrival.aliasStamped)) open('work', trigger);
    }
    void dispatch(object.command);
  }
  useOvenChime(run, dispatch, sound.ready && !panelOpen);
  const objects = sceneObjects(run, collection), objective = roomObjective(run, layout, objects, preferences.textSize), exit = roomExit(run, layout);
  const otherObjects = objects.flatMap(object => {
    if (object.id !== objective.id) return [object];
    return objective.command?.type === 'SIGN_IN' ? [{ ...object, id: 'cottage.stitch', label: 'Inspect the unbound door stitch' }] : [];
  });
  function useObjective(trigger: HTMLElement) {
    if (objective.command) void dispatch(objective.command);
    else open('work', trigger);
  }
  const clock = run.trialClock && !panelOpen ? <TrialClock clock={run.trialClock} /> : null;
  const disabled = (object: SceneObject) => busy || (object.id.startsWith('garden.cap.') && run.puzzles.garden.solved) || (object.id.startsWith('cabin.lamp.') && run.puzzles.cabin.solved) || (object.command.type === 'TRACE_VINE' && (run.puzzles.greenhouse.solved || !vineChoices(run.puzzles.greenhouse.route).includes(object.command.node)));
  const isPlaque = (object: SceneObject) => object.command.type === 'INSPECT_ENCOUNTER' ||
    ['cottage.rug', 'cottage.garden', 'cottage.stitch', 'account.slot', 'account.renew', 'cabin.check'].includes(object.id);
  function bounds(object: SceneObject) {
    if (object.command.type === 'INSPECT_ENCOUNTER') return worldEncounterBounds(object, layout);
    if (object.command.type === 'TOGGLE_LAMP') return visibleHitArea(projectRect(cabinLampBounds(object.command.index), layout.camera), layout);
    if (object.id === 'cabin.check') return plaqueBounds(projectRect(CABIN_PLANCHETTE, layout.camera), layout);
    if (object.id === 'cottage.garden') return plaqueBounds(layout.garden, layout);
    if (isPlaque(object)) return worldApproachBounds(object, layout);
    if (instrument && !['kitchen.jen', 'studio.alice', 'cabin.agatha', 'tower.lilia', 'greenhouse.rio'].includes(object.id)) return null;
    if (!layout.outside) return worldObjectBounds(object, layout);
    if (object.id === 'cottage.door') return layout.door;
    return layout.actor;
  }
  const targets = otherObjects.flatMap(object => {
    const frame = bounds(object);
    return frame ? [{ object, frame }] : [];
  });
  const occupied = [objective.frame, ...targets.filter(({ object }) => object.command.type === 'TOGGLE_LAMP').map(({ frame }) => frame)];
  function reserve(frame: Rect | null) {
    const placed = frame && placePlaque(frame, occupied, layout);
    if (placed) occupied.push(placed);
    return placed;
  }
  const exitFrame = exit && reserve(exit.frame);
  const cottageView = run.currentScene === 'cottage' ? {
    label: layout.outside ? 'Look inside the cottage' : 'Step outside cottage',
    command: { type: 'SET_COTTAGE_VIEW', view: layout.outside ? 'inside' : 'outside' } as const,
    frame: reserve(plaqueBounds({ x: layout.door.x + layout.door.width + 60, y: layout.door.y + layout.door.height * .25, width: 0, height: 0 }, layout)),
  } : null;
  const deskFrame = reserve(cottageDeskBounds(layout));
  const positioned = targets.flatMap(({ object, frame }) => {
    const rect = isPlaque(object) ? reserve(frame) : frame;
    return rect ? [{ object, rect }] : [];
  });
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'), change = () => setSystemReduced(media.matches);
    media.addEventListener('change', change); return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => { document.documentElement.dataset.presentation = 'world'; return () => { delete document.documentElement.dataset.presentation; }; }, []);
  useEffect(() => { const visibility = () => setPaused(document.hidden); document.addEventListener('visibilitychange', visibility); return () => document.removeEventListener('visibilitychange', visibility); }, []);
  useLayoutEffect(() => {
    const backToTv = lastCommand?.type === 'LEAVE_VISION';
    setEncounter(backToTv ? 'television' : null);
    setSurface(preferences.actionList ? 'objects' : backToTv ? 'encounter' : null);
    spellOrigin.current = null;
    origin.current = null;
    objectReturn.current = null;
    pendingArrival.current = true;
  }, [sceneKey]);
  useLayoutEffect(() => {
    if (!arrival || surface !== 'work' || lastCommand?.type !== 'STAMP_ALIAS' && lastCommand?.type !== 'SUBMIT_ATTEMPTED_SPELL') return;
    origin.current = null;
    closingAnchor.current = null;
    restoreOrigin.current = true;
    setSurface(null);
  }, [lastCommand]);
  useLayoutEffect(() => {
    if (surface !== null || !restoreOrigin.current) return;
    restoreOrigin.current = false;
    const trigger = origin.current;
    if (trigger?.isConnected && !trigger.matches(':disabled') && !trigger.closest('[hidden], [inert]')) {
      trigger.focus({ preventScroll: true });
      return;
    }
    const anchor = closingAnchor.current;
    const approach = anchor ? root.current?.querySelector<HTMLButtonElement>(`.world-hotspots [data-prop-id="${anchor}"]:not(:disabled)`) : null;
    (approach ?? root.current?.querySelector<HTMLElement>('.world-hotspots [data-objective]:not(:disabled), #world-map-button'))?.focus({ preventScroll: true });
  }, [surface]);
  useEffect(() => {
    if (!sound.ready || panelOpen) return;
    if (pendingArrival.current || surface !== null) {
      const target = paperOpen ? paper.current : surface === null ? root.current?.querySelector<HTMLElement>('#world-heading') : workPaper.current;
      target?.focus({ preventScroll: true });
      pendingArrival.current = false;
    }
  }, [sound.ready, panelOpen, surface, sceneKey, paperOpen]);
  useEffect(() => {
    let cancelled = false, current: WorldRenderer | undefined; setRenderer('loading');
    void import('./renderer').then(module => {
      if (cancelled || !host.current) return;
      return module.mountWorld(host.current, () => visual.current, status => { if (!cancelled) setRenderer(status); });
    }).then(handle => {
      if (!handle) return;
      if (cancelled) handle.dispose(); else { current = handle; mounted.current = handle; handle.refresh(); }
    }).catch(() => { if (!cancelled) setRenderer('fallback'); });
    return () => { cancelled = true; current?.dispose(); mounted.current = null; };
  }, [attempt]);
  useLayoutEffect(() => {
    const field = document.activeElement;
    if (!(field instanceof HTMLInputElement) || !root.current?.contains(field)) return;
    const surface = field.closest('[data-world-surface]');
    if (!surface) return;
    const body = field.closest('.parchment-body');
    const bounds = (body ?? surface).getBoundingClientRect();
    const heading = body ? null : surface.querySelector('.instrument-heading')?.getBoundingClientRect();
    const input = field.getBoundingClientRect();
    if (input.bottom > bounds.bottom - 8 || input.top < (heading?.bottom ?? bounds.top) + 8) field.scrollIntoView({ block: 'center', inline: 'nearest' });
  }, [viewport.width, viewport.height, viewport.top]);
  useLayoutEffect(() => { mounted.current?.refresh(); }, [layout, run, reduced, theft, flourish, panelOpen, surface, sound.ready, viewport.density]);
  const markMissing = (url: string) => setMissing(previous => new Set(previous).add(url));
  const illustrationMissing = missing.has(layout.background) || Boolean(layout.character && missing.has(layout.character));
  const rendererStatus = illustrationMissing ? 'fallback' : renderer;
  const feedback = <div className={paperOpen ? 'world-response' : 'world-response parchment'} role="status" aria-live="polite" data-testid="feedback"><span className="scene-art-caption">{sceneCaption(run)}</span>{message}</div>;
  const recovery = status === 'unsaved' && <aside className="world-storage-alert" aria-label="Journey saving"><p>Browser saving is unavailable. Export your unsaved moves before closing.</p><button onClick={retrySave}>Retry save</button><button onClick={exportJourney}>Export journey</button></aside>;
  const rendererRecovery = rendererStatus === 'fallback' && <div className="world-renderer-recovery"><span>Still illustration · every control remains available</span><button onClick={() => { setMissing(new Set()); setAttempt(value => value + 1); }}>Retry illustrated scene</button></div>;
  const returnSurface = objectReturn.current;
  const returnName = returnSurface === null ? 'Return to the room' : returnSurface === 'encounter' && encounter ? `Return to ${ENCOUNTERS[encounter].title.toLowerCase()}` : returnSurface === 'rug' ? FINALE_SURFACES.rug.return : instrument ? INSTRUMENTS[instrument].return : primaryFinale ? FINALE_SURFACES[primaryFinale].return : 'Return to room notes';
  const skipLabel = flourish && flourish !== 'standBy' ? `Skip ${FLOURISH_LABEL[flourish]} animation` : null;
  const encounterFrame = instrumentFrame(viewport.width, viewport.height, true);
  return <main ref={root} id="main" className="world-viewport" aria-label={locationName(run)} aria-hidden={panelOpen || undefined} inert={panelOpen} style={{ width: viewport.width, height: viewport.height, left: viewport.left, top: viewport.top }} data-testid="scene-stage" data-renderer={rendererStatus} data-scene={run.currentScene} data-profile={layout.profile} data-framing={layout.framing} data-short={viewport.height < 540 || undefined} data-motion={reduced ? 'reduced' : 'full'} data-flourish={flourish ?? 'none'} data-paused={paused} data-finale={primaryFinale ?? undefined} data-cottage-view={run.currentScene === 'cottage' ? run.cottageView : undefined}>
    <h1 id="world-heading" className="sr-only" tabIndex={-1}>{SCENE_INFO[run.currentScene].title}</h1>
    <div className="world-still" aria-hidden="true">
      {!missing.has(layout.background) && <img key={layout.background} data-testid="world-background" src={artUrl(layout.background)} alt="" style={rectStyle(layout.backgroundRect)} onError={() => markMissing(layout.background)} />}
      {run.currentScene === 'cottage' && !layout.outside && <CottageDetails layout={layout} />}
      {paintedTrial && <TrialRoomProps run={run} layout={layout} />}
      {returning && <svg className="cottage-thread-decal" data-unbound={run.milestones.unbindingCompleted} viewBox="0 0 80 40"
        style={{ left: layout.knocker.x, top: layout.knocker.y, width: Math.min(88, layout.door.width * .72) }}>
        <path d="m5 31 17-21 18 21 18-21 17 21" /><path d="M5 31h70" />
      </svg>}
      {layout.character && !missing.has(layout.character) && (instrument !== 'studio' || !sound.ready) && <img key={layout.character} src={artUrl(layout.character)} alt="" style={rectStyle(layout.actor)} onError={() => markMissing(layout.character!)} />}
      <div className="world-shade" />
    </div>
    <div ref={host} className="world-renderer" data-testid="world-renderer" />
    {run.currentScene === 'cottage' && run.encounters.sessionExpired && <div className="session-flower" role="img" aria-label="Rio’s red session flower"
      style={{ left: layout.door.x + 6, top: Math.min(layout.height - 162, layout.door.y + layout.door.height * .84) }}>
      <RoadEmblem kind="flower" />
    </div>}
    <span className="sr-only" data-testid="journey-mode">{run.mode.toUpperCase()} JOURNEY</span>
    {!sound.ready ? <AudioEntrance embedded status={sound.status} starting={sound.starting} enter={sound.enter} exportJourney={exportJourney} /> : <>
      <div className="world-location" aria-hidden="true"><span>{SCENE_INFO[run.currentScene].subtitle}</span><i>{locationName(run)}</i></div>
      {surface === null && clock && <div className="world-trial-clock">{clock}</div>}
      <div className="world-hotspots" aria-label="Illustrated room objects" aria-hidden={surface !== null || undefined} inert={surface !== null}>
        <ObjectPlaque className="world-object" data-objective data-prop-id={objective.id} style={rectStyle(objective.frame)} label={objective.label} marker={objective.marker}
          aria-haspopup={objective.command ? undefined : 'dialog'} disabled={busy && Boolean(objective.command)} onClick={event => useObjective(event.currentTarget)} />
        {exit && exitFrame && <ObjectPlaque className="world-object" data-room-exit marker="↗" label={exit.label} style={rectStyle(exitFrame)}
          aria-label={`Take the door: ${exit.label}`} disabled={busy} onClick={() => void dispatch(exit.command)} />}
        {cottageView?.frame && <ObjectPlaque className="world-object" data-cottage-entry marker="⌂" label={cottageView.label} style={rectStyle(cottageView.frame)}
          disabled={busy} onClick={() => void dispatch(cottageView.command)} />}
        {deskFrame && <ObjectPlaque className="world-object" style={rectStyle(deskFrame)} label="Inspect the writing desk" marker="▱" onClick={event => open('objects', event.currentTarget)} />}
        {positioned.map(({ object, rect }) => {
          const extra = object.command.type === 'INSPECT_ENCOUNTER' ? object.command.prop : undefined;
          if (isPlaque(object)) return <ObjectPlaque key={object.id} className="world-object" data-prop-id={object.id} data-encounter-anchor={extra} data-work-object={object.id === 'cottage.stitch' || undefined}
            label={object.label} marker={object.marker} style={rectStyle(rect)} disabled={disabled(object)} onClick={event => inspect(object, event.currentTarget)} />;
          return <button
            key={object.id}
            data-prop-id={object.id}
            aria-label={object.label}
            title={object.label}
            disabled={disabled(object)}
            className="world-object"
            aria-pressed={object.command.type === 'TOGGLE_LAMP' ? Boolean(run.puzzles.cabin.lamps[object.command.index]) : undefined}
            style={rectStyle(rect)}
            onClick={event => inspect(object, event.currentTarget)}
          >
            <span>{object.label}</span>
          </button>;
        })}
      </div>
      {surface === null && <>{feedback}{recovery}</>}
      <nav className="traveller-kit" aria-label="Traveller’s kit">
        <button id="world-map-button" onClick={openMap}><KitIcon kind="map" /><span>Road map</span></button>
        <button onClick={openNotebook}><KitIcon kind="book" /><span>Notebook</span></button>
        <button onClick={() => open('objects')} aria-expanded={surface === 'objects'}><KitIcon kind="leaf" /><span>Room objects</span></button>
        <button onClick={openJourneys}><KitIcon kind="cards" /><span>Journeys</span></button>
        <button onClick={openSettings}><KitIcon kind="gear" /><span>Settings</span></button>
        <span data-testid="audio-controls" data-audio-state={sound.status}><button aria-label={preferences.muted ? 'Enable sound' : 'Mute sound'} aria-pressed={!preferences.muted} onClick={() => sound.mute(!preferences.muted)}><KitIcon kind="bell" /><span>{preferences.muted ? 'Muted' : 'Sound'}</span></button></span>
      </nav>
      <div className={`world-save ${status}`} data-testid="save-status" role={status === 'unsaved' || status === 'conflict' ? 'status' : undefined}>{status === 'saved' ? '✧ Journey saved in this browser' : status === 'saving' ? 'Saving your place…' : status === 'conflict' ? 'Latest tab state loaded · repeat your action' : status === 'recovered' ? 'Previous checkpoint recovered' : 'Unsaved · export before closing'}</div>
      {surface === null && rendererRecovery}
      {(theft || skipLabel) && !reduced && <div className="world-skip">
        {theft && <button onClick={skipTheft}>Skip dot-theft animation</button>}
        {skipLabel && <button aria-label={skipLabel} title={skipLabel} onClick={skipFlourish}>{primaryFinale ? 'Skip' : skipLabel}</button>}
      </div>}
      {instrument === 'studio' ? <RecordingStage key={run.runId} run={run} busy={busy} act={dispatch}
        expanded={surface === 'work'} obscured={surface === 'objects' || surface === 'encounter'}
        active={surface === 'work' && !panelOpen && !paused} geometryKey={geometryKey} reduced={reduced}
        placement={studioPlacement(layout, preferences.textSize)} layout={layout}
        character={layout.character && !missing.has(layout.character) ? artUrl(layout.character) : null}
        onCharacterError={() => { if (layout.character) markMissing(layout.character); }}
        surfaceRef={workPaper} close={close} lastCommand={lastCommand} clock={surface === 'work' ? clock : null}>
        {feedback}{recovery}{rendererRecovery}
      </RecordingStage> : instrument && <InstrumentStage key={`${run.runId}:${instrument}`} run={run} scene={instrument} busy={busy} act={dispatch}
        expanded={surface === 'work'} obscured={surface === 'objects' || surface === 'encounter'}
        active={surface === 'work' && !panelOpen && !paused && sound.ready} geometryKey={geometryKey}
        frame={paintedTrial && surface !== 'work' ? objective.frame : instrumentFrame(viewport.width, viewport.height, surface === 'work', instrument)}
        surfaceRef={workPaper} close={close} openIntercom={trigger => approachEncounter('visionIntercom', trigger)}
        clock={surface === 'work' ? clock : null} reduced={reduced} blooming={flourish === 'flower'} lastCommand={lastCommand} feedback={feedback}
        recovery={recovery} rendererRecovery={rendererRecovery} />}
      {finale && <FinaleStage key={`${run.runId}:${finale}`} kind={finale} run={run} busy={busy} act={dispatch} active={!panelOpen && !paused} geometryKey={geometryKey} frame={instrumentFrame(viewport.width, viewport.height, true)} surfaceRef={workPaper} flourish={flourish} clock={clock} close={close} openDateStamp={trigger => approachEncounter('returnDate', trigger)}>
        {feedback}{recovery}{rendererRecovery}
      </FinaleStage>}
      {surface === 'encounter' && encounter && <EncounterStage key={`${run.runId}:${encounter}`} kind={encounter} run={run} busy={busy} act={dispatch}
        frame={{ ...encounterFrame, width: Math.min(680, encounterFrame.width) }} surfaceRef={workPaper} close={close} skip={skipFlourish} flourish={flourish} clock={clock}>
        {feedback}{recovery}{rendererRecovery}
      </EncounterStage>}
      <div ref={paper} data-world-surface={paperOpen || undefined} className={`world-paper world-borrowing-card parchment ${run.currentScene !== 'cottage' ? 'world-room-surface' : ''} ${surface === 'objects' ? 'world-object-page' : ''}`} role="dialog" aria-modal="false" aria-label={surface === 'objects' ? 'Room objects' : 'Your borrowing card'} tabIndex={-1} hidden={!paperOpen} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
        <div className="world-paper-heading"><span>{surface === 'objects' ? 'FIELD NOTES · ROOM OBJECTS' : 'WESTVIEW PUBLIC LIBRARY · BORROWER RECORD'}</span>{paperOpen && clock}<button aria-label={surface === 'objects' ? 'Close room objects' : 'Close borrowing card'} onClick={close}>×</button></div>
        <div className="parchment-body">
          {arrival && <fieldset className="world-card-controls" hidden={surface !== 'work'} aria-busy={busy}><legend className="sr-only">Agatha’s room controls</legend><ArrivalCard key={run.runId} run={run} act={dispatch} /></fieldset>}
          {surface === 'objects' && instrument && <RoomRules scene={instrument} opposite={run.puzzles.tower.stage === 'confirming'} />}
          {surface === 'objects' && <fieldset className="world-object-list" aria-label="Scene action list">
            <legend>Objects on this page</legend>
            <ObjectPlaque data-list-objective label={objective.label} marker={objective.marker} aria-haspopup={objective.command ? undefined : 'dialog'}
              disabled={busy && Boolean(objective.command)} onClick={event => useObjective(event.currentTarget)} />
            {exit && <ObjectPlaque label={`Take the door: ${exit.label}`} marker="↗" disabled={busy} onClick={() => void dispatch(exit.command)} />}
            {cottageView && <ObjectPlaque label={cottageView.label} marker="⌂" disabled={busy} onClick={() => void dispatch(cottageView.command)} />}
            {otherObjects.map(object => {
              const unavailable = disabled(object);
              return <button key={object.id} data-prop-id={object.id} aria-disabled={unavailable || undefined} onClick={event => { if (!unavailable) inspect(object, event.currentTarget); }}>{object.label}</button>;
            })}
            <button onClick={() => returnSurface ? open(returnSurface) : close()}>{returnName}</button>
          </fieldset>}
          {paperOpen && <>{feedback}{recovery}{rendererRecovery}</>}
          <span className="world-paper-seal" aria-hidden="true">W</span>
        </div>
      </div>
    </>}
  </main>;
}

function KitIcon({ kind }: { kind: 'map' | 'book' | 'leaf' | 'cards' | 'gear' | 'bell' }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">{kind === 'map' ? <><path d="m3 7 9-4 8 4 9-4v22l-9 4-8-4-9 4zM12 3v22M20 7v22"/><path d="m7 19 7-5 5 4 7-8"/></> : kind === 'book' ? <><path d="M5 5h17l5 4v20H9l-4-4zM9 9h18M9 9v20M5 5v20h4" /><path d="M14 14h8m-8 5h8m-8 5h5" /></> : kind === 'leaf' ? <><path d="M8 25C-2 9 15 3 27 5c0 16-7 25-19 20ZM8 25 23 9M13 20v-8m5 3h6" /></> : kind === 'cards' ? <><path d="m7 3 21 5-5 21L2 24zM9 5 6 21l15 4" /><path d="m17 10 2 6 5 2-6 1-3 5-1-6-5-3 6-1z" /></> : kind === 'gear' ? <><circle cx="16" cy="16" r="10" /><circle cx="16" cy="16" r="3" /><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3" /></> : <><path d="M6 23c4-5 2-10 5-14a7 7 0 0 1 10 0c3 4 1 9 5 14H6Zm7 4h6M16 3v3" /><path d="m24 4 4 3M4 7l4-3" /></>}</svg>;
}
