import { useId } from 'react';
import { EDGES, NODES, edgeId, type Node } from '../puzzles/rules';
import { VINE_BRIDGE, VINE_POSITIONS, vinePath } from '../content/vines';

const edgesInPaintOrder = [...EDGES.filter(edge => edge !== 'CD'), 'CD'] as const;
const plantingShape = 'M19 12 120 6 218 10 324 7 418 13 433 36 431 137 435 225 419 280 360 290 244 286 145 291 49 288 11 269 6 191 10 108 7 45Z';
const pebbles = [
  [33, 46], [118, 35], [170, 61], [257, 30], [290, 47], [335, 34], [413, 61],
  [36, 96], [138, 131], [237, 142], [303, 106], [400, 117], [93, 182], [211, 186],
  [128, 216], [274, 208], [315, 251], [81, 275], [159, 261], [225, 265], [387, 270],
] as const;

function routeEdges(route: readonly Node[]) {
  return new Set(route.slice(1).map((node, index) => edgeId(route[index], node)));
}

/** The raised crossing and every stone use the same path and anchors as the stroke surface. */
export function VineBedArt({ route, draft = route, room = false }: { route: readonly Node[]; draft?: readonly Node[]; room?: boolean }) {
  const id = useId();
  const saved = routeEdges(route), drawn = routeEdges(draft), current = draft.at(-1);
  return <>
    <defs>
      <linearGradient id={`${id}-soil`} x2="1" y2="1">
        <stop stopColor="#544938" /><stop offset=".43" stopColor="#383d30" /><stop offset="1" stopColor="#2d2e27" />
      </linearGradient>
      <linearGradient id={`${id}-stone`} x2=".82" y2="1">
        <stop stopColor="#a4a787" /><stop offset=".44" stopColor="#707c67" /><stop offset="1" stopColor="#4b5a50" />
      </linearGradient>
      <linearGradient id={`${id}-current`} x2=".82" y2="1">
        <stop stopColor="#e3d5a6" /><stop offset=".55" stopColor="#bdbe91" /><stop offset="1" stopColor="#8c9b79" />
      </linearGradient>
      <pattern id={`${id}-crumbs`} patternUnits="userSpaceOnUse" width="31" height="19">
        <path d="M5 3h3v2H5zm16 9h5v2h-5zM1 15h2v2H1z" fill="#b49b68" opacity=".18" />
        <path d="M12 12h4v3h-4zm13-8h2v3h-2z" fill="#1d2522" opacity=".53" />
      </pattern>
    </defs>
    <path d={plantingShape} fill="#1c251e" opacity=".8" transform="translate(1 7)" />
    <path className="vine-bed" d={plantingShape} style={{ fill: `url(#${id}-soil)` }} />
    <path d={plantingShape} fill={`url(#${id}-crumbs)`} stroke="#737956" strokeWidth="3" />
    <path d="m12 86 5-39 16-27 85-6 45 3m53 1 85-3 95 4 20 16m8 113-4 74-13 42-58 12m-119 4-89 2-77-7-37-17" fill="none" stroke="#b1a772" strokeWidth="3" opacity=".53" />
    <path d="M18 67 27 34l19-12m-9 246 25 9 48 3m233-261 60 7 12 22m-8 214 14-35" fill="none" stroke="#82996c" strokeWidth="7" strokeDasharray="7 4 3 5" opacity=".76" />
    {pebbles.map(([x, y], index) => <path key={x} d={`M${x} ${y}l${index % 5 + 4}-2 4 3-3 3h-7Z`}
      fill={index % 3 === 1 ? '#8b9270' : '#9b8568'} opacity={index % 3 === 1 ? '.42' : '.3'} />)}
    {edgesInPaintOrder.map(edge => {
      const path = vinePath(edge);
      return <g key={edge} className="vine-stem" data-edge={edge} data-saved={saved.has(edge)}>
        {edge === 'CD' && <path className="vine-bridge" d={`M${VINE_BRIDGE.from} Q${VINE_BRIDGE.control} ${VINE_BRIDGE.to}`} />}
        <path d={path} className="vine-outline" />
        <path d={path} className={`vine ${saved.has(edge) ? 'used' : drawn.has(edge) ? 'draft' : ''}`} />
        <path d={path} className="vine-shine" />
      </g>;
    })}
    {NODES.map(node => {
      const [x, y] = VINE_POSITIONS[node];
      return <g key={node} data-node={node} className="vine-carved-stone" data-current={current === node}>
        <ellipse cx={x + 2} cy={y + 10} rx="31" ry="18" fill="#19231e" opacity=".76" />
        <path d={`M${x - 26} ${y + 9}l6-23 15-9 22 2 13 15-1 17-14 11h-28Z`}
          fill={`url(#${id}-${current === node ? 'current' : 'stone'})`} stroke={current === node ? '#e1d8a6' : '#4f5947'} strokeWidth="2" />
        <path d={`M${x - 22} ${y + 3}l4-16 13-6 20 2m6 9 5 6`} fill="none" stroke="#d2c8a1" strokeWidth="1.7" opacity=".74" />
        <path d={`M${x - 18} ${y + 14}l12 4 17-3 8-6`} fill="none" stroke="#485447" strokeWidth="2" />
        {room && <text x={x} y={y + 6} textAnchor="middle" fill={current === node ? '#263931' : '#fff0c9'} fontSize="19" fontFamily="Georgia, serif">{node}</text>}
      </g>;
    })}
  </>;
}
