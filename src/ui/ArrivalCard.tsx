import { useState } from 'react';
import type { RunState } from '../game/state';
import type { Command } from '../game/commands';
import { PropButton } from '../world/PropControl';

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
      <div className="input-row"><input id="alias" value={alias} maxLength={24} autoComplete="off" placeholder="e.g. Violet Finch" onChange={event => setAlias(event.target.value)} required /><PropButton type="submit" label="Stamp my card" art="stamp" /></div>
    </form>}
    {run.arrival.aliasStamped && !run.arrival.theftRecorded && <form onSubmit={event => { event.preventDefault(); setSpell(''); action({ type: 'SUBMIT_ATTEMPTED_SPELL' }); }}>
      <span className="eyebrow">CARD STAMPED · {run.alias}</span><h2>Try the door.</h2>
      <p>Invent a disposable spell. Its dots are about to become somebody else’s problem.</p>
      <label htmlFor="spell">Attempted spell — fictional only</label>
      <div className="input-row"><input id="spell" type={showSpell ? 'text' : 'password'} value={spell} maxLength={32} autoComplete="off" onChange={event => setSpell(event.target.value)} required /><button className="quiet" type="button" aria-pressed={showSpell} onClick={() => { if (!showSpell) action({ type: 'INSPECT_PROP', prop: 'visibilityEye' }); setShowSpell(!showSpell); }}>Show spell</button><PropButton type="submit" label="Try the door" art="knocker" /></div>
      {showSpell && <p className="aside">The little eye looks back. “Yes, I can see you, too.”</p>}
    </form>}
  </section>;
}
