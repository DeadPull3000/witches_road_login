import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Production-export verification only: decode both files and compare every visible RGBA pixel.
// FFmpeg's lossless WebP encoder can discard RGB beneath alpha=0, which has no visible effect.
const root = new URL('../', import.meta.url);
const i6 = process.argv.includes('--i6');
const phaseF = process.argv.includes('--phase-f');
const earlier = [
  ['cottage/cottage-dusk.png', 'world/cottage-dusk.webp'],
  ['cottage/cottage-dusk-portrait.png', 'world/cottage-dusk-portrait.webp'],
  ['cottage/agatha-road.png', 'world/agatha-road.webp'],
];
const roomArt = [
  'threshold/coven-cellar',
  'kitchen/kitchen-tide', 'kitchen/jen-road',
  'studio/studio-amber', 'studio/alice-road',
  'cabin/cabin-violet',
  'tower/tower-divination', 'tower/lilia-road',
  'greenhouse/greenhouse-earth', 'greenhouse/rio-road',
  'cottage/cottage-room', 'library/library-afterhours',
  'cottage/cottage-room-portrait', 'library/library-afterhours-portrait',
];
const visionArt = ['vision/vision-annex-wide', 'vision/vision-annex-portrait', 'vision/vision-pale'];
const exportPairs = names => names.map(path => [path + '.png', path + '.webp']);
const assets = phaseF ? exportPairs(visionArt) : i6 ? [...exportPairs(roomArt), earlier[2]] : earlier;
const assetPath = path => fileURLToPath(new URL(`public/assets/${path}`, root));
function dimensions(path) {
  const result = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', assetPath(path)], { windowsHide: true });
  if (result.error || result.status !== 0) throw result.error ?? new Error(result.stderr.toString());
  return result.stdout.toString().trim();
}
function decode(path) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-threads', '1', '-i', assetPath(path), '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], { maxBuffer: 32_000_000, windowsHide: true });
  if (result.error || result.status !== 0) throw result.error ?? new Error(result.stderr.toString());
  return result.stdout;
}
const records = assets.map(([source, runtime]) => {
  const before = decode(source), after = decode(runtime);
  if (before.length !== after.length) throw new Error(`Dimensions changed: ${runtime}`);
  const size = i6 || phaseF ? dimensions(source) : undefined;
  if (size && size !== dimensions(runtime)) throw new Error(`Dimensions changed: ${runtime}`);
  for (let i = 0; i < before.length; i += 4) {
    if (before[i + 3] !== after[i + 3] || before[i + 3] > 0 && (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2])) throw new Error(`Visible pixel changed: ${runtime}, pixel ${i / 4}`);
  }
  const sourceBytes = readFileSync(new URL(`public/assets/${source}`, root)).length, runtimeBytes = readFileSync(new URL(`public/assets/${runtime}`, root)).length;
  return { source, runtime, sourceBytes, runtimeBytes, visiblePixelsIdentical: true, decodedPixels: before.length / 4, ...(size ? { dimensions: size } : {}) };
});
const report = { method: 'FFmpeg libwebp lossless, compression_level=6, q=100. Decoded RGBA compared, ignoring RGB only where alpha=0.', assets: records };
writeFileSync(new URL(`docs/evidence/${phaseF ? 'phase-f' : i6 ? 'i6' : 'i1'}-export-verification.json`, root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
