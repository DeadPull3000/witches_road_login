import { useState } from 'react';
import type { Command } from '../game/commands';
import type { RunState } from '../game/state';
import { MEMORIES } from '../content/memories';
import { NODE_LABELS } from '../puzzles/rules';
import { TarotSymbol, TarotTable } from '../ui/TarotTable';
import { VineMap } from '../ui/VineMap';
import { CAP_POSITIONS, capNeighbours, confirmationChoices, TAROT_MEMORIES } from './trialLayout';
import { InstrumentInstructions } from './RoomRules';
import { ObjectPlaque } from './ObjectPlaque';

type Props={run:RunState;busy:boolean;act:(command:Command)=>Promise<void>};
function ChairDrawing({ moon }: { moon: boolean }) {
  return <svg className="table-chair-drawing" viewBox="0 0 80 60" aria-hidden="true">
    <path d="M19 32V15L40 3l21 12v17l6 9v8H13v-8ZM21 49v8m38-8v8" fill="#75492f" stroke="#362230" strokeWidth="4" />
    <path d="M23 30V16L40 7l17 9v14ZM18 40h44l-5 6H23Z" fill="#50324f" stroke="#c59761" strokeWidth="2" />
    {moon ? <path d="M44 13a10 10 0 1 0 6 13A11 11 0 0 1 44 13Z" fill="#e8cf97" /> :
      <path d="m40 12 2 6 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#e8cf97" />}
    <path d="M22 36h36m-32 9h29" stroke="#d6a873" strokeWidth="1.5" />
  </svg>;
}

export function LiliaTable({run,busy,act}:Props){
  const p=run.puzzles.tower,opposite=p.stage==='confirming';
  const memories = <ol className="table-memories" aria-label="Four card memories">
    {TAROT_MEMORIES.map((text, index) => <li key={text} className="parchment"><small>APPOINTMENT {['I', 'II', 'III', 'IV'][index]}</small>{text}</li>)}
  </ol>;
  return <>
    <InstrumentInstructions scene="tower" opposite={opposite} />
    {!opposite && memories}
    <div className="lilia-table-assembly" data-seat={opposite?'opposite':'first'}>
      <div className="table-chair-place far-place">
        <ChairDrawing moon={!opposite} /><b>{opposite ? 'First chair · arrangement set' : 'Opposite chair'}</b>
      </div>
      <TarotTable tower={p} />
      <div className="table-chair-place near-place">
        <ChairDrawing moon={opposite} /><b>{opposite ? 'Your opposite chair' : 'Your first chair'}</b>
      </div>
    </div>
    {opposite && <fieldset className="confirmation-rack">
      <legend>Your cards · choose the sequence from this seat</legend>
      {confirmationChoices(p).map(({ card, disabled }) => <button key={card} aria-label={card} disabled={busy || disabled}
        onClick={() => void act({ type: 'PICK_CONFIRM', card })}><TarotSymbol card={card} /><b>{card}</b></button>)}
    </fieldset>}
    <div className="table-edge-tools">
      {opposite ? <>
        <button disabled={busy || p.solved} onClick={() => void act({ type: 'CLEAR_CONFIRM' })}>Clear confirmation</button>
        {!p.solved && <button disabled>↶ Undo last move</button>}
        <ObjectPlaque className="table-confirm" marker="✧" label="Confirm password" disabled={busy || p.solved || p.confirmation.length !== 5}
          onClick={() => void act({ type: 'CONFIRM_DECK' })} />
      </> : <>
        <button disabled={busy} onClick={() => void act({ type: 'MOVE_DECK', move: 'cut' })}><span aria-hidden>↷</span>CUT</button>
        <button disabled={busy} onClick={() => void act({ type: 'MOVE_DECK', move: 'quarrel' })}><span aria-hidden>⇄</span>QUARREL</button>
        <button disabled={busy} onClick={() => void act({ type: 'UNDO' })}>↶ Undo last move</button>
        <ObjectPlaque className="table-confirm" marker="▱" label="Set the arrangement" disabled={busy} onClick={() => void act({ type: 'SUBMIT_DECK' })} />
      </>}
      {!p.solved && <button disabled={busy} onClick={() => void act({ type: 'RESET_PUZZLE' })}>Reset this puzzle</button>}
    </div>
    {opposite && <details className="table-recall"><summary>Read the four appointment slips</summary>{memories}</details>}
    <button className="table-envelope" disabled={busy} onClick={()=>void act({type:'INSPECT_PROP',prop:'envelope'})}><span aria-hidden>✉</span>Inspect the appointment envelope</button>
    <details className="memory-album"><summary>Lilia’s scattered moments · {p.memories.length} / 4</summary><p>Her moments arrive out of order. You can return to each one.</p><div className="memory-fragments">{MEMORIES.map(memory=><article key={memory.id}><button disabled={busy} aria-expanded={p.memories.includes(memory.id)} onClick={()=>void act({type:'REVEAL_MEMORY',memory:memory.id})}><small>{memory.time}</small><b>{memory.title}</b><span aria-hidden>{p.memories.includes(memory.id)?'✦':'✧'}</span></button>{p.memories.includes(memory.id)&&<p>{memory.text}</p>}</article>)}</div></details>
  </>;
}

export function RioBed({run,busy,act,active,geometryKey,blooming}:{active:boolean;geometryKey:string;blooming:boolean}&Props){
  const p=run.puzzles.greenhouse;
  return <>
    <InstrumentInstructions scene="greenhouse" />
    <div className="greenhouse-bed">
      <VineMap route={p.route} revision={run.revision} disabled={p.solved||busy} active={active} geometryKey={geometryKey} act={act}>
        {p.solved && <div className="bed-flower" data-blooming={blooming} aria-hidden="true"><Flower /></div>}
      </VineMap>
    </div>
    <p className="route-text" data-testid="vine-route">{p.route.map(node=>`${node} ${NODE_LABELS[node]}`).join(' → ')}</p>
    {p.solved&&<div className="rio-bloom" aria-label="Rio’s red flower"><p>Every vine signed. Something to take home.</p></div>}
    <details className="vine-clauses"><summary>Read the seven fictional clauses</summary><ol>{['Remember where you began.','Let each breath be borrowed.','Return a seed to the soil.','Carry only what you can share.','Make room for new growth.','Leave the earth gentler.','Return books in good time.'].map(clause=><li key={clause}>{clause}</li>)}</ol></details>
  </>;
}

export function RememberingRing({run,busy,act}:Props){
  const p=run.puzzles.garden,[preview,setPreview]=useState('');
  const describe=(index:number)=>{const n=capNeighbours(index).map(value=>value+1);setPreview(`Cap ${index+1} changes caps ${n[0]}, ${n[1]} and ${n[2]}.`);};
  return <>
    <InstrumentInstructions scene="garden" />
    <div className="remembering-ring" role="group" aria-label="Eight remembering caps"><svg className="cap-circle" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="50" cy="50" rx="37" ry="35"/><path d="M50 8v8m0 68v8M7 50h8m70 0h8"/></svg><div className="ring-centre" aria-hidden><span>✧</span><small>REMEMBER<br/>THE WAY HOME</small></div>{p.lights.map((lit,index)=><button className="remembering-cap" style={{left:`${CAP_POSITIONS[index].x}%`,top:`${CAP_POSITIONS[index].y}%`}} data-lit={lit} key={index} aria-pressed={lit} aria-label={`Cap ${index+1}: ${lit?'lit':'unlit'}`} disabled={busy||p.solved} onFocus={()=>describe(index)} onPointerEnter={()=>describe(index)} onClick={()=>void act({type:'TOGGLE_MUSHROOM',index})}><Mushroom lit={lit}/><b>{index+1}</b><small>{lit?'LIT':'UNLIT'}</small></button>)}</div>
    <p className="cap-preview" role="status">{preview||'Each numbered cap changes itself and its two neighbors; cap 1 also changes 8.'}</p>
    {p.solved&&<p className="garden-remembered">✧ The garden remembers. Recognition starts after your first sign-in.</p>}
    <div className="garden-sign-tools">
      {run.rememberEnabled && <ObjectPlaque marker="⌁" label="Forget me" disabled={busy} onClick={() => void act({ type: 'FORGET_ME' })} />}
      {p.solved && !run.rememberEnabled && <ObjectPlaque marker="✿" label="Remember this journey again" disabled={busy} onClick={() => void act({ type: 'REMEMBER_ME' })} />}
      <ObjectPlaque className="garden-return" marker="↗" label="Return to cottage" disabled={busy} onClick={() => void act({ type: 'ENTER_SCENE', scene: 'cottage' })} />
    </div>
  </>;
}

export function GardenPreview({ run }: { run: RunState }) {
  return <svg viewBox="0 0 600 240" className="road-trial-still" aria-hidden="true">
    <ellipse className="preview-cap-bed" cx="300" cy="125" rx="275" ry="100" />
    {run.puzzles.garden.lights.map((lit, index) => {
      const angle = index * Math.PI / 4 - Math.PI / 2;
      return <svg key={index} x={300 + Math.cos(angle) * 228 - 31} y={115 + Math.sin(angle) * 76 - 30} width="62" height="68">
        <Mushroom lit={lit} />
      </svg>;
    })}
  </svg>;
}
export function Flower(){return<svg viewBox="0 0 70 95" className="ritual-flower" width="100%" height="100%" aria-hidden="true"><path d="M35 88V35m0 37Q9 68 17 53q15 0 18 15m0-9q25-6 18-20-15 0-18 17" fill="#496f42" stroke="#8dab67" strokeWidth="2"/><g className="flower-petals">{Array.from({length:5},(_,index)=>{const a=index*Math.PI*2/5-Math.PI/2;return<ellipse key={index} cx={35+Math.cos(a)*14} cy={25+Math.sin(a)*14} rx="11" ry="10" fill="#b64160" stroke="#e18486" strokeWidth="1.5"/>})}<circle cx="35" cy="25" r="6" fill="#e0b56c"/></g></svg>}
export function Mushroom({lit}:{lit:boolean}){return<svg viewBox="0 0 80 80" width="100%" height="100%" aria-hidden="true"><ellipse className="cap-ground-glow" cx="40" cy="62" rx="34" ry="15" opacity={lit?1:0}/><path className="cap-stem" d="M31 40h18l5 28H26z"/><path className="cap-top" d="M7 41q3-30 33-32 30 2 33 32v9H7z" data-lit={lit}/><path className="cap-gills" d="M9 49h62"/><path className="cap-specks" d="M24 28h8v8h-8zm24-7h7v7h-7zm7 18h8v6h-8z"/></svg>}
