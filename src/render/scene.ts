import type { CardSideContent, FieldDef, MasterCardSide } from "../state/schema";
import { getContrastColor } from "../utils/color";
import type { DrawCommand, Scene } from "./commands";
import { buildFontString, wrapText, lineHeightMm } from "./textMeasure";
import type { MmSize } from "./layout";
import { CUT_MARK_LENGTH_MM, CUT_MARK_OFFSET_MM } from "./layout";

export interface SceneOptions {
  /** Show field placeholders for empty fields (master editor) instead of leaving them blank (export/preview of real content). */
  showPlaceholders?: boolean;
  cardIndex?: number; // 0-based
  totalCards?: number;
}

/**
 * Single source of truth for how a card side looks. Pure and target-agnostic
 * — returns declarative draw commands consumed identically by the live
 * canvas preview and every export path (PDF/PNG/SVG), so there is exactly
 * one place that knows how backgrounds, textures, borders, fields,
 * watermarks, cut marks and card numbers are laid out.
 */
export function buildCardSideScene(masterSide: MasterCardSide, content: CardSideContent, dims: MmSize, options: SceneOptions = {}): Scene {
  const commands: DrawCommand[] = [];
  const { width, height } = dims;
  const contrastColor = getContrastColor(masterSide.backgroundColor);

  commands.push({ type: "rect", x: 0, y: 0, width, height, fill: masterSide.backgroundColor });

  if (masterSide.texture !== "none") {
    commands.push({ type: "texture", x: 0, y: 0, width, height, textureId: masterSide.texture, baseColor: masterSide.backgroundColor });
  }

  const sortedFields = [...masterSide.fields].sort((a, b) => a.zIndex - b.zIndex);
  for (const field of sortedFields) {
    const cmd = buildFieldCommand(field, content, options.showPlaceholders ?? false);
    if (cmd) commands.push(cmd);
  }

  if (masterSide.border.style !== "none" && masterSide.border.width > 0) {
    const w = masterSide.border.width;
    commands.push({
      type: "strokeRect",
      x: w / 2,
      y: w / 2,
      width: width - w,
      height: height - w,
      color: masterSide.border.color,
      lineWidth: w,
      style: masterSide.border.style,
    });
  }

  if (masterSide.showCutMarks) {
    commands.push(...buildCutMarks(width, height, contrastColor));
  }

  if (masterSide.watermark.enabled && masterSide.watermark.text.trim()) {
    commands.push(buildWatermarkCommand(masterSide.watermark, width, height, contrastColor));
  }

  if (masterSide.serialNumber.enabled && options.cardIndex !== undefined) {
    const n = masterSide.serialNumber.startNumber + options.cardIndex;
    const total = options.totalCards ?? n;
    const text = masterSide.serialNumber.format.replace("{n}", String(n).padStart(3, "0")).replace("{total}", String(total));
    commands.push({
      type: "text",
      x: 2,
      y: height - 8,
      width: width - 4,
      height: 6,
      lines: [text],
      fontFamily: "Segoe UI, Arial, sans-serif",
      fontSize: 6,
      lineHeight: lineHeightMm(6),
      fontWeight: "normal",
      italic: false,
      align: "center",
      color: contrastColor,
      opacity: 0.55,
      rotation: 0,
    });
  }

  if (masterSide.cardNumber.enabled && options.cardIndex !== undefined) {
    const label = `${options.cardIndex + 1}${options.totalCards ? `/${options.totalCards}` : ""}`;
    commands.push(buildCardNumberCommand(label, masterSide.cardNumber.position, width, height, contrastColor));
  }

  return { width, height, commands };
}

function buildFieldCommand(field: FieldDef, content: CardSideContent, showPlaceholders: boolean): DrawCommand | null {
  if (field.kind === "text") {
    const value = content.text[field.id] ?? "";
    const isPlaceholder = value.trim().length === 0;
    if (isPlaceholder && !showPlaceholders) return null;
    const text = isPlaceholder ? field.placeholder : value;
    const font = buildFontString(field.fontFamily, field.fontSize, field.fontWeight, field.italic);
    const lines = wrapText(text, font, field.width);
    return {
      type: "text",
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      lines,
      fontFamily: field.fontFamily,
      fontSize: field.fontSize,
      lineHeight: lineHeightMm(field.fontSize),
      fontWeight: field.fontWeight,
      italic: field.italic,
      align: field.align,
      color: isPlaceholder ? "#9aa1ac" : field.color,
      opacity: isPlaceholder ? 0.7 : field.opacity,
      rotation: field.rotation,
    };
  }

  const image = content.images[field.id];
  if (!image) {
    if (!showPlaceholders) return null;
    return {
      type: "strokeRect",
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      color: "#9aa1ac",
      lineWidth: 0.4,
      style: "dashed",
      radius: field.borderRadius,
    };
  }
  return {
    type: "image",
    x: field.x,
    y: field.y,
    width: field.width,
    height: field.height,
    src: image.dataUrl,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    fit: field.fit,
    radius: field.borderRadius,
    opacity: field.opacity,
    rotation: field.rotation,
  };
}

function buildCutMarks(width: number, height: number, color: string): DrawCommand[] {
  const len = CUT_MARK_LENGTH_MM;
  const off = CUT_MARK_OFFSET_MM;
  const corners: [number, number, number, number][] = [
    // each entry: originX, originY, dirX, dirY (outward direction from the card)
    [0, 0, -1, -1],
    [width, 0, 1, -1],
    [0, height, -1, 1],
    [width, height, 1, 1],
  ];
  const lines: DrawCommand[] = [];
  for (const [ox, oy, dx, dy] of corners) {
    lines.push({
      type: "line",
      x1: ox + dx * off,
      y1: oy,
      x2: ox + dx * (off + len),
      y2: oy,
      color,
      lineWidth: 0.25,
    });
    lines.push({
      type: "line",
      x1: ox,
      y1: oy + dy * off,
      x2: ox,
      y2: oy + dy * (off + len),
      color,
      lineWidth: 0.25,
    });
  }
  return lines;
}

function buildWatermarkCommand(
  watermark: MasterCardSide["watermark"],
  width: number,
  height: number,
  color: string,
): DrawCommand {
  const rotation = watermark.position === "diagonal" ? -30 : 0;
  return {
    type: "text",
    x: width * 0.1,
    y: height / 2 - 8,
    width: width * 0.8,
    height: 16,
    lines: [watermark.text],
    fontFamily: "Segoe UI, Arial, sans-serif",
    fontSize: watermark.fontSize,
    lineHeight: lineHeightMm(watermark.fontSize),
    fontWeight: "bold",
    italic: false,
    align: "center",
    color,
    opacity: watermark.opacity,
    rotation,
  };
}

function buildCardNumberCommand(
  label: string,
  position: MasterCardSide["cardNumber"]["position"],
  width: number,
  height: number,
  color: string,
): DrawCommand {
  const size = 8;
  const margin = 2.5;
  const boxW = 14;
  const boxH = 5;
  const [x, y, align] = (() => {
    switch (position) {
      case "top-left":
        return [margin, margin, "left" as const];
      case "top-right":
        return [width - margin - boxW, margin, "right" as const];
      case "bottom-left":
        return [margin, height - margin - boxH, "left" as const];
      case "bottom-right":
      default:
        return [width - margin - boxW, height - margin - boxH, "right" as const];
    }
  })();
  return {
    type: "text",
    x,
    y,
    width: boxW,
    height: boxH,
    lines: [label],
    fontFamily: "Segoe UI, Arial, sans-serif",
    fontSize: size,
    lineHeight: lineHeightMm(size),
    fontWeight: "normal",
    italic: false,
    align,
    color,
    opacity: 0.85,
    rotation: 0,
  };
}
