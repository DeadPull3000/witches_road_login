import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { NODES, NODE_LABELS, vineChoices, type Node } from '../puzzles/rules';
import { VINE_POSITIONS, nodesAlongSegment, type Point } from '../content/vines';
import { capturePointer, releasePointer, svgPoint, svgTransformKey, watchPointerGeometry } from './pointer';
import type { Command } from '../game/commands';
import { VineBedArt } from './VineBedArt';

type Stroke={route:Node[];revision:number;pointerId:number;point:Point;prefixLength:number;owner:Element;matrix:string};
type Props={route:Node[];revision:number;disabled:boolean;act:(command:Command)=>Promise<void>;active?:boolean;geometryKey?:string;children?:ReactNode};

export function VineMap({route,revision,disabled,act,active=true,geometryKey='',children}:Props){
  const svg=useRef<SVGSVGElement>(null),plane=useRef<HTMLDivElement>(null),stroke=useRef<Stroke|null>(null),suppressClick=useRef(false);
  const latest=useRef({revision,disabled,active});latest.current={revision,disabled,active};
  const [draft,setDraft]=useState<Node[]|null>(null),[notice,setNotice]=useState('');
  const stop=(message:string,announce=true)=>{const prior=stroke.current;stroke.current=null;if(prior)releasePointer(prior.owner,prior.pointerId);if(announce){setDraft(null);if(prior)setNotice(message);}};
  useLayoutEffect(()=>{stop('View or saved state changed. Your saved route is unchanged.');},[revision,disabled,active,geometryKey]);
  useEffect(()=>{
    const cancel=()=>stop('Stroke cancelled. Your saved route is unchanged.');
    const unwatch=plane.current?watchPointerGeometry(plane.current,cancel):undefined;
    return()=>{unwatch?.();stop('',false);};
  },[]);
  const begin=(event:PointerEvent<HTMLDivElement>)=>{
    if(event.isPrimary&&event.button===0)suppressClick.current=false;
    if(disabled||!active||!event.isPrimary||event.button!==0||!svg.current||stroke.current)return;
    let point=svgPoint(svg.current,event.clientX,event.clientY);if(!point)return;
    const current=route.at(-1)!,target=event.target instanceof Element?event.target.closest('[data-stone]'):null;
    if(target&&target.getAttribute('data-stone')!==current)return;
    if(target?.getAttribute('data-stone')===current)point=VINE_POSITIONS[current];
    else if(!nodesAlongSegment(point,point).includes(current)){setNotice('Begin at the current stone. The named stones also work as buttons.');return;}
    event.preventDefault();suppressClick.current=false;capturePointer(event.currentTarget,event.pointerId);
    stroke.current={route:[...route],revision,pointerId:event.pointerId,point,prefixLength:route.length,owner:event.currentTarget,matrix:svgTransformKey(svg.current)};setDraft([...route]);setNotice('Drawing · release to save this stroke.');
  };
  const extend=(event:PointerEvent<HTMLDivElement>,released=false)=>{
    const current=stroke.current;if(!current||current.pointerId!==event.pointerId||!svg.current)return;
    if((!event.buttons&&!released)||latest.current.revision!==current.revision||latest.current.disabled||!latest.current.active||svgTransformKey(svg.current)!==current.matrix){suppressClick.current=true;stop('Stroke cancelled. Your saved route is unchanged.');return;}
    const point=svgPoint(svg.current,event.clientX,event.clientY);if(!point)return;
    for(const node of nodesAlongSegment(current.point,point))if(node!==current.route.at(-1)&&vineChoices(current.route).includes(node))current.route.push(node);
    current.point=point;setDraft([...current.route]);
  };
  const finish=(event:PointerEvent<HTMLDivElement>,cancel=false)=>{
    const current=stroke.current;if(!current||current.pointerId!==event.pointerId)return;
    if(cancel){suppressClick.current=true;stop('Stroke cancelled. Your saved route is unchanged.');return;}
    extend(event,true);if(stroke.current!==current)return;stroke.current=null;setDraft(null);releasePointer(current.owner,event.pointerId);
    const nodes=current.route.slice(current.prefixLength);suppressClick.current=nodes.length>0;
    if(nodes.length){setNotice('Stroke submitted.');void act({type:'TRACE_VINE_PATH',nodes,revision:current.revision});}else setNotice('No vine added. Your saved route is unchanged.');
  };
  const choices=vineChoices(route),current=route.at(-1)!;
  return <div className="vine-map-panel"><div ref={plane} className={`vine-working-plane ${disabled?'locked':''}`} onPointerDown={begin} onPointerMove={extend} onPointerUp={event=>finish(event)} onPointerCancel={event=>finish(event,true)} onLostPointerCapture={event=>finish(event,true)}>
    <svg ref={svg} className={`vine-map ${disabled?'locked':''}`} data-testid="vine-map" viewBox="0 0 440 300" role="img" aria-label="Five named stones joined by seven vines; the bridged crossing is not a stone">
      <VineBedArt route={route} draft={draft ?? route} />
    </svg>
    {NODES.map(node=><button className="vine-stone-target" key={node} data-stone={node} aria-label={node===current?`Start a stroke at ${node} · ${NODE_LABELS[node]}`:`Follow to ${node} · ${NODE_LABELS[node]}`} aria-current={node===current?'step':undefined} style={{left:`${VINE_POSITIONS[node][0]/440*100}%`,top:`${VINE_POSITIONS[node][1]/300*100}%`}} disabled={disabled||!active||(node!==current&&!choices.includes(node))} onClick={event=>{if(suppressClick.current&&event.detail>0){suppressClick.current=false;return;}if(node!==current)void act({type:'TRACE_VINE',node});}}><b>{node}</b><small>{NODE_LABELS[node]}</small></button>)}
    {children}
  </div><p className="drawing-notice" role="status">{notice||(disabled?'The vine signature is preserved.':'Draw from the current stone, then release to save. You can also activate a named stone.')}</p></div>;
}
