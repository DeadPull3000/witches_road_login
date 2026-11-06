import type { Preferences } from '../game/state';
import { DEFAULT_PREFERENCES } from '../game/state';
import type { SceneId } from '../content/scenes';
import { createAmbience, createStem, reverseSamples, SCORE_RATE, SCORE_SECONDS, type ScoreMood } from './score';

export type SoundStatus = 'off' | 'playing' | 'paused' | 'blocked' | 'unavailable';
type Mix = { channels: boolean[]; speakersOpen: boolean; reversed: boolean };
type Loop = { source: AudioBufferSourceNode; gain: GainNode };
const moodFor = (scene: SceneId): ScoreMood => scene === 'account' ? 'library' : scene === 'studio' || scene === 'cabin' || scene === 'tower' || scene === 'vision' ? scene : scene === 'greenhouse' || scene === 'garden' ? 'earth' : 'road';
const STEM_FADE_SECONDS = .14;
const CHANT_LEVEL: Record<SceneId, number> = {
  cottage: .29,
  threshold: .72,
  kitchen: .25,
  studio: 0,
  cabin: .21,
  tower: .25,
  greenhouse: .46,
  garden: .27,
  account: .15,
  vision: .1,
};

export class AudioEngine {
  private context: AudioContext | null = null;
  private master?: GainNode; private ambience?: GainNode; private music?: GainNode; private effects?: GainNode;
  private loops: Loop[] = []; private ambienceSource?: AudioBufferSourceNode;
  private chant?: Loop; private chantRequest?: AbortController;
  private fading: Loop[] = []; private stemsAt = 0;
  private oneShots = new Set<AudioScheduledSourceNode>();
  private listeners = new Set<() => void>(); private status: SoundStatus = 'off';
  private preferences = { ...DEFAULT_PREFERENCES }; private scene: SceneId = 'cottage';
  private mix: Mix = { channels: [false, false, false], speakersOpen: true, reversed: false };
  private epoch = 0; private closed = false; private enabling?: Promise<void>;
  private hidden = false; private visibilityRequest = 0;
  constructor(private factory: () => AudioContext = () => new AudioContext(), private chantUrl?: string) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  getSnapshot = () => this.status;
  private publish(status: SoundStatus) { if (status !== this.status) { this.status = status; this.listeners.forEach(listener => listener()); } }
  configure(preferences: Preferences) { this.preferences = preferences; this.applyGains(); if (preferences.muted) this.publish('off'); }
  setScene(scene: SceneId) { this.setRoom(scene, this.mix); }
  setMix(mix: Mix) { this.setRoom(this.scene, mix); }
  setRoom(scene: SceneId, mix: Mix) {
    const changed = moodFor(scene) !== moodFor(this.scene) || scene === 'studio' && this.mix.reversed !== mix.reversed;
    this.scene = scene; this.mix = { ...mix, channels: [...mix.channels] };
    if (changed && this.context && this.loops.length) this.replaceStems();
    this.applyGains();
  }
  async enable(): Promise<void> {
    if (this.closed || this.hidden || this.preferences.muted) return;
    if (this.enabling) return this.enabling;
    this.enabling = this.start().finally(() => { this.enabling = undefined; }); return this.enabling;
  }
  private async start() {
    try {
      if (!this.context) {
        this.context = this.factory(); const context = this.context;
        this.master = context.createGain(); this.master.connect(context.destination);
        this.ambience = context.createGain(); this.music = context.createGain(); this.effects = context.createGain();
        this.ambience.connect(this.master); this.music.connect(this.master); this.effects.connect(this.master);
        this.applyGains();
      }
      await this.resume(); if (this.closed || this.hidden) return;
      if (this.context.state !== 'running') { this.publish('blocked'); return; }
      if (!this.loops.length) this.startStems(false);
      if (!this.ambienceSource) this.startAmbience();
      this.applyGains(); this.publish(this.preferences.muted ? 'off' : 'playing');
      if (!this.preferences.muted) void this.startChant(this.context);
    } catch { if (!this.closed && !this.hidden) this.publish(this.context ? 'blocked' : 'unavailable'); }
  }
  private async resume() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { await Promise.race([this.context!.resume(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Audio start timed out')), 5000); })]); }
    finally { clearTimeout(timer); }
  }
  private replaceStems() {
    try { this.startStems(true); } catch { this.stopLoops(); this.clearFade(); this.publish('blocked'); }
  }
  private buffer(samples: Float32Array): AudioBuffer {
    const buffer = this.context!.createBuffer(1, samples.length, SCORE_RATE); buffer.getChannelData(0).set(samples); return buffer;
  }
  private startStems(preservePhase: boolean) {
    const context = this.context!;
    const buffers = [0, 1, 2].map(voice => { const samples = createStem(voice, SCORE_RATE, moodFor(this.scene)); return this.buffer(this.scene === 'studio' && this.mix.reversed ? reverseSamples(samples) : samples); });
    const when = context.currentTime + .04;
    const offset = preservePhase ? Math.max(0, when - this.epoch) % SCORE_SECONDS : 0;
    if (!preservePhase) this.epoch = when;
    // Every voice uses exactly the same scheduled start and loop offset.
    const pending: Loop[] = [];
    try {
      for (const voice of [0, 1, 2]) {
        const source = context.createBufferSource(), gain = context.createGain(); pending.push({ source, gain });
        source.buffer = buffers[voice]; source.loop = true; source.loopStart = 0; source.loopEnd = SCORE_SECONDS;
        source.connect(gain); gain.connect(this.music!); gain.gain.value = 0; source.start(when, offset);
      }
    } catch (error) { pending.forEach(loop => this.stopLoop(loop)); throw error; }
    const previous = this.loops;
    this.loops = pending;
    this.stemsAt = when;
    this.fadeStems(previous, when);
  }
  private fadeStems(previous: Loop[], when: number) {
    if (this.hidden) {
      previous.forEach(loop => this.stopLoop(loop));
      this.clearFade();
      return;
    }
    this.fading.push(...previous);
    for (const loop of previous) {
      loop.gain.gain.cancelScheduledValues(when);
      loop.gain.gain.setTargetAtTime(0, when, .025);
      loop.source.onended = () => {
        this.disconnectLoop(loop);
        this.fading = this.fading.filter(source => source !== loop);
      };
      loop.source.stop(when + STEM_FADE_SECONDS);
    }
  }
  private clearFade() {
    for (const loop of this.fading) this.disconnectLoop(loop);
    this.fading = [];
  }
  private startAmbience() {
    const buffer = this.buffer(createAmbience()), source = this.context!.createBufferSource(); source.buffer = buffer; source.loop = true;
    source.connect(this.ambience!); source.start(this.context!.currentTime + .04); this.ambienceSource = source;
  }
  private async startChant(context: AudioContext) {
    if (!this.chantUrl || this.chant || this.chantRequest || this.closed) return;
    const request = new AbortController();
    this.chantRequest = request;
    const release = () => { if (this.chantRequest === request) this.chantRequest = undefined; };
    const timeout = setTimeout(() => { release(); request.abort(); }, 8000);
    try {
      const response = await fetch(this.chantUrl, { signal: request.signal });
      if (!response.ok) return;
      const data = await response.arrayBuffer();
      if (request.signal.aborted) return;
      const buffer = await context.decodeAudioData(data);
      if (request.signal.aborted) return;

      const source = context.createBufferSource(), gain = context.createGain();
      const loop = { source, gain };
      try {
        source.buffer = buffer;
        source.loop = true;
        gain.gain.value = 0;
        source.connect(gain);
        gain.connect(this.music!);
        source.start(context.currentTime + .04);
        this.chant = loop;
        this.applyGains();
      } catch {
        this.chant = undefined;
        this.stopLoop(loop);
      }
    } catch {
      // The room score and effects are already running. An explicit enable can retry the chant.
    } finally {
      clearTimeout(timeout);
      release();
    }
  }
  private applyGains() {
    if (!this.context || !this.master) return;
    const at = this.context.currentTime;
    const gain = (node: GainNode | undefined, value: number) => { node?.gain.setTargetAtTime(value, at, .025); };
    this.master.gain.cancelScheduledValues(at);
    if (this.preferences.muted) this.master.gain.setValueAtTime(0, at); else gain(this.master, this.preferences.masterVolume);
    gain(this.ambience, this.preferences.ambienceVolume * (this.scene === 'cabin' ? .8 : this.scene === 'tower' ? .65 : 1));
    gain(this.music, this.preferences.musicVolume * (this.scene === 'studio' ? this.mix.speakersOpen ? 1 : .12 : this.scene === 'cabin' ? .5 : .7));
    gain(this.effects, this.preferences.effectsVolume);
    const chantLevel = this.chant ? CHANT_LEVEL[this.scene] : 0;
    this.chant?.gain.gain.setTargetAtTime(chantLevel, at, .24);
    const stemTime = Math.max(at, this.stemsAt);
    this.loops.forEach((loop, i) => {
      const level = this.scene === 'studio' ? Number(this.mix.channels[i]) : [.6, .25, .5][i] * (1 - chantLevel);
      loop.gain.gain.cancelScheduledValues(stemTime);
      loop.gain.gain.setTargetAtTime(level, stemTime, .025);
    });
  }
  effect(kind: 'fill' | 'empty' | 'pour' | 'timer' | 'dial' | 'success' | 'lamp' | 'card' | 'memory' | 'shadow' | 'flower' | 'thread' | 'receipt') {
    if (!this.context || this.context.state !== 'running' || this.hidden || this.preferences.muted || !this.effects) return;
    const context = this.context, start = context.currentTime + .005;
    const notes = kind === 'flower' ? [329.63, 392, 493.88, 659.25] : kind === 'thread' ? [293.66, 349.23, 392, 440, 587.33] : kind === 'receipt' ? [196, 261.63, 329.63] : kind === 'success' ? [293.665, 349.228, 440] : kind === 'memory' ? [659.25, 880, 1046.5] : kind === 'shadow' ? [146.83, 155.56] : [kind === 'lamp' ? 392 : kind === 'card' ? 740 : kind === 'timer' ? 880 : kind === 'dial' ? 523.25 : kind === 'pour' ? 190 : 260];
    for (const [i, frequency] of notes.entries()) {
      const when = start + i * .06;
      const oscillator = context.createOscillator(), envelope = context.createGain(); oscillator.type = kind === 'pour' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, when); if (kind === 'pour' || kind === 'empty') oscillator.frequency.exponentialRampToValueAtTime(frequency * .55, when + .22);
      const duration = kind === 'success' ? .9 : .25;
      envelope.gain.setValueAtTime(0, when); envelope.gain.linearRampToValueAtTime(.1, when + .015); envelope.gain.exponentialRampToValueAtTime(.0001, when + duration);
      oscillator.connect(envelope); envelope.connect(this.effects); this.oneShots.add(oscillator);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); this.oneShots.delete(oscillator); };
      oscillator.start(when); oscillator.stop(when + duration);
    }
  }
  async setHidden(hidden: boolean) {
    this.hidden = hidden;
    const request = ++this.visibilityRequest;
    if (!this.context || this.closed) return;
    const current = () => request === this.visibilityRequest && !this.closed;
    try {
      if (hidden) {
        await this.context.suspend();
        if (current()) this.publish(this.preferences.muted ? 'off' : 'paused');
      } else if (!this.preferences.muted) {
        await this.resume();
        if (!current()) return;
        if (this.context.state !== 'running') this.publish('blocked');
        else if (!this.loops.length) await this.enable();
        else this.publish(this.preferences.muted ? 'off' : 'playing');
      }
    } catch { if (current()) this.publish('blocked'); }
  }
  private disconnectLoop(loop: Loop) { loop.source.onended = null; loop.source.disconnect(); loop.gain.disconnect(); }
  private stopLoop(loop: Loop) { try { loop.source.stop(); } catch { /* A finished or unstarted source needs no stop. */ } this.disconnectLoop(loop); }
  private stopLoops() { this.loops.forEach(loop => this.stopLoop(loop)); this.loops = []; }
  dispose() {
    this.closed = true; this.stopLoops(); this.clearFade(); this.ambienceSource?.stop(); this.ambienceSource?.disconnect();
    this.chantRequest?.abort();
    if (this.chant) { this.stopLoop(this.chant); this.chant = undefined; }
    for (const source of this.oneShots) { try { source.stop(); } catch { /* Already ended. */ } source.disconnect(); }
    this.oneShots.clear(); void this.context?.close().catch(() => undefined); this.listeners.clear();
  }
}
