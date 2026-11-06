import type { RunState } from '../game/state';
import type { Card } from '../puzzles/rules';

/** Interface illustrations stay as vector paths so small cards remain legible. */
export function TarotSymbol({ card }: { card: Card }) {
  return <svg viewBox="0 0 64 80" className="tarot-symbol" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
    <path d="M8 10h5m-2-3v6M51 64h6m-3-3v6" opacity=".5" />
    {card === 'Cup' && <><path d="M18 23h28v9c0 12-7 17-14 17s-14-5-14-17z" fill="#bd995232" /><path d="M18 27H9v6c0 8 5 10 11 10m26-16h9v6c0 8-5 10-11 10M32 49v15m-10 3h20M25 61h14" /><path d="M24 16l2-5m6 5v-6m6 6l-2-5" /></>}
    {card === 'Moon' && <><path d="M42 16a24 24 0 1 0 10 39A25 25 0 0 1 42 16z" fill="#c5b6e750" /><path d="M47 12l2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1zM16 64l2-3 2 3-2 3z" /></>}
    {card === 'Tower' && <><path d="M17 66h32M22 63V31h-4V17h8v7h6v-7h7v7h6v-7h7v14h-5v32" fill="#c3b8cf30" /><path d="M30 63V48a5 5 0 0 1 10 0v15M27 34v5m14-5v5M12 11l9 3-6 6 10-2" /><path d="M15 70h36" /></>}
    {card === 'Key' && <><circle cx="25" cy="25" r="12" fill="#c6a86230" /><circle cx="25" cy="25" r="5" /><path d="M33 34l23 23-6 6-6-6 4-4-5-5-4 4-6-6 4-4-7-7M12 56l3-4 3 4-3 4z" /></>}
    {card === 'Door' && <><path d="M14 67V33a18 18 0 0 1 36 0v34z" fill="#c4b58325" /><path d="M20 67V34a12 12 0 0 1 24 0v33M32 22v44M25 35v26m14-26v26" /><circle cx="36" cy="47" r="1" /><path d="M9 70h46M29 10h6m-3-3v6" /></>}
  </svg>;
}

export function TarotTable({ tower }: { tower: RunState['puzzles']['tower'] }) {
  const opposite = tower.stage === 'confirming';
  return <div className="tarot-table" data-testid="tarot-table" data-seat={opposite ? 'opposite' : 'first'}>
    <p className="seat-label">{opposite ? 'OPPOSITE SEAT · table nick at your right' : 'YOUR FIRST SEAT · table nick at your left'}</p>
    <div className="table-felt">
      <div className="table-nick" aria-label={`Permanent table nick · ${opposite ? 'right' : 'left'} edge`}><span aria-hidden>╱</span></div>
      {!opposite ? <div className="tarot-row" aria-label="Current card order">{tower.deck.map((card, index) => <div className="tarot" key={card} style={{ left: `${index * 20}%` }}><small>{index + 1}</small><TarotSymbol card={card} /><b>{card}</b></div>)}</div> :
        <div className="tarot-row confirmation-slots" aria-label="Confirmation sequence">{Array.from({ length: 5 }, (_, index) => {
          const card = tower.confirmation[index];
          return <div key={index} className={`tarot ${card ? '' : 'card-back'}`} style={{ left: `${index * 20}%` }}><small>{index + 1}</small>{card ? <><TarotSymbol card={card} /><b>{card}</b></> : <><span className="card-rosette" aria-hidden>✧</span><b className="sr-only">Unchosen card {index + 1}</b></>}</div>;
        })}</div>}
    </div>
  </div>;
}
