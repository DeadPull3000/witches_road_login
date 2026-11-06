import { RoadEmblem, ROAD_EMBLEMS } from './RoadEmblem';
export function CottageRug({ recognized }: { recognized: boolean }) {
  const points = [[50, 104], [145, 62], [240, 104], [335, 62], [430, 104]];
  return <figure className="rug-detail"><figcaption><p>{recognized ? 'Five familiar turns. The thread has been here all along.' : 'Five old motifs, worked into the same wandering thread.'}</p></figcaption>
    <svg viewBox="0 0 480 172" role="img" aria-label="The same embroidered cup, record, lamp, cards and flower on a winding thread"><rect x="5" y="6" width="470" height="160" rx="12" className="rug-field"/><rect x="14" y="15" width="452" height="142" rx="8" className="rug-border"/><polyline points={points.map(point=>point.join(',')).join(' ')} className="rug-road" />{ROAD_EMBLEMS.map((kind,index)=><g key={kind}><circle cx={points[index][0]} cy={points[index][1]} r="27"/><RoadEmblem kind={kind} x={points[index][0]-20} y={points[index][1]-20} width="40" height="40" /></g>)}</svg></figure>;
}
