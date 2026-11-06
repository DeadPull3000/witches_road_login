import type { SoundStatus } from '../audio/engine';

export function AudioEntrance({ status, starting, enter, exportJourney, embedded = false }: { status: SoundStatus; starting: boolean; enter: () => Promise<void>; exportJourney: () => void; embedded?: boolean }) {
  const failed = status === 'blocked' || status === 'unavailable';
  const Surface = embedded ? 'section' : 'main';
  return <Surface className={`audio-entrance ${embedded ? 'world-audio-entrance' : ''}`} data-testid="audio-entrance" data-audio-state={status}>
    <div className="entrance-card"><span className="eyebrow">WESTVIEW PUBLIC LIBRARY · AFTER HOURS</span>
      <div className="entrance-sigil" aria-hidden>W<span>✦</span></div>
      <h1>The Witches’<br /><i>Road.</i></h1>
      <p>A borrowed name. Five trials.<br />Something waiting in the music.</p>
      <p className="entrance-note">Sound accompanies every room. Begin with your speakers or headphones at a comfortable volume.</p>
      <button className="primary" disabled={starting} onClick={() => void enter()}>{starting ? 'Opening the Road…' : failed ? 'Retry audio and enter' : 'Enter the Road with sound'} <span aria-hidden>↗</span></button>
      <p className="entrance-status" role="status">{failed ? status === 'unavailable' ? 'The browser could not open an audio device. Check your output device and try again. Your saved journey is safe.' : 'The browser paused audio. Select Retry to start it. Your saved journey is safe.' : 'This opens the room audio. Volume and mute controls are available during play.'}</p>
      {failed && <button className="quiet" onClick={exportJourney}>Export saved journey</button>}
    </div>
  </Surface>;
}
