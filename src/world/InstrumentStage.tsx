import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { Command } from '../game/commands';
import type { RunState } from '../game/state';
import { COVEN, SCENE_INFO } from '../content/scenes';
import { JUG_LABELS } from '../puzzles/rules';
import { RoadEmblem } from '../ui/RoadEmblem';
import { rectStyle, type Rect } from './layout';
import { acceptedPour, COVEN_SEATS, INSTRUMENTS, jugActions, pourStream, SPIRIT_STATEMENTS, VESSELS, VESSEL_VIEW, type InstrumentScene, type PourCue } from './instruments';
import { InstrumentInstructions } from './RoomRules';
import { GardenPreview, LiliaTable, RioBed, RememberingRing } from './RoadTrials';
import { VisionConsole } from './VisionConsole';
import { BrassTap, CovenMat, DrainArt, IronRing, JugDrawing, LanternArt, PlanchetteArt } from './TrialPropArt';
import { isPaintedTrial } from './trialSurfaces';

type ActionProps = { run: RunState; busy: boolean; act: (command: Command) => Promise<void> };
type SharedScene = Exclude<InstrumentScene, 'studio'>;
type Props = ActionProps & { scene: SharedScene; expanded: boolean; obscured: boolean; active: boolean; geometryKey: string; frame: Rect; surfaceRef: RefObject<HTMLDivElement | null>; open: () => void; close: () => void; openIntercom: (trigger: HTMLButtonElement) => void; clock: ReactNode; reduced: boolean; blooming: boolean; lastCommand: Command | null; feedback: ReactNode; recovery: ReactNode; rendererRecovery: ReactNode };

function usePour(run: RunState, command: Command | null, reduced: boolean) {
  const previous = useRef(run), [cue, setCue] = useState<PourCue | null>(null);
  useEffect(() => {
    const next = reduced ? null : acceptedPour(previous.current, run, command); previous.current = run; setCue(next);
    if (!next) return;
    const end = () => setCue(null), timer = setTimeout(end, 450);
    document.addEventListener('visibilitychange', end);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', end); };
  }, [run, command, reduced]);
  return cue;
}

export function InstrumentStage({ run, busy, act, scene, expanded, obscured, active, geometryKey, frame, surfaceRef, open, close, openIntercom, clock, reduced, blooming, lastCommand, feedback, recovery, rendererRecovery }: Props) {
  const meta = INSTRUMENTS[scene], cue = usePour(run, lastCommand, reduced || !active);
  const workbench = isPaintedTrial(scene);
  const solved = scene === 'threshold' ? run.threshold.opened : run.puzzles[scene].solved;
  const next = scene === 'threshold' ? 'kitchen' : scene === 'kitchen' ? 'studio' : scene === 'cabin' ? 'tower' : scene === 'tower' ? 'greenhouse' : 'cottage';
  return <div ref={surfaceRef} className={`instrument-stage instrument-${scene}${workbench ? ' workbench-stage' : ''}`} style={rectStyle(frame)} data-testid="instrument-stage" data-instrument={scene} data-expanded={expanded} data-world-surface={expanded || undefined} role={expanded ? 'dialog' : undefined} aria-modal={expanded ? 'false' : undefined} aria-label={expanded ? meta.title : undefined} tabIndex={-1} hidden={obscured} onKeyDown={event => { if (expanded && event.key === 'Escape') { event.stopPropagation(); close(); } }}>
    <header className="instrument-heading" hidden={!expanded}>
      <div><span>{meta.inscription}</span><b>{meta.title}</b></div>
      {clock}
      {scene === 'vision' && <button className="vision-return" disabled={busy} onClick={() => void act({ type: 'LEAVE_VISION' })}>Return to the cottage television</button>}
      <button onClick={close} aria-label={meta.close}>×</button>
    </header>
    {scene === 'garden' && <div className="instrument-preview" hidden={expanded} aria-hidden="true"><GardenPreview run={run} /></div>}
    <button className="instrument-approach" hidden={expanded} onClick={open}>{meta.approach}<span aria-hidden> ↗</span></button>
    <div className="instrument-content" hidden={!expanded}>
      {scene === 'threshold' && <CovenCircle run={run} act={act} busy={busy} />}
      {scene === 'kitchen' && <MeasuringCounter run={run} act={act} busy={busy} cue={cue} />}
      {scene === 'cabin' && <SpiritTable run={run} act={act} busy={busy} />}
      {scene === 'tower' && <LiliaTable run={run} act={act} busy={busy}/>}
      {scene === 'greenhouse' && <RioBed run={run} act={act} busy={busy} active={active} geometryKey={geometryKey} blooming={blooming} />}
      {scene === 'garden' && <RememberingRing run={run} act={act} busy={busy}/>}
      {scene === 'vision' && <VisionConsole run={run} act={act} busy={busy} onIntercom={openIntercom} />}
    </div>
    {scene === 'kitchen' && <aside className="counter-oven" data-dismissed={run.puzzles.kitchen.timerDismissed} data-testid="oven-chime"><svg viewBox="0 0 60 56" aria-hidden="true"><path d="M5 6h50v44H5zM5 17h50M13 24h34v19H13z"/><circle cx="16" cy="11" r="2"/><circle cx="27" cy="11" r="2"/>{run.puzzles.kitchen.timerDismissed && <path className="oven-mitt" d="M34 13v-6q0-5 5-5h7q5 0 5 5v18H34l-7-9q-2-5 3-5z" />}</svg><p className="oven-caption">{run.puzzles.kitchen.solved ? 'Jen has put the mitt away.' : run.puzzles.kitchen.timerDismissed ? 'The oven mitt has hushed the chime.' : 'A little chime waits inside the oven.'}</p></aside>}
    <div className="instrument-end" hidden={!expanded}>
      {solved && scene !== 'garden' && scene !== 'vision' && <div className="instrument-exit"><RoadEmblem kind={scene === 'kitchen' ? 'cup' : scene === 'cabin' ? 'lamp' : scene === 'greenhouse' ? 'flower' : 'cards'} /><span>{scene === 'threshold' ? 'The coven is assembled. Sharon counts.' : 'Seal earned. Your work is safe.'}</span><button className="instrument-door" disabled={busy} onClick={() => void act({ type: 'ENTER_SCENE', scene: next })}>{scene === 'threshold' ? 'Enter Jen’s kitchen' : next === 'cottage' ? 'Return to the cottage' : `Continue to ${SCENE_INFO[next].character}’s ${next}`} <span aria-hidden>↗</span></button></div>}
      {!solved && ['kitchen','cabin','greenhouse','garden'].includes(scene) && <div className="instrument-tools"><button disabled={busy} onClick={() => void act({ type: 'UNDO' })}>↶ Undo last move</button><button disabled={busy} onClick={() => void act({ type: 'RESET_PUZZLE' })}>Reset this puzzle</button></div>}
      {expanded && <>{feedback}{recovery}{rendererRecovery}</>}
    </div>
  </div>;
}

function CovenCircle({ run, busy, act }: ActionProps) {
  const [selected, setSelected] = useState<typeof COVEN[number]['id'] | null>(null);
  const disabled = busy || run.threshold.opened, chosen = COVEN.find(token => token.id === selected);
  const occupiedSeat = selected ? run.threshold.placements.indexOf(selected) : -1;
  return <>
    <InstrumentInstructions scene="threshold" />
    <div className="coven-keepsakes" role="group" aria-label="Coven tokens">
      {COVEN.map(token => <button key={token.id} className={`coven-token token-${token.id}`} disabled={disabled}
        aria-label={`${token.name} · ${token.affinity} token`} aria-pressed={selected === token.id}
        onClick={() => setSelected(token.id)}>
        <span className="token-symbol" aria-hidden="true">{token.symbol}</span>
        <b>{token.name}</b><small>{token.affinity}</small>
        <i>{run.threshold.placements.includes(token.id) ? 'Seated' : 'Choose'}</i>
      </button>)}
    </div>
    <div className="coven-floor" role="group" aria-label="Five coven seats">
      <CovenMat />
      {COVEN.map((seat, index) => {
        const occupant = COVEN.find(token => token.id === run.threshold.placements[index]);
        return <button className="coven-seat" key={seat.id}
          style={{ left: `${COVEN_SEATS[index].x}%`, top: `${COVEN_SEATS[index].y}%` }}
          aria-label={`${seat.affinity} seat`} aria-describedby={`seat-${seat.id}-occupant`}
          data-occupied={Boolean(occupant)} disabled={disabled || !selected}
          onClick={() => { if (selected) void act({ type: 'PLACE_TOKEN', seat: index, token: selected }); }}>
          <span aria-hidden="true">{occupant?.symbol ?? seat.symbol}</span>
          <b>{seat.affinity}</b><small id={`seat-${seat.id}-occupant`}>{occupant?.name ?? 'Empty seat'}</small>
        </button>;
      })}
      <button className="trapdoor-control" disabled={disabled} onClick={() => void act({ type: 'MATCH_COVEN' })}>
        <svg viewBox="0 0 90 82" aria-hidden="true"><IronRing open={run.threshold.opened} /></svg>
        <span>Open the trapdoor</span>
      </button>
    </div>
    <div className="coven-selection" role="status">
      {run.threshold.opened ? 'Five specialties. One coven.' : chosen ? `${chosen.name} selected. Choose a seat.` : 'Select a coven token to lift it.'}
    </div>
    <div className="instrument-tools coven-tools">
      <button disabled={disabled || occupiedSeat < 0}
        onClick={() => void act({ type: 'PLACE_TOKEN', seat: occupiedSeat, token: null })}>Lift selected token from its seat</button>
      <button className="leaf-stamp" disabled={busy} onClick={() => void act({ type: 'INSPECT_PROP', prop: 'sharon' })}>
        <span aria-hidden="true">❧</span> Inspect leaf stamp
      </button>
    </div>
  </>;
}

function MeasuringCounter({ run, busy, act, cue }: ActionProps & { cue: PourCue | null }) {
  const [selected, setSelected] = useState<0 | 1>(1), puzzle = run.puzzles.kitchen;
  return <>
    <InstrumentInstructions scene="kitchen" />
    <div className="counter-working">
      <div className="counter-vessels">
        <div className="measuring-plane" role="group" aria-label="Measuring vessels">
          <svg className="vessel-art" viewBox={`${VESSEL_VIEW.x} 0 ${VESSEL_VIEW.width} ${VESSEL_VIEW.height}`} aria-hidden="true">
            <path className="marble-side" d="M96 202h438l-12 33H106Z" />
            <path className="marble-top" d="M126 169h381l29 37H93Z" />
            <path className="marble-veins" d="m141 180 43 4 41 17 56-4 65-14 65-4 65 16m-275 8 34 6 38-1m146-27 34 12 46 6" />
            <svg x="91" y="84" width="61" height="97" viewBox="0 0 95 117"><BrassTap /></svg>
            <svg x="90" y="156" width="70" height="52" viewBox="0 0 115 90"><DrainArt /></svg>
            {VESSELS.map((vessel, index) => <svg key={vessel.capacity} x={vessel.x} y={vessel.y} width={vessel.width}
              height={vessel.height} viewBox="0 0 140 190" preserveAspectRatio="none"
              className={cue?.move === (index ? 'pour-large' : 'pour-small') ? `pouring-vessel source-${index}` : ''}>
              <JugDrawing volume={puzzle.volumes[index]} capacity={vessel.capacity} />
            </svg>)}
            {cue && <path key={cue.revision} data-testid="pour-stream" data-amount={cue.amount} className="pour-stream" d={pourStream(cue.move)} />}
          </svg>
          {VESSELS.map((vessel, index) => <button key={vessel.capacity} className="vessel-select"
            style={{ left: `${(vessel.x - VESSEL_VIEW.x) / VESSEL_VIEW.width * 100}%`, top: `${vessel.y / VESSEL_VIEW.height * 100}%`,
              width: `${vessel.width / VESSEL_VIEW.width * 100}%`, height: `${vessel.height / VESSEL_VIEW.height * 100}%` }}
            aria-label={`Select the ${vessel.capacity}-cup jug`} aria-pressed={selected === index}
            disabled={busy} onClick={() => setSelected(index as 0 | 1)}>
            <span className="sr-only">{index ? 'Large jug' : 'Small jug'}</span>
          </button>)}
          <PumpkinWitness watched={puzzle.pours > 0} />
        </div>
        <div className="vessel-readings" aria-live="polite">
          {VESSELS.map((vessel, index) => <div key={vessel.capacity} data-selected={selected === index}>
            <strong data-testid={`jug-${vessel.capacity}`}>{puzzle.volumes[index]} / {vessel.capacity} cups</strong>
            <span>{index ? 'Large vessel' : 'Small vessel'}</span>
          </div>)}
        </div>
      </div>
      <fieldset className="counter-tools">
        <legend>{selected ? '5-cup' : '3-cup'} vessel selected</legend>
        {jugActions(puzzle.volumes, selected, puzzle.solved).map(({ move, disabled }) => {
          const fill = move.startsWith('fill'), empty = move.startsWith('empty');
          return <button key={move} aria-label={JUG_LABELS[move]} disabled={busy || disabled}
            onClick={() => void act({ type: 'JUG', move })}>
            {fill ? <svg viewBox="0 0 95 117" aria-hidden="true"><BrassTap /></svg> : empty ?
              <svg viewBox="0 0 115 90" aria-hidden="true"><DrainArt /></svg> :
              <svg viewBox="0 0 66 49" aria-hidden="true"><path d="M13 13q23 1 37 24m-3-12 5 13-14-2" fill="none" stroke="#8cc4c8" strokeWidth="5" strokeLinecap="round" /><path d="M14 5 7 16l14-1Z" fill="#e4c19a" /></svg>}
            <span><small>{fill ? 'Tap' : empty ? 'Drain' : 'Spout'}</small><b>{JUG_LABELS[move]}</b></span>
          </button>;
        })}
      </fieldset>
    </div>
  </>;
}

function PumpkinWitness({ watched }: { watched: boolean }) {
  return <div className="pumpkin-witness" aria-hidden="true"><svg viewBox="0 0 70 60">
    <path d="M34 9q-5-8 4-9l4 5-3 8" fill="#5e744c" />
    <ellipse cx="34" cy="33" rx="29" ry="23" fill="#bd702c" stroke="#55352c" strokeWidth="3" />
    <path d="M28 12q-14 20 0 42m12-42q14 20 0 42" fill="none" stroke="#8b4c2d" strokeWidth="2" />
    {watched && <><path d="M19 28h7v6h-7zm25 0h7v6h-7z" fill="#35222b" /><path d="M30 43h9" stroke="#35222b" strokeWidth="2" /></>}
  </svg></div>;
}

function SpiritTable({ run, busy, act }: ActionProps) {
  const puzzle = run.puzzles.cabin;
  return <>
    <InstrumentInstructions scene="cabin" />
    <div className="spirit-working-table">
      <div className="working-lamps" role="group" aria-label="Four spirit lamps">
        {puzzle.lamps.map((lit, index) => {
          const letter = 'ABCD'[index];
          return <button key={letter} className="working-lamp" data-lit={!!lit}
            aria-label={`Lamp ${letter}: ${lit ? 'lit' : 'unlit'}`} aria-pressed={!!lit} disabled={busy || puzzle.solved}
            onClick={() => void act({ type: 'TOGGLE_LAMP', index })}>
            <LanternArt lit={!!lit} letter={letter} /><span>{letter} · {lit ? 'Lit' : 'Unlit'}</span>
          </button>;
        })}
      </div>
      <ol className="spirit-slips" aria-label="Four spirit statements">
        {SPIRIT_STATEMENTS.map((statement, index) => <li key={statement} className="parchment">
          <small>SPIRIT {['I', 'II', 'III', 'IV'][index]}</small><span>{statement}</span>
        </li>)}
      </ol>
      <button className="planchette-control" disabled={busy || puzzle.solved} onClick={() => void act({ type: 'CHECK_LAMPS' })}>
        <svg viewBox="0 0 100 72" aria-hidden="true"><PlanchetteArt /></svg><span>Ask the spirits to check</span>
      </button>
    </div>
  </>;
}
