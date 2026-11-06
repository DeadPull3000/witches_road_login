import { applyCommand, type Command } from './commands';
import { createRun, DEFAULT_PREFERENCES, preferencesSchema, runSchema, type Preferences, type RunState } from './state';
import { ConflictError, type SaveRepository } from '../persistence/repository';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'recovered' | 'conflict';
export interface SessionView { run: RunState; status: SaveStatus; message: string; busy: boolean; preferences: Preferences; collection: readonly string[]; recoveryExport: unknown | null; lastCommand: Command | null }

export class GameSession {
  private listeners = new Set<() => void>();
  private queue: Promise<void> = Promise.resolve();
  private baseRevision: number | null = null;
  private view: SessionView;
  constructor(private repository: SaveRepository, run = createRun()) {
    this.view = { run, status: 'unsaved', message: 'Welcome to Westview. Choose a fictional borrowing alias.', busy: false, preferences: { ...DEFAULT_PREFERENCES }, collection: [], recoveryExport: null, lastCommand: null };
  }
  getSnapshot = () => this.view;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private publish(change: Partial<SessionView>) { this.view = { ...this.view, ...change }; this.listeners.forEach(listener => listener()); }
  private enqueue(operation: () => Promise<void>) { this.queue = this.queue.then(operation, operation); return this.queue; }
  private readCollection() { return this.repository.getCollection().catch(() => this.view.collection); }
  async boot() {
    try {
      const loaded = await this.repository.loadActive();
      if (loaded.kind === 'loaded') { this.baseRevision = loaded.run.revision; this.publish({ run: loaded.run, status: 'saved', collection: await this.readCollection(), message: 'Your journey is restored.' }); }
      else if (loaded.kind === 'recovered') {
        // Preserve both the damaged original and valid checkpoint. Continue as a new slot.
        const recovered = { ...loaded.run, runId: crypto.randomUUID(), revision: 0 };
        this.baseRevision = null; this.publish({ run: recovered, recoveryExport: loaded.raw, status: 'recovered', message: 'Recovered the previous checkpoint in a new slot. The damaged original remains available for export.' });
        this.publish(await this.persist(recovered));
      } else if (loaded.kind === 'corrupt') {
        this.publish({ recoveryExport: loaded.raw, message: 'This save could not be read. It has been retained for export; a new journey is available.' });
        this.publish(await this.persist(this.view.run));
      } else this.publish(await this.persist(this.view.run));
      this.publish({ preferences: await this.repository.getPreferences() });
    } catch { this.publish({ status: 'unsaved', message: 'Browser saving is unavailable. You can still play; export your journey before closing.' }); }
  }
  private async persist(run: RunState, activate = true): Promise<Pick<SessionView, 'status' | 'collection'>> {
    try {
      const collection = await this.repository.save(run, this.baseRevision, activate);
      this.baseRevision = run.revision;
      return { status: 'saved', collection };
    } catch (error) { if (error instanceof ConflictError) throw error; return { status: 'unsaved', collection: this.view.collection }; }
  }
  dispatch = (command: Command) => {
    const at = Date.now();
    return this.enqueue(async () => {
      this.publish({ busy: true });
      try {
        const result = applyCommand(this.view.run, command, this.view.collection, at);
        if (result.state === this.view.run) {
          if (result.message) this.publish({ message: result.message });
          return;
        }
        this.publish({ status: 'saving' });
        const accepted: Command = result.timedOut ? { type: 'TRIAL_TIMEOUT' } : command;
        const automatic = accepted.type === 'TRIAL_TIMEOUT' || accepted.type === 'START_TRIAL_CLOCK';
        const save = await this.persist(result.state, !automatic);
        this.publish({ run: result.state, ...save, message: result.message || this.view.message, lastCommand: accepted });
      } catch (error) {
        if (error instanceof ConflictError) {
          const branch = this.view.run;
          try {
            const latest = await this.repository.load(branch.runId);
            if (latest.kind === 'loaded') { this.baseRevision = latest.run.revision; this.publish({ run: latest.run, status: 'conflict', collection: await this.readCollection(), message: error.message, recoveryExport: branch, lastCommand: null }); }
            else this.publish({ status: 'unsaved', message: 'Another tab changed this slot and its latest save is unreadable. Export this branch before resuming elsewhere.' });
          } catch { this.publish({ status: 'unsaved', message: 'Unable to load the latest tab state. Export your branch; no overwrite was attempted.' }); }
        } else this.publish({ message: error instanceof Error ? error.message : 'That action could not be completed.' });
      } finally { this.publish({ busy: false }); }
    });
  };
  retrySave = () => this.enqueue(async () => {
    this.publish({ busy: true });
    try { const save = await this.persist(this.view.run); this.publish({ ...save, message: save.status === 'saved' ? 'Your journey is saved again.' : 'Saving is still unavailable. Export is available.' }); }
    catch (error) { this.publish({ status: 'unsaved', recoveryExport: this.view.run, message: error instanceof ConflictError ? 'Another tab changed the saved base. Export this branch, then resume the saved slot; it was not overwritten.' : 'Retry failed.' }); }
    finally { this.publish({ busy: false }); }
  });
  newJourney = (mode: RunState['mode']) => this.enqueue(async () => {
    this.publish({ busy: true });
    try { const run = createRun(mode); this.baseRevision = null; const save = await this.persist(run); this.publish({ run, ...save, lastCommand: null, message: `A new ${mode} journey. Older slots are kept.` }); }
    finally { this.publish({ busy: false }); }
  });
  resume = (id: string) => this.enqueue(async () => {
    this.publish({ busy: true });
    try { const loaded = await this.repository.load(id); if (loaded.kind !== 'loaded') throw new Error('This slot is not readable. Export the retained data before starting another.'); await this.repository.setActive(id); this.baseRevision = loaded.run.revision; this.publish({ run: loaded.run, status: 'saved', collection: await this.readCollection(), lastCommand: null, message: 'Saved journey resumed.' }); }
    catch (error) { this.publish({ message: error instanceof Error ? error.message : 'Unable to resume.' }); }
    finally { this.publish({ busy: false }); }
  });
  listRuns = () => this.repository.list();
  exportRun = () => JSON.stringify(this.view.run, null, 2);
  importRun = (text: string) => this.enqueue(async () => {
    this.publish({ busy: true });
    try {
      if (text.length > 1_000_000) throw new Error('Save file is too large (maximum 1 MB).');
      const parsed = runSchema.safeParse(JSON.parse(text));
      if (!parsed.success) throw new Error('Unsupported or invalid save. The current journey has not been changed.');
      const imported = { ...parsed.data, runId: crypto.randomUUID(), revision: 0 };
      this.baseRevision = null; const save = await this.persist(imported); this.publish({ run: imported, ...save, lastCommand: null, message: 'Imported as a new slot. Existing journeys were kept.' });
    } catch (error) { this.publish({ message: error instanceof Error ? error.message : 'Invalid save file.' }); }
    finally { this.publish({ busy: false }); }
  });
  setPreferences = (update: Partial<Preferences>) => this.enqueue(async () => {
    const preferences = preferencesSchema.parse({ ...this.view.preferences, ...update }); this.publish({ preferences });
    try { await this.repository.savePreferences(preferences); }
    catch { this.publish({ message: 'Preferences apply for this visit; browser storage could not retain them.' }); }
  });
}
