import type { Store } from "../state/store";
import type { CardNumberPosition, CardSide, TextureId, WatermarkPosition } from "../state/schema";
import { createEl, qs } from "../utils/dom";
import { TEXTURE_OPTIONS } from "../render/textureTiles";
import { CanvasEditor } from "./canvasEditor";
import { mountFieldsList } from "./fieldsList";
import { mountPropertiesPanel } from "./propertiesPanel";

const CARD_NUMBER_POSITIONS: [CardNumberPosition, string][] = [
  ["bottom-right", "Unten rechts"],
  ["bottom-left", "Unten links"],
  ["top-right", "Oben rechts"],
  ["top-left", "Oben links"],
];

export function mountMasterDesignPanel(store: Store): CanvasEditor {
  const root = qs("#design-workspace");
  root.classList.add("design-workspace");

  const sidebar = createEl("aside", { class: "design-sidebar" });
  const sideToggle = buildSideToggle(store);
  sidebar.append(sideToggle, ...buildControlSections(store), buildFieldsSection(store));

  const canvasArea = createEl("div", { class: "design-canvas-area" });
  const instructions = createEl(
    "p",
    { id: "canvas-instructions", class: "field__hint" },
    ["Klicken zum Auswählen, ziehen zum Verschieben. Pfeiltasten bewegen das ausgewählte Feld (Umschalt = fein), Entf löscht es."],
  );
  const canvasFrame = createEl("div", { class: "canvas-frame" });
  const canvas = createEl("canvas", { id: "card-preview", "aria-describedby": "canvas-instructions" });
  canvasFrame.append(canvas);
  canvasArea.append(instructions, canvasFrame);

  const propertiesPanel = createEl("div", { class: "element-properties", "aria-label": "Feld-Eigenschaften" });

  root.append(sidebar, canvasArea, propertiesPanel);

  const editor = new CanvasEditor(canvas, store);
  mountFieldsList(qs("#fields-list-container", sidebar), store);
  mountPropertiesPanel(propertiesPanel, store);

  const resizeObserver = new ResizeObserver(() => editor.resize(canvasFrame.clientWidth));
  resizeObserver.observe(canvasFrame);

  store.subscribe(() => refreshSidebar(store, sidebar));
  refreshSidebar(store, sidebar);

  return editor;
}

function buildSideToggle(store: Store): HTMLElement {
  const nav = createEl("div", { class: "side-toggle btn-group", role: "tablist", "aria-label": "Kartenseite" });
  for (const [side, label] of [["front", "Vorderseite"], ["back", "Rückseite"]] as [CardSide, string][]) {
    const btn = createEl("button", { type: "button", class: "btn btn--secondary", id: `side-${side}`, role: "tab", "aria-selected": "false" }, [label]);
    btn.addEventListener("click", () => {
      store.setEditorSide(side);
      store.selectField(side, null);
    });
    nav.append(btn);
  }
  return nav;
}

function section(title: string, children: (Node | string)[]): HTMLElement {
  const el = createEl("div", { class: "control-section" });
  el.append(createEl("h3", {}, [title]), ...children);
  return el;
}

function buildControlSections(store: Store): HTMLElement[] {
  const side = () => store.getState().editorSide;

  const background = section("Hintergrund", [
    (() => {
      const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "bg-color" }, ["Hintergrundfarbe"])]);
      const input = createEl("input", { type: "color", id: "bg-color" });
      input.addEventListener("input", () => store.updateMasterSideSettings(side(), { backgroundColor: (input as HTMLInputElement).value }, { live: true }));
      input.addEventListener("change", () => store.commitCheckpoint());
      wrap.append(input);
      return wrap;
    })(),
    (() => {
      const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "bg-texture" }, ["Textur"])]);
      const select = createEl("select", { id: "bg-texture" });
      for (const opt of TEXTURE_OPTIONS) select.append(createEl("option", { value: opt.id }, [opt.label]));
      select.addEventListener("change", () => store.updateMasterSideSettings(side(), { texture: (select as HTMLSelectElement).value as TextureId }));
      wrap.append(select);
      return wrap;
    })(),
  ]);

  const border = section("Kartenrahmen", [
    (() => {
      const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "border-style" }, ["Rahmenstil"])]);
      const select = createEl("select", { id: "border-style" }, [
        createEl("option", { value: "none" }, ["Kein Rahmen"]),
        createEl("option", { value: "solid" }, ["Durchgezogen"]),
        createEl("option", { value: "dashed" }, ["Gestrichelt"]),
        createEl("option", { value: "dotted" }, ["Gepunktet"]),
      ]);
      select.addEventListener("change", () =>
        store.updateMasterSideSettings(side(), { border: { ...store.getProject().masterCard[side()].border, style: (select as HTMLSelectElement).value as never } }),
      );
      wrap.append(select);
      return wrap;
    })(),
    (() => {
      const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "border-width" }, ["Rahmenbreite (mm)"])]);
      const input = createEl("input", { type: "range", id: "border-width", min: "0", max: "5", step: "0.25" });
      input.addEventListener("input", () =>
        store.updateMasterSideSettings(side(), { border: { ...store.getProject().masterCard[side()].border, width: Number((input as HTMLInputElement).value) } }, { live: true }),
      );
      input.addEventListener("change", () => store.commitCheckpoint());
      wrap.append(input);
      return wrap;
    })(),
    (() => {
      const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "border-color" }, ["Rahmenfarbe"])]);
      const input = createEl("input", { type: "color", id: "border-color" });
      input.addEventListener("input", () =>
        store.updateMasterSideSettings(side(), { border: { ...store.getProject().masterCard[side()].border, color: (input as HTMLInputElement).value } }, { live: true }),
      );
      input.addEventListener("change", () => store.commitCheckpoint());
      wrap.append(input);
      return wrap;
    })(),
  ]);

  const watermark = section("Wasserzeichen", [
    checkboxField("watermark-enabled", "Wasserzeichen anzeigen", (checked) =>
      store.updateMasterSideSettings(side(), { watermark: { ...store.getProject().masterCard[side()].watermark, enabled: checked } }),
    ),
    (() => {
      const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "watermark-text" }, ["Text"])]);
      const input = createEl("input", { type: "text", id: "watermark-text" });
      input.addEventListener("change", () =>
        store.updateMasterSideSettings(side(), { watermark: { ...store.getProject().masterCard[side()].watermark, text: (input as HTMLInputElement).value } }),
      );
      wrap.append(input);
      return wrap;
    })(),
    (() => {
      const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "watermark-opacity" }, ["Deckkraft"])]);
      const input = createEl("input", { type: "range", id: "watermark-opacity", min: "0.05", max: "0.6", step: "0.05" });
      input.addEventListener("input", () =>
        store.updateMasterSideSettings(side(), { watermark: { ...store.getProject().masterCard[side()].watermark, opacity: Number((input as HTMLInputElement).value) } }, { live: true }),
      );
      input.addEventListener("change", () => store.commitCheckpoint());
      wrap.append(input);
      return wrap;
    })(),
    (() => {
      const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "watermark-position" }, ["Position"])]);
      const select = createEl("select", { id: "watermark-position" }, [
        createEl("option", { value: "diagonal" }, ["Diagonal"]),
        createEl("option", { value: "center" }, ["Zentriert"]),
      ]);
      select.addEventListener("change", () =>
        store.updateMasterSideSettings(side(), { watermark: { ...store.getProject().masterCard[side()].watermark, position: (select as HTMLSelectElement).value as WatermarkPosition } }),
      );
      wrap.append(select);
      return wrap;
    })(),
  ]);

  const cardNumber = section("Kartennummer", [
    checkboxField("card-number-enabled", "Kartennummer im Rand anzeigen", (checked) =>
      store.updateMasterSideSettings(side(), { cardNumber: { ...store.getProject().masterCard[side()].cardNumber, enabled: checked } }),
    ),
    (() => {
      const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "card-number-position" }, ["Position"])]);
      const select = createEl("select", { id: "card-number-position" });
      for (const [value, label] of CARD_NUMBER_POSITIONS) select.append(createEl("option", { value }, [label]));
      select.addEventListener("change", () =>
        store.updateMasterSideSettings(side(), { cardNumber: { ...store.getProject().masterCard[side()].cardNumber, position: (select as HTMLSelectElement).value as CardNumberPosition } }),
      );
      wrap.append(select);
      return wrap;
    })(),
  ]);

  const serialNumber = section("Seriennummer", [
    checkboxField("serial-enabled", "Seriennummer anzeigen (z. B. Sammelkarten-Stil)", (checked) =>
      store.updateMasterSideSettings(side(), { serialNumber: { ...store.getProject().masterCard[side()].serialNumber, enabled: checked } }),
    ),
    (() => {
      const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "serial-start" }, ["Startnummer"])]);
      const input = createEl("input", { type: "number", id: "serial-start", min: "1" });
      input.addEventListener("change", () =>
        store.updateMasterSideSettings(side(), { serialNumber: { ...store.getProject().masterCard[side()].serialNumber, startNumber: Number((input as HTMLInputElement).value) || 1 } }),
      );
      wrap.append(input);
      return wrap;
    })(),
  ]);

  const cutMarks = section("Schnittmarken", [
    checkboxField("cut-marks-enabled", "Schnittmarken anzeigen (Farbe passt sich automatisch an)", (checked) =>
      store.updateMasterSideSettings(side(), { showCutMarks: checked }),
    ),
  ]);

  return [background, border, watermark, cardNumber, serialNumber, cutMarks];
}

function checkboxField(id: string, label: string, onChange: (checked: boolean) => void): HTMLElement {
  const wrap = createEl("label", { class: "checkbox-field", for: id });
  const input = createEl("input", { type: "checkbox", id });
  input.addEventListener("change", () => onChange((input as HTMLInputElement).checked));
  wrap.append(input, label);
  return wrap;
}

function buildFieldsSection(store: Store): HTMLElement {
  const el = section("Felder", []);
  const addRow = createEl("div", { class: "btn-group" });
  const addText = createEl("button", { type: "button", class: "btn btn--secondary btn--sm" }, ["+ Textfeld"]);
  addText.addEventListener("click", () => store.addTextField(store.getState().editorSide));
  const addImage = createEl("button", { type: "button", class: "btn btn--secondary btn--sm" }, ["+ Bildfeld"]);
  addImage.addEventListener("click", () => store.addImageField(store.getState().editorSide));
  addRow.append(addText, addImage);
  const listContainer = createEl("div", { id: "fields-list-container" });
  el.append(addRow, listContainer);
  return el;
}

function refreshSidebar(store: Store, sidebar: HTMLElement): void {
  const state = store.getState();
  const masterSide = state.project.masterCard[state.editorSide];

  for (const side of ["front", "back"] as CardSide[]) {
    const btn = sidebar.querySelector<HTMLButtonElement>(`#side-${side}`);
    if (!btn) continue;
    const selected = state.editorSide === side;
    btn.setAttribute("aria-selected", String(selected));
    btn.classList.toggle("btn--primary", selected);
    btn.classList.toggle("btn--secondary", !selected);
  }

  const setIfIdle = (id: string, value: string) => {
    const el = sidebar.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
    if (el && document.activeElement !== el) el.value = value;
  };
  const setChecked = (id: string, checked: boolean) => {
    const el = sidebar.querySelector<HTMLInputElement>(`#${id}`);
    if (el) el.checked = checked;
  };

  setIfIdle("bg-color", masterSide.backgroundColor);
  setIfIdle("bg-texture", masterSide.texture);
  setIfIdle("border-style", masterSide.border.style);
  setIfIdle("border-width", String(masterSide.border.width));
  setIfIdle("border-color", masterSide.border.color);
  setChecked("watermark-enabled", masterSide.watermark.enabled);
  setIfIdle("watermark-text", masterSide.watermark.text);
  setIfIdle("watermark-opacity", String(masterSide.watermark.opacity));
  setIfIdle("watermark-position", masterSide.watermark.position);
  setChecked("card-number-enabled", masterSide.cardNumber.enabled);
  setIfIdle("card-number-position", masterSide.cardNumber.position);
  setChecked("serial-enabled", masterSide.serialNumber.enabled);
  setIfIdle("serial-start", String(masterSide.serialNumber.startNumber));
  setChecked("cut-marks-enabled", masterSide.showCutMarks);
}
