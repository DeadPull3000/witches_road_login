import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { DEFAULT_PREFERENCES, preferencesSchema, runSchema, type Preferences, type RunState } from '../game/state';

interface RoadDatabase extends DBSchema {
  runs: { key: string; value: { current: unknown; previous: unknown | null } };
  meta: { key: string; value: unknown };
  collection: { key: string; value: string[] };
}
export type LoadResult = { kind: 'loaded' | 'recovered'; run: RunState; raw?: unknown } | { kind: 'empty' } | { kind: 'corrupt'; raw: unknown };
export class ConflictError extends Error { constructor() { super('Another tab saved a newer journey. Your action was not replayed.'); } }
const collectionIds = (value: unknown): string[] => Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && id.length <= 80) : [];
export interface SaveRepository {
  loadActive(): Promise<LoadResult>;
  load(id: string): Promise<LoadResult>;
  save(run: RunState, expectedRevision: number | null, activate?: boolean): Promise<string[]>;
  getCollection(): Promise<string[]>;
  list(): Promise<RunState[]>;
  setActive(id: string): Promise<void>;
  getPreferences(): Promise<Preferences>;
  savePreferences(preferences: Preferences): Promise<void>;
}

export class IndexedRepository implements SaveRepository {
  private connection?: Promise<IDBPDatabase<RoadDatabase>>;
  constructor(private name = 'witches-road') {}
  private db() {
    return this.connection ??= openDB<RoadDatabase>(this.name, 1, {
      upgrade(db) { db.createObjectStore('runs'); db.createObjectStore('meta'); db.createObjectStore('collection'); },
      blocked() { /* Upgrades wait for older database connections to close. */ },
    });
  }
  async loadActive(): Promise<LoadResult> {
    const db = await this.db(); const id = await db.get('meta', 'active');
    return typeof id === 'string' ? this.load(id) : { kind: 'empty' };
  }
  async load(id: string): Promise<LoadResult> {
    const db = await this.db(); const stored = await db.get('runs', id);
    if (!stored) return { kind: 'empty' };
    const current = runSchema.safeParse(stored.current);
    if (current.success) return { kind: 'loaded', run: current.data };
    const previous = runSchema.safeParse(stored.previous);
    return previous.success ? { kind: 'recovered', run: previous.data, raw: stored.current } : { kind: 'corrupt', raw: stored };
  }
  async save(run: RunState, expectedRevision: number | null, activate = true): Promise<string[]> {
    const valid = runSchema.parse(run); const db = await this.db();
    const tx = db.transaction(['runs', 'meta', 'collection'], 'readwrite');
    // Attach immediately: aborts must not become unhandled rejected promises.
    const completion = tx.done.catch(error => { throw error; });
    void completion.catch(() => undefined);
    try {
      const store = tx.objectStore('runs'); const stored = await store.get(valid.runId);
      if (expectedRevision === null ? stored !== undefined : !stored || (stored.current as { revision?: unknown })?.revision !== expectedRevision) throw new ConflictError();
      if (expectedRevision !== null && valid.revision <= expectedRevision) throw new Error('Save revision must advance.');
      await store.put({ current: valid, previous: stored?.current ?? null }, valid.runId);
      if (activate) await tx.objectStore('meta').put(valid.runId, 'active');
      const collection = tx.objectStore('collection'); const found = collectionIds(await collection.get('discoveries'));
      const merged = [...new Set([...found, ...valid.discoveries])];
      await collection.put(merged, 'discoveries');
      await completion;
      return merged;
    } catch (error) {
      try { tx.abort(); } catch { /* Transaction may already have aborted. */ }
      await completion.catch(() => undefined); throw error;
    }
  }
  async getCollection(): Promise<string[]> { const db = await this.db(); return collectionIds(await db.get('collection', 'discoveries')); }
  async list(): Promise<RunState[]> {
    const db = await this.db(); const records = await db.getAll('runs');
    return records.flatMap(record => { const value = runSchema.safeParse(record.current); return value.success ? [value.data] : []; });
  }
  async setActive(id: string): Promise<void> { const db = await this.db(); await db.put('meta', id, 'active'); }
  async getPreferences(): Promise<Preferences> { const db = await this.db(); const value = preferencesSchema.safeParse(await db.get('meta', 'preferences')); return value.success ? value.data : { ...DEFAULT_PREFERENCES }; }
  async savePreferences(preferences: Preferences): Promise<void> { const db = await this.db(); await db.put('meta', preferencesSchema.parse(preferences), 'preferences'); }
  async close() { const db = await this.connection; db?.close(); this.connection = undefined; }
}
