import { NODES, type Node } from '../puzzles/rules';

export type Point = readonly [number, number];
export const VINE_POSITIONS: Record<Node, Point> = { A: [200, 100], B: [70, 40], C: [70, 240], D: [370, 50], E: [370, 250] };
export const VINE_HIT_RADIUS = 28;
// CD passes over AE. This bend is decoration, never an extra graph vertex.
const c = VINE_POSITIONS.C, d = VINE_POSITIONS.D, a = VINE_POSITIONS.A, e = VINE_POSITIONS.E;
const t = ((a[0] - c[0]) * (e[1] - a[1]) - (a[1] - c[1]) * (e[0] - a[0])) / ((d[0] - c[0]) * (e[1] - a[1]) - (d[1] - c[1]) * (e[0] - a[0]));
export const VINE_CROSSING: Point = [c[0] + t * (d[0] - c[0]), c[1] + t * (d[1] - c[1])];
const crossing = VINE_CROSSING;
const cdLength = Math.hypot(300, -190), dx = 300 / cdLength, dy = -190 / cdLength;
export const VINE_BRIDGE = {
  from: [crossing[0] - dx * 14, crossing[1] - dy * 14] as Point,
  control: [crossing[0] + dy * 20, crossing[1] - dx * 20] as Point,
  to: [crossing[0] + dx * 14, crossing[1] + dy * 14] as Point,
};
export function vinePath(edge: string): string {
  const [a, b] = edge.split('') as Node[], from = VINE_POSITIONS[a], to = VINE_POSITIONS[b];
  return edge === 'CD' ? `M${from} L${VINE_BRIDGE.from} Q${VINE_BRIDGE.control} ${VINE_BRIDGE.to} L${to}` : `M${from} L${to}`;
}
export function nodesAlongSegment(from: Point, to: Point): Node[] {
  return hitPoints(NODES.map(node => [node, VINE_POSITIONS[node]]), from, to, VINE_HIT_RADIUS);
}
export function hitPoints<T>(points: readonly (readonly [T, Point])[], from: Point, to: Point, radius: number): T[] {
  const dx = to[0] - from[0], dy = to[1] - from[1], length2 = dx * dx + dy * dy;
  return points.map(([node, point]) => {
    const t = length2 ? Math.max(0, Math.min(1, ((point[0] - from[0]) * dx + (point[1] - from[1]) * dy) / length2)) : 0;
    return { node, t, distance: Math.hypot(point[0] - from[0] - t * dx, point[1] - from[1] - t * dy) };
  }).filter(hit => hit.distance <= radius).sort((a, b) => a.t - b.t).map(hit => hit.node);
}
export const vineStagePoint = ([x, y]: Point): Point => [40 + x * .9, 190 + y * .4];
