import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import { rectStyle, type Rect } from './layout';

type Props = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  frame: Rect; viewportWidth: number; label: string; art?: ReactNode; important?: boolean;
};

/** A native hit target shares the position of the room's painted or live artwork. */
export function WorldObject({ frame, viewportWidth, label, art, important, ...button }: Props) {
  const center = frame.x + frame.width / 2;
  const labelCenter = Math.max(110, Math.min(viewportWidth - 110, center));
  const style = { ...rectStyle(frame), '--prop-label-x': `${labelCenter - frame.x}px` } as CSSProperties;
  return <button type="button" {...button} className="world-object" style={style} aria-label={button['aria-label'] ?? label}
    data-object-art={art ? 'drawn' : 'painted'} data-important={important || undefined}>
    {art}
    <span className="object-caption" aria-hidden="true">{label}</span>
  </button>;
}
