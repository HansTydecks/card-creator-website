import type { ImageCommand, LineCommand, RectCommand, StrokeRectCommand, TextCommand, TextureCommand } from "../commands";
import type { RenderTarget } from "./renderTarget";
import { createTextureCanvas } from "../textureTiles";
import { rasterizeImageCommand } from "../rasterizeImage";

const TEXTURE_EXPORT_PX_PER_MM = 6;
const IMAGE_EXPORT_PX_PER_MM = 8;

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function dashArray(style: StrokeRectCommand["style"], lineWidth: number): string | null {
  switch (style) {
    case "dashed":
      return `${lineWidth * 3},${lineWidth * 2}`;
    case "dotted":
      return `${lineWidth},${lineWidth * 1.5}`;
    default:
      return null;
  }
}

/** Builds a standalone SVG document for a single card side. Renders images/textures as embedded raster data (see rasterizeImage.ts) since SVG's own filter/pattern primitives aren't worth the complexity for this secondary export format. */
export class SvgTarget implements RenderTarget {
  private parts: string[] = [];

  constructor(private width: number, private height: number) {}

  toSvgString(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}mm" height="${this.height}mm" viewBox="0 0 ${this.width} ${this.height}">${this.parts.join("")}</svg>`;
  }

  drawRect(cmd: RectCommand): void {
    const rx = cmd.radius ? ` rx="${cmd.radius}"` : "";
    const opacity = cmd.opacity !== undefined ? ` opacity="${cmd.opacity}"` : "";
    this.parts.push(`<rect x="${cmd.x}" y="${cmd.y}" width="${cmd.width}" height="${cmd.height}" fill="${cmd.fill}"${rx}${opacity}/>`);
  }

  drawStrokeRect(cmd: StrokeRectCommand): void {
    if (cmd.style === "none") return;
    const rx = cmd.radius ? ` rx="${cmd.radius}"` : "";
    const dash = dashArray(cmd.style, cmd.lineWidth);
    const dashAttr = dash ? ` stroke-dasharray="${dash}"` : "";
    this.parts.push(
      `<rect x="${cmd.x}" y="${cmd.y}" width="${cmd.width}" height="${cmd.height}" fill="none" stroke="${cmd.color}" stroke-width="${cmd.lineWidth}"${dashAttr}${rx}/>`,
    );
  }

  drawLine(cmd: LineCommand): void {
    this.parts.push(`<line x1="${cmd.x1}" y1="${cmd.y1}" x2="${cmd.x2}" y2="${cmd.y2}" stroke="${cmd.color}" stroke-width="${cmd.lineWidth}"/>`);
  }

  drawText(cmd: TextCommand): void {
    const anchor = cmd.align === "center" ? "middle" : cmd.align === "right" ? "end" : "start";
    const anchorX = cmd.align === "center" ? cmd.x + cmd.width / 2 : cmd.align === "right" ? cmd.x + cmd.width : cmd.x;
    const cx = cmd.x + cmd.width / 2;
    const cy = cmd.y + cmd.height / 2;
    const transform = cmd.rotation ? ` transform="rotate(${cmd.rotation} ${cx} ${cy})"` : "";
    const weight = cmd.fontWeight === "bold" ? " font-weight=\"bold\"" : "";
    const style = cmd.italic ? " font-style=\"italic\"" : "";

    const tspans = cmd.lines
      .map((line, i) => `<tspan x="${anchorX}" y="${cmd.y + i * cmd.lineHeight + cmd.fontSize * 0.3528}">${escapeXml(line)}</tspan>`)
      .join("");

    this.parts.push(
      `<text${transform} text-anchor="${anchor}" font-family="${escapeXml(cmd.fontFamily)}" font-size="${cmd.fontSize * 0.3528}mm" fill="${cmd.color}" opacity="${cmd.opacity}"${weight}${style}>${tspans}</text>`,
    );
  }

  async drawImage(cmd: ImageCommand): Promise<void> {
    const { dataUrl } = await rasterizeImageCommand(cmd, IMAGE_EXPORT_PX_PER_MM);
    this.parts.push(`<image x="${cmd.x}" y="${cmd.y}" width="${cmd.width}" height="${cmd.height}" href="${dataUrl}"/>`);
  }

  drawTexture(cmd: TextureCommand): void {
    const widthPx = Math.max(1, Math.round(cmd.width * TEXTURE_EXPORT_PX_PER_MM));
    const heightPx = Math.max(1, Math.round(cmd.height * TEXTURE_EXPORT_PX_PER_MM));
    const canvas = createTextureCanvas(cmd.textureId, cmd.baseColor, widthPx, heightPx);
    this.parts.push(`<image x="${cmd.x}" y="${cmd.y}" width="${cmd.width}" height="${cmd.height}" href="${canvas.toDataURL("image/png")}"/>`);
  }
}
