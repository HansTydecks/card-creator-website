import type { Store } from "../state/store";
import type { CardSide } from "../state/schema";
import { createEmptySideContent } from "../state/schema";
import { CardCanvasRenderer } from "../render/preview";
import { getCardSize } from "../render/layout";
import { announce } from "./statusRegion";

type DragMode = "move" | "resize" | null;
type Handle = "nw" | "ne" | "sw" | "se";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Pointer/keyboard interaction layer for the master-card canvas. Uses
 * Pointer Events (not mouse events) so drag/resize works identically with
 * mouse, touch and pen; the canvas gets `touch-action: none` so a drag never
 * scrolls the page on a tablet.
 */
export class CanvasEditor {
  private renderer: CardCanvasRenderer;
  private dragMode: DragMode = null;
  private dragHandle: Handle | null = null;
  private dragStart = { x: 0, y: 0 };
  private fieldStart = { x: 0, y: 0, width: 0, height: 0 };
  private activePointerId: number | null = null;

  constructor(private canvas: HTMLCanvasElement, private store: Store) {
    this.renderer = new CardCanvasRenderer(canvas);
    canvas.style.touchAction = "none";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "application");
    canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    canvas.addEventListener("pointermove", (e) => this.onPointerMove(e));
    canvas.addEventListener("pointerup", (e) => this.onPointerUp(e));
    canvas.addEventListener("pointercancel", (e) => this.onPointerUp(e));
    canvas.addEventListener("keydown", (e) => this.onKeyDown(e));
    store.subscribe(() => this.render());
  }

  private get side(): CardSide {
    return this.store.getState().editorSide;
  }

  private get masterSide() {
    return this.store.getProject().masterCard[this.side];
  }

  resize(displayWidthCss: number): void {
    // Defensive clamp: a 0 reading (measured while hidden) or a runaway
    // value (a transient container/content feedback loop before layout
    // settles) should never reach the canvas as its display width.
    const safeWidth = clamp(displayWidthCss, 160, 900);
    const project = this.store.getProject();
    const cardSize = getCardSize(project.paperSize, project.grid);
    this.renderer.setCardSize(cardSize, safeWidth);
    this.render();
  }

  render(): void {
    const state = this.store.getState();
    const masterSide = state.project.masterCard[state.editorSide];
    const content = createEmptySideContent(masterSide);
    const selectedId = state.selection && state.selection.side === state.editorSide ? state.selection.fieldId : null;
    this.renderer.render(masterSide, content, selectedId, () => this.render(), { showPlaceholders: true });
  }

  private onPointerDown(e: PointerEvent): void {
    this.canvas.focus();
    const { x, y } = this.renderer.pointerToMm(e.clientX, e.clientY);
    const state = this.store.getState();
    const currentlySelected =
      state.selection && state.selection.side === this.side
        ? this.masterSide.fields.find((f) => f.id === state.selection!.fieldId)
        : null;

    if (currentlySelected) {
      const handle = this.renderer.hitTestHandle(currentlySelected, x, y);
      if (handle) {
        this.beginDrag(e, "resize", handle, x, y, currentlySelected);
        return;
      }
    }

    const field = this.renderer.hitTestField(this.masterSide, x, y);
    if (field) {
      this.store.selectField(this.side, field.id);
      this.beginDrag(e, "move", null, x, y, field);
    } else {
      this.store.selectField(this.side, null);
    }
  }

  private beginDrag(e: PointerEvent, mode: DragMode, handle: Handle | null, x: number, y: number, field: { x: number; y: number; width: number; height: number }): void {
    this.dragMode = mode;
    this.dragHandle = handle;
    this.dragStart = { x, y };
    this.fieldStart = { x: field.x, y: field.y, width: field.width, height: field.height };
    this.activePointerId = e.pointerId;
    this.canvas.setPointerCapture(e.pointerId);
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.dragMode === null || e.pointerId !== this.activePointerId) return;
    const state = this.store.getState();
    if (!state.selection) return;
    const { x, y } = this.renderer.pointerToMm(e.clientX, e.clientY);
    const dx = x - this.dragStart.x;
    const dy = y - this.dragStart.y;
    const cardSize = this.renderer.getCardSize();

    if (this.dragMode === "move") {
      const newX = clamp(this.fieldStart.x + dx, 0, cardSize.width - this.fieldStart.width);
      const newY = clamp(this.fieldStart.y + dy, 0, cardSize.height - this.fieldStart.height);
      this.store.updateField(this.side, state.selection.fieldId, { x: newX, y: newY }, { live: true });
    } else if (this.dragMode === "resize" && this.dragHandle) {
      const patch = this.computeResizePatch(dx, dy, cardSize);
      this.store.updateField(this.side, state.selection.fieldId, patch, { live: true });
    }
  }

  private computeResizePatch(dx: number, dy: number, cardSize: { width: number; height: number }) {
    const min = 5;
    let { x, y, width, height } = this.fieldStart;
    switch (this.dragHandle) {
      case "se":
        width = Math.max(min, width + dx);
        height = Math.max(min, height + dy);
        break;
      case "sw": {
        const newWidth = Math.max(min, width - dx);
        x = x + (width - newWidth);
        width = newWidth;
        height = Math.max(min, height + dy);
        break;
      }
      case "ne": {
        const newHeight = Math.max(min, height - dy);
        y = y + (height - newHeight);
        height = newHeight;
        width = Math.max(min, width + dx);
        break;
      }
      case "nw": {
        const newWidth = Math.max(min, width - dx);
        const newHeight = Math.max(min, height - dy);
        x = x + (width - newWidth);
        y = y + (height - newHeight);
        width = newWidth;
        height = newHeight;
        break;
      }
    }
    x = clamp(x, 0, Math.max(0, cardSize.width - width));
    y = clamp(y, 0, Math.max(0, cardSize.height - height));
    return { x, y, width, height };
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.activePointerId !== e.pointerId) return;
    if (this.dragMode) this.store.commitCheckpoint();
    this.dragMode = null;
    this.dragHandle = null;
    this.activePointerId = null;
  }

  private onKeyDown(e: KeyboardEvent): void {
    const state = this.store.getState();
    if (!state.selection || state.selection.side !== this.side) return;
    const field = this.masterSide.fields.find((f) => f.id === state.selection!.fieldId);
    if (!field) return;
    const step = e.shiftKey ? 0.1 : 1;
    let handled = true;
    switch (e.key) {
      case "ArrowLeft":
        this.store.updateField(this.side, field.id, { x: Math.max(0, field.x - step) });
        break;
      case "ArrowRight":
        this.store.updateField(this.side, field.id, { x: field.x + step });
        break;
      case "ArrowUp":
        this.store.updateField(this.side, field.id, { y: Math.max(0, field.y - step) });
        break;
      case "ArrowDown":
        this.store.updateField(this.side, field.id, { y: field.y + step });
        break;
      case "Delete":
      case "Backspace":
        this.store.removeField(this.side, field.id);
        announce("Feld gelöscht.");
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  }
}
