import { Application, Graphics } from 'pixi.js';
import { artUrl } from 'virtual:road-art';
import { ResourcePool } from '../scenes/resourcePool';
import type { RunState } from '../game/state';
import type { Flourish } from '../scenes/cues';
import { renderResolution, type WorldLayout, type Point } from './layout';
import { ResourceSwitch } from './resourceSwitch';
import { instrumentFrame } from './instruments';
import { atmosphereId, createAtmosphere } from './atmosphere';

// Paintings and portraits are composited by the browser. Lease decoded images without uploading them to WebGL.
const paintings = new ResourcePool<HTMLImageElement>(async url => {
  const image = new Image();
  image.src = artUrl(url);
  await image.decode();
  return image;
}, async () => {
  // Dropping the lease lets the browser collect the image. Clearing src can keep it detached in Chromium.
});
export type WorldVisual = { layout: WorldLayout; run: RunState; reduced: boolean; theft: boolean; flourish: Flourish | null; spellOrigin: Point | null; occluded: boolean };
export type WorldRenderer = { refresh: () => void; dispose: () => void };

/** One world application for every location, journey and menu. Only explicit renderer recovery recreates it. */
export async function mountWorld(host: HTMLElement, getVisual: () => WorldVisual, onStatus: (status: 'loading' | 'ready' | 'fallback') => void): Promise<WorldRenderer> {
  const app = new Application(); let initialized = false, disposed = false;
  const resources = new ResourceSwitch<HTMLImageElement>(ids => paintings.acquire(ids));
  let refresh = () => {};
  const visibility = () => refresh();
  const dispose = () => {
    if (disposed) return; disposed = true;
    delete host.dataset.paintReady;
    document.removeEventListener('visibilitychange', visibility);
    if (initialized) {
      app.canvas.removeEventListener('webglcontextlost', lost);
      try { app.destroy({ removeView: true, releaseGlobalResources: false }, { children: true }); } catch { /* DOM controls survive a damaged context. */ }
    }
    resources.dispose();
  };
  const lost = (event: Event) => { event.preventDefault(); onStatus('fallback'); dispose(); };
  try {
    const initial = getVisual();
    let { width, height } = initial.layout;
    let density = devicePixelRatio || 1;
    await app.init({ width, height, preference: 'webgl', antialias: false, resolution: renderResolution(width, height, density), autoDensity: true, manageImports: false, backgroundAlpha: 0 });
    initialized = true; app.ticker.remove(app.render, app);
    if (!host.isConnected) { dispose(); return { refresh, dispose }; }
    const light = new Graphics(), magic = new Graphics();
    const atmosphere = createAtmosphere();
    app.stage.addChild(light, atmosphere.container, magic);
    let requested = '', installed = '', discarded = 0;
    host.dataset.discardedLoads = '0';
    const loadScene = (visual: WorldVisual) => {
      const { background: image, character } = visual.layout, key = image + '|' + (character ?? '');
      if (key === requested) return;
      requested = key; delete host.dataset.paintReady; onStatus('loading');
      void resources.replace([image, ...(character ? [character] : [])], assets => {
        installed = key; host.dataset.activeAsset = image;
        const active = Object.values(assets);
        host.dataset.activeImages = String(active.length);
        host.dataset.rgbaBytes = String(active.reduce((bytes, { naturalWidth, naturalHeight }) => bytes + naturalWidth * naturalHeight * 4, 0));
      }).then(accepted => { if (!disposed) { if (accepted) { onStatus('ready'); refresh(); } else host.dataset.discardedLoads = String(++discarded); } }).catch(() => { if (!disposed) { onStatus('fallback'); dispose(); } });
    };
    let elapsed = 0, theftAt = 0, theftWasPlaying = false, flourishAt = 0, previousFlourish: Flourish | null = null, frameCount = 0, location = '';
    let paintedLayout: WorldLayout | null = null;
    const draw = (delta: number) => {
      const visual = getVisual(), { layout: l } = visual;
      app.ticker.maxFPS = visual.occluded || l.framing === 'portrait' ? 30 : 60;
      const currentDensity = devicePixelRatio || 1;
      if (width !== l.width || height !== l.height || density !== currentDensity) {
        width = l.width; height = l.height; density = currentDensity;
        app.renderer.resize(width, height, renderResolution(width, height, density));
      }
      elapsed += visual.reduced ? 0 : delta;
      const key = visual.run.runId + ':' + visual.run.currentScene + ':' + visual.run.cottageView;
      if (key !== location) { location = key; flourishAt = elapsed; previousFlourish = null; }
      if (visual.flourish !== previousFlourish) { previousFlourish = visual.flourish; flourishAt = elapsed; }
      const progress = Math.min(1, (elapsed - flourishAt) / 1400);
      loadScene(visual);
      if (l !== paintedLayout) {
        paintedLayout = l;
        light.clear();
        if (l.outside) light.ellipse(l.door.x + l.door.width / 2, l.door.y + l.door.height * .5, l.door.width * .9, l.door.height * .7).fill('#ffbb68');
      }
      light.alpha = visual.reduced ? .1 : .08 + Math.sin(elapsed / 1700) * .025;
      const mood = atmosphereId(visual.run.currentScene, l.outside);
      const particles = atmosphere.draw(mood, l, elapsed, visual.reduced, visual.occluded);
      if (host.dataset.atmosphere !== mood) {
        host.dataset.atmosphere = mood;
        host.dataset.ambientParticles = String(particles);
      }
      magic.clear();
      const unit = Math.max(1, Math.min(l.width, l.height) / 600);
      if (l.outside && visual.flourish === 'smoke') for (let i = 0; i < 8; i++) {
        const t = (progress + i / 8) % 1;
        magic.circle(l.chimney.x + Math.sin(t * Math.PI * 3) * 8 * unit, l.chimney.y - (1 - t) * 65 * unit, (3 + (1 - t) * 4) * unit).fill({ color: '#c6b4d8', alpha: .3 * t });
      }
      if (visual.flourish === 'unbinding' || visual.flourish === 'recognition') for (let i = 0; i < 14; i++) {
        const a = i * Math.PI * 2 / 14, radius = 20 + progress * 75;
        const x = Math.max(24, Math.min(l.width - 24, l.knocker.x));
        magic.circle(x + Math.cos(a) * radius, l.knocker.y + Math.sin(a) * radius, 2.5 * unit).fill({ color: '#d2e7b5', alpha: 1 - progress * .8 });
      }
      if (visual.flourish === 'receipt' && !visual.reduced) {
        for (let i = 0; i < 24; i++) {
          const angle = i * Math.PI / 12;
          const x = l.width * (.5 + Math.cos(angle) * progress * .48);
          const y = l.height * (.54 + Math.sin(angle) * progress * .44);
          magic.rect(x, y, 3 * unit, 4 * unit).fill({ color: '#f2d391', alpha: (1 - progress) * .65 });
        }
      }
      if (visual.run.currentScene === 'cabin' && visual.run.puzzles.cabin.shadowSeen) {
        const raise = visual.flourish === 'shadow' && !visual.reduced ? Math.sin(progress * Math.PI) * .08 : 0;
        const points = [[.58,.96],[.7,.18],[.6,.12],[.49,.22],[.47,.45],[.35,.28],[.29,.12-raise],[.22,.12-raise],[.27,.4],[.41,.65],[.39,.96]];
        magic.poly(points.flatMap(([x,y])=>[l.actor.x+l.actor.width*x,l.actor.y+l.actor.height*y])).fill({color:'#a56ac6',alpha:visual.flourish==='shadow'?.35:.12});
      }
      // The tower's world turns around the table; native cards and clue text remain upright.
      if (visual.run.currentScene === 'tower' && visual.flourish === 'inversion' && !visual.reduced) {
        const table = instrumentFrame(l.width,l.height,true,'tower'), x=table.x+table.width/2, y=table.y+table.height/2;
        for(let i=0;i<24;i++){
          const a=i*Math.PI/12+progress*Math.PI, radius=Math.max(l.width,l.height)*(.35+progress*.2);
          magic.poly([x+Math.cos(a)*radius,y+Math.sin(a)*radius*.7,x+Math.cos(a+.02)*radius,y+Math.sin(a+.02)*radius*.7,x+Math.cos(a+.02)*(radius+30*unit),y+Math.sin(a+.02)*(radius+30*unit)*.7]).fill({color:i%2?'#d5bb7e':'#b99bc6',alpha:(1-progress)*.6});
        }
      }
      if ((visual.flourish === 'flower' || visual.flourish === 'sessionFlower') && !visual.reduced) for(let i=0;i<18;i++){
        const x=((i*.618+.16)%1)*l.width, y=l.height*(1-progress)+Math.sin(i)*l.height*.15;
        magic.ellipse(x,y,4*unit,7*unit).fill({color:i%2?'#bd5976':'#df9392',alpha:(1-progress)*.65});
      }
      if (visual.flourish === 'diagnostics' && !visual.reduced) for (let index = 0; index < 12; index++) {
        const x = ((index * .618 + progress * .42) % 1) * l.width;
        const y = l.height * (.16 + (index / 13) * .69);
        magic.rect(x, y, 42 * unit, 2 * unit).fill({ color: '#b8e7ee', alpha: .5 * (1 - progress) });
      }
      if (visual.theft && !theftWasPlaying) theftAt = elapsed; theftWasPlaying = visual.theft;
      if (visual.theft && !visual.reduced) {
        const from = visual.spellOrigin ?? { x: l.card.x + l.card.width / 2, y: l.card.y }, to = { x: l.actor.x + l.actor.width * .48, y: l.actor.y + l.actor.height * .34 };
        for (let i = 0; i < 6; i++) {
          const t = Math.min(1, Math.max(0, (elapsed - theftAt - i * 65) / 900));
          magic.circle(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 75 * unit, 3 * unit).fill({ color: '#e8b9ff', alpha: 1 - t * .25 });
        }
      }
    };
    const frame = (delta: number) => {
      if (disposed) return;
      try {
        draw(delta);
        if (installed === requested) {
          app.render();
          if (!host.dataset.paintReady) host.dataset.paintReady = 'true';
          host.dataset.frames = String(++frameCount);
        }
        const leased = String(paintings.leasedCount), retiring = String(paintings.retiringCount);
        if (host.dataset.leasedImages !== leased) host.dataset.leasedImages = leased;
        if (host.dataset.retiringImages !== retiring) host.dataset.retiringImages = retiring;
      } catch { onStatus('fallback'); dispose(); }
    };
    app.ticker.add(ticker => frame(ticker.deltaMS));
    refresh = () => { if (disposed) return; frame(0); if (disposed) return; if (document.hidden || getVisual().reduced) app.ticker.stop(); else app.ticker.start(); };
    app.canvas.setAttribute('aria-hidden', 'true'); app.canvas.className = 'world-canvas';
    app.canvas.addEventListener('webglcontextlost', lost); host.appendChild(app.canvas);
    document.addEventListener('visibilitychange', visibility); refresh();
    if (disposed) throw new Error('The first world frame failed.');
    return { refresh, dispose };
  } catch (error) { dispose(); throw error; }
}
