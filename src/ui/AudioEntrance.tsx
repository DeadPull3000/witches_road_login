import type { SoundStatus } from '../audio/engine';
import { ObjectPlaque } from '../world/ObjectPlaque';

export function AudioEntrance({ status, starting, enter, exportJourney, embedded = false }: { status: SoundStatus; starting: boolean; enter: () => Promise<void>; exportJourney: () => void; embedded?: boolean }) {
  const failed = status === 'blocked' || status === 'unavailable';
  const Surface = embedded ? 'section' : 'main';
  return <Surface className={`audio-entrance ${embedded ? 'world-audio-entrance' : ''}`} data-testid="audio-entrance" data-audio-state={status}>
    <div className="entrance-card parchment">
      <div className="entrance-copy parchment-body">
        <span className="eyebrow">WESTVIEW PUBLIC LIBRARY · AFTER HOURS</span>
        <div className="entrance-sigil" aria-hidden>W<span>✦</span></div>
        <h1>The Witches’<br /><i>Road.</i></h1>
        <p>A borrowed name. Five trials.<br />Something waiting in the music.</p>
        <p className="entrance-note">You have five minutes per trial. Run out of time and the Road sends you back to the cottage to earn your seals again.</p>
        <p className="entrance-note">Sound accompanies every room. Begin with your speakers or headphones at a comfortable volume.</p>
      </div>
      <ObjectPlaque className="primary" marker="♫" disabled={starting} onClick={() => void enter()}
        label={starting ? 'Opening the Road…' : failed ? 'Retry audio and enter' : 'Enter the Road with sound'} />
      <p className="entrance-status" role="status">{failed ? status === 'unavailable' ? 'The browser could not open an audio device. Check your output device and try again. Your saved journey is safe.' : 'The browser paused audio. Select Retry to start it. Your saved journey is safe.' : 'This opens the room audio. Volume and mute controls are available during play.'}</p>
      {failed && <button className="quiet" onClick={exportJourney}>Export saved journey</button>}
    </div>
  </Surface>;
}
