import { describe, expect, it, vi } from 'vitest';
import { SCENES, TRIALS } from '../../src/content/scenes';
import { createRun, canEnter } from '../../src/game/state';
import { mapLocations, roomDoor } from '../../src/world/navigation';
import { ResourceSwitch, type ResourceLease } from '../../src/world/resourceSwitch';
import { nextWorldCue } from '../../src/world/useWorldCues';
import { worldLayout, worldObjectBounds } from '../../src/world/layout';
import { sceneObjects } from '../../src/scenes/objects';
import { annexRun, completedRun, move, solveCurrent, throughTrial } from '../helpers';

describe('shared map and doorway policy', () => {
  it('exposes exactly the domain-authorized destinations at every checkpoint without changing the run', () => {
    for (const state of [createRun(), ...TRIALS.map(throughTrial), completedRun()]) {
      const before = JSON.stringify(state), locations = mapLocations(state);
      expect(locations.map(place => place.scene)).toEqual(SCENES.filter(scene => scene !== 'vision' || canEnter(state, scene))); expect(locations.filter(place => place.current)).toHaveLength(1);
      for (const place of locations) expect(place.available).toBe(canEnter(state, place.scene));
      expect(JSON.stringify(state)).toBe(before);
    }
  });
  it('locks the five trials and library on a fresh card while leaving the optional garden reachable', () => {
    const run = createRun(), map = mapLocations(run);
    expect(map.filter(place => place.available).map(place => place.scene)).toEqual(['cottage', 'garden']); expect(roomDoor(run)).toBeNull();
  });
  it.each(TRIALS)('provides the %s exit only after its existing completion rule succeeds', scene => {
    const before = throughTrial(scene); expect(roomDoor(before)).toBeNull();
    const solved = solveCurrent(before), door = roomDoor(solved)!;
    expect(door.command.type).toBe('ENTER_SCENE');
    const arrived = move(solved, door.command); expect(arrived.currentScene).not.toBe(scene); expect(arrived.puzzles[scene].solved).toBe(true);
  });
  it('keeps library entry on the knocker and preserves the five-seal/unbinding requirements', () => {
    const home = move(solveCurrent(throughTrial('greenhouse')), { type: 'ENTER_SCENE', scene: 'cottage' });
    expect(roomDoor(home)).toBeNull(); expect(mapLocations(home).find(place => place.scene === 'account')!.available).toBe(false);
    const unbound = move(home, { type: 'UNBIND' }); expect(roomDoor(unbound)!.command).toEqual({ type: 'SIGN_IN' });
    expect(mapLocations(unbound).find(place => place.scene === 'account')!.available).toBe(false);
    const inside = move(unbound, roomDoor(unbound)!.command); expect(inside.currentScene).toBe('account'); expect(roomDoor(inside)!.command).toEqual({ type: 'SIGN_OUT' });
  });
  it('covers each room uniformly and leaves cropped props on the complete object page', () => {
    const account = completedRun();
    for (const scene of SCENES) for (const [width, height] of [[390,844],[1280,800]]) {
      const state = scene === 'account' ? account : scene === 'vision' ? annexRun(account) : move(account, { type: 'ENTER_SCENE', scene });
      const layout = worldLayout(state, width, height), rect = layout.backgroundRect;
      expect(rect.x).toBeLessThanOrEqual(0); expect(rect.y).toBeLessThanOrEqual(0); expect(rect.x + rect.width).toBeGreaterThanOrEqual(width - .001); expect(rect.y + rect.height).toBeGreaterThanOrEqual(height - .001);
    }
    const studio = throughTrial('studio'), layout = worldLayout(studio, 390, 844), record = sceneObjects(studio).find(object => object.id === 'studio.record')!;
    expect(worldObjectBounds(record, layout)).toBeNull(); expect(sceneObjects(studio)).toContainEqual(record);
  });
});

describe('persistent renderer resource switching', () => {
  function setup() {
    const pending = new Map<string, { resolve: (lease: ResourceLease<string>) => void; reject: (error: Error) => void }>();
    const acquire = vi.fn((ids: readonly string[]) => new Promise<ResourceLease<string>>((resolve, reject) => pending.set(ids[0], { resolve, reject })));
    const resources = new ResourceSwitch(acquire), install = vi.fn();
    const resolve = (id: string) => { const release = vi.fn(); pending.get(id)!.resolve({ resources: { [id]: id }, release }); return release; };
    return { resources, install, acquire, pending, resolve };
  }
  it('releases the previous room only after the replacement is installed', async () => {
    const x = setup(), first = x.resources.replace(['cottage'], x.install), releaseFirst = x.resolve('cottage'); await first;
    const second = x.resources.replace(['kitchen'], x.install); expect(releaseFirst).not.toHaveBeenCalled();
    const releaseSecond = x.resolve('kitchen'); await second; expect(x.install).toHaveBeenLastCalledWith({ kitchen: 'kitchen' }); expect(releaseFirst).toHaveBeenCalledOnce();
    x.resources.dispose(); x.resources.dispose(); expect(releaseSecond).toHaveBeenCalledOnce();
  });
  it('discards a slow obsolete room instead of replacing the newer destination', async () => {
    const x = setup(), older = x.resources.replace(['kitchen'], x.install), newer = x.resources.replace(['tower'], x.install);
    const releaseNew = x.resolve('tower'); expect(await newer).toBe(true);
    const releaseOld = x.resolve('kitchen'); expect(await older).toBe(false); expect(releaseOld).toHaveBeenCalledOnce(); expect(x.install).toHaveBeenCalledOnce(); expect(x.install).toHaveBeenCalledWith({ tower: 'tower' });
    x.resources.dispose(); expect(releaseNew).toHaveBeenCalledOnce();
  });
  it('suppresses obsolete failures, and releases work that finishes after disposal', async () => {
    const x = setup(), older = x.resources.replace(['kitchen'], x.install), newer = x.resources.replace(['tower'], x.install);
    x.pending.get('kitchen')!.reject(new Error('old missing texture')); expect(await older).toBe(false);
    x.resources.dispose(); const release = x.resolve('tower'); expect(await newer).toBe(false); expect(release).toHaveBeenCalledOnce(); expect(x.install).not.toHaveBeenCalled();
    expect(await x.resources.replace(['cottage'], x.install)).toBe(false); expect(x.acquire).toHaveBeenCalledTimes(2);
  });
  it('surfaces a current failure and releases a replacement whose installation fails', async () => {
    const x = setup(), failed = x.resources.replace(['cottage'], x.install); x.pending.get('cottage')!.reject(new Error('current texture failed'));
    await expect(failed).rejects.toThrow('current texture failed');
    const badInstall = x.resources.replace(['tower'], () => { throw new Error('GPU install'); }), release = x.resolve('tower');
    await expect(badInstall).rejects.toThrow('GPU install'); expect(release).toHaveBeenCalledOnce(); x.resources.dispose();
  });
});

describe('shared world cue guards', () => {
  it('plays acceptance cues once and never treats loading or importing a saved run as an action', () => {
    const cabin = throughTrial('cabin'), shadow = move(cabin, { type: 'CHECK_LAMPS' });
    expect(nextWorldCue(cabin, shadow, { type: 'CHECK_LAMPS' })).toBe('shadow'); expect(nextWorldCue(shadow, shadow, null)).toBeNull();
    expect(nextWorldCue(cabin, shadow, null)).toBeNull();
    expect(nextWorldCue(cabin, { ...shadow, runId: crypto.randomUUID() }, null)).toBeNull();
    const account = completedRun(), renewed = move(account, { type: 'RENEW_BOOK' });
    expect(nextWorldCue(account, renewed, { type: 'RENEW_BOOK' })).toBe('receipt'); expect(nextWorldCue(renewed, renewed, null)).toBeNull();
  });
  it('retains accepted arrival cues when the same renderer changes rooms', () => {
    const greenhouse = solveCurrent(throughTrial('greenhouse')), home = move(greenhouse, { type: 'ENTER_SCENE', scene: 'cottage' });
    expect(nextWorldCue(greenhouse, home, { type: 'ENTER_SCENE', scene: 'cottage' })).toBe('smoke');
    expect(nextWorldCue(home, move(home, { type: 'SET_COTTAGE_VIEW', view: 'inside' }), { type: 'SET_COTTAGE_VIEW', view: 'inside' })).toBeNull();
  });
});
