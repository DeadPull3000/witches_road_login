import { useId } from 'react';
import { COVEN } from '../content/scenes';
import type { RunState } from '../game/state';
import { COVEN_SEATS } from './instruments';

const seatColors = ['#ecaaaf', '#eac18b', '#d1b0d8', '#f0cb9b', '#c4d198'];

/** One patterned textile, projected onto the stone floor and viewed from above at the bench. */
export function CovenMat({ placements, opened }: { placements?: RunState['threshold']['placements']; opened?: boolean }) {
  const thread = useId();
  return <svg className="coven-mat-art" viewBox="0 0 600 280" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <radialGradient id={`${thread}-cloth`} cx=".37" cy=".35" r=".72">
        <stop stopColor="#663549" /><stop offset=".67" stopColor="#4b293d" /><stop offset="1" stopColor="#382638" />
      </radialGradient>
      <pattern id={`${thread}-weave`} width="9" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 2h5m2 4h2M3 0v2m4 2v3" stroke="#e2a78d" opacity=".13" />
      </pattern>
    </defs>
    <ellipse cx="304" cy="151" rx="279" ry="120" fill="#1c1423" opacity=".73" />
    <ellipse cx="300" cy="139" rx="278" ry="124" fill={`url(#${thread}-cloth)`} stroke="#3b2234" strokeWidth="6" />
    <ellipse cx="300" cy="139" rx="268" ry="116" fill={`url(#${thread}-weave)`} stroke="#b27964" strokeWidth="3" />
    <ellipse cx="300" cy="139" rx="254" ry="106" fill="none" stroke="#d5aa80" strokeWidth="2" strokeDasharray="4 5" />
    <path d="M300 39 426 224 102 120H498L174 224Z" fill="none" stroke="#c3917c" strokeWidth="2" strokeDasharray="3 5" opacity=".67" />
    {[78, 131, 188, 244, 354, 411, 467, 525].map((x, index) =>
      <path key={x} d={`M${x} ${index < 2 || index > 5 ? 102 : 33}l7-5 7 5-7 5Z`} fill="#d9b487" opacity=".43" />)}
    {COVEN.map((seat, index) => {
      const position = COVEN_SEATS[index];
      const occupant = COVEN.find(token => token.id === placements?.[index]);
      return <g key={seat.id} transform={`translate(${position.x * 6} ${position.y * 2.8})`}>
        <ellipse rx="31" ry="18" fill={occupant ? '#876246' : '#38263b'} stroke="#c18c70" strokeWidth="2" />
        <ellipse rx="26" ry="14" fill="none" stroke="#d4a983" strokeDasharray="2 3" />
        <text y="7" textAnchor="middle" fill={seatColors[index]} fontFamily="Georgia, serif" fontSize="20">{occupant?.symbol ?? seat.symbol}</text>
      </g>;
    })}
    {placements && <svg x="262" y="97" width="76" height="82" viewBox="0 0 90 82"><IronRing open={opened} /></svg>}
  </svg>;
}

export function IronRing({ open = false }: { open?: boolean }) {
  return <g>
    <path d="M17 26 31 16h27l15 10 5 31-12 12H24L11 57Z" fill="#1f1922" opacity=".8" />
    <path d="M20 22 32 15h27l13 9 3 27-12 11H28L15 52Z" fill="#56434a" stroke="#241d27" strokeWidth="4" />
    <path d="M20 24 32 17h26l13 9M29 59h33l11-11" fill="none" stroke="#ba9377" strokeWidth="2" />
    <circle cx="45" cy="38" r="13" fill="#241d25" stroke="#836456" strokeWidth="2" />
    <path d={open ? 'M31 33a15 15 0 1 1 29 0q-2 14-15 16-12-3-14-16Z' : 'M29 40c0-7 7-11 16-11s16 4 16 11-7 12-16 12-16-5-16-12Z'}
      fill="none" stroke="#1c1720" strokeWidth="8" />
    <path d={open ? 'M31 31a15 15 0 1 1 29 0q-2 14-15 16-12-3-14-16Z' : 'M29 38c0-7 7-11 16-11s16 4 16 11-7 12-16 12-16-5-16-12Z'}
      fill="none" stroke="#a58165" strokeWidth="4" />
    <path d="M31 36q3-6 11-7m-20 19h2m43 0h2" fill="none" stroke="#f0cc97" strokeWidth="2" strokeLinecap="round" />
  </g>;
}

const jugBody = 'M22 19 17 13 30 11 100 13 95 31 91 156 85 170H30l-8-14Z';
export function JugDrawing({ volume, capacity }: { volume: number; capacity: number }) {
  const id = useId();
  const height = 126 * volume / capacity;
  return <>
    <defs>
      <clipPath id={`${id}-inside`}><path d={jugBody} /></clipPath>
      <linearGradient id={`${id}-glass`}>
        <stop stopColor="#365867" stopOpacity=".78" /><stop offset=".24" stopColor="#b8dfda" stopOpacity=".56" />
        <stop offset=".47" stopColor="#738a9d" stopOpacity=".58" /><stop offset=".75" stopColor="#2c4d61" stopOpacity=".82" />
        <stop offset="1" stopColor="#203a52" stopOpacity=".9" />
      </linearGradient>
      <linearGradient id={`${id}-water`} x2="0" y2="1">
        <stop stopColor="#78c7cf" /><stop offset=".6" stopColor="#3c8caa" /><stop offset="1" stopColor="#335d80" />
      </linearGradient>
    </defs>
    <ellipse cx="61" cy="181" rx="53" ry="8" fill="#2c2335" opacity=".43" />
    <path d="M94 41h15l18 15 3 30-9 23-27 17 1-15 17-13 6-16-3-17-11-12H94Z" fill="#7193a9" stroke="#37546b" strokeWidth="3" />
    <path d="M100 44h7l15 13 4 19m-3 16-5 12-15 10" fill="none" stroke="#dce7db" strokeWidth="3" />
    <path d={jugBody} fill={`url(#${id}-glass)`} stroke="#37445a" strokeWidth="4" strokeLinejoin="round" />
    <g clipPath={`url(#${id}-inside)`}>
      {volume > 0 && <>
        <rect className="jug-water" x="15" y={164 - height} width="87" height={height + 8} fill={`url(#${id}-water)`} />
        <path d={`M18 ${165 - height}q43 8 81-1`} className="water-meniscus" />
      </>}
      <path d="M30 22 34 151l10 11-6-129M58 25l2 125 5 14 5-12 3-124M87 24l-4 126-7 13" fill="none" stroke="#d9f4e9" strokeWidth="3" opacity=".57" />
      <path d="m32 143 12 14 11-9 11 13 14-14 12 5m-58-19 11 12 11-10 12 10 12-12 10 5" fill="none" stroke="#b6d7d6" strokeWidth="2" opacity=".75" />
      {Array.from({ length: capacity }, (_, index) => <path key={index} d={`M28 ${164 - 126 * (index + 1) / capacity}h${index + 1 === capacity ? 27 : 16}`} className="volume-mark" />)}
    </g>
    <path d="m18 13 12-4 72 4-8 7H24Zm10 154h57l8 9H24Z" fill="#c0d3d6" stroke="#647c93" strokeWidth="2" />
    <path d="M23 13 97 14M32 173h50" stroke="#f4ebd3" strokeWidth="2" strokeLinecap="round" />
    <path d="M49 150h22l3 16-3 4H49l-4-4Z" fill="#a87653" stroke="#4d3742" strokeWidth="2" />
    <text x="60" y="165" textAnchor="middle" fill="#fff0c7" fontFamily="Georgia, serif" fontSize="15">{capacity}</text>
  </>;
}

export function BrassTap() {
  return <g strokeLinejoin="round">
    <ellipse cx="47" cy="108" rx="32" ry="9" fill="#312a31" opacity=".48" />
    <path d="M31 107v-8h8V49q0-31 20-31 21 0 21 24v13H67V43q0-12-8-12-7 0-7 17v51h9v8Z" fill="#9b6339" stroke="#4f3330" strokeWidth="3" />
    <path d="M43 97V47q0-25 17-25 14 0 15 19v10M32 102h25" fill="none" stroke="#f0c68a" strokeWidth="3" strokeLinecap="round" />
    <path d="M17 79h25m-14-9v19m-11-10 5-4m-5 4 5 4" fill="none" stroke="#6f4937" strokeWidth="7" />
    <path d="M18 76h24m-14-5v14m44-31h7" fill="none" stroke="#ebbd7e" strokeWidth="2" strokeLinecap="round" />
  </g>;
}

export function DrainArt() {
  return <g>
    <path d="m12 30 88-1 9 8-10 42H20L8 40Z" fill="#746466" stroke="#a58f8e" strokeWidth="3" />
    <path d="M14 36h90l-9 37H23Z" fill="#4b505d" stroke="#d8bfba" strokeWidth="3" />
    <path d="M22 42h74L91 67H27Z" fill="#333c48" />
    <ellipse cx="61" cy="57" rx="16" ry="8" fill="#ac8359" stroke="#262931" strokeWidth="3" />
    <path d="M53 55h16m-15 5h14m-8-8v9" stroke="#4b3b3d" strokeWidth="1.5" />
  </g>;
}

export function LanternArt({ lit, letter }: { lit: boolean; letter: string }) {
  const id = useId();
  return <svg viewBox="0 0 100 140" width="100%" height="100%" aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-light`}>
        <stop stopColor="#ffd49a" stopOpacity=".78" /><stop offset=".44" stopColor="#ec9a55" stopOpacity=".35" />
        <stop offset="1" stopColor="#df814d" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-glass`}>
        <stop stopColor={lit ? '#eaae6d' : '#74617b'} stopOpacity=".69" /><stop offset=".32" stopColor={lit ? '#ffd198' : '#a598b2'} stopOpacity=".27" />
        <stop offset="1" stopColor="#2d2536" stopOpacity=".86" />
      </linearGradient>
    </defs>
    <ellipse cx="49" cy="128" rx="37" ry="7" fill="#211525" opacity=".8" />
    {lit && <><ellipse cx="50" cy="68" rx="49" ry="64" fill={`url(#${id}-light)`} />
      <ellipse cx="50" cy="124" rx="45" ry="14" fill={`url(#${id}-light)`} /></>}
    <path d="M41 23V16q0-14 9-14t9 14v7" fill="none" stroke="#33252b" strokeWidth="6" />
    <path d="M43 19v-4q0-10 7-10t7 10v4" fill="none" stroke="#c09a70" strokeWidth="2" />
    <path d="M30 28 39 20h22l9 8 10 10H20Zm-5 70h50l7 14-8 12H26l-8-12Z" fill="#9a6a4c" stroke="#342633" strokeWidth="4" />
    <path d="M25 39h50l-4 59H29Z" fill={`url(#${id}-glass)`} stroke="#271e2c" strokeWidth="3" />
    {lit ? <g className="lamp-flame"><path d="M50 45q-2 16 8 25 6 12-7 20-14-4-10-18 3-10 9-27Z" fill="#f7b96a" />
      <path d="M50 65q-6 11-4 16 1 6 6 4 6-5-2-20Z" fill="#fff1bb" /></g>
      : <path d="M47 90v-7h6v7" fill="none" stroke="#96808f" strokeWidth="2" />}
    <path d="M26 38l6 63m41-63-5 63M38 41v55m24-55v55" fill="none" stroke="#ba9576" strokeWidth="3" />
    <path d="m32 44 4 44M56 43l10 16m-34 24 5 7" fill="none" stroke="#f4d5ad" strokeWidth="2" opacity=".62" />
    <path d="M24 35h48m-50 75h54m-45 10h39" stroke="#e4b889" strokeWidth="2" />
    <path d="M42 106h16v13H42Z" fill="#d7a873" stroke="#634653" />
    <text x="50" y="116" textAnchor="middle" fill="#3b2a34" fontSize="11" fontFamily="Georgia, serif">{letter}</text>
  </svg>;
}

export function PlanchetteArt() {
  return <g>
    <path d="M8 17Q50-5 92 17L55 68H45Z" fill="#32212c" opacity=".82" />
    <path d="M8 13Q50-7 92 13L53 65h-6Z" fill="#825340" stroke="#392635" strokeWidth="4" />
    <path d="M13 14q36-16 72 1L51 60Z" fill="#ad7952" stroke="#d3a474" strokeWidth="1.5" />
    <path d="M20 16q21-6 33-6M32 44l17 16m18-29 11-12" stroke="#dcb787" strokeWidth="1.3" />
    <circle cx="50" cy="24" r="10" fill="#4c3540" stroke="#dfb583" strokeWidth="2" />
    <circle cx="49" cy="22" r="4" fill="#dab897" opacity=".54" />
    <path d="m45 45 5-7 5 7-5 7Z" fill="none" stroke="#6f483d" strokeWidth="2" />
  </g>;
}
