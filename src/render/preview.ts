import type { CardSideContent, FieldDef, MasterCardSide } from "../state/schema";
import { buildCardSideScene, type SceneOptions } from "./scene";
import { CanvasTarget } from "./targets/canvasTarget";
import { renderScene } from "./targets/renderTarget";
import type { MmSize } from "./layout";

export const HANDLE_SIZE_PX = 10;

/**
 * Owns the live editor canvas: sizing/DPI, drawing the shared scene plus
 * editor-only selection chrome (never part of the scene, so it can never
 * leak into an export), and the mm<->pointer coordinate math the pointer
 * interaction layer (ui/canvasEditor.ts) needs for hit-testing/dragging.
 */
export class CardCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private pxPerMm = 4;
  private cardSize: MmSize = { width: 90, height: 55 };

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
  }

  getCardSize(): MmSize {
    return this.cardSize;
  }

  getPxPerMm(): number {
    return this.pxPerMm;
  }

  /** Sizes the backing canvas for a target CSS display width, keeping device-pixel sharpness. */
  setCardSize(cardSize: MmSize, displayWidthCss: number): void {
    this.cardSize = cardSize;
    const dpr = window.devicePixelRatio || 1;
    this.pxPerMm = (displayWidthCss / cardSize.width) * dpr;
    this.canvas.width = Math.round(cardSize.width * this.pxPerMm);
    this.canvas.height = Math.round(cardSize.height * this.pxPerMm);
    this.canvas.style.width = `${displayWidthCss}px`;
    this.canvas.style.height = `${(cardSize.height / cardSize.width) * displayWidthCss}px`;
  }

  /**
   * renderScene always returns a Promise (PDF/SVG targets rasterize images
   * asynchronously), even though CanvasTarget itself is fully synchronous —
   * so this still has to await it before layering the selection overlay,
   * otherwise the overlay draw (issued right after, uninterleaved) would
   * race ahead of scene commands that got pushed onto microtasks.
   */
  async render(
    masterSide: MasterCardSide,
    content: CardSideContent,
    selectedFieldId: string | null,
    onImageReady: () => void,
    sceneOptions: SceneOptions = { showPlaceholders: true },
  ): Promise<void> {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const scene = buildCardSideScene(masterSide, content, this.cardSize, sceneOptions);
    const target = new CanvasTarget(ctx, this.pxPerMm, onImageReady);
    await renderScene(target, scene);

    if (selectedFieldId) {
      const field = masterSide.fields.find((f) => f.id === selectedFieldId);
      if (field) this.drawSelectionOverlay(field);
    }
  }

  private drawSelectionOverlay(field: FieldDef): void {
    const ctx = this.ctx;
    const mm = (v: number) => v * this.pxPerMm;
    ctx.save();
    const cx = mm(field.x + field.width / 2);
    const cy = mm(field.y + field.height / 2);
    if (field.rotation) {
      ctx.translate(cx, cy);
      ctx.rotate((field.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
    const x = mm(field.x);
    const y = mm(field.y);
    const w = mm(field.width);
    const h = mm(field.height);

    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    ctx.fillStyle = "#2563eb";
    for (const [hx, hy] of this.cornerPoints(x, y, w, h)) {
      ctx.beginPath();
      ctx.arc(hx, hy, HANDLE_SIZE_PX / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  private cornerPoints(x: number, y: number, w: number, h: number): [number, number][] {
    return [
      [x, y],
      [x + w, y],
      [x, y + h],
      [x + w, y + h],
    ];
  }

  /** Converts a pointer event's viewport coordinates into card-local mm coordinates. */
  pointerToMm(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const cssScaleX = this.canvas.width / rect.width;
    const cssScaleY = this.canvas.height / rect.height;
    const px = (clientX - rect.left) * cssScaleX;
    const py = (clientY - rect.top) * cssScaleY;
    return { x: px / this.pxPerMm, y: py / this.pxPerMm };
  }

  /** Topmost field (by zIndex) whose axis-aligned box contains the point; rotation is ignored for hit-testing as a deliberate simplification. */
  hitTestField(masterSide: MasterCardSide, xMm: number, yMm: number): FieldDef | null {
    const sorted = [...masterSide.fields].sort((a, b) => b.zIndex - a.zIndex);
    for (const field of sorted) {
      if (xMm >= field.x && xMm <= field.x + field.width && yMm >= field.y && yMm <= field.y + field.height) {
        return field;
      }
    }
    return null;
  }

  /** Which corner handle (if any) of the selected field is under the point, in mm-space tolerance. */
  hitTestHandle(field: FieldDef, xMm: number, yMm: number): "nw" | "ne" | "sw" | "se" | null {
    const toleranceMm = (HANDLE_SIZE_PX / this.pxPerMm) * 0.9;
    const corners: Record<"nw" | "ne" | "sw" | "se", [number, number]> = {
      nw: [field.x, field.y],
      ne: [field.x + field.width, field.y],
      sw: [field.x, field.y + field.height],
      se: [field.x + field.width, field.y + field.height],
    };
    for (const key of Object.keys(corners) as (keyof typeof corners)[]) {
      const [cx, cy] = corners[key];
      if (Math.hypot(xMm - cx, yMm - cy) <= toleranceMm) return key;
    }
    return null;
  }
}
