import type { Store } from "../state/store";
import type { CardSide, FieldDef, ImageFieldDef, TextFieldDef } from "../state/schema";
import { createEl } from "../utils/dom";

const FONT_OPTIONS = [
  "Segoe UI, Arial, sans-serif",
  "Georgia, 'Times New Roman', serif",
  "'Courier New', monospace",
  "Verdana, sans-serif",
];

let lastFieldId: string | null = null;

export function mountPropertiesPanel(container: HTMLElement, store: Store): void {
  const render = () => {
    const state = store.getState();
    const selection = state.selection;
    if (!selection) {
      lastFieldId = null;
      container.replaceChildren(createEl("p", { class: "field__hint" }, ["Wähle ein Feld aus, um es zu bearbeiten."]));
      return;
    }
    const field = state.project.masterCard[selection.side].fields.find((f) => f.id === selection.fieldId);
    if (!field) {
      lastFieldId = null;
      container.replaceChildren(createEl("p", { class: "field__hint" }, ["Wähle ein Feld aus, um es zu bearbeiten."]));
      return;
    }

    if (lastFieldId !== field.id) {
      lastFieldId = field.id;
      container.replaceChildren(buildForm(store, selection.side, field));
    } else {
      refreshValues(container, field);
    }
  };

  store.subscribe(render);
  render();
}

function numberField(id: string, label: string, value: number, step: number, onInput: (v: number) => void, onCommit: () => void): HTMLElement {
  const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: id }, [label])]);
  const input = createEl("input", { type: "number", id, step: String(step), value: String(round(value)) });
  input.addEventListener("input", () => onInput(Number(input.value) || 0));
  input.addEventListener("change", onCommit);
  wrap.append(input);
  return wrap;
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

function buildForm(store: Store, side: CardSide, field: FieldDef): HTMLElement {
  const form = createEl("div", { class: "properties-form" });
  form.append(createEl("h3", {}, [field.kind === "text" ? "Textfeld" : "Bildfeld"]));

  const labelWrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "prop-label" }, ["Bezeichnung"])]);
  const labelInput = createEl("input", { type: "text", id: "prop-label", value: field.label });
  labelInput.addEventListener("change", () => store.updateField(side, field.id, { label: labelInput.value }));
  labelWrap.append(labelInput);
  form.append(labelWrap);

  const geometryRow1 = createEl("div", { class: "field-row" }, [
    numberField("prop-x", "X (mm)", field.x, 1, (v) => store.updateField(side, field.id, { x: v }, { live: true }), () => store.commitCheckpoint()),
    numberField("prop-y", "Y (mm)", field.y, 1, (v) => store.updateField(side, field.id, { y: v }, { live: true }), () => store.commitCheckpoint()),
  ]);
  const geometryRow2 = createEl("div", { class: "field-row" }, [
    numberField("prop-width", "Breite (mm)", field.width, 1, (v) => store.updateField(side, field.id, { width: v }, { live: true }), () => store.commitCheckpoint()),
    numberField("prop-height", "Höhe (mm)", field.height, 1, (v) => store.updateField(side, field.id, { height: v }, { live: true }), () => store.commitCheckpoint()),
  ]);
  const geometryRow3 = createEl("div", { class: "field-row" }, [
    numberField("prop-rotation", "Rotation (°)", field.rotation, 5, (v) => store.updateField(side, field.id, { rotation: v }, { live: true }), () => store.commitCheckpoint()),
    numberField("prop-opacity", "Deckkraft (%)", field.opacity * 100, 5, (v) => store.updateField(side, field.id, { opacity: v / 100 }, { live: true }), () => store.commitCheckpoint()),
  ]);
  form.append(geometryRow1, geometryRow2, geometryRow3);

  if (field.kind === "text") {
    form.append(buildTextControls(store, side, field));
  } else {
    form.append(buildImageControls(store, side, field));
  }

  return form;
}

function buildTextControls(store: Store, side: CardSide, field: TextFieldDef): HTMLElement {
  const wrap = createEl("div", { class: "properties-form__section" });

  const fontWrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "prop-font-family" }, ["Schriftart"])]);
  const fontSelect = createEl("select", { id: "prop-font-family" });
  for (const font of FONT_OPTIONS) fontSelect.append(createEl("option", { value: font }, [font.split(",")[0]!.replace(/'/g, "")]));
  fontSelect.value = field.fontFamily;
  fontSelect.addEventListener("change", () => store.updateField(side, field.id, { fontFamily: fontSelect.value }));
  fontWrap.append(fontSelect);

  const sizeField = numberField("prop-font-size", "Schriftgröße (pt)", field.fontSize, 1, (v) => store.updateField(side, field.id, { fontSize: v }, { live: true }), () => store.commitCheckpoint());

  const styleRow = createEl("div", { class: "btn-group", role: "group", "aria-label": "Textstil" });
  const boldBtn = createEl("button", { type: "button", class: "btn btn--secondary btn--sm", id: "prop-bold", "aria-pressed": String(field.fontWeight === "bold") }, ["Fett"]);
  boldBtn.addEventListener("click", () => store.updateField(side, field.id, { fontWeight: field.fontWeight === "bold" ? "normal" : "bold" }));
  const italicBtn = createEl("button", { type: "button", class: "btn btn--secondary btn--sm", id: "prop-italic", "aria-pressed": String(field.italic) }, ["Kursiv"]);
  italicBtn.addEventListener("click", () => store.updateField(side, field.id, { italic: !field.italic }));
  styleRow.append(boldBtn, italicBtn);

  const alignRow = createEl("div", { class: "btn-group", role: "radiogroup", "aria-label": "Ausrichtung" });
  for (const [value, label] of [["left", "Links"], ["center", "Zentriert"], ["right", "Rechts"]] as const) {
    const btn = createEl("button", { type: "button", class: "btn btn--secondary btn--sm", id: `prop-align-${value}`, "aria-pressed": String(field.align === value) }, [label]);
    btn.addEventListener("click", () => store.updateField(side, field.id, { align: value }));
    alignRow.append(btn);
  }

  const colorWrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "prop-color" }, ["Textfarbe"])]);
  const colorInput = createEl("input", { type: "color", id: "prop-color", value: field.color });
  colorInput.addEventListener("input", () => store.updateField(side, field.id, { color: colorInput.value }, { live: true }));
  colorInput.addEventListener("change", () => store.commitCheckpoint());
  colorWrap.append(colorInput);

  const placeholderWrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "prop-placeholder" }, ["Platzhaltertext"])]);
  const placeholderInput = createEl("input", { type: "text", id: "prop-placeholder", value: field.placeholder });
  placeholderInput.addEventListener("change", () => store.updateField(side, field.id, { placeholder: placeholderInput.value }));
  placeholderWrap.append(placeholderInput);

  wrap.append(fontWrap, sizeField, styleRow, alignRow, colorWrap, placeholderWrap);
  return wrap;
}

function buildImageControls(store: Store, side: CardSide, field: ImageFieldDef): HTMLElement {
  const wrap = createEl("div", { class: "properties-form__section" });

  const fitWrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "prop-fit" }, ["Bildausschnitt"])]);
  const fitSelect = createEl("select", { id: "prop-fit" }, [
    createEl("option", { value: "contain" }, ["Vollständig einpassen"]),
    createEl("option", { value: "cover" }, ["Feld ausfüllen (zuschneiden)"]),
  ]);
  fitSelect.value = field.fit;
  fitSelect.addEventListener("change", () => store.updateField(side, field.id, { fit: fitSelect.value as ImageFieldDef["fit"] }));
  fitWrap.append(fitSelect);

  const radiusField = numberField("prop-radius", "Eckenradius (mm)", field.borderRadius, 1, (v) => store.updateField(side, field.id, { borderRadius: v }, { live: true }), () => store.commitCheckpoint());

  wrap.append(fitWrap, radiusField);
  return wrap;
}

function refreshValues(container: HTMLElement, field: FieldDef): void {
  const setIfIdle = (id: string, value: string) => {
    const el = container.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
    if (el && document.activeElement !== el) el.value = value;
  };

  setIfIdle("prop-label", field.label);
  setIfIdle("prop-x", String(round(field.x)));
  setIfIdle("prop-y", String(round(field.y)));
  setIfIdle("prop-width", String(round(field.width)));
  setIfIdle("prop-height", String(round(field.height)));
  setIfIdle("prop-rotation", String(round(field.rotation)));
  setIfIdle("prop-opacity", String(round(field.opacity * 100)));

  if (field.kind === "text") {
    setIfIdle("prop-font-family", field.fontFamily);
    setIfIdle("prop-font-size", String(field.fontSize));
    setIfIdle("prop-color", field.color);
    setIfIdle("prop-placeholder", field.placeholder);
    container.querySelector("#prop-bold")?.setAttribute("aria-pressed", String(field.fontWeight === "bold"));
    container.querySelector("#prop-italic")?.setAttribute("aria-pressed", String(field.italic));
    for (const align of ["left", "center", "right"]) {
      container.querySelector(`#prop-align-${align}`)?.setAttribute("aria-pressed", String(field.align === align));
    }
  } else {
    setIfIdle("prop-fit", field.fit);
    setIfIdle("prop-radius", String(field.borderRadius));
  }
}
