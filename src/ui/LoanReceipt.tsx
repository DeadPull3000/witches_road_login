import type { RunState } from '../game/state';
import { Fragment } from 'react';
import { RoadEmblem, ROAD_EMBLEMS } from './RoadEmblem';
export function LoanReceipt({ run }: { run: RunState }) {
  return <div className="receipt road-receipt" role="status" data-testid="loan-receipt"><b>WESTVIEW PUBLIC LIBRARY</b><span>Borrower: {run.alias}</span><span>Renewal accepted · 28 days</span><span>Five seals. Zero late fees.</span>
    <div className="receipt-road" aria-label="The five trial stops on your receipt">{ROAD_EMBLEMS.map((kind,index)=><Fragment key={kind}><span data-stop={kind}>{kind.toUpperCase()}<RoadEmblem kind={kind} /></span>{index < 4 && <i aria-hidden>↓</i>}</Fragment>)}</div>
    <span className="receipt-stamp">RENEWED · 28 DAYS</span><small>Keep this receipt. It has already travelled quite far.</small></div>;
}
