import type { Store } from "../state/store";
import type { GridId, PaperSize, ProjectCategory } from "../state/schema";
import { createEl, qs } from "../utils/dom";
import { paginate } from "../render/layout";

const GRID_LABELS: Record<GridId, string> = {
  "2x2": "2 × 2 (4 Karten)",
  "2x4": "2 × 4 (8 Karten)",
  "3x3": "3 × 3 (9 Karten)",
  custom: "Eigene Kartengröße",
};

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  allgemein: "Allgemein",
  schule: "Schule",
  hochschule: "Hochschule",
  unternehmen: "Unternehmen / Training",
  privat: "Privat",
};

export function mountProjectSetupPanel(store: Store): void {
  const root = qs("#setup-grid");
  root.append(
    buildFormatCard(store),
    buildProjectMetaCard(store),
  );

  const render = () => refresh(store);
  store.subscribe(render);
  render();
}

function buildFormatCard(store: Store): HTMLElement {
  const card = createEl("section", { class: "setup-card", "aria-labelledby": "setup-format-heading" });
  card.append(createEl("h2", { id: "setup-format-heading" }, ["Kartenformat"]));

  // Paper size
  const paperFieldset = createEl("fieldset", {}, [createEl("legend", {}, ["Papierformat"])]);
  const paperGroup = createEl("div", { class: "btn-group", role: "radiogroup", "aria-label": "Papierformat" });
  for (const size of ["A4", "A3"] as PaperSize[]) {
    const btn = createEl(
      "button",
      { type: "button", class: "btn btn--secondary", id: `paper-${size}`, "aria-pressed": "false" },
      [size],
    );
    btn.addEventListener("click", () => store.setPaperSize(size));
    paperGroup.append(btn);
  }
  paperFieldset.append(paperGroup);

  // Grid
  const gridFieldset = createEl("fieldset", {}, [createEl("legend", {}, ["Kartenraster"])]);
  const gridGroup = createEl("div", { class: "btn-group", role: "radiogroup", "aria-label": "Kartenraster" });
  for (const id of Object.keys(GRID_LABELS) as GridId[]) {
    const btn = createEl("button", { type: "button", class: "btn btn--secondary", id: `grid-${id}`, "aria-pressed": "false" }, [
      GRID_LABELS[id],
    ]);
    btn.addEventListener("click", () => store.setGrid(id));
    gridGroup.append(btn);
  }
  gridFieldset.append(gridGroup);

  const customSizeRow = createEl("div", { class: "field-row", id: "custom-size-row" });
  const widthField = buildNumberField("custom-card-width", "Kartenbreite (mm)", 10, 400, (v) =>
    store.setCustomCardSize(v, store.getProject().grid.customCardHeight ?? 55),
  );
  const heightField = buildNumberField("custom-card-height", "Kartenhöhe (mm)", 10, 400, (v) =>
    store.setCustomCardSize(store.getProject().grid.customCardWidth ?? 90, v),
  );
  customSizeRow.append(widthField, heightField);
  gridFieldset.append(customSizeRow);

  const cardCountField = createEl("div", { class: "field" }, [
    createEl("label", { class: "field__label", for: "card-count" }, ["Anzahl Karten"]),
    (() => {
      const input = createEl("input", { type: "number", id: "card-count", min: "1", max: "500" });
      input.addEventListener("change", () => store.setCardCount(Number(input.value) || 1));
      return input;
    })(),
  ]);

  const info = createEl("p", { class: "field__hint", id: "layout-info", role: "status" });

  card.append(paperFieldset, gridFieldset, cardCountField, info);
  return card;
}

function buildNumberField(id: string, label: string, min: number, max: number, onChange: (value: number) => void): HTMLElement {
  const wrap = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: id }, [label])]);
  const input = createEl("input", { type: "number", id, min: String(min), max: String(max) });
  input.addEventListener("change", () => onChange(Number(input.value) || min));
  wrap.append(input);
  return wrap;
}

function buildProjectMetaCard(store: Store): HTMLElement {
  const card = createEl("section", { class: "setup-card", "aria-labelledby": "setup-meta-heading" });
  card.append(createEl("h2", { id: "setup-meta-heading" }, ["Projekt-Details"]));

  const nameField = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "project-name" }, ["Projektname"])]);
  const nameInput = createEl("input", { type: "text", id: "project-name" });
  nameInput.addEventListener("change", () => store.updateProjectMeta({ name: nameInput.value }));
  nameField.append(nameInput);

  const descField = createEl("div", { class: "field" }, [
    createEl("label", { class: "field__label", for: "project-description" }, ["Beschreibung (optional)"]),
  ]);
  const descInput = createEl("textarea", { id: "project-description" });
  descInput.addEventListener("change", () => store.updateProjectMeta({ description: descInput.value }));
  descField.append(descInput);

  const categoryField = createEl("div", { class: "field" }, [createEl("label", { class: "field__label", for: "project-category" }, ["Kategorie"])]);
  const categorySelect = createEl("select", { id: "project-category" });
  for (const [value, label] of Object.entries(CATEGORY_LABELS)) {
    categorySelect.append(createEl("option", { value }, [label]));
  }
  categorySelect.addEventListener("change", () => store.setCategory(categorySelect.value as ProjectCategory));
  categoryField.append(categorySelect);

  card.append(nameField, descField, categoryField);
  return card;
}

function refresh(store: Store): void {
  const project = store.getProject();
  const root = document.getElementById("setup-grid");
  if (!root) return;

  for (const size of ["A4", "A3"] as PaperSize[]) {
    const btn = root.querySelector<HTMLButtonElement>(`#paper-${size}`);
    if (!btn) continue;
    const pressed = project.paperSize === size;
    btn.setAttribute("aria-pressed", String(pressed));
    btn.classList.toggle("btn--primary", pressed);
    btn.classList.toggle("btn--secondary", !pressed);
  }

  for (const id of Object.keys(GRID_LABELS) as GridId[]) {
    const btn = root.querySelector<HTMLButtonElement>(`#grid-${id}`);
    if (!btn) continue;
    const pressed = project.grid.id === id;
    btn.setAttribute("aria-pressed", String(pressed));
    btn.classList.toggle("btn--primary", pressed);
    btn.classList.toggle("btn--secondary", !pressed);
  }

  const customRow = root.querySelector<HTMLElement>("#custom-size-row");
  if (customRow) customRow.hidden = project.grid.id !== "custom";
  const widthInput = root.querySelector<HTMLInputElement>("#custom-card-width");
  const heightInput = root.querySelector<HTMLInputElement>("#custom-card-height");
  if (widthInput && document.activeElement !== widthInput) widthInput.value = String(project.grid.customCardWidth ?? 90);
  if (heightInput && document.activeElement !== heightInput) heightInput.value = String(project.grid.customCardHeight ?? 55);

  const countInput = root.querySelector<HTMLInputElement>("#card-count");
  if (countInput && document.activeElement !== countInput) countInput.value = String(project.cardCount);

  const nameInput = root.querySelector<HTMLInputElement>("#project-name");
  if (nameInput && document.activeElement !== nameInput) nameInput.value = project.name;
  const descInput = root.querySelector<HTMLTextAreaElement>("#project-description");
  if (descInput && document.activeElement !== descInput) descInput.value = project.description;
  const categorySelect = root.querySelector<HTMLSelectElement>("#project-category");
  if (categorySelect) categorySelect.value = project.category;

  const info = root.querySelector<HTMLElement>("#layout-info");
  if (info) {
    const pages = paginate(project.paperSize, project.grid, project.cardCount);
    const perPage = pages[0]?.slots.length ?? 0;
    info.textContent = `${perPage} Karten pro Seite · ${pages.length} Seite${pages.length === 1 ? "" : "n"} für Vorder- und Rückseite`;
  }
}
