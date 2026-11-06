import { useState, type ReactNode, type RefObject } from 'react';
import { artUrl } from 'virtual:road-art';
import { ENCOUNTERS, TV_DIALS, type EncounterId, type TvChannel } from '../content/encounters';
import { VISION_INTERCOM } from '../content/vision';
import type { Command } from '../game/commands';
import type { RunState } from '../game/state';
import type { Flourish } from '../scenes/cues';
import { rectStyle, WORLD_ASSETS, type Rect } from './layout';

type ActionProps = { run: RunState; busy: boolean; act: (command: Command) => Promise<void>; flourish: Flourish | null };
type Props = ActionProps & {
  kind: EncounterId; frame: Rect; surfaceRef: RefObject<HTMLDivElement | null>; close: () => void;
  skip: () => void; clock: ReactNode; children: ReactNode;
};

export function EncounterStage({ kind, frame, surfaceRef, close, skip, clock, children, ...actions }: Props) {
  const meta = ENCOUNTERS[kind];
  return <div ref={surfaceRef} className={`instrument-stage encounter-stage encounter-${kind}`} style={{ ...rectStyle(frame), height: 'auto', maxHeight: frame.height }}
    role="dialog" aria-modal="false" aria-label={meta.title} tabIndex={-1} data-world-surface data-encounter={kind}
    onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
    <header className="instrument-heading">
      <div><span>WESTVIEW · ROOM OBJECTS</span><b>{meta.title}</b></div>
      {clock}
      <button onClick={close} aria-label={`Close ${meta.title.toLowerCase()}`}>×</button>
    </header>
    {kind === 'television' ? <Television {...actions} skip={skip} /> : <EncounterDetail kind={kind} {...actions} />}
    <div className="instrument-end">{children}</div>
  </div>;
}

function Television({ run, busy, act, flourish, skip }: ActionProps & { skip: () => void }) {
  const { tvChannel, tvLargeCaptions } = run.encounters;
  const [replay, setReplay] = useState(0);
  const channels = Object.entries(TV_DIALS) as [Exclude<TvChannel, 'off'>, string][];
  const dialDisabled = busy || tvChannel === 'off';
  const tune = (channel: TvChannel) => {
    if (channel === 'sponsor' && tvChannel === 'sponsor') setReplay(value => value + 1);
    void act({ type: 'TUNE_TELEVISION', channel });
  };
  return <div className="cottage-tv" data-channel={tvChannel} data-large-captions={tvLargeCaptions}>
    <div className="tv-cabinet">
      <div className="tv-glass" aria-label="Television picture">
        {tvChannel === 'off' && <div className="tv-off" aria-label="Television off"><i /></div>}
        {tvChannel === 'local' && <div className="tv-local">
          <span aria-hidden="true">✧</span><p className="tv-caption">Westview local<br />A lovely evening to return a library book.</p>
        </div>}
        {tvChannel === 'sponsor' && <div className="tv-sponsor" key={replay}>
          <svg viewBox="0 0 132 76" role="img" aria-label="A chrome toaster with a red pilot light">
            <path className="tv-toast" d="M35 35V20q-9-6-3-15 9-9 26 0l6 4v26M70 35V21q-8-7-1-15 12-7 24 1l6 5v23" />
            <rect className="tv-toaster-body" x="16" y="32" width="96" height="34" rx="10" />
            <path d="M28 69h12m51 0h12m10-24h11v6" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle className="tv-pilot" cx="88" cy="53" r="5" />
          </svg>
          <p className="tv-caption"><strong>Two-factor toast</strong><br />“Something you know. Something you butter.”</p>
        </div>}
        {tvChannel === 'diagnostic' && <div className="tv-diagnostic">
          <span aria-hidden="true">▰ ▰ ▰ ▰</span>
          <p className="tv-caption">{run.puzzles.vision.solved ? 'Reader verified. Diagnostics ready.' : 'Four readers online. The repair bench is open.'}</p>
        </div>}
        {flourish === 'standBy' && tvChannel !== 'off' && <div className="tv-standby" aria-hidden="true">
          <svg viewBox="0 0 100 90"><path d="M50 7 88 28v34L50 83 12 62V28Z" /><path d="M50 20 74 34v22L50 70 26 56V34ZM50 0v90M0 45h100" /></svg>
          <b>PLEASE STAND BY</b>
        </div>}
      </div>
      <div className="tv-hardware">
        <fieldset><legend>Channel selector</legend>
          {channels.map(([channel, label]) => {
            const unavailable = busy || channel === 'diagnostic' && !run.puzzles.studio.solved;
            return <button key={channel} aria-pressed={tvChannel === channel}
              aria-disabled={unavailable || undefined} onClick={() => { if (!unavailable) tune(channel); }}>{label}</button>;
          })}
        </fieldset>
        <div className="tv-dials">
          <button className="tv-size-dial" aria-pressed={tvLargeCaptions} aria-disabled={dialDisabled || undefined}
            onClick={() => { if (!dialDisabled) void act({ type: 'TURN_TV_DIAL' }); }}>Turn the TV volume dial</button>
          <button aria-disabled={dialDisabled || undefined} onClick={() => { if (!dialDisabled) tune('off'); }}>Turn off the television</button>
        </div>
      </div>
    </div>
    {flourish === 'standBy' && tvChannel !== 'off' && <button className="tv-skip" onClick={skip}>Skip test card</button>}
    {tvChannel === 'diagnostic' && <button className="tv-annex-door" disabled={busy} onClick={() => void act({ type: 'OPEN_VISION' })}>Enter Vision’s annex <span aria-hidden="true">↗</span></button>}
    {tvChannel === 'off' && run.discoveries.includes('library.finalStamp') && <figure className="tv-final-slip" data-pressing={flourish === 'finalStamp'}>
      <span>WESTVIEW PUBLIC LIBRARY</span><b>RETURN BROADCAST COMPLETE</b><figcaption>One last stamp. Your renewal is on file.</figcaption>
    </figure>}
  </div>;
}

function EncounterDetail({ kind, run, flourish }: ActionProps & { kind: Exclude<EncounterId, 'television'> }) {
  switch (kind) {
    case 'caseDrawer': return <div className="case-file">
      <span className="case-index">AGNES OF WESTVIEW · CASE 004</span>
      <svg viewBox="0 0 380 100" className="case-thread" aria-hidden="true"><path d="M18 60 104 15 170 72 248 20 356 63" /><circle cx="104" cy="15" r="5" /><circle cx="248" cy="20" r="5" /></svg>
      <div className="case-card"><span>FILED BORROWING CARD</span><b>{run.discoveries.includes('agnes.caseDrawer') ? run.alias : 'Opening the drawer…'}</b></div>
    </div>;
    case 'sigilCard': return <div className="covered-sigil">
      <span aria-hidden="true">✧</span><p>WESTVIEW BORROWING CARD</p>
      <b>{run.discoveries.includes('teen.sigil') ? run.alias : 'The name is covered.'}</b>
    </div>;
    case 'portrait': {
      const recast = run.discoveries.includes('wanda.recast');
      return <figure className="encounter-portrait" data-recast={recast}>
        {recast ? <svg viewBox="0 0 180 160" role="img" aria-label="A new clerk in the portrait">
          <path d="M0 0h180v160H0Z" fill="#5e6264" /><path d="M17 160q11-44 52-47h42q41 3 52 47" fill="#3b323e" />
          <path d="M47 77V47q2-31 44-33 38 2 44 38v37l-16 21H64Z" fill="#392f2e" />
          <path d="M63 67q7-19 26-20 23 0 30 24v19q-6 24-28 27-22-5-28-27Z" fill="#e5c7a4" />
          <path d="M61 78h25v14H61Zm34 0h25v14H95ZM86 83h9" fill="none" stroke="#382f31" strokeWidth="4" />
          <path d="M83 99h16" stroke="#705151" strokeWidth="2" /><path d="M69 113l22 25 23-25" fill="#e0d0bc" />
        </svg> : <img src={artUrl(WORLD_ASSETS.agatha)} alt="Agatha in the original portrait" />}
        <figcaption>{recast ? '“The light is different today.” — Agatha' : 'The clerk’s portrait watches the room.'}</figcaption>
      </figure>;
    }
    case 'rabbitPortrait': return <figure className="encounter-portrait rabbit-portrait"><RabbitDrawing glasses={run.discoveries.includes('rabbit.clerkGlasses')} /><figcaption>Señor Scratchy · clerk for the evening</figcaption></figure>;
    case 'gardenStone': return run.discoveries.includes('rabbit.first') && <figure className="rabbit-encounter"><RabbitDrawing /><figcaption>Moonlit stone, one short pair of tracks.</figcaption></figure>;
    case 'studioSpeaker': return run.discoveries.includes('rabbit.third') && <figure className="rabbit-encounter speaker-rabbit"><RabbitDrawing /><figcaption>One paw stamp on the borrowing card.</figcaption></figure>;
    case 'kitchenCupboard': return run.discoveries.includes('rabbit.second') && <figure className="paw-imprint">
      <svg viewBox="0 0 84 80" role="img" aria-label="A muddy rabbit paw print"><ellipse cx="42" cy="56" rx="21" ry="16" /><circle cx="21" cy="35" r="8" /><circle cx="34" cy="22" r="8" /><circle cx="50" cy="23" r="8" /><circle cx="64" cy="35" r="8" /></svg>
      <figcaption>Mud by the cupboard latch</figcaption>
    </figure>;
    case 'cabinWindow': return <figure className="visitors-window" data-passing={flourish === 'visitors'}>
      <div className="window-glass" aria-label="Seven silhouettes behind the glass" role="img">
        {run.discoveries.includes('salem.windowVisitors') && Array.from({ length: 7 }, (_, index) => <svg key={index} viewBox="0 0 32 68" aria-hidden="true" data-visitor>
          <path d="M2 63l5-24 5-11-2-9 6-12 7 11-3 9 7 12 3 24Z" /><path d="m10 20 6 3 7-4" stroke="currentColor" />
        </svg>)}
      </div><figcaption>Seven silhouettes pass behind the séance window.</figcaption>
    </figure>;
    case 'visionIntercom': return <section className="annex-intercom" aria-label="Intercom transcript">
      <div className="intercom-grille" aria-hidden="true">◉</div>
      {run.discoveries.includes('vision.aiArgument') && <dl>{VISION_INTERCOM.map(({ name, line }) => <div key={name}><dt>{name}</dt><dd>{line}</dd></div>)}</dl>}
    </section>;
    case 'returnDate': return <figure className="old-date-stamp">
      <span>RETURN DATE</span><b>{run.discoveries.includes('road.borrowingDate') ? '1693' : '…'}</b><figcaption>Overdue · see librarian</figcaption>
    </figure>;
  }
}

function RabbitDrawing({ glasses = false }: { glasses?: boolean }) {
  return <svg className="rabbit-drawing" viewBox="0 0 156 155" role="img" aria-label={glasses ? 'Señor Scratchy in round spectacles' : 'Señor Scratchy'}>
    <ellipse cx="77" cy="135" rx="48" ry="8" fill="#19161b68" />
    <path d="M39 83Q21 59 26 24q5-16 15-4l18 44m28 0 13-44q7-14 14 0 10 30-8 59" fill="#bb8966" stroke="#4c3540" strokeWidth="5" />
    <path d="M38 31 51 63m57-35L96 62" stroke="#dfac9d" strokeWidth="7" strokeLinecap="round" />
    <ellipse cx="79" cy="108" rx="39" ry="27" fill="#b58466" stroke="#4c3540" strokeWidth="4" />
    <circle cx="115" cy="110" r="12" fill="#edcfae" stroke="#735049" strokeWidth="3" />
    <path d="M38 78q8-24 39-23 29-1 40 24v20q-12 22-40 22-28 0-39-22Z" fill="#dfb58b" stroke="#5a4245" strokeWidth="4" />
    <path d="M64 85q14-8 26 0l10 19q-14 13-23 10-11 1-22-11Z" fill="#f4dbc1" />
    <circle cx="58" cy="84" r="4" fill="#342638" /><circle cx="94" cy="84" r="4" fill="#342638" />
    <path d="M70 94h14l-7 7Z" fill="#704856" /><path d="M77 101v6m-10-1h20m-35-8-17-5m17 11-17 3m67-9 16-5m-16 11 16 3" fill="none" stroke="#805d56" strokeWidth="2" />
    {glasses && <path d="M40 80q5 17 18 17 14 0 17-15 5-6 9 0 3 15 17 15 13 0 17-17-15-6-30-2H70q-15-4-30 2Z" fill="none" stroke="#28232b" strokeWidth="4" />}
  </svg>;
}
