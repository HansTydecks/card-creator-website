import type { ImageCommand, LineCommand, RectCommand, StrokeRectCommand, TextCommand, TextureCommand } from "../commands";
import type { RenderTarget } from "./renderTarget";
import { fitImageInBox } from "../imageFit";
import { createTextureCanvas } from "../textureTiles";
import { PT_TO_MM } from "../textMeasure";

interface ImageCacheEntry {
  img: HTMLImageElement;
  loaded: boolean;
  listeners: Set<() => void>;
}

// Module-level so preview + PNG export share decoded images instead of
// re-decoding the same data URL on every redraw.
const imageCache = new Map<string, ImageCacheEntry>();

function getOrLoadImage(src: string, onReady: () => void): HTMLImageElement | null {
  let entry = imageCache.get(src);
  if (!entry) {
    const img = new Image();
    entry = { img, loaded: false, listeners: new Set() };
    imageCache.set(src, entry);
    img.onload = () => {
      entry!.loaded = true;
      for (const listener of entry!.listeners) listener();
      entry!.listeners.clear();
    };
    img.src = src;
  }
  if (entry.loaded) return entry.img;
  entry.listeners.add(onReady);
  return null;
}

/**
 * Warms the shared decode cache so a subsequent synchronous render (e.g. a
 * one-shot PNG export via CanvasTarget) doesn't silently skip images that
 * have never been drawn through this target before — drawImage() below is
 * intentionally fire-and-forget for the live-preview redraw loop, which
 * only works once the src is already cached.
 */
export function preloadImagesIntoCache(srcs: string[]): Promise<void> {
  const unique = Array.from(new Set(srcs));
  return Promise.all(
    unique.map(
      (src) =>
        new Promise<void>((resolve) => {
          const loaded = getOrLoadImage(src, resolve);
          if (loaded) resolve();
        }),
    ),
  ).then(() => undefined);
}

function dashPattern(style: StrokeRectCommand["style"], lineWidthPx: number): number[] {
  switch (style) {
    case "dashed":
      return [lineWidthPx * 3, lineWidthPx * 2];
    case "dotted":
      return [lineWidthPx, lineWidthPx * 1.5];
    default:
      return [];
  }
}

/** Renders a Scene onto a 2D canvas context at `pxPerMm` device pixels per mm of card space. */
export class CanvasTarget implements RenderTarget {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private pxPerMm: number,
    private onImageReady?: () => void,
  ) {}

  private mm(v: number): number {
    return v * this.pxPerMm;
  }

  private tracePath(x: number, y: number, w: number, h: number, radius: number): void {
    const ctx = this.ctx;
    const X = this.mm(x);
    const Y = this.mm(y);
    const W = this.mm(w);
    const H = this.mm(h);
    const R = Math.max(0, Math.min(this.mm(radius), W / 2, H / 2));
    ctx.beginPath();
    if (R > 0) {
      ctx.moveTo(X + R, Y);
      ctx.arcTo(X + W, Y, X + W, Y + H, R);
      ctx.arcTo(X + W, Y + H, X, Y + H, R);
      ctx.arcTo(X, Y + H, X, Y, R);
      ctx.arcTo(X, Y, X + W, Y, R);
      ctx.closePath();
    } else {
      ctx.rect(X, Y, W, H);
    }
  }

  drawRect(cmd: RectCommand): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = cmd.opacity ?? 1;
    ctx.fillStyle = cmd.fill;
    this.tracePath(cmd.x, cmd.y, cmd.width, cmd.height, cmd.radius ?? 0);
    ctx.fill();
    ctx.restore();
  }

  drawStrokeRect(cmd: StrokeRectCommand): void {
    if (cmd.style === "none") return;
    const ctx = this.ctx;
    ctx.save();
    const lw = this.mm(cmd.lineWidth);
    ctx.strokeStyle = cmd.color;
    ctx.lineWidth = lw;
    ctx.setLineDash(dashPattern(cmd.style, lw));
    this.tracePath(cmd.x, cmd.y, cmd.width, cmd.height, cmd.radius ?? 0);
    ctx.stroke();
    ctx.restore();
  }

  drawLine(cmd: LineCommand): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = cmd.color;
    ctx.lineWidth = this.mm(cmd.lineWidth);
    ctx.beginPath();
    ctx.moveTo(this.mm(cmd.x1), this.mm(cmd.y1));
    ctx.lineTo(this.mm(cmd.x2), this.mm(cmd.y2));
    ctx.stroke();
    ctx.restore();
  }

  drawText(cmd: TextCommand): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = cmd.opacity;
    ctx.fillStyle = cmd.color;
    const fontSizeMm = cmd.fontSize * PT_TO_MM;
    const fontPx = this.mm(fontSizeMm);
    ctx.font = `${cmd.italic ? "italic " : ""}${cmd.fontWeight === "bold" ? "bold " : ""}${fontPx}px ${cmd.fontFamily}`;
    ctx.textBaseline = "top";

    if (cmd.rotation) {
      const cx = this.mm(cmd.x + cmd.width / 2);
      const cy = this.mm(cmd.y + cmd.height / 2);
      ctx.translate(cx, cy);
      ctx.rotate((cmd.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    const boxX = this.mm(cmd.x);
    const boxWidth = this.mm(cmd.width);
    const lineHeightPx = this.mm(cmd.lineHeight);
    cmd.lines.forEach((line, i) => {
      const lineWidth = ctx.measureText(line).width;
      let lineX = boxX;
      if (cmd.align === "center") lineX = boxX + (boxWidth - lineWidth) / 2;
      else if (cmd.align === "right") lineX = boxX + boxWidth - lineWidth;
      ctx.fillText(line, lineX, this.mm(cmd.y) + i * lineHeightPx);
    });
    ctx.restore();
  }

  drawImage(cmd: ImageCommand): void {
    const img = getOrLoadImage(cmd.src, () => this.onImageReady?.());
    if (!img) return;
    const ctx = this.ctx;
    const placement = fitImageInBox(cmd.naturalWidth, cmd.naturalHeight, cmd.width, cmd.height, cmd.fit);
    ctx.save();
    ctx.globalAlpha = cmd.opacity;
    if (cmd.rotation) {
      const cx = this.mm(cmd.x + cmd.width / 2);
      const cy = this.mm(cmd.y + cmd.height / 2);
      ctx.translate(cx, cy);
      ctx.rotate((cmd.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
    this.tracePath(cmd.x, cmd.y, cmd.width, cmd.height, cmd.radius);
    ctx.clip();
    ctx.drawImage(
      img,
      placement.sx,
      placement.sy,
      placement.sw,
      placement.sh,
      this.mm(cmd.x + placement.dx),
      this.mm(cmd.y + placement.dy),
      this.mm(placement.dw),
      this.mm(placement.dh),
    );
    ctx.restore();
  }

  drawTexture(cmd: TextureCommand): void {
    const w = this.mm(cmd.width);
    const h = this.mm(cmd.height);
    const tile = createTextureCanvas(cmd.textureId, cmd.baseColor, w, h);
    this.ctx.drawImage(tile, this.mm(cmd.x), this.mm(cmd.y), w, h);
  }
}
