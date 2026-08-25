const PX_PER_PT = 4 / 3;
const MM_PER_PX = 25.4 / 96;
export const PT_TO_MM = 25.4 / 72;

let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureCtx(): CanvasRenderingContext2D {
  if (!measureCtx) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable for text measurement");
    measureCtx = ctx;
  }
  return measureCtx;
}

export function fontSizePtToPx(fontSizePt: number): number {
  return fontSizePt * PX_PER_PT;
}

export function buildFontString(fontFamily: string, fontSizePt: number, weight: "normal" | "bold", italic: boolean): string {
  const px = fontSizePtToPx(fontSizePt);
  return `${italic ? "italic " : ""}${weight === "bold" ? "bold " : ""}${px}px ${fontFamily}`;
}

export function measureTextWidthMm(text: string, font: string): number {
  const ctx = getMeasureCtx();
  ctx.font = font;
  return ctx.measureText(text).width * MM_PER_PX;
}

/** Word-wraps `text` (respecting explicit newlines) to fit within `maxWidthMm`. */
export function wrapText(text: string, font: string, maxWidthMm: number): string[] {
  if (!text) return [];
  const paragraphs = text.split(/\n/);
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = words[0]!;
    for (let i = 1; i < words.length; i++) {
      const word = words[i]!;
      const candidate = `${current} ${word}`;
      if (measureTextWidthMm(candidate, font) <= maxWidthMm || current.length === 0) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

/** mm-per-line for a given point size, using a slightly-loose 1.2 leading. */
export function lineHeightMm(fontSizePt: number): number {
  return fontSizePt * PT_TO_MM * 1.2;
}
