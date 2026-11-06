export type ResourceLease<T> = { resources: Record<string, T>; release: () => void };

/** Latest destination wins. Slow loads never install an old room or leak their texture lease. */
export class ResourceSwitch<T> {
  private generation = 0;
  private disposed = false;
  private active: ResourceLease<T> | null = null;
  constructor(private acquire: (ids: readonly string[]) => Promise<ResourceLease<T>>) {}
  async replace(ids: readonly string[], install: (resources: Record<string, T>) => void): Promise<boolean> {
    if (this.disposed) return false;
    const generation = ++this.generation;
    let next: ResourceLease<T>;
    try { next = await this.acquire(ids); }
    catch (error) { if (this.disposed || generation !== this.generation) return false; throw error; }
    if (this.disposed || generation !== this.generation) { next.release(); return false; }
    try { install(next.resources); } catch (error) { next.release(); throw error; }
    const previous = this.active; this.active = next; previous?.release(); return true;
  }
  dispose() { if (this.disposed) return; this.disposed = true; this.generation++; this.active?.release(); this.active = null; }
}
