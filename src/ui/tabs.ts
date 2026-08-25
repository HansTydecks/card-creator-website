import { qsa, qsOptional } from "../utils/dom";

/**
 * APG tabs pattern: roving tabindex, arrow-key navigation, aria-selected /
 * aria-controls wiring, panels toggled via the `hidden` attribute.
 */
export class TabGroup {
  private tabs: HTMLButtonElement[];

  constructor(root: HTMLElement, private onChange?: (tabId: string) => void) {
    this.tabs = qsa<HTMLButtonElement>('[role="tab"]', root);
    this.tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => this.select(tab.dataset.tab!, true));
      tab.addEventListener("keydown", (e) => this.handleKeydown(e, i));
    });
    const active = this.tabs.find((t) => t.getAttribute("aria-selected") === "true") ?? this.tabs[0];
    if (active) this.select(active.dataset.tab!, false);
  }

  select(tabId: string, focus: boolean): void {
    for (const tab of this.tabs) {
      const selected = tab.dataset.tab === tabId;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = qsOptional<HTMLElement>(`#${tab.getAttribute("aria-controls")}`);
      if (panel) panel.hidden = !selected;
      if (selected && focus) tab.focus();
    }
    this.onChange?.(tabId);
  }

  private handleKeydown(e: KeyboardEvent, index: number): void {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % this.tabs.length;
    else if (e.key === "ArrowLeft") nextIndex = (index - 1 + this.tabs.length) % this.tabs.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = this.tabs.length - 1;
    if (nextIndex === null) return;
    e.preventDefault();
    const next = this.tabs[nextIndex];
    if (next?.dataset.tab) this.select(next.dataset.tab, true);
  }
}
