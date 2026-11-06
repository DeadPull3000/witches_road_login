import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { hitPoints, type Point } from '../content/vines';
import { capturePointer, releasePointer, svgPoint, svgTransformKey, watchPointerGeometry } from './pointer';
import type { Command } from '../game/commands';

export const STITCH_POINTS: Point[] = [[48, 96], [114, 42], [180, 96], [246, 42], [312, 96]];
const orderedPoints = STITCH_POINTS.map((point, index) => [index, point] as const);
const releasedNotice = 'Thread released. You can trace again or use the unbinding button.';

type Stroke = {
  owner: SVGSVGElement;
  pointerId: number;
  revision: number;
  transform: string;
  point: Point;
  hits: number[];
};
type Props = {
  completed: boolean;
  busy: boolean;
  active: boolean;
  revision: number;
  geometryKey: string;
  act: (command: Command) => Promise<void>;
};

export function RuneStitch({ completed, busy, active, revision, geometryKey, act }: Props) {
  const drawing = useRef<SVGSVGElement>(null);
  const stroke = useRef<Stroke | null>(null);
  const [hits, setHits] = useState<number[]>([]);
  const [notice, setNotice] = useState('');

  const clearStroke = useCallback((message?: string, update = true) => {
    const prior = stroke.current;
    if (!prior) return;
    stroke.current = null;
    releasePointer(prior.owner, prior.pointerId);
    if (update) {
      setHits([]);
      if (message) setNotice(message);
    }
  }, []);

  useLayoutEffect(() => {
    clearStroke(releasedNotice);
  }, [active, busy, completed, revision, geometryKey, clearStroke]);

  useEffect(() => {
    const owner = drawing.current;
    if (!owner) return;
    const unwatch = watchPointerGeometry(owner, () => clearStroke(releasedNotice));
    return () => {
      unwatch();
      clearStroke(undefined, false);
    };
  }, [clearStroke]);

  function begin(event: PointerEvent<SVGSVGElement>) {
    if (completed || busy || !active || stroke.current || !event.isPrimary || event.button !== 0) return;
    const owner = event.currentTarget;
    const point = svgPoint(owner, event.clientX, event.clientY);
    if (!point || !hitPoints(orderedPoints, point, point, 23).includes(0)) {
      setNotice('Begin at stitch 1, or use the unbinding button.');
      return;
    }
    event.preventDefault();
    capturePointer(owner, event.pointerId);
    stroke.current = { owner, pointerId: event.pointerId, revision, transform: svgTransformKey(owner), point, hits: [0] };
    setHits([0]);
    setNotice('Drawing your thread.');
  }

  function extend(event: PointerEvent<SVGSVGElement>, released = false) {
    const current = stroke.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (completed || busy || !active || current.revision !== revision || (!event.buttons && !released) ||
        svgTransformKey(current.owner) !== current.transform) {
      clearStroke(releasedNotice);
      return;
    }
    const point = svgPoint(current.owner, event.clientX, event.clientY);
    if (!point) {
      clearStroke(releasedNotice);
      return;
    }
    for (const hit of hitPoints(orderedPoints, current.point, point, 23)) {
      if (hit === current.hits.length) current.hits.push(hit);
    }
    current.point = point;
    setHits([...current.hits]);
  }

  function finish(event: PointerEvent<SVGSVGElement>, cancelled = false) {
    const current = stroke.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (cancelled) {
      clearStroke(releasedNotice);
      return;
    }
    extend(event, true);
    if (stroke.current !== current) return;
    const finished = current.hits.length === STITCH_POINTS.length;
    clearStroke(finished ? 'Thread submitted.' : releasedNotice);
    if (finished) void act({ type: 'UNBIND' });
  }

  const visible = completed ? STITCH_POINTS : STITCH_POINTS.slice(0, hits.length);
  return <div className={`rune-stitch ${completed ? 'unbound' : ''}`}>
    <svg
      ref={drawing}
      viewBox="0 0 360 150"
      data-testid="rune-stitch"
      data-draft-stitches={hits.length}
      role="img"
      aria-label={completed ? 'Your five stitches have replaced Agatha’s binding thread' : 'Five marked stitches. Trace 1 through 5, or use the unbinding button'}
      onPointerDown={begin}
      onPointerMove={event => extend(event)}
      onPointerUp={event => finish(event)}
      onPointerCancel={event => finish(event, true)}
      onLostPointerCapture={event => finish(event, true)}
    >
      <path d="M25 128V28Q180-12 335 28V128" className="rune-frame" />
      <polyline points={STITCH_POINTS.map(point => point.join(',')).join(' ')} className="old-thread" />
      <polyline points={visible.map(point => point.join(',')).join(' ')} className="new-thread" />
      {STITCH_POINTS.map(([x, y], index) => <g key={index} data-stitch={index + 1}>
        <circle cx={x} cy={y} r="19" />
        <text x={x} y={y + 5} textAnchor="middle">{completed ? '✧' : index + 1}</text>
      </g>)}
    </svg>
    <p className="drawing-notice" role="status">
      {completed ? 'Your stitches hold. The knocker is ready.' : notice || 'Trace the marked stitches from 1 through 5, or use the button below.'}
    </p>
  </div>;
}
