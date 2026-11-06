/** An original eight-beat miniature; no show recordings or melodies are used. */
export const SCORE_RATE = 22050;
export const SCORE_SECONDS = 6;
const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export type ScoreMood = 'road' | 'studio' | 'cabin' | 'tower' | 'earth' | 'library' | 'vision';
const SCORES: Record<ScoreMood, number[][]> = {
  studio: [[50, 57, 62, 57, 53, 60, 65, 60], [69, 65, 62, 65, 72, 69, 65, 69], [38, 38, 45, 45, 41, 41, 48, 45]],
  road: [[62, 69, 65, 64, 62, 60, 57, 60], [77, 74, 72, 69, 72, 74, 69, 65], [38, 38, 41, 41, 36, 36, 33, 36]],
  cabin: [[50, 50, 53, 52, 50, 48, 49, 45], [62, 69, 65, 64, 62, 60, 61, 57], [26, 26, 29, 29, 26, 26, 33, 33]],
  tower: [[65, 72, 69, 76, 74, 69, 72, 65], [81, 79, 76, 77, 74, 76, 72, 77], [41, 41, 45, 45, 38, 38, 36, 41]],
  earth: [[57, 60, 64, 60, 55, 59, 62, 59], [72, 76, 79, 76, 71, 74, 77, 74], [33, 33, 36, 36, 31, 31, 35, 35]],
  library: [[60, 64, 67, 72, 69, 65, 67, 64], [76, 79, 84, 79, 77, 81, 79, 76], [36, 36, 40, 40, 41, 41, 43, 36]],
  vision: [[55, 62, 58, 67, 55, 60, 57, 62], [79, 74, 82, 77, 79, 72, 81, 74], [31, 31, 38, 38, 29, 29, 36, 36]],
};
export function createStem(voice: number, rate = SCORE_RATE, mood: ScoreMood = 'studio'): Float32Array {
  const notes = SCORES[mood][voice];
  if (!notes) throw new Error('Unknown score voice');
  const length = Math.round(rate * SCORE_SECONDS), samples = new Float32Array(length), beat = SCORE_SECONDS / notes.length;
  for (let i = 0; i < length; i++) {
    const time = i / rate, step = Math.min(7, Math.floor(time / beat)), local = time % beat;
    const envelope = Math.sin(Math.PI * local / beat) ** 2 * Math.exp(-local * (voice === 1 ? 4 : 1.6));
    const phase = 2 * Math.PI * frequency(notes[step]) * local;
    samples[i] = (.13 * Math.sin(phase) + .025 * Math.sin(phase * 2)) * envelope;
  }
  return samples;
}
export function createAmbience(rate = SCORE_RATE): Float32Array {
  const samples = new Float32Array(Math.round(rate * SCORE_SECONDS)); let seed = 1693, filtered = 0;
  for (let i = 0; i < samples.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    filtered = filtered * .985 + ((seed / 0xffffffff) * 2 - 1) * .015;
    const fade = Math.min(1, i / 800, (samples.length - 1 - i) / 800);
    samples[i] = filtered * .25 * fade;
  }
  return samples;
}
export function reverseSamples(samples: Float32Array): Float32Array { return samples.slice().reverse(); }
