import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Props = ComponentPropsWithoutRef<'button'> & { label: string; marker: ReactNode };

function PlaqueFace({ label, marker }: Pick<Props, 'label' | 'marker'>) {
  return <>
    <span className="plaque-mark" aria-hidden="true">{marker}</span>
    <span className="plaque-label">{label}</span>
  </>;
}

export function ObjectPlaque({ label, marker, className, ...button }: Props) {
  return <button type="button" {...button} className={className ? `object-plaque ${className}` : 'object-plaque'}>
    <PlaqueFace label={label} marker={marker} />
  </button>;
}

export function ObjectNote({ label, children }: { label: string; children: ReactNode }) {
  return <details className="object-note">
    <summary className="object-plaque"><PlaqueFace label={label} marker="▤" /><span className="plaque-caret" aria-hidden="true">▾</span></summary>
    <div className="instrument-intro parchment">{children}</div>
  </details>;
}
