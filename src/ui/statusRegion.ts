import { createEl, qsOptional } from "../utils/dom";

let region: HTMLElement | null = null;

/** One shared aria-live region for screen-reader announcements (autosave, export status, selection changes). */
function getRegion(): HTMLElement {
  if (region) return region;
  const existing = qsOptional<HTMLElement>("#status-region");
  if (existing) {
    region = existing;
    return region;
  }
  const el = createEl("div", {
    id: "status-region",
    class: "visually-hidden",
    role: "status",
    "aria-live": "polite",
    "aria-atomic": "true",
  });
  document.body.append(el);
  region = el;
  return el;
}

export function announce(message: string): void {
  const el = getRegion();
  el.textContent = "";
  // Force a DOM mutation even if the message repeats, so AT re-announces it.
  window.setTimeout(() => {
    el.textContent = message;
  }, 30);
}
