import type { TextureId } from "../state/schema";
import { hexToRgb, relativeLuminance, rgbToHex } from "../utils/color";

function shade(baseColor: string, amount: number): string {
  const rgb = hexToRgb(baseColor);
  const isLight = relativeLuminance(rgb) > 0.6;
  const dir = isLight ? -1 : 1;
  const delta = dir * amount * 255;
  return rgbToHex({ r: rgb.r + delta, g: rgb.g + delta, b: rgb.b + delta });
}

// Deterministic PRNG so the "paper-fiber" texture looks identical between
// the live preview and every export pass instead of re-rolling each time.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws a background texture pattern directly at (0,0,width,height) on the given context. */
export function drawTexturePattern(
  ctx: CanvasRenderingContext2D,
  textureId: TextureId,
  baseColor: string,
  width: number,
  height: number,
): void {
  ctx.save();
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  const line = shade(baseColor, 0.06);
  const lineStrong = shade(baseColor, 0.1);

  switch (textureId) {
    case "none":
      break;
    case "dots": {
      const spacing = Math.max(6, width / 24);
      ctx.fillStyle = line;
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, spacing * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "grid": {
      const spacing = Math.max(8, width / 16);
      ctx.strokeStyle = line;
      ctx.lineWidth = Math.max(1, spacing * 0.02);
      ctx.beginPath();
      for (let x = 0; x <= width; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
      break;
    }
    case "diagonal": {
      const spacing = Math.max(8, width / 18);
      ctx.strokeStyle = line;
      ctx.lineWidth = Math.max(1, spacing * 0.18);
      ctx.beginPath();
      const diag = width + height;
      for (let offset = -height; offset < diag; offset += spacing) {
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset + height, height);
      }
      ctx.stroke();
      break;
    }
    case "hexagon": {
      const r = Math.max(6, width / 14);
      const hexW = r * Math.sqrt(3);
      const hexH = r * 2 * 0.75;
      ctx.strokeStyle = line;
      ctx.lineWidth = Math.max(1, r * 0.05);
      let row = 0;
      for (let y = -r; y < height + r; y += hexH) {
        const xOffset = row % 2 === 0 ? 0 : hexW / 2;
        for (let x = -hexW; x < width + hexW; x += hexW) {
          drawHexagon(ctx, x + xOffset, y, r);
        }
        row++;
      }
      break;
    }
    case "paper-fiber": {
      const rand = mulberry32(1337);
      const dotCount = Math.round((width * height) / 6);
      for (let i = 0; i < dotCount; i++) {
        const x = rand() * width;
        const y = rand() * height;
        const alpha = 0.03 + rand() * 0.05;
        ctx.fillStyle = withAlpha(rand() > 0.5 ? line : lineStrong, alpha);
        ctx.fillRect(x, y, 1, 1);
      }
      break;
    }
  }
  ctx.restore();
}

function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Renders a texture into a standalone canvas at the given pixel size, for embedding into PDF/SVG output as a raster image. */
export function createTextureCanvas(textureId: TextureId, baseColor: string, widthPx: number, heightPx: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(widthPx));
  canvas.height = Math.max(1, Math.round(heightPx));
  const ctx = canvas.getContext("2d");
  if (ctx) drawTexturePattern(ctx, textureId, baseColor, canvas.width, canvas.height);
  return canvas;
}

export const TEXTURE_OPTIONS: { id: TextureId; label: string }[] = [
  { id: "none", label: "Keine" },
  { id: "dots", label: "Punkte" },
  { id: "grid", label: "Raster" },
  { id: "diagonal", label: "Diagonal" },
  { id: "hexagon", label: "Sechsecke" },
  { id: "paper-fiber", label: "Papierstruktur" },
];
