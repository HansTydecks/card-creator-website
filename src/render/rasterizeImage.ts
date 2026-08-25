import type { ImageCommand } from "./commands";
import { fitImageInBox } from "./imageFit";

const decodedCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = decodedCache.get(src);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      decodedCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error("Bild konnte für den Export nicht geladen werden."));
    img.src = src;
  });
}

function tracePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number): void {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  if (r > 0) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  } else {
    ctx.rect(x, y, w, h);
  }
}

/**
 * PDF/SVG have no source-rect image cropping and no reliable cross-target
 * clip-path support, unlike <canvas>. Rather than reimplementing cover-fit
 * cropping + rounded-corner clipping + rotation per output format, this
 * pre-bakes all three into a flat PNG (via an offscreen canvas, reusing the
 * exact same fit/clip math as the live editor) that both pdfTarget and
 * svgTarget can just place as-is.
 */
export async function rasterizeImageCommand(cmd: ImageCommand, pxPerMm: number): Promise<{ dataUrl: string; widthPx: number; heightPx: number }> {
  const img = await loadImage(cmd.src);
  const widthPx = Math.max(1, Math.round(cmd.width * pxPerMm));
  const heightPx = Math.max(1, Math.round(cmd.height * pxPerMm));
  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl: cmd.src, widthPx, heightPx };

  ctx.save();
  ctx.globalAlpha = cmd.opacity;
  if (cmd.rotation) {
    ctx.translate(widthPx / 2, heightPx / 2);
    ctx.rotate((cmd.rotation * Math.PI) / 180);
    ctx.translate(-widthPx / 2, -heightPx / 2);
  }
  tracePath(ctx, 0, 0, widthPx, heightPx, cmd.radius * pxPerMm);
  ctx.clip();
  const placement = fitImageInBox(cmd.naturalWidth, cmd.naturalHeight, cmd.width, cmd.height, cmd.fit);
  ctx.drawImage(
    img,
    placement.sx,
    placement.sy,
    placement.sw,
    placement.sh,
    placement.dx * pxPerMm,
    placement.dy * pxPerMm,
    placement.dw * pxPerMm,
    placement.dh * pxPerMm,
  );
  ctx.restore();

  return { dataUrl: canvas.toDataURL("image/png"), widthPx, heightPx };
}
