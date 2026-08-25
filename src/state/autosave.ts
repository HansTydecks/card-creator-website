import { CURRENT_SCHEMA_VERSION, type Project } from "./schema";
import { deserializeProject } from "./projectFile";

const STORAGE_KEY = "card-creator:autosave";
const DEBOUNCE_MS = 800;

interface AutosaveEnvelope {
  schemaVersion: number;
  savedAt: string;
  project: Project;
}

export class Autosave {
  private timer: ReturnType<typeof setTimeout> | null = null;

  schedule(project: Project): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.writeNow(project), DEBOUNCE_MS);
  }

  writeNow(project: Project): void {
    try {
      const envelope: AutosaveEnvelope = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        project,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      // Quota exceeded or storage disabled (e.g. private browsing) — autosave
      // is a convenience, not a guarantee, so we fail silently here and let
      // explicit "Projekt speichern" remain the durable path.
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Returns the saved project + its timestamp, or null if none/corrupt. */
  read(): { project: Project; savedAt: string } | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const envelope = JSON.parse(raw) as AutosaveEnvelope;
      const project = deserializeProject(JSON.stringify(envelope.project));
      return { project, savedAt: envelope.savedAt };
    } catch {
      return null;
    }
  }
}
