import { DISCOVERIES, DISCOVERY_IDS } from '../content/discoveries';

export function DiscoveryNotebook({ found }: { found: readonly string[] }) {
  const ids = new Set(found);
  const discovered = DISCOVERY_IDS.filter(id => ids.has(id));
  const remaining = DISCOVERY_IDS.length - discovered.length;
  return <article className="discovery-notebook" aria-label="Discovery catalogue">
    <h3>Discoveries · {discovered.length} / {DISCOVERY_IDS.length}</h3>
    <p>Clippings kept across journeys on this browser.</p>
    {discovered.length > 0 && <ul className="discovery-clippings">
      {discovered.map(id => <li key={id} data-discovery-id={id}>
        <span aria-hidden="true">✧</span>
        <div><strong>{DISCOVERIES[id].title}</strong><p>{DISCOVERIES[id].description}</p></div>
      </li>)}
    </ul>}
    {remaining > 0 && <div className="discovery-blanks" role="img" aria-label={`${remaining} unrecorded discoveries`}>
      {Array.from({ length: remaining }, (_, index) => <span key={index} aria-hidden="true">◇</span>)}
    </div>}
  </article>;
}
