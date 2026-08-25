import type { Store } from "../state/store";
import { createEl, qs } from "../utils/dom";
import { saveBlob, slugifyFileName } from "../export/download";
import { toast } from "./toast";
import { announce } from "./statusRegion";

interface ExportOption {
  id: string;
  icon: string;
  title: string;
  description: string;
  /** Appended after the slugified project name — include a distinguishing suffix before the extension so e.g. the images and SVG exports (both .zip) never collide. */
  fileSuffix: string;
  run: (store: Store) => Promise<Blob>;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: "pdf",
    icon: "📄",
    title: "PDF (empfohlen zum Drucken)",
    description: "Alle Karten als druckfertiges PDF – Vorderseiten, dann Rückseiten, passend zum Umdrehen des Papierstapels.",
    fileSuffix: "pdf",
    run: async (store) => (await import("../export/pdf")).generatePdfBlob(store.getProject()),
  },
  {
    id: "word",
    icon: "📝",
    title: "Word-Dokument",
    description: "Alle Karteninhalte als strukturiertes .docx-Dokument, zum Weiterbearbeiten oder Ausdrucken.",
    fileSuffix: "docx",
    run: async (store) => (await import("../export/word")).generateWordBlob(store.getProject()),
  },
  {
    id: "images",
    icon: "🖼️",
    title: "Bilder (ZIP)",
    description: "Jede Karten-Vorder- und Rückseite als einzelne PNG-Datei, gebündelt in einer ZIP-Datei.",
    fileSuffix: "bilder.zip",
    run: async (store) => (await import("../export/images")).generateImagesZipBlob(store.getProject()),
  },
  {
    id: "svg",
    icon: "📐",
    title: "Masterkarte als SVG",
    description: "Vorder- und Rückseite der Masterkarte als vektorbasierte SVG-Dateien (ZIP), z. B. für Weiterverarbeitung in Design-Tools.",
    fileSuffix: "masterkarte.zip",
    run: async (store) => (await import("../export/svg")).generateMasterSvgZipBlob(store.getProject()),
  },
];

export function mountExportPanel(store: Store): void {
  const root = qs("#export-workspace");
  const grid = createEl("div", { class: "export-grid" });

  for (const option of EXPORT_OPTIONS) {
    const card = createEl("section", { class: "export-card", "aria-labelledby": `export-${option.id}-title` });
    card.append(
      createEl("div", { class: "export-card__icon", "aria-hidden": "true" }, [option.icon]),
      createEl("h3", { id: `export-${option.id}-title` }, [option.title]),
      createEl("p", { class: "field__hint" }, [option.description]),
    );
    const button = createEl("button", { type: "button", class: "btn btn--primary" }, ["Exportieren"]);
    button.addEventListener("click", () => runExport(store, option, button as HTMLButtonElement));
    card.append(button);
    grid.append(card);
  }

  root.append(grid);
}

async function runExport(store: Store, option: ExportOption, button: HTMLButtonElement): Promise<void> {
  const project = store.getProject();
  if (project.cards.length === 0) {
    toast("Lege zuerst mindestens eine Karte an.", "danger");
    return;
  }
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Wird erstellt …";
  announce(`${option.title} wird erstellt …`);
  try {
    const blob = await option.run(store);
    const fileName = `${slugifyFileName(project.name)}.${option.fileSuffix}`;
    saveBlob(blob, fileName);
    toast(`${option.title} heruntergeladen.`, "success");
  } catch (error) {
    console.error(error);
    toast(`Export fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`, "danger");
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}
