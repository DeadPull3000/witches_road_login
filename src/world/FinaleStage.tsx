import { useRef, type ReactNode, type RefObject } from 'react';
import type { Command } from '../game/commands';
import { canSignIn, type RunState } from '../game/state';
import type { Flourish } from '../scenes/cues';
import { CottageRug } from '../ui/CottageRug';
import { LoanReceipt } from '../ui/LoanReceipt';
import { RoadEmblem, ROAD_EMBLEMS } from '../ui/RoadEmblem';
import { RuneStitch } from '../ui/RuneStitch';
import { rectStyle, type Rect } from './layout';
import { cottageKnockerLabel } from './navigation';
import { MechanicalFlower } from './VisionConsole';

export const FINALE_SURFACES = {
  rug: { title: 'The embroidered rug', inscription: 'FIVE MOTIFS · ONE THREAD', close: 'Step back from the rug', return: 'Return to the rug' },
  door: { title: 'The cottage door', inscription: 'FIVE SEALS · THE SAME OLD COTTAGE', close: 'Step back from the door', return: 'Return to the door' },
  desk: { title: 'The borrowing desk', inscription: 'WESTVIEW PUBLIC LIBRARY · AFTER HOURS', close: 'Step back from the borrowing desk', return: 'Return to the borrowing desk' },
} as const;
export type FinaleKind = keyof typeof FINALE_SURFACES;

type WorkProps = {
  run: RunState;
  busy: boolean;
  act: (command: Command) => Promise<void>;
};
type Props = WorkProps & {
  kind: FinaleKind;
  frame: Rect;
  surfaceRef: RefObject<HTMLDivElement | null>;
  active: boolean;
  geometryKey: string;
  flourish: Flourish | null;
  clock: ReactNode;
  close: () => void;
  openDateStamp: (trigger: HTMLButtonElement) => void;
  children: ReactNode;
};

export function FinaleStage({ kind, frame, surfaceRef, run, busy, act, active, geometryKey, flourish, clock, close, openDateStamp, children }: Props) {
  const meta = FINALE_SURFACES[kind];
  return <div
    ref={surfaceRef}
    className={`instrument-stage finale-stage finale-${kind}`}
    style={kind === 'rug' ? { ...rectStyle(frame), height: 'auto', maxHeight: frame.height } : rectStyle(frame)}
    data-world-surface
    data-testid="finale-stage"
    data-kind={kind}
    role="dialog"
    aria-modal="false"
    aria-label={meta.title}
    tabIndex={-1}
    onKeyDown={event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    }}
  >
    <header className="instrument-heading">
      <div><span>{meta.inscription}</span><b>{meta.title}</b></div>
      {clock}
      <div className="finale-heading-tools">
        {kind === 'desk' && <button className="desk-exit" aria-label="Sign out to cottage" disabled={busy} onClick={() => void act({ type: 'SIGN_OUT' })}>
          <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 29V5h15v24M9 29V8l8-3v24M19 16h11m-4-4 4 4-4 4" /></svg>
          <span>Sign out</span>
        </button>}
        <button aria-label={meta.close} onClick={close}>×</button>
      </div>
    </header>
    {kind === 'rug' && <CottageRug recognized={run.puzzles.greenhouse.solved} />}
    {kind === 'door' && <CottageDoor run={run} busy={busy} act={act} active={active} geometryKey={geometryKey} />}
    {kind === 'desk' && <BorrowingDesk run={run} busy={busy} act={act} flourish={flourish} openDateStamp={openDateStamp} />}
    <div className="instrument-end">{children}</div>
  </div>;
}

function CottageDoor({ run, busy, act, active, geometryKey }: WorkProps & { active: boolean; geometryKey: string }) {
  const stitched = run.milestones.unbindingCompleted;
  const recognized = run.rememberEnabled && run.milestones.hasSignedInOnce;
  return <>
    <div className="instrument-intro parchment">
      <h2>The way was here all along.</h2>
      <p>The cup, the record, the lamps, the cards and the flower. Familiar things, seen differently.</p>
    </div>
    <div className="cottage-door-planks" data-ready={canSignIn(run)} aria-busy={busy}>
      <div className="door-nameplate" data-testid="borrower-nameplate" data-recognized={recognized}>
        <span>WESTVIEW BORROWING CARD</span>
        <b>{run.alias}</b>
        {recognized && <small>✧ Borrower recognized</small>}
      </div>
      <ol className="door-seals" aria-label="Five earned seals">
        {ROAD_EMBLEMS.map(kind => <li key={kind}><RoadEmblem kind={kind} /><span>{kind}</span></li>)}
      </ol>
      <div className="door-hardware">
        <div className="door-thread">
          <RuneStitch completed={stitched} busy={busy} active={active} revision={run.revision} geometryKey={geometryKey} act={act} />
          {!stitched && <button className="door-unbind" onClick={() => void act({ type: 'UNBIND' })}>Unbind the door stitch</button>}
        </div>
        <button className="door-knocker" onClick={() => void act({ type: 'SIGN_IN' })}>
          <svg viewBox="0 0 80 100" aria-hidden="true">
            <path className="knocker-plate" d="M40 5 61 18v58L40 94 19 76V18Z" />
            <circle className="knocker-pin" cx="40" cy="27" r="9" />
            <circle className="knocker-pin" cx="40" cy="77" r="4" />
            <ellipse className="knocker-ring" cx="40" cy="50" rx="21" ry="22" />
          </svg>
          <span>{cottageKnockerLabel(run)}</span>
        </button>
      </div>
    </div>
    <button className="door-garden" onClick={() => void act({ type: 'ENTER_SCENE', scene: 'garden' })}>Visit the optional garden</button>
  </>;
}

function BorrowingDesk({ run, busy, act, flourish, openDateStamp }: WorkProps & { flourish: Flourish | null; openDateStamp: (trigger: HTMLButtonElement) => void }) {
  const renewed = run.milestones.bookRenewed;
  const receipt = useRef<HTMLElement>(null);

  function readReceipt() {
    receipt.current?.focus({ preventScroll: true });
    receipt.current?.scrollIntoView({ block: 'start', inline: 'nearest' });
  }

  return <>
    <div className="instrument-intro parchment">
      <h2>Your shelf, at last.</h2>
      <p>One book. Five trials. A perfectly reasonable library policy.</p>
    </div>
    <div className="borrowing-counter" data-renewed={renewed}>
      <div className="desk-tray">
        <dl className="desk-ledger" aria-label="Borrowing ledger">
          <div><dt>Borrower</dt><dd>{run.alias}</dd></div>
          <div><dt>On loan</dt><dd>One book</dd></div>
          <div><dt>Loan status</dt><dd>{renewed ? 'Renewed' : 'Ready to renew'}</dd></div>
        </dl>
        {run.puzzles.vision.solved && <figure className="desk-mechanical-flower" aria-label="Vision’s mechanical flower">
          <MechanicalFlower /><figcaption>Vision’s mechanical flower</figcaption>
        </figure>}
        <article className="desk-book">
          <div className="book-cover" aria-hidden="true">
            <span>WESTVIEW LIBRARY</span>
            <b>Library<br />Reference</b>
            <small>REFERENCE · 004</small>
          </div>
          <div>
            <h3>A Short Introduction to Passwordless Authentication</h3>
            <p>{renewed ? 'Renewed · another 28 fictional days' : 'Due for renewal · no actual fees'}</p>
          </div>
        </article>
        <button className="desk-stamp" disabled={busy && !renewed} onClick={() => renewed ? readReceipt() : void act({ type: 'RENEW_BOOK' })}>
          <svg viewBox="0 0 66 60" aria-hidden="true">
            <path d="M22 17a11 11 0 1 1 22 0c0 5-4 9-4 17h10v8H16v-8h10c0-8-4-12-4-17Z" />
            <path d="M10 43h46v11H10zM17 49h32" />
          </svg>
          <span>{renewed ? 'Read the renewal receipt' : 'Renew this book'}</span>
        </button>
      </div>
      <div className="desk-outlet">
        <button className="desk-return-slot" disabled={busy} onClick={() => void act({ type: 'INSPECT_PROP', prop: 'returnSlot' })}>Inspect the return slot</button>
        <div className="desk-optional-tools">
          <button disabled={busy} onClick={event => openDateStamp(event.currentTarget)}>Inspect the return-date stamp</button>
          <button disabled={busy} onClick={() => void act({ type: 'EXPIRE_SESSION' })}>Expire session</button>
        </div>
        {!renewed && <div className="desk-empty-tray" aria-hidden="true">RECEIPT TRAY</div>}
        {renewed && <section ref={receipt} className="desk-receipt" aria-label="Renewal receipt" tabIndex={-1}>
          <div className="desk-paper-roll" data-unrolling={flourish === 'receipt'} aria-hidden="true" />
          <LoanReceipt run={run} />
        </section>}
      </div>
    </div>
  </>;
}
