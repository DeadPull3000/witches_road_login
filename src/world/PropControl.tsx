import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';
import { PropArtwork, type PropKind } from './PropArtwork';

type Art = PropKind | ReactElement;
type Props = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & { label: string; art: Art; caption?: string };

function PropFace({ art, caption }: { art: Art; caption: string }) {
  return <>
    <span className="prop-grip" aria-hidden="true">{typeof art === 'string' ? <PropArtwork kind={art} /> : art}</span>
    <span className="prop-caption" aria-hidden="true">{caption}</span>
  </>;
}

export function PropButton({ label, art, caption = label, className, ...button }: Props) {
  return <button type="button" {...button} aria-label={label} className={className ? `prop-control ${className}` : 'prop-control'}>
    <PropFace art={art} caption={caption} />
  </button>;
}

export function PropNote({ label, art = 'scroll', children }: { label: string; art?: PropKind; children: ReactNode }) {
  return <details className="object-note">
    <summary className="prop-control" aria-label={label}><PropFace art={art} caption={label} /></summary>
    <div className="instrument-intro parchment">{children}</div>
  </details>;
}
