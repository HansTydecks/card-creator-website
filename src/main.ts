import "./styles/main.css";
import { mountFooter } from "./ui/footer";
import { Store } from "./state/store";
import { createDefaultProject } from "./state/schema";
import { TabGroup } from "./ui/tabs";
import { mountProjectSetupPanel } from "./ui/projectSetupPanel";
import { mountMasterDesignPanel } from "./ui/masterDesignPanel";
import { mountCardsContentPanel } from "./ui/cardsContentPanel";
import { mountExportPanel } from "./ui/exportPanel";
import { qs } from "./utils/dom";
import { openModal, confirmDialog } from "./ui/modal";
import { toast } from "./ui/toast";
import { serializeProject, deserializeProject, ProjectFileError } from "./state/projectFile";
import { saveBlob, slugifyFileName } from "./export/download";

const store = new Store(createDefaultProject());

mountFooter();
mountProjectSetupPanel(store);
const editor = mountMasterDesignPanel(store);
mountCardsContentPanel(store);
mountExportPanel(store);

new TabGroup(qs(".tab-nav"), (tabId) => {
  if (tabId === "design") requestAnimationFrame(() => editor.resize(qs<HTMLElement>(".canvas-frame").clientWidth));
});

// --- undo/redo ---

const undoBtn = qs<HTMLButtonElement>("#btn-undo");
const redoBtn = qs<HTMLButtonElement>("#btn-redo");
undoBtn.addEventListener("click", () => store.undo());
redoBtn.addEventListener("click", () => store.redo());
store.subscribe(() => {
  undoBtn.disabled = !store.canUndo();
  redoBtn.disabled = !store.canRedo();
});

document.addEventListener("keydown", (e) => {
  const target = e.target as HTMLElement | null;
  const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
  if (!(e.ctrlKey || e.metaKey) || typing) return;
  if (e.key.toLowerCase() === "z" && !e.shiftKey) {
    e.preventDefault();
    store.undo();
  } else if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) {
    e.preventDefault();
    store.redo();
  }
});

// --- autosave status ---

const autosaveStatus = qs<HTMLElement>("#autosave-status");
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
store.subscribe(() => {
  autosaveStatus.textContent = "Wird gespeichert …";
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    autosaveStatus.textContent = "Automatisch gespeichert";
  }, 900);
});

// --- save/load project ---

const saveBtn = qs<HTMLButtonElement>("#btn-save-project");
saveBtn.addEventListener("click", () => {
  const project = store.getProject();
  const json = serializeProject(project);
  saveBlob(new Blob([json], { type: "application/json" }), `${slugifyFileName(project.name)}.json`);
  toast("Projekt gespeichert.", "success");
});

const loadBtn = qs<HTMLButtonElement>("#btn-load-project");
const loadInput = qs<HTMLInputElement>("#load-project-input");
loadBtn.addEventListener("click", () => loadInput.click());
loadInput.addEventListener("change", async () => {
  const file = loadInput.files?.[0];
  loadInput.value = "";
  if (!file) return;
  try {
    const text = await file.text();
    const project = deserializeProject(text);
    store.replaceProject(project);
    toast(`Projekt „${project.name}“ geladen.`, "success");
  } catch (error) {
    const message = error instanceof ProjectFileError ? error.message : "Die Datei konnte nicht gelesen werden.";
    openModal({ title: "Projekt konnte nicht geladen werden", body: message, actions: [{ label: "OK", variant: "primary" }] });
  }
});

// --- autosave restore prompt ---

const autosave = store.readAutosave();
if (autosave) {
  const savedAt = new Date(autosave.savedAt).toLocaleString("de-DE");
  confirmDialog(
    "Gespeicherten Stand wiederherstellen?",
    `Es wurde ein automatisch gespeicherter Stand vom ${savedAt} gefunden ("${autosave.project.name}"). Möchtest du dort weitermachen, oder mit einem neuen Projekt beginnen?`,
    "Wiederherstellen",
  ).then((restore) => {
    if (restore) {
      store.replaceProject(autosave.project);
      toast("Gespeicherter Stand wiederhergestellt.", "success");
    } else {
      store.clearAutosave();
    }
  });
}
