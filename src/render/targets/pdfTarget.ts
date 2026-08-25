import type { jsPDF } from "jspdf";
import type { LineCommand, RectCommand, StrokeRectCommand, TextCommand, TextureCommand, ImageCommand } from "../commands";
import type { RenderTarget } from "./renderTarget";
import { hexToRgb } from "../../utils/color";
import { createTextureCanvas } from "../textureTiles";
import { rasterizeImageCommand } from "../rasterizeImage";

const IMAGE_EXPORT_PX_PER_MM = 12; // ~300dpi
const TEXTURE_EXPORT_PX_PER_MM = 6;

// jsPDF's text `angle` rotates counter-clockwise in its top-left-origin
// coordinate space, opposite of <canvas> rotate()'s clockwise convention —
// negate so a field's rotation looks the same in the PDF as in the editor.
const PDF_ANGLE_SIGN = -1;

function jspdfFont(fontFamily: string): "helvetica" | "times" | "courier" {
  const lower = fontFamily.toLowerCase();
  if (lower.includes("monospace") || lower.includes("courier")) return "courier";
  if (lower.includes("serif") && !lower.includes("sans-serif")) return "times";
  return "helvetica";
}

function jspdfFontStyle(weight: "normal" | "bold", italic: boolean): "normal" | "bold" | "italic" | "bolditalic" {
  if (weight === "bold" && italic) return "bolditalic";
  if (weight === "bold") return "bold";
  if (italic) return "italic";
  return "normal";
}

function dashPattern(style: StrokeRectCommand["style"], lineWidth: number): number[] {
  switch (style) {
    case "dashed":
      return [lineWidth * 3, lineWidth * 2];
    case "dotted":
      return [lineWidth, lineWidth * 1.5];
    default:
      return [];
  }
}

/** Renders a Scene onto a jsPDF document at the card's current page offset (ox, oy) in mm. */
export class PdfTarget implements RenderTarget {
  constructor(private pdf: jsPDF, private ox: number, private oy: number) {}

  private setFill(hex: string): void {
    const { r, g, b } = hexToRgb(hex);
    this.pdf.setFillColor(r, g, b);
  }

  private setStroke(hex: string): void {
    const { r, g, b } = hexToRgb(hex);
    this.pdf.setDrawColor(r, g, b);
  }

  private withOpacity<T>(alpha: number | undefined, fn: () => T): T {
    if (alpha === undefined || alpha >= 1) return fn();
    const pdf = this.pdf as jsPDF & { GState: new (params: Record<string, number>) => unknown; setGState: (g: unknown) => void };
    this.pdf.saveGraphicsState();
    pdf.setGState(new pdf.GState({ opacity: alpha }));
    const result = fn();
    this.pdf.restoreGraphicsState();
    return result;
  }

  drawRect(cmd: RectCommand): void {
    this.withOpacity(cmd.opacity, () => {
      this.setFill(cmd.fill);
      const x = this.ox + cmd.x;
      const y = this.oy + cmd.y;
      if (cmd.radius) this.pdf.roundedRect(x, y, cmd.width, cmd.height, cmd.radius, cmd.radius, "F");
      else this.pdf.rect(x, y, cmd.width, cmd.height, "F");
    });
  }

  drawStrokeRect(cmd: StrokeRectCommand): void {
    if (cmd.style === "none") return;
    this.setStroke(cmd.color);
    this.pdf.setLineWidth(cmd.lineWidth);
    this.pdf.setLineDashPattern(dashPattern(cmd.style, cmd.lineWidth), 0);
    const x = this.ox + cmd.x;
    const y = this.oy + cmd.y;
    if (cmd.radius) this.pdf.roundedRect(x, y, cmd.width, cmd.height, cmd.radius, cmd.radius, "S");
    else this.pdf.rect(x, y, cmd.width, cmd.height, "S");
    this.pdf.setLineDashPattern([], 0);
  }

  drawLine(cmd: LineCommand): void {
    this.setStroke(cmd.color);
    this.pdf.setLineWidth(cmd.lineWidth);
    this.pdf.line(this.ox + cmd.x1, this.oy + cmd.y1, this.ox + cmd.x2, this.oy + cmd.y2);
  }

  drawText(cmd: TextCommand): void {
    this.withOpacity(cmd.opacity, () => {
      const { r, g, b } = hexToRgb(cmd.color);
      this.pdf.setTextColor(r, g, b);
      this.pdf.setFont(jspdfFont(cmd.fontFamily), jspdfFontStyle(cmd.fontWeight, cmd.italic));
      this.pdf.setFontSize(cmd.fontSize);

      const boxX = this.ox + cmd.x;
      const boxY = this.oy + cmd.y;
      const anchorX = cmd.align === "center" ? boxX + cmd.width / 2 : cmd.align === "right" ? boxX + cmd.width : boxX;

      // jsPDF rotates text around the (x, y) anchor itself, not around the
      // field's box center the way the canvas/editor selection does. Close
      // enough for short single/multi-line labels like a watermark; a
      // perfectly matching center-pivot would need manual glyph placement.
      cmd.lines.forEach((line, i) => {
        if (!line) return;
        const y = boxY + i * cmd.lineHeight;
        this.pdf.text(line, anchorX, y, {
          align: cmd.align,
          baseline: "top",
          angle: cmd.rotation ? PDF_ANGLE_SIGN * cmd.rotation : undefined,
        });
      });
    });
  }

  async drawImage(cmd: ImageCommand): Promise<void> {
    const { dataUrl } = await rasterizeImageCommand(cmd, IMAGE_EXPORT_PX_PER_MM);
    this.pdf.addImage(dataUrl, "PNG", this.ox + cmd.x, this.oy + cmd.y, cmd.width, cmd.height);
  }

  drawTexture(cmd: TextureCommand): void {
    const widthPx = Math.max(1, Math.round(cmd.width * TEXTURE_EXPORT_PX_PER_MM));
    const heightPx = Math.max(1, Math.round(cmd.height * TEXTURE_EXPORT_PX_PER_MM));
    const canvas = createTextureCanvas(cmd.textureId, cmd.baseColor, widthPx, heightPx);
    this.pdf.addImage(canvas.toDataURL("image/png"), "PNG", this.ox + cmd.x, this.oy + cmd.y, cmd.width, cmd.height);
  }
}
