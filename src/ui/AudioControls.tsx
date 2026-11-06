import type { SoundStatus } from '../audio/engine';
import type { Preferences } from '../game/state';

export function AudioControls({ preferences, status, mute, retry }: { preferences: Preferences; status: SoundStatus; mute: (value: boolean) => void; retry: () => void }) {
  return <div className="audio-controls" data-testid="audio-controls" data-audio-state={status}>
    <div><span className="eyebrow">THE SOUND OF THE ROAD</span><p>{preferences.muted ? 'Muted by you. Restore the room audio whenever you’re ready.' : status === 'playing' ? 'Room ambience, an original score, and sounds for your actions.' : 'Sound is paused while this tab rests. Your place on the Road is safe.'}</p></div>
    <button aria-pressed={!preferences.muted} onClick={() => mute(!preferences.muted)}>{preferences.muted ? 'Enable sound' : 'Mute sound'}</button>
    {!preferences.muted && status === 'blocked' && <button onClick={retry}>Retry sound</button>}
  </div>;
}
