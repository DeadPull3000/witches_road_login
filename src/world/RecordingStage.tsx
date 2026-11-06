import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { ALICE_REACTIONS, type AliceReaction } from '../content/studio';
import type { Command } from '../game/commands';
import type { RunState } from '../game/state';
import { STUDIO_CLUES } from '../puzzles/rules';
import { RoadEmblem } from '../ui/RoadEmblem';
import { INSTRUMENTS } from './instruments';
import { rectStyle, type Rect, type WorldLayout } from './layout';
import { InstrumentInstructions } from './RoomRules';
import type { StudioDock, StudioPlacement } from './studioLayout';
import './recordingStudio.css';

type Props = {
  run: RunState;
  act: (command: Command) => Promise<void>;
  busy: boolean;
  expanded: boolean;
  obscured: boolean;
  active: boolean;
  reduced: boolean;
  geometryKey: string;
  placement: StudioPlacement;
  layout: WorldLayout;
  character: string | null;
  onCharacterError: () => void;
  surfaceRef: RefObject<HTMLDivElement | null>;
  open: () => void;
  close: () => void;
  lastCommand: Command | null;
  clock: ReactNode;
  children: ReactNode;
};
type StudioState = RunState['puzzles']['studio'];
type Cue = { kind: AliceReaction; revision: number };
const meta = INSTRUMENTS.studio;
const relativeTo = (rect: Rect, frame: Rect): Rect => ({ ...rect, x: rect.x - frame.x, y: rect.y - frame.y });

export function RecordingStage({
  run, act, busy, expanded, obscured, active, reduced, geometryKey, placement, layout, character,
  onCharacterError, surfaceRef, open, close, lastCommand, clock, children,
}: Props) {
  const studio = run.puzzles.studio;
  const [code, setCode] = useState(studio.attempt);
  const [cue, setCue] = useState<Cue | null>(null);
  const previous = useRef(run);
  const working = expanded && !obscured;
  const { dock, frame, tag, speaker, benchWidth, headingHeight, speakerHeight } = placement;

  useEffect(() => { if (!lastCommand) setCode(studio.attempt); }, [studio.attempt, lastCommand]);
  useEffect(() => { setCue(working ? { kind: 'listening', revision: -1 } : null); }, [working]);
  useEffect(() => {
    const before = previous.current;
    previous.current = run;
    if (!active || before.runId !== run.runId || before.revision >= run.revision || lastCommand?.type !== 'DIAL_CODE') return;
    setCue({ kind: studio.solved ? 'accepted' : 'missed', revision: run.revision });
  }, [active, run, lastCommand, studio.solved]);
  useEffect(() => {
    if (!cue || !working) return;
    const timeout = setTimeout(() => setCue(null), 7000);
    return () => clearTimeout(timeout);
  }, [cue, working]);

  const shownCue = working ? cue : null;
  const talk = () => setCue(current => current ? null : { kind: 'speaking', revision: run.revision });
  const speakerPanel = <StudioSpeech cue={shownCue} talk={talk} dock={dock} style={dock === 'sheet' ? undefined : rectStyle(speaker)} />;
  const style = {
    ...rectStyle(frame), '--studio-bench-width': `${benchWidth}px`, '--studio-heading-height': `${headingHeight}px`,
    '--studio-speaker-height': `${speakerHeight}px`,
  } as CSSProperties;

  return <div ref={surfaceRef} className="instrument-stage studio-stage" style={style}
    data-testid="instrument-stage" data-instrument="studio" data-expanded={expanded} data-dock={dock}
    data-world-surface={working || undefined} role={working ? 'dialog' : undefined}
    aria-modal={working ? 'false' : undefined} aria-label={working ? meta.title : undefined}
    aria-hidden={obscured || undefined} tabIndex={-1}
    onKeyDown={event => { if (working && event.key === 'Escape') { event.stopPropagation(); close(); } }}>
    <div className="studio-overview" hidden={working} aria-hidden="true">
      <RoomGear studio={studio} rect={relativeTo(layout.backgroundRect, frame)} />
    </div>
    <button className="instrument-approach studio-approach" style={rectStyle(relativeTo(tag, frame))}
      hidden={working || obscured} onClick={open}>{meta.approach}<span aria-hidden="true"> ↗</span></button>
    <div className="studio-host-layer" aria-hidden="true">
      {character && <StudioActor character={character} onError={onCharacterError}
        rect={relativeTo(working ? placement.actor : layout.actor, frame)} dock={working ? dock : 'room'}
        geometryKey={geometryKey} reduced={reduced} cue={shownCue} />}
    </div>
    <section className="studio-bench" hidden={!working}>
      <header className="instrument-heading studio-heading">
        <div className="studio-title-bar">
          <div><span>{meta.inscription}</span><b>{meta.title}</b></div>
          {clock}
          <button onClick={close} aria-label={meta.close}>×</button>
        </div>
        {dock === 'sheet' && speakerPanel}
      </header>
      <div className="studio-scroll">
        <InstrumentInstructions scene="studio" />
        <div className="recording-console">
          <div className="studio-deck" aria-hidden="true">
            <DeckArt reversed={studio.reversed} />
            <span className="record-sleeve">LORNA WU <small>PROTECTION DEMO</small></span>
          </div>
          <div className="mixing-board">
            <div className="mixer-plate"><b>THREE-TRACK MIXER</b><span aria-hidden="true">● ● ●</span></div>
            <div className="mixer-channels" role="group" aria-label="Recording channels">
              {STUDIO_CLUES.map((clue, index) => <button className="mixer-channel" data-enabled={studio.channels[index]}
                aria-pressed={studio.channels[index]} key={clue.divisor} disabled={busy}
                onClick={() => void act({ type: 'SET_CHANNEL', index, enabled: !studio.channels[index] })}>
                <span>CHANNEL {index + 1}</span>
                <Meter enabled={studio.channels[index]} />
                <i className="fader-track" aria-hidden="true"><i /></i>
                <small className="studio-lyric parchment">Divide by <strong>{clue.divisor}</strong><br />remainder <strong>{clue.remainder}</strong></small>
                <em>{studio.channels[index] ? 'OPEN' : 'CLOSED'}</em>
              </button>)}
            </div>
          </div>
          <form className="studio-telephone" onSubmit={event => { event.preventDefault(); void act({ type: 'DIAL_CODE', code }); }}>
            <TelephoneArt />
            <div className="telephone-number">
              <label htmlFor="code">Two-digit recording number</label>
              <div className="telephone-dial">
                <input id="code" inputMode="numeric" pattern="[0-9]{2}" maxLength={2} value={code} disabled={busy || studio.solved}
                  onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 2))} required autoComplete="off" />
                <button disabled={busy || studio.solved} aria-label="Dial the number">Dial</button>
              </div>
            </div>
          </form>
          <div className="studio-gear-strip">
            <button disabled={busy} onClick={() => void act({ type: 'REVERSE_RECORD' })}>
              <i aria-hidden="true">↶</i>{studio.reversed ? 'Play the record forwards' : 'Play the record backwards'}
            </button>
            <button aria-pressed={studio.speakersOpen} disabled={busy} onClick={() => void act({ type: 'TOGGLE_SPEAKERS' })}>
              <i aria-hidden="true">◖</i>{studio.speakersOpen ? 'Close the speaker doors' : 'Open the speaker doors'}
            </button>
            <p className="playback-state">Record: {studio.reversed ? 'backwards' : 'forwards'} · speaker doors: {studio.speakersOpen ? 'open' : 'closed'}.</p>
          </div>
        </div>
        {studio.solved && <div className="instrument-exit">
          <RoadEmblem kind="record" /><span>Seal earned. Your work is safe.</span>
          <button className="instrument-door" disabled={busy} onClick={() => void act({ type: 'ENTER_SCENE', scene: 'cabin' })}>
            Continue to Agatha’s cabin <span aria-hidden="true">↗</span>
          </button>
        </div>}
        {working && <div className="studio-feedback">{children}</div>}
      </div>
    </section>
    {working && dock !== 'sheet' && speakerPanel}
  </div>;
}

function StudioSpeech({ cue, talk, dock, style }: { cue: Cue | null; talk: () => void; dock: StudioDock; style?: CSSProperties }) {
  return <aside className="studio-speaker" data-position={dock} style={style} aria-label="Alice">
    {cue && <div key={`${cue.kind}:${cue.revision}`} className="studio-bubble parchment" data-testid="alice-comment" data-reaction={cue.kind}>
      <b>Alice</b><p>{ALICE_REACTIONS[cue.kind]}</p>
    </div>}
    <button className="studio-speak" aria-label={cue ? 'Dismiss Alice’s comment' : 'Speak with Alice'} onClick={talk}>
      {cue ? '×' : 'Talk'}
    </button>
  </aside>;
}

function StudioActor({ character, onError, rect, dock, geometryKey, reduced, cue }: {
  character: string; onError: () => void; rect: Rect; dock: StudioDock | 'room'; geometryKey: string; reduced: boolean; cue: Cue | null;
}) {
  const lastGeometry = useRef(geometryKey);
  const snap = reduced || lastGeometry.current !== geometryKey;
  useLayoutEffect(() => { lastGeometry.current = geometryKey; }, [geometryKey]);
  return <div className="studio-actor" data-testid="studio-actor" data-position={dock} data-reaction={cue?.kind}
    style={{ transform: `translate3d(${rect.x}px,${rect.y}px,0) scale(${rect.width / 200})`, transition: snap ? 'none' : undefined }}>
    <div className="studio-actor-shadow" />
    <div className="studio-actor-crop"><img src={character} alt="" onError={onError} /></div>
  </div>;
}

function Disc({ reversed }: { reversed: boolean }) {
  return <>
    <circle r="50" fill="#161117" stroke="#a17b64" strokeWidth="1.4" />
    <g className="studio-disc" data-reversed={reversed}>
      <path d="M-40-17a44 44 0 0 1 51-24l-7 8a35 35 0 0 0-35 22Zm79 33a43 43 0 0 1-50 26l6-8a35 35 0 0 0 36-22Z"
        fill="#6c5455" opacity=".64" />
      {[45, 39, 32, 24].map(radius => <circle key={radius} r={radius} fill="none" stroke="#a48a7a" opacity=".28" />)}
      <circle r="15" fill="#b98c5f" stroke="#ead2a7" />
      <path d="M-8-5h16m-12 9h8" stroke="#5e3b36" strokeWidth="1.4" />
      <circle r="2.6" fill="#332228" />
    </g>
  </>;
}

function DeckArt({ reversed }: { reversed: boolean }) {
  return <svg viewBox="0 0 180 146" aria-hidden="true">
    <path d="M10 16h159v113l-8 9H15l-5-7Z" fill="#21171b" stroke="#170f15" strokeWidth="3" />
    <path d="M10 13h158v112H10Z" fill="#3a2529" stroke="#b08059" strokeWidth="2" />
    <path d="M18 21h143v97H18Z" fill="#241b25" stroke="#865e4c" />
    <g transform="translate(72 70) scale(.88)"><Disc reversed={reversed} /></g>
    <path d="M142 32l-8 51-16 12-10-5" fill="none" stroke="#17131a" strokeWidth="8" />
    <path d="M142 28l-8 51-16 12-10-5" fill="none" stroke="#dfbd8d" strokeWidth="4" />
    <circle cx="142" cy="28" r="8" fill="#aa794e" stroke="#e2bc88" />
    <path d="M126 108h26" stroke="#997455" strokeWidth="2" />
    <rect x="146" y="106" width="7" height="4" fill="#e0a95f" />
  </svg>;
}

function RoomGear({ studio, rect }: { studio: StudioState; rect: Rect }) {
  return <svg className="studio-room-gear" viewBox="0 0 1672 941" style={rectStyle(rect)} aria-hidden="true">
    <g transform="translate(249 592) scale(1.63 .37)" opacity=".83"><Disc reversed={studio.reversed} /></g>
    {studio.channels.map((on, index) => <g key={index} className="studio-room-meter" data-enabled={on}
      transform={`translate(${183 + index * 42} ${401 - index * 1.65})`}>
      <path d="M-10 4 5-4" stroke="#624234" strokeWidth="1.4" />
      <ellipse rx="13" ry="8" fill="#ffc478" />
    </g>)}
  </svg>;
}

function Meter({ enabled }: { enabled: boolean }) {
  return <svg className="studio-vu" data-enabled={enabled} viewBox="0 0 84 27" aria-hidden="true">
    <rect x="1" y="1" width="82" height="25" rx="3" />
    <path className="studio-vu-glass" d="M5 4h74v15H5Z" />
    <path className="studio-vu-ticks" d="M12 12q30-14 60 0M21 9v4m10-7v4m11-5v4m11-3v4m10-1v4" />
    <path className="studio-vu-needle" d="M42 25 19 11" />
  </svg>;
}

function TelephoneArt() {
  return <svg className="studio-phone-art" viewBox="0 0 178 114" aria-hidden="true">
    <path d="M26 97q0 9 14 9h101l13-8-9-5H30Z" fill="#180f17" opacity=".8" />
    <path d="M48 47h80l23 46-8 9H33l-9-8Z" fill="#946748" stroke="#211820" strokeWidth="3" />
    <path d="M51 49h73l20 42H33Z" fill="#d8ba89" stroke="#f1d5a5" strokeWidth="2" />
    <path d="M52 52h70l5 12H46Z" fill="#b88c62" />
    <circle cx="88" cy="75" r="22" fill="#604037" stroke="#f2d5a3" strokeWidth="3" />
    <circle cx="88" cy="75" r="15" fill="#ead1a2" stroke="#3f2b2d" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map(index => {
      const angle = index * Math.PI / 4;
      return <circle key={index} cx={88 + Math.cos(angle) * 11} cy={75 + Math.sin(angle) * 11} r="2.5" fill="#5c423e" />;
    })}
    <path d="M24 27q63-28 129 0l-3 21-24 5-7-12q-30-10-62 0l-7 12-23-5Z"
      fill="#755040" stroke="#2c2027" strokeWidth="3" />
    <path d="M25 25q63-28 127 0l-5 16-20 5-8-12q-30-9-63 0l-7 12-20-5Z"
      fill="#dfc393" stroke="#f6dbad" strokeWidth="2" />
    <path d="M26 41q-24 1-19 34t20 20" fill="none" stroke="#ccaa79" strokeDasharray="2 3" strokeWidth="5" />
  </svg>;
}
