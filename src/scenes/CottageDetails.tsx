import type { ReactNode } from 'react';
import { ROOM_PROPS, type RoomPropId } from '../content/cottage';
import { RoadEmblem, ROAD_EMBLEMS } from '../ui/RoadEmblem';
import type { Projection, WorldLayout } from '../world/layout';

const deskObjects: Record<RoomPropId, ReactNode> = {
  roomCup: <><rect x="-7" y="-7" width="14" height="13" rx="3" fill="#86b6bb"/><path d="M7-4h3a2 2 0 0 1 0 6H7" fill="none" stroke="#bdcdd0"/></>,
  roomRecord: <><ellipse rx="12" ry="5" fill="#27202c" stroke="#ae989b"/><circle r="2" fill="#c9936f"/></>,
  roomLamp: <><path d="M-8 5H8v3H-8ZM-2-1H2v6H-2Z" fill="#8b715f"/><rect x="-6" y="-13" width="12" height="12" rx="3" fill="#c5a5ce"/></>,
  roomCards: <g fill="#c3b290" stroke="#6d4865" strokeWidth=".6">{[0, 4, 8].map(x => <path key={x} transform={`translate(${x})`} d="M-9-7H1L5 4H-5Z"/>)}</g>,
  roomKey: <g fill="none" stroke="#e2bd7d" strokeWidth="1.7"><circle cx="-5" cy="-2" r="4"/><path d="M-1-1 10 2v3"/></g>,
  roomFlower: <><rect x="-4" y="-4" width="8" height="12" rx="2" fill="#a2bdac"/><path d="M0-2v-12" stroke="#91ab67"/><path d="M0-19a3 3 0 0 1 3 3 3 3 0 0 1 0 5 3 3 0 0 1-6 0 3 3 0 0 1 0-5 3 3 0 0 1 3-3" fill="#b74d68"/></>,
};
const stitchPoints = [[160, 294], [207, 280], [253, 298], [300, 282], [348, 299]];
const transform = ({ x, y, scale }: Projection) => `translate(${x} ${y}) scale(${scale})`;

/** The familiar objects and rug belong to the still illustration, including during canvas recovery. */
export function CottageDetails({ layout }: { layout: WorldLayout }) {
  const desk = layout.cottageDetails?.desk ?? layout.plane, rug = layout.cottageDetails?.rug ?? layout.plane;
  return <svg className="cottage-details" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
    <g transform={transform(desk)}>{ROOM_PROPS.map(({ id, x, y }) => <g key={id} transform={`translate(${x} ${y})`}>{deskObjects[id]}</g>)}</g>
    <g transform={transform(rug)} color="#dbc0a0">
      <polyline points={stitchPoints.map(point => point.join(',')).join(' ')} fill="none" stroke="currentColor" strokeWidth="1" opacity=".8"/>
      {ROAD_EMBLEMS.map((kind, index) => <RoadEmblem key={kind} kind={kind} x={stitchPoints[index][0] - 8} y={stitchPoints[index][1] - 8} width="16" height="16" strokeWidth="3"/>)}
    </g>
  </svg>;
}
