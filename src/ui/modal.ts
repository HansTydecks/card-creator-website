import { createEl } from "../utils/dom";

export interface ModalAction {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  onSelect?: () => void;
}

export interface ModalOptions {
  title: string;
  body: string | HTMLElement;
  actions: ModalAction[];
}

/**
 * Accessible confirm/info dialog built on native <dialog>, which gives us a
 * real focus trap, Escape-to-close and ::backdrop for free — replacing the
 * old app's window.confirm()/alert() calls.
 */
export function openModal(options: ModalOptions): void {
  const dialog = createEl("dialog", { class: "modal", "aria-labelledby": "modal-title" });
  const title = createEl("h2", { class: "modal__title", id: "modal-title" }, [options.title]);
  const body = createEl("div", { class: "modal__body" }, [options.body]);
  const actionsRow = createEl("div", { class: "modal__actions" });

  for (const action of options.actions) {
    const btn = createEl("button", {
      type: "button",
      class: `btn btn--${action.variant ?? "secondary"}`,
    }, [action.label]);
    btn.addEventListener("click", () => {
      dialog.close();
      action.onSelect?.();
    });
    actionsRow.append(btn);
  }

  dialog.append(title, body, actionsRow);
  dialog.addEventListener("close", () => dialog.remove());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  document.body.append(dialog);
  dialog.showModal();
}

export function confirmDialog(title: string, body: string, confirmLabel = "Bestätigen"): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;
    const settle = (value: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(value);
      }
    };
    const dialog = createEl("dialog", { class: "modal", "aria-labelledby": "modal-title" });
    dialog.append(
      createEl("h2", { class: "modal__title", id: "modal-title" }, [title]),
      createEl("div", { class: "modal__body" }, [body]),
      (() => {
        const row = createEl("div", { class: "modal__actions" });
        const cancel = createEl("button", { type: "button", class: "btn btn--secondary" }, ["Abbrechen"]);
        const confirm = createEl("button", { type: "button", class: "btn btn--primary" }, [confirmLabel]);
        cancel.addEventListener("click", () => dialog.close());
        confirm.addEventListener("click", () => {
          settle(true);
          dialog.close();
        });
        row.append(cancel, confirm);
        return row;
      })(),
    );
    dialog.addEventListener("close", () => {
      settle(false);
      dialog.remove();
    });
    document.body.append(dialog);
    dialog.showModal();
  });
}
