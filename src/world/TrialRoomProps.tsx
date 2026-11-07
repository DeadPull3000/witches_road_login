import type { RunState } from '../game/state';
import { TarotSymbol } from '../ui/TarotTable';
import { VineBedArt } from '../ui/VineBedArt';
import { VESSELS } from './instruments';
import { rectStyle, type WorldLayout } from './layout';
import { Flower } from './RoadTrials';
import { CovenMat, JugDrawing, LanternArt, PlanchetteArt } from './TrialPropArt';
import { visibleTableCards } from './trialLayout';
import { CABIN_PLANCHETTE, COVEN_MAT, JUGS, TAROT_SPREAD, VINE_BED, cabinLampBounds } from './trialSurfaces';

/** The painted room uses the same live pieces as its close-up, on the painting's camera plane. */
export function TrialRoomProps({ run, layout }: { run: RunState; layout: WorldLayout }) {
  const { currentScene: scene, puzzles } = run;
  return <svg className="trial-room-props" data-testid="trial-room-props" viewBox="0 0 1672 941"
    style={rectStyle(layout.backgroundRect)} aria-hidden="true">
    {scene === 'threshold' && <svg {...COVEN_MAT} viewBox="0 0 600 280" preserveAspectRatio="none">
      <CovenMat placements={run.threshold.placements} opened={run.threshold.opened} />
    </svg>}
    {scene === 'kitchen' && <g>
      {VESSELS.map(({ capacity }, index) => <svg key={capacity} {...JUGS[index]}
        viewBox="0 0 140 190" data-vessel={capacity} data-volume={puzzles.kitchen.volumes[index]}>
        <JugDrawing volume={puzzles.kitchen.volumes[index]} capacity={capacity} />
      </svg>)}
    </g>}
    {scene === 'cabin' && <g>
      {puzzles.cabin.lamps.map((lit, index) => <svg key={index} {...cabinLampBounds(index)} viewBox="0 0 100 140" data-lantern={'ABCD'[index]} data-lit={!!lit}>
        <LanternArt lit={!!lit} letter={'ABCD'[index]} />
      </svg>)}
      <svg {...CABIN_PLANCHETTE} viewBox="0 0 100 72" preserveAspectRatio="none"><PlanchetteArt /></svg>
    </g>}
    {scene === 'tower' && <g className="painted-tarot-spread road-trial-still">
      {visibleTableCards(puzzles.tower).map((card, index) => <g key={index}
        transform={`translate(${TAROT_SPREAD.x + index * 87} ${TAROT_SPREAD.y + Math.abs(index - 2) * 4}) skewX(${(index - 2) * 2})`}>
        <rect x="2" y="4" width="63" height="46" rx="3" fill="#261a29" opacity=".75" />
        <rect className={card ? 'preview-card-face' : 'preview-card-back'} width="62" height="46" rx="3" />
        <rect x="5" y="4" width="52" height="38" rx="2" className="preview-card-border" />
        {card ? <svg x="9" y="4" width="44" height="37" viewBox="0 0 64 80" preserveAspectRatio="none"><TarotSymbol card={card} /></svg>
          : <path d="M31 11l4 9 10 3-10 3-4 9-4-9-10-3 10-3Z" fill="#bd9d75" />}
      </g>)}
    </g>}
    {scene === 'greenhouse' && <g>
      <svg {...VINE_BED} viewBox="0 0 440 300" preserveAspectRatio="none">
        <VineBedArt route={puzzles.greenhouse.route} room />
      </svg>
      {puzzles.greenhouse.solved && <svg x="932" y="534" width="55" height="82" viewBox="0 0 70 95"><Flower /></svg>}
    </g>}
  </svg>;
}
