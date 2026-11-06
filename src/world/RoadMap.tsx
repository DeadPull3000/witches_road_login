import { TRIALS, type SceneId } from '../content/scenes';
import type { RunState } from '../game/state';
import { mapLocations } from './navigation';
import { RoadEmblem } from '../ui/RoadEmblem';

export function RoadMap({ run, busy, travel }: { run: RunState; busy: boolean; travel: (scene: SceneId) => void }) {
  const seals = TRIALS.filter(id => run.puzzles[id].solved).length;
  return <section className="folded-map" aria-label="Folded Road map">
    <p className="map-inscription">A borrowed name. A path through five doors.</p>
    <div className="map-seal-count" aria-label={`${seals} of 5 seals collected`}>{TRIALS.map((scene, index) => <span key={scene} className={run.puzzles[scene].solved ? 'map-seal earned' : 'map-seal'}><RoadEmblem kind={(['cup','record','lamp','cards','flower'] as const)[index]} /><small>{run.puzzles[scene].solved ? 'SEALED' : '·'}</small></span>)}</div>
    <nav className="map-locations" aria-label="Journey locations"><svg className="map-trail map-trail-wide" viewBox="0 0 640 470" preserveAspectRatio="none" aria-hidden="true"><path d="M26 51C110 0 260 0 352 51C450 98 130 97 26 143C110 92 260 92 352 143C450 190 130 189 26 235C110 184 260 184 352 235C450 282 130 281 26 327C110 276 260 276 352 327C450 374 130 373 26 419"/></svg><svg className="map-trail map-trail-tall" viewBox="0 0 640 900" preserveAspectRatio="none" aria-hidden="true"><path d="M68 50C10 90 126 110 68 150S10 210 68 250S126 310 68 350S10 410 68 450S126 510 68 550S10 610 68 650S126 710 68 750S10 810 68 850"/></svg>{mapLocations(run).map((location, index) => <button key={location.scene} className={`map-place ${location.current ? 'current' : ''} ${location.sealed ? 'finished' : ''}`} aria-label={`${location.label}${location.mark ? ` ${location.mark}` : ''}`} aria-current={location.current ? 'location' : undefined} disabled={busy || !location.available || location.current} onClick={() => travel(location.scene)}>
      <span className="map-pin" aria-hidden="true">{location.sealed ? '✧' : index === 0 ? '⌂' : location.scene === 'garden' ? '❧' : '◇'}</span><span><b>{location.label}</b><small>{location.current ? 'YOU ARE HERE' : !location.available ? 'LOCKED' : location.mark || 'OPEN PATH'}</small></span><span aria-hidden="true">{location.current ? '·' : location.available ? '↗' : '⌑'}</span>
    </button>)}</nav>
    <p className="map-footnote">The Road keeps your seals. The library still requires its knocker.</p>
  </section>;
}
