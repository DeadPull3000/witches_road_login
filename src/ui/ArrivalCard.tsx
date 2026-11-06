import { useState } from 'react';
import type { RunState } from '../game/state';
import type { Command } from '../game/commands';

type Props = { run: RunState; act: (command: Command) => Promise<void> };

/** The fictional credentials live on the player's arrival card. */
export function ArrivalCard({ run, act }: Props) {
  const [alias, setAlias] = useState(run.alias ?? '');
  const [spell, setSpell] = useState('');
  const [showSpell, setShowSpell] = useState(false);
  const action = (command: Command) => void act(command);

  return <section className="puzzle cottage-controls" aria-label="Cottage door controls">
    {!run.arrival.aliasStamped && <form onSubmit={event => { event.preventDefault(); action({ type: 'STAMP_ALIAS', alias }); }}>
      <span className="eyebrow">YOUR BORROWING CARD</span><h2>A name for the journey.</h2>
      <p>Use a fictional alias. This library is a little unusual.</p>
      <label htmlFor="alias">Borrowing alias</label>
      <div className="input-row"><input id="alias" value={alias} maxLength={24} autoComplete="off" placeholder="e.g. Violet Finch" onChange={event => setAlias(event.target.value)} required /><button className="primary" type="submit">Stamp my card <span aria-hidden>↗</span></button></div>
    </form>}
    {run.arrival.aliasStamped && !run.arrival.theftRecorded && <form onSubmit={event => { event.preventDefault(); setSpell(''); action({ type: 'SUBMIT_ATTEMPTED_SPELL' }); }}>
      <span className="eyebrow">CARD STAMPED · {run.alias}</span><h2>Try the door.</h2>
      <p>Invent a disposable spell. Its dots are about to become somebody else’s problem.</p>
      <label htmlFor="spell">Attempted spell — fictional only</label>
      <div className="input-row"><input id="spell" type={showSpell ? 'text' : 'password'} value={spell} maxLength={32} autoComplete="off" onChange={event => setSpell(event.target.value)} required /><button className="quiet" type="button" aria-pressed={showSpell} onClick={() => { if (!showSpell) action({ type: 'INSPECT_PROP', prop: 'visibilityEye' }); setShowSpell(!showSpell); }}>Show spell</button><button className="primary" type="submit">Try the door</button></div>
      {showSpell && <p className="aside">The little eye looks back. “Yes, I can see you, too.”</p>}
    </form>}
    {run.arrival.theftRecorded && <>
      <span className="eyebrow">YOUR PASSWORD HAS WANDERED OFF</span><h2>Account recovery, naturally.</h2>
      <p>Agatha has pocketed every dot. Five seals along the Road will set things right.</p>
      <div className="button-row"><button className="primary" onClick={() => action({ type: 'START_RECOVERY' })}>Begin account recovery <span aria-hidden>↗</span></button><button onClick={() => action({ type: 'ENTER_SCENE', scene: 'garden' })}>Remember me garden · optional</button></div>
    </>}
  </section>;
}
