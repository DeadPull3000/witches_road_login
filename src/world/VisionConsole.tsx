import type { Command } from '../game/commands';
import type { RunState } from '../game/state';
import { VISION_INSTRUCTIONS, VISION_INVENTORY, VISION_POLICY, VISION_RECEIPT, VISION_STATIONS, VISION_TRANSFERS, replayVisionTransfers, type VisionInventory } from '../content/vision';
import { ObjectNote, ObjectPlaque } from './ObjectPlaque';

function ReaderInventory({ inventory, caption }: { inventory: VisionInventory; caption: string }) {
  return <table className="reader-inventory">
    <caption>{caption}</caption>
    <thead><tr><th scope="col">Station</th><th scope="col">Casing</th><th scope="col">Module</th></tr></thead>
    <tbody>{VISION_STATIONS.map(station => <tr key={station}>
      <th scope="row">{station}</th><td>{inventory[station].casing}</td><td>{inventory[station].module}</td>
    </tr>)}</tbody>
  </table>;
}

export function VisionRecords() {
  return <div className="vision-records">
    <section className="vision-receipt" aria-label="Original borrowing receipt">
      <span className="vision-slip-heading">WESTVIEW PUBLIC LIBRARY</span>
      <h3>Original borrowing receipt</h3>
      <dl><div><dt>Casing stamp</dt><dd>{VISION_RECEIPT.casing}</dd></div><div><dt>Memory stamp</dt><dd>{VISION_RECEIPT.module}</dd></div></dl>
      <p><strong>Reader identity policy</strong><br />{VISION_POLICY}</p>
    </section>
    <section className="vision-maintenance" aria-label="Dated maintenance slips">
      <span className="vision-slip-heading">SERVICE LOG · READER REPAIRS</span>
      <ReaderInventory inventory={VISION_INVENTORY} caption="01 · Installation inventory · Oct 11" />
      <ol start={2} className="vision-slips">{VISION_TRANSFERS.map(({ part, from, to }, index) => <li key={`${part}-${from}-${to}`}>
        <span>OCT {String(12 + index).padStart(2, '0')}</span>
        Exchange the {part === 'module' ? 'memory modules' : 'casings'} at {from} and {to}.
      </li>)}</ol>
    </section>
  </div>;
}

export function VisionConsole({ run, busy, act, onIntercom }: {
  run: RunState; busy: boolean; act: (command: Command) => Promise<void>; onIntercom: (trigger: HTMLButtonElement) => void;
}) {
  const { selection, solved } = run.puzzles.vision;
  const selectDisabled = busy || solved;
  const submitDisabled = selectDisabled || selection === null;
  return <>
    <ObjectNote label="Read the repair instructions">
      <h2>Which reader keeps the card?</h2>
      <p>{VISION_INSTRUCTIONS}</p>
    </ObjectNote>
    <div className="reader-claims" aria-label="Reader statements">
      <p className="parchment"><b>First voice</b> “I remember your alias, {run.alias}. You have one library book.”</p>
      <p className="parchment"><b>Second voice</b> “{run.alias}. One borrowed book. I have the very same record.”</p>
    </div>
    <VisionRecords />
    <div className="vision-bench">
      <fieldset className="reader-controls">
        <legend>Four reader stations</legend>
        {VISION_STATIONS.map(station => <button key={station} className="reader-terminal" aria-pressed={selection === station}
          aria-disabled={selectDisabled || undefined} onClick={() => { if (!selectDisabled) void act({ type: 'SELECT_IDENTITY', station }); }}>
          <span className="reader-screen" aria-hidden="true"><span>{station[0]}</span></span>
          <b>{station} reader</b>
        </button>)}
      </fieldset>
      <div className="vision-console-tools">
        <ObjectPlaque label={solved ? 'Receipt filed' : 'File the borrowing receipt'} marker="▱"
          aria-disabled={submitDisabled || undefined} onClick={() => { if (!submitDisabled) void act({ type: 'SUBMIT_IDENTITY' }); }} />
        <button onClick={event => onIntercom(event.currentTarget)}>Inspect the annex intercom</button>
      </div>
    </div>
    {solved && <section className="vision-verified" aria-label="Verified original reader">
      <MechanicalFlower />
      <div><h3>Original reader verified</h3><p>“At least one of us is a robot.” — Vision</p><p>A pale mechanical flower has been sent to the library desk.</p></div>
      <details><summary>Read the completed transfer table</summary><ReaderInventory inventory={replayVisionTransfers()} caption="Verified reader inventory" /></details>
    </section>}
  </>;
}

export function MechanicalFlower() {
  return <svg className="mechanical-flower" viewBox="0 0 72 96" aria-hidden="true">
    <path d="M35 37v47m0-20L17 51m18 18 19-17M23 84h24l6 9H17Z" fill="none" stroke="#b8c3c7" strokeWidth="3" />
    <path d="M36 4l8 10 13-2-2 13 10 8-12 5-3 12-14-5-13 5-4-12-12-5 11-8-3-13 13 2Z" fill="#dce4e7" stroke="#728488" strokeWidth="2" />
    <circle cx="36" cy="30" r="9" fill="#729caa" stroke="#f4fdff" strokeWidth="2" />
    <path d="M35 65q-17-1-18-14 13 2 18 14m0 3q18-1 19-16-14 3-19 16" fill="#9caeaa" stroke="#71888c" strokeWidth="1.5" />
  </svg>;
}
