import { createEl, qsOptional } from "../utils/dom";
import { announce } from "./statusRegion";

function getRegion(): HTMLElement {
  let el = qsOptional<HTMLElement>("#toast-region");
  if (!el) {
    el = createEl("div", { id: "toast-region", class: "toast-region no-print" });
    document.body.append(el);
  }
  return el;
}

export function toast(message: string, kind: "info" | "success" | "danger" = "info"): void {
  const region = getRegion();
  const el = createEl("div", { class: `toast toast--${kind}`, role: "status" }, [message]);
  region.append(el);
  announce(message);
  window.setTimeout(() => el.remove(), 4500);
}
