import { describe, expect, it, vi } from 'vitest';
import { AudioEngine } from '../../src/audio/engine';
import { createAmbience, createStem, reverseSamples, SCORE_RATE, SCORE_SECONDS } from '../../src/audio/score';
import { DEFAULT_PREFERENCES } from '../../src/game/state';

class Param {
  value = 0;
  events: [number, number | undefined][] = [];
  setValueAtTime(value: number, when?: number) { this.value = value; this.events.push([value, when]); }
  setTargetAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; }
  exponentialRampToValueAtTime(value: number) { this.value = value; }
  cancelScheduledValues() {}
}
class Gain {
  gain = new Param(); target: Gain | object | null = null;
  connect(target: Gain | object) { this.target = target; } disconnect() { this.target = null; }
}
class Source {
  buffer: unknown; loop = false; loopStart = 0; loopEnd = 0; started: number[] = []; stops = 0; stopAt?: number; target: Gain | null = null;
  frequency = new Param(); type = ''; onended?: () => void;
  startedAtClock = 0;
  constructor(private clock: () => number) {}
  connect(target: Gain) { this.target = target; } disconnect() { this.target = null; }
  start(when: number, offset = 0) { this.startedAtClock = this.clock(); this.started = [when, offset]; } stop(when?: number) { this.stops++; this.stopAt = when; }
}
class Context {
  currentTime = 0; state = 'suspended'; destination = {}; gains: Gain[] = []; sources: Source[] = []; failResume = false; failBuffer = false; bufferCostSeconds = 0;
  createGain() { const gain = new Gain(); this.gains.push(gain); return gain; }
  createBufferSource() { const source = new Source(() => this.currentTime); this.sources.push(source); return source; }
  createOscillator() { return this.createBufferSource(); }
  createBuffer(_channels: number, length: number) { if (this.failBuffer) throw new Error('Test audio buffer failure'); this.currentTime += this.bufferCostSeconds; const data = new Float32Array(length); return { getChannelData: () => data }; }
  async resume() { if (this.failResume) throw new Error('Autoplay blocked'); this.state = 'running'; }
  async suspend() { this.state = 'suspended'; } async close() { this.state = 'closed'; }
}
const setup = () => { const context = new Context(); const engine = new AudioEngine(() => context as unknown as AudioContext); engine.configure({ ...DEFAULT_PREFERENCES, muted: false }); engine.setScene('studio'); return { engine, context }; };

describe('original audio buffers', () => {
  it('creates three finite, bounded, distinct voices of identical loop length', () => {
    const stems = [0, 1, 2].map(voice => createStem(voice));
    for (const stem of [...stems, createAmbience()]) {
      expect(stem.length).toBe(SCORE_RATE * SCORE_SECONDS); expect(stem.every(Number.isFinite)).toBe(true);
      expect(stem.every(sample => Math.abs(sample) < .3)).toBe(true); expect(Math.abs(stem[0])).toBeLessThan(.001); expect(Math.abs(stem.at(-1)!)).toBeLessThan(.001);
    }
    expect(stems[0]).not.toEqual(stems[1]); expect(stems[1]).not.toEqual(stems[2]);
    expect(reverseSamples(reverseSamples(stems[0]))).toEqual(stems[0]);
  });
  it('authors distinct bounded music for every room mood', () => {
    const moods = ['road', 'studio', 'cabin', 'tower', 'earth', 'library', 'vision'] as const;
    const signatures = moods.map(mood => [...createStem(0, 4000, mood).filter((_, index) => index % 911 === 0)]);
    expect(new Set(signatures.map(samples => JSON.stringify(samples))).size).toBe(moods.length);
    for (const mood of moods) for (let voice = 0; voice < 3; voice++) {
      const stem = createStem(voice, 4000, mood); expect(stem).toHaveLength(24000);
      expect(stem.every(sample => Number.isFinite(sample) && Math.abs(sample) < .3)).toBe(true);
    }
  });
});
describe('synchronized Web Audio lifecycle', () => {
  it('routes the bloom, unbinding and receipt cues through effects while master mute takes precedence', async () => {
    const { engine, context } = setup(); await engine.enable();
    engine.effect('flower'); engine.effect('thread'); engine.effect('receipt');
    const tones = context.sources.slice(4); expect(tones).toHaveLength(12);
    expect(tones.every(tone => tone.target!.target === context.gains[3])).toBe(true);
    expect(tones.every(tone => tone.target!.gain.events[0][1] === tone.started[0] && tone.frequency.events[0][1] === tone.started[0])).toBe(true);
    engine.configure({ ...DEFAULT_PREFERENCES, muted: true }); engine.effect('flower'); expect(context.sources).toHaveLength(16); expect(context.gains[0].gain.value).toBe(0);
    engine.dispose(); expect(tones.every(tone => tone.stops >= 1)).toBe(true);
  });
  it('starts all three stems on one clock, and repeated enable does not duplicate sources', async () => {
    const { engine, context } = setup(); await Promise.all([engine.enable(), engine.enable()]);
    expect(context.sources).toHaveLength(4); expect(context.sources.slice(0, 3).map(source => source.started)).toEqual([[.04, 0], [.04, 0], [.04, 0]]);
    await engine.enable(); expect(context.sources).toHaveLength(4); expect(engine.getSnapshot()).toBe('playing'); engine.dispose();
    expect(context.state).toBe('closed'); expect(context.sources.every(source => source.stops === 1)).toBe(true);
  });
  it('prepares every voice before scheduling so slow buffer creation cannot stagger playback', async () => {
    const { engine, context } = setup(); context.bufferCostSeconds = .06; await engine.enable();
    const voices = context.sources.slice(0, 3); expect(voices.every(source => source.started[0] > source.startedAtClock)).toBe(true);
    expect(new Set(voices.map(source => source.started[0])).size).toBe(1); engine.dispose();
  });
  it('keeps master mute above speaker doors, channel gains and independent volume buses', async () => {
    const { engine, context } = setup(); await engine.enable(); engine.setMix({ channels: [true, false, true], speakersOpen: true, reversed: false });
    expect(context.sources.slice(0, 3).map(source => source.target!.gain.value)).toEqual([1, 0, 1]);
    const music = context.sources[0].target!.target as Gain; expect(music.gain.value).toBe(DEFAULT_PREFERENCES.musicVolume);
    engine.setMix({ channels: [true, true, true], speakersOpen: false, reversed: false }); expect(music.gain.value).toBeCloseTo(DEFAULT_PREFERENCES.musicVolume * .12);
    engine.configure({ ...DEFAULT_PREFERENCES, muted: true }); const master = context.gains.find(gain => gain.target === context.destination)!;
    expect(master.gain.value).toBe(0); engine.setMix({ channels: [true, true, true], speakersOpen: true, reversed: false }); expect(master.gain.value).toBe(0); engine.dispose();
  });
  it('keeps sources aligned through reverse, hidden-tab pause and resume', async () => {
    const { engine, context } = setup(); await engine.enable(); context.currentTime = 2;
    engine.setMix({ channels: [true, true, true], speakersOpen: true, reversed: true });
    expect(context.sources.slice(0, 3).every(source => source.stops === 1)).toBe(true);
    const restarted = context.sources.slice(-3); expect(restarted.every(source => source.started[0] === 2.04 && source.started[1] === 2)).toBe(true);
    await engine.setHidden(true); expect(engine.getSnapshot()).toBe('paused'); await engine.setHidden(false);
    expect(engine.getSnapshot()).toBe('playing'); expect(context.sources).toHaveLength(7); engine.dispose();
  });
  it('fades the old score across the new start time and installs only one bank for a room and mix change', async () => {
    const { engine, context } = setup();
    engine.setScene('cottage');
    await engine.enable();
    const outgoing = context.sources.slice(0, 3);
    context.currentTime = 2;
    engine.setRoom('studio', { channels: [true, true, true], speakersOpen: true, reversed: true });
    expect(context.sources).toHaveLength(7);
    const [start, offset] = context.sources[4].started;
    expect(offset).toBeCloseTo(2);
    for (const voice of outgoing) {
      expect(voice.stopAt).toBeGreaterThan(start);
      expect(voice.target?.gain.value).toBe(0);
      voice.onended?.();
      expect(voice.target).toBeNull();
    }
    expect(context.sources.slice(4).every(voice => voice.started[0] === start)).toBe(true);
    engine.dispose();
  });
  it('ignores stale completion of a hidden-tab pause after the visible tab has resumed', async () => {
    const { engine, context } = setup(); await engine.enable();
    let finishPause!: () => void;
    context.suspend = () => new Promise<void>(resolve => { finishPause = resolve; });
    const pause = engine.setHidden(true);
    await engine.setHidden(false);
    finishPause(); await pause;
    expect(engine.getSnapshot()).toBe('playing');
    expect(context.sources).toHaveLength(4);
    engine.dispose();
  });
  it('handles unavailable audio and retryable autoplay failure without throwing into the game', async () => {
    const unavailable = new AudioEngine(() => { throw new Error('No audio device'); }); unavailable.configure({ ...DEFAULT_PREFERENCES, muted: false }); await unavailable.enable(); expect(unavailable.getSnapshot()).toBe('unavailable'); unavailable.dispose();
    const { engine, context } = setup(); context.failResume = true; await engine.enable(); expect(engine.getSnapshot()).toBe('blocked'); expect(context.sources).toHaveLength(0);
    context.failResume = false; await engine.enable(); expect(engine.getSnapshot()).toBe('playing'); expect(context.sources).toHaveLength(4); engine.dispose();
  });
  it('requires a genuinely running context, even if resume resolves without starting audio', async () => {
    const { engine, context } = setup(), resume = context.resume.bind(context);
    context.resume = async () => {}; await engine.enable(); expect(engine.getSnapshot()).toBe('blocked'); expect(context.sources).toHaveLength(0);
    context.resume = resume; await engine.enable(); expect(engine.getSnapshot()).toBe('playing'); engine.dispose();
  });
  it('times out a hanging browser resume and allows a later gesture to retry', async () => {
    vi.useFakeTimers(); const { engine, context } = setup(), resume = context.resume.bind(context);
    try {
      context.resume = () => new Promise<void>(() => {}); const pending = engine.enable();
      await vi.advanceTimersByTimeAsync(5000); await pending; expect(engine.getSnapshot()).toBe('blocked'); expect(context.sources).toHaveLength(0);
      context.resume = resume; await engine.enable(); expect(engine.getSnapshot()).toBe('playing');
    } finally { engine.dispose(); vi.useRealTimers(); }
  });
  it('plays each room through the music/ambience buses and keeps studio-only settings local', async () => {
    const { engine, context } = setup(); await engine.enable();
    engine.setMix({ channels: [false, false, false], speakersOpen: false, reversed: true });
    for (const scene of ['cottage', 'threshold', 'kitchen', 'cabin', 'tower', 'greenhouse', 'garden', 'account', 'vision'] as const) {
      engine.setScene(scene); const active = context.sources.filter(source => !source.stops && source.loopEnd === 6);
      expect(active).toHaveLength(3); expect(active.every(source => source.target!.gain.value > 0)).toBe(true);
      expect((active[0].target!.target as Gain).gain.value).toBeGreaterThan(0);
      expect(context.gains[1].gain.value).toBeGreaterThan(0);
    }
    engine.setScene('studio'); const active = context.sources.filter(source => !source.stops && source.loopEnd === 6);
    expect(active.every(source => source.target!.gain.value === 0)).toBe(true);
    engine.dispose(); expect(context.sources.every(source => source.stops === 1)).toBe(true);
  }, 15_000);
  it('recovers a room-buffer failure without duplicating ambience or leaving old stems running', async () => {
    const { engine, context } = setup(); await engine.enable(); context.failBuffer = true;
    expect(() => engine.setScene('tower')).not.toThrow(); expect(engine.getSnapshot()).toBe('blocked');
    expect(context.sources.filter(source => !source.stops)).toHaveLength(1);
    context.failBuffer = false; await engine.enable(); expect(engine.getSnapshot()).toBe('playing');
    expect(context.sources.filter(source => !source.stops)).toHaveLength(4);
    engine.dispose(); expect(context.sources.every(source => source.stops === 1)).toBe(true);
  });
});
