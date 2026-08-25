import type { Store } from "../state/store";
import { createEl } from "../utils/dom";

export function mountFieldsList(container: HTMLElement, store: Store): void {
  const render = () => {
    const state = store.getState();
    const fields = [...state.project.masterCard[state.editorSide].fields].sort((a, b) => b.zIndex - a.zIndex);
    container.replaceChildren();

    if (fields.length === 0) {
      container.append(createEl("p", { class: "field__hint" }, ["Noch keine Felder auf dieser Seite."]));
      return;
    }

    const list = createEl("ul", { class: "fields-list", role: "listbox", "aria-label": "Felder auf dieser Kartenseite" });
    for (const field of fields) {
      const selected = state.selection?.fieldId === field.id;
      const item = createEl("li", { class: "fields-list__item" });

      const selectBtn = createEl(
        "button",
        { type: "button", class: "fields-list__select", role: "option", "aria-selected": String(selected) },
        [`${field.kind === "text" ? "📝" : "🖼️"} ${field.label}`],
      );
      selectBtn.addEventListener("click", () => store.selectField(state.editorSide, field.id));

      const upBtn = createEl(
        "button",
        { type: "button", class: "btn btn--ghost btn--sm btn--icon", "aria-label": `${field.label}: eine Ebene nach vorne` },
        ["↑"],
      );
      upBtn.addEventListener("click", () => store.moveFieldLayer(state.editorSide, field.id, "forward"));

      const downBtn = createEl(
        "button",
        { type: "button", class: "btn btn--ghost btn--sm btn--icon", "aria-label": `${field.label}: eine Ebene nach hinten` },
        ["↓"],
      );
      downBtn.addEventListener("click", () => store.moveFieldLayer(state.editorSide, field.id, "backward"));

      const delBtn = createEl(
        "button",
        { type: "button", class: "btn btn--ghost btn--sm btn--icon", "aria-label": `${field.label} löschen` },
        ["🗑"],
      );
      delBtn.addEventListener("click", () => store.removeField(state.editorSide, field.id));

      item.append(selectBtn, upBtn, downBtn, delBtn);
      list.append(item);
    }
    container.append(list);
  };

  store.subscribe(render);
  render();
}
