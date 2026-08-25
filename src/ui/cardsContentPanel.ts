import type { Store } from "../state/store";
import type { Card, CardSide, ImageFieldDef, MasterCardSide, Project, TextFieldDef } from "../state/schema";
import { createEl, qs } from "../utils/dom";
import { openCsvImportDialog } from "./csvImport";
import { prepareUploadedImage } from "../utils/image";
import { hasAnyContent } from "../state/content";

let expandedCardId: string | null = null;

export function mountCardsContentPanel(store: Store): void {
  const root = qs("#content-workspace");

  const toolbar = createEl("div", { class: "content-toolbar" });
  const importBtn = createEl("button", { type: "button", class: "btn btn--secondary" }, ["📋 Aus Tabelle importieren"]);
  importBtn.addEventListener("click", () => openCsvImportDialog(store));
  const addCardBtn = createEl("button", { type: "button", class: "btn btn--secondary" }, ["+ Karte hinzufügen"]);
  addCardBtn.addEventListener("click", () => {
    const card = store.addCard();
    expandedCardId = card.id;
  });
  const countLabel = createEl("span", { class: "field__hint" });
  toolbar.append(importBtn, addCardBtn, countLabel);

  const accordion = createEl("div", { class: "cards-accordion" });
  root.append(toolbar, accordion);

  const render = () => {
    const project = store.getProject();
    countLabel.textContent = `${project.cards.length} Karte${project.cards.length === 1 ? "" : "n"}`;
    accordion.replaceChildren();
    if (project.cards.length === 0) {
      accordion.append(createEl("p", { class: "field__hint" }, ["Noch keine Karten. Füge eine Karte hinzu oder importiere eine Tabelle."]));
      return;
    }
    project.cards.forEach((card, index) => {
      accordion.append(buildAccordionItem(store, card, index, project, (id) => {
        expandedCardId = expandedCardId === id ? null : id;
        render();
      }));
    });
  };

  store.subscribe(render);
  render();
}

function buildAccordionItem(store: Store, card: Card, index: number, project: Project, onToggle: (id: string) => void): HTMLElement {
  const expanded = expandedCardId === card.id;
  const item = createEl("div", { class: "accordion-item" });
  const headerId = `card-header-${card.id}`;
  const panelId = `card-panel-${card.id}`;

  const header = createEl("div", { class: "accordion-header" });
  const filled = hasAnyContent(project.masterCard.front, card.front) || hasAnyContent(project.masterCard.back, card.back);
  const toggleBtn = createEl(
    "button",
    { type: "button", id: headerId, class: "accordion-toggle", "aria-expanded": String(expanded), "aria-controls": panelId },
    [`${filled ? "✓ " : ""}Karte ${index + 1}`],
  );
  toggleBtn.addEventListener("click", () => onToggle(card.id));
  const deleteBtn = createEl("button", { type: "button", class: "btn btn--ghost btn--icon btn--sm", "aria-label": `Karte ${index + 1} löschen` }, ["🗑"]);
  deleteBtn.addEventListener("click", () => store.removeCard(card.id));
  header.append(toggleBtn, deleteBtn);

  const panel = createEl("div", { id: panelId, role: "region", "aria-labelledby": headerId, class: "accordion-panel", hidden: !expanded });
  if (expanded) {
    panel.append(
      buildSideEditor(store, card, "front", project.masterCard.front),
      buildSideEditor(store, card, "back", project.masterCard.back),
    );
  }

  item.append(header, panel);
  return item;
}

function buildSideEditor(store: Store, card: Card, side: CardSide, masterSide: MasterCardSide): HTMLElement {
  const wrap = createEl("div", { class: "accordion-side" });
  wrap.append(createEl("h4", {}, [side === "front" ? "Vorderseite" : "Rückseite"]));

  if (masterSide.fields.length === 0) {
    wrap.append(createEl("p", { class: "field__hint" }, ["Keine Felder auf dieser Seite definiert."]));
    return wrap;
  }

  for (const field of [...masterSide.fields].sort((a, b) => a.zIndex - b.zIndex)) {
    if (field.kind === "text") wrap.append(buildTextFieldEditor(store, card, side, field));
    else wrap.append(buildImageFieldEditor(store, card, side, field));
  }
  return wrap;
}

function buildTextFieldEditor(store: Store, card: Card, side: CardSide, field: TextFieldDef): HTMLElement {
  const id = `${card.id}-${side}-${field.id}`;
  const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: id }, [field.label])]);
  const input = createEl("textarea", { id, rows: "2", placeholder: field.placeholder });
  input.value = card[side].text[field.id] ?? "";
  input.addEventListener("change", () => store.setCardText(card.id, side, field.id, input.value));
  wrap.append(input);
  return wrap;
}

function buildImageFieldEditor(store: Store, card: Card, side: CardSide, field: ImageFieldDef): HTMLElement {
  const id = `${card.id}-${side}-${field.id}`;
  const wrap = createEl("div", { class: "field image-field-editor" }, [createEl("label", { class: "field__label", for: id }, [field.label])]);
  const current = card[side].images[field.id];

  if (current) {
    wrap.append(createEl("img", { src: current.dataUrl, alt: "", class: "image-field-editor__thumb" }));
  }

  const input = createEl("input", { type: "file", accept: "image/*", id });
  input.addEventListener("change", async () => {
    const file = (input as HTMLInputElement).files?.[0];
    if (!file) return;
    const prepared = await prepareUploadedImage(file);
    store.setCardImage(card.id, side, field.id, {
      dataUrl: prepared.dataUrl,
      fileName: file.name,
      naturalWidth: prepared.width,
      naturalHeight: prepared.height,
    });
  });
  wrap.append(input);

  if (current) {
    const removeBtn = createEl("button", { type: "button", class: "btn btn--ghost btn--sm" }, ["Bild entfernen"]);
    removeBtn.addEventListener("click", () => store.setCardImage(card.id, side, field.id, null));
    wrap.append(removeBtn);
  }
  return wrap;
}
