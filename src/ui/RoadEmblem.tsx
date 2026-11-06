import type { SVGProps } from 'react';
export const ROAD_EMBLEMS = ['cup', 'record', 'lamp', 'cards', 'flower'] as const;
export function RoadEmblem({ kind, ...props }: SVGProps<SVGSVGElement> & { kind: typeof ROAD_EMBLEMS[number] }) {
  return <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {kind === 'cup' && <><path d="M17 14h30v13c0 12-6 17-15 17s-15-5-15-17zM17 19H8v7c0 7 4 11 12 11m27-18h9v7c0 7-4 11-12 11M32 44v12m-11 0h22" /></>}
    {kind === 'record' && <><circle cx="32" cy="32" r="23"/><circle cx="32" cy="32" r="13"/><circle cx="32" cy="32" r="3"/><path d="M17 21q6-8 16-7m-18 9-2 4" /></>}
    {kind === 'lamp' && <><path d="M24 8h16l6 31H18zM28 39h8v11H28zM18 50h28v6H18z"/><path d="M32 17q-12 17 0 18q11-1 0-18z"/></>}
    {kind === 'cards' && <><path d="M12 16h30v40H12zM19 9h31v40h-8"/><path d="m27 26 7 10-7 10-7-10z"/></>}
    {kind === 'flower' && <><path d="M32 32v26m0-11q-18 0-16-12q14-2 16 8m0-9q17 1 16-11q-12-1-16 8"/><circle cx="32" cy="21" r="5"/>{[[32,11],[42,19],[38,29],[26,29],[22,19]].map(([x,y],index)=><circle cx={x} cy={y} r="6" key={index}/>)}</>}
  </svg>;
}
