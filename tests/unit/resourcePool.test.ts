import { describe, expect, it, vi } from 'vitest';
import { ResourcePool } from '../../src/scenes/resourcePool';

describe('scene image ownership', () => {
  it('shares resources, releases only the final reference, and makes release idempotent', async () => {
    const load = vi.fn(async (id: string) => ({ id })), unload = vi.fn(async () => undefined), pool = new ResourcePool(load, unload);
    const first = await pool.acquire(['shared', 'a']), second = await pool.acquire(['shared', 'b']);
    expect(load.mock.calls.filter(call => call[0] === 'shared')).toHaveLength(1); expect(first.resources.shared).toBe(second.resources.shared);
    first.release(); first.release(); await vi.waitFor(() => expect(unload).toHaveBeenCalledWith('a', first.resources.a));
    expect(unload).not.toHaveBeenCalledWith('shared', first.resources.shared); second.release(); await vi.waitFor(() => expect(unload).toHaveBeenCalledWith('shared', second.resources.shared));
    expect(unload).toHaveBeenCalledTimes(3);
  });
  it('waits for an in-flight unload before loading a fresh texture', async () => {
    let finish!: () => void, generation = 0; const load = vi.fn(async () => ({ generation: ++generation }));
    const unload = vi.fn(() => new Promise<void>(resolve => { finish = resolve; })); const pool = new ResourcePool(load, unload);
    const old = await pool.acquire(['room']); old.release(); await vi.waitFor(() => expect(unload).toHaveBeenCalledTimes(1));
    const pending = pool.acquire(['room']); await Promise.resolve(); expect(load).toHaveBeenCalledTimes(1);
    finish(); const fresh = await pending; expect(load).toHaveBeenCalledTimes(2); expect(fresh.resources.room).not.toBe(old.resources.room);
    fresh.release(); await vi.waitFor(() => expect(unload).toHaveBeenCalledTimes(2)); finish();
  });
  it('releases successful parts of a failed bundle and permits a later retry', async () => {
    const load = vi.fn(async (id: string) => { if (id === 'missing') throw new Error('Missing'); return { id }; });
    const unload = vi.fn(async () => undefined), pool = new ResourcePool(load, unload);
    await expect(pool.acquire(['good', 'missing'])).rejects.toThrow('Missing'); await vi.waitFor(() => expect(unload).toHaveBeenCalledWith('good', { id: 'good' }));
    expect(unload).toHaveBeenCalledTimes(1); const retry = await pool.acquire(['good']); expect(retry.resources.good.id).toBe('good'); retry.release();
  });
});
