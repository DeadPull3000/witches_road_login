/** Serialize re-acquisition behind unloading, so a new scene never receives a destroyed texture. */
export class ResourcePool<T> {
  private entries = new Map<string, { refs: number; value: Promise<T> }>();
  private unloading = new Map<string, Promise<void>>();
  constructor(private load: (id: string) => Promise<T>, private unload: (id: string, value: T) => Promise<void>) {}
  get leasedCount() { return this.entries.size; }
  get retiringCount() { return this.unloading.size; }

  async acquire(ids: readonly string[]): Promise<{ resources: Record<string, T>; release: () => void }> {
    const unique = [...new Set(ids)];
    const records = unique.map(id => {
      let entry = this.entries.get(id);
      if (!entry) {
        entry = { refs: 0, value: (this.unloading.get(id) ?? Promise.resolve()).then(() => this.load(id)) };
        this.entries.set(id, entry);
      }
      entry.refs++;
      return { id, entry };
    });
    let released = false;
    const release = () => {
      if (released) return; released = true;
      for (const { id, entry } of records) if (--entry.refs === 0) {
        if (this.entries.get(id) === entry) this.entries.delete(id);
        const task = entry.value.then(value => this.unload(id, value), () => undefined).catch(() => undefined);
        this.unloading.set(id, task);
        void task.then(() => { if (this.unloading.get(id) === task) this.unloading.delete(id); });
      }
    };
    try { const values = await Promise.all(records.map(record => record.entry.value)); return { resources: Object.fromEntries(unique.map((id, i) => [id, values[i]])), release }; }
    catch (error) { release(); throw error; }
  }
}
