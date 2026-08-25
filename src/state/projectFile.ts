import { CURRENT_SCHEMA_VERSION, type Project } from "./schema";

export class ProjectFileError extends Error {}

/** Migration steps keyed by the version they migrate *from*. Empty for now — there's only ever been schema v1 — but this is where a v1->v2 step would be added. */
const MIGRATIONS: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {};

export function serializeProject(project: Project): string {
  return JSON.stringify({ ...project, updatedAt: new Date().toISOString() }, null, 2);
}

export function deserializeProject(raw: string): Project {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new ProjectFileError("Die Datei enthält kein gültiges JSON.");
  }

  if (typeof data !== "object" || data === null) {
    throw new ProjectFileError("Unerwartetes Projektformat.");
  }

  let version = typeof data.schemaVersion === "number" ? data.schemaVersion : 0;
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new ProjectFileError(
      "Dieses Projekt wurde mit einer neueren Version von Card Creator erstellt und kann hier nicht geöffnet werden.",
    );
  }

  while (version < CURRENT_SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) {
      throw new ProjectFileError("Dieses Projektformat kann nicht mehr migriert werden.");
    }
    data = migrate(data);
    version += 1;
  }

  if (!isPlausibleProject(data)) {
    throw new ProjectFileError("Die Datei sieht nicht wie ein Card-Creator-Projekt aus.");
  }

  return data as unknown as Project;
}

function isPlausibleProject(data: Record<string, unknown>): boolean {
  return (
    typeof data.id === "string" &&
    typeof data.name === "string" &&
    typeof data.masterCard === "object" &&
    data.masterCard !== null &&
    Array.isArray(data.cards) &&
    typeof data.grid === "object" &&
    data.grid !== null
  );
}
