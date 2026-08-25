import { createId } from "../utils/id";

export const CURRENT_SCHEMA_VERSION = 1;

export type PaperSize = "A4" | "A3";
export type GridId = "2x2" | "2x4" | "3x3" | "custom";
export type CardSide = "front" | "back";
export type TextureId = "none" | "dots" | "grid" | "diagonal" | "hexagon" | "paper-fiber";
export type BorderStyle = "none" | "solid" | "dashed" | "dotted";
export type TextAlign = "left" | "center" | "right";
export type ImageFit = "contain" | "cover";
export type WatermarkPosition = "center" | "diagonal";
export type CardNumberPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface GridConfig {
  id: GridId;
  columns: number;
  rows: number;
  /** mm; only used when id === 'custom', otherwise derived from paper size. */
  customCardWidth?: number;
  customCardHeight?: number;
}

export interface BorderSettings {
  style: BorderStyle;
  width: number; // mm
  color: string; // hex
}

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  opacity: number; // 0..1
  fontSize: number; // pt
  position: WatermarkPosition;
}

export interface SerialNumberSettings {
  enabled: boolean;
  startNumber: number;
  format: string; // e.g. "No. {n}/{total}"
}

export interface CardNumberSettings {
  enabled: boolean;
  position: CardNumberPosition;
}

interface FieldBase {
  id: string;
  x: number; // mm, from card top-left
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0..1
  zIndex: number;
}

export interface TextFieldDef extends FieldBase {
  kind: "text";
  label: string; // shown in the fields list / accordion, e.g. "Frage"
  placeholder: string;
  fontFamily: string;
  fontSize: number; // pt
  fontWeight: "normal" | "bold";
  italic: boolean;
  align: TextAlign;
  color: string;
}

export interface ImageFieldDef extends FieldBase {
  kind: "image";
  label: string;
  fit: ImageFit;
  borderRadius: number; // mm
}

export type FieldDef = TextFieldDef | ImageFieldDef;

export interface MasterCardSide {
  backgroundColor: string;
  texture: TextureId;
  border: BorderSettings;
  watermark: WatermarkSettings;
  showCutMarks: boolean;
  cardNumber: CardNumberSettings;
  serialNumber: SerialNumberSettings;
  fields: FieldDef[];
}

export interface MasterCard {
  front: MasterCardSide;
  back: MasterCardSide;
}

export interface ImageContent {
  dataUrl: string;
  fileName: string;
  naturalWidth: number;
  naturalHeight: number;
}

export interface CardSideContent {
  text: Record<string, string>;
  images: Record<string, ImageContent | null>;
}

export interface Card {
  id: string;
  front: CardSideContent;
  back: CardSideContent;
}

export type ProjectCategory = "allgemein" | "schule" | "hochschule" | "unternehmen" | "privat";

export interface Project {
  schemaVersion: number;
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  paperSize: PaperSize;
  grid: GridConfig;
  cardCount: number;
  masterCard: MasterCard;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export function createDefaultBorder(): BorderSettings {
  return { style: "solid", width: 0.5, color: "#1a1d21" };
}

export function createDefaultWatermark(): WatermarkSettings {
  return { enabled: false, text: "MUSTER", opacity: 0.15, fontSize: 48, position: "diagonal" };
}

export function createDefaultSerialNumber(): SerialNumberSettings {
  return { enabled: false, startNumber: 1, format: "No. {n}/{total}" };
}

export function createDefaultCardNumber(): CardNumberSettings {
  return { enabled: false, position: "bottom-right" };
}

export function createDefaultMasterSide(): MasterCardSide {
  return {
    backgroundColor: "#ffffff",
    texture: "none",
    border: createDefaultBorder(),
    watermark: createDefaultWatermark(),
    showCutMarks: true,
    cardNumber: createDefaultCardNumber(),
    serialNumber: createDefaultSerialNumber(),
    fields: [],
  };
}

export function createTextField(overrides: Partial<TextFieldDef> = {}): TextFieldDef {
  return {
    id: createId(),
    kind: "text",
    label: "Textfeld",
    placeholder: "Text eingeben …",
    x: 10,
    y: 10,
    width: 60,
    height: 20,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    fontFamily: "Segoe UI, Arial, sans-serif",
    fontSize: 14,
    fontWeight: "normal",
    italic: false,
    align: "left",
    color: "#1a1d21",
    ...overrides,
  };
}

export function createImageField(overrides: Partial<ImageFieldDef> = {}): ImageFieldDef {
  return {
    id: createId(),
    kind: "image",
    label: "Bildfeld",
    x: 10,
    y: 10,
    width: 40,
    height: 40,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    fit: "contain",
    borderRadius: 0,
    ...overrides,
  };
}

export function createEmptyCardContent(masterCard: MasterCard): { front: CardSideContent; back: CardSideContent } {
  return { front: createEmptySideContent(masterCard.front), back: createEmptySideContent(masterCard.back) };
}

export function createEmptySideContent(side: MasterCardSide): CardSideContent {
  const text: Record<string, string> = {};
  const images: Record<string, ImageContent | null> = {};
  for (const field of side.fields) {
    if (field.kind === "text") text[field.id] = "";
    else images[field.id] = null;
  }
  return { text, images };
}

export function createCard(masterCard: MasterCard): Card {
  const content = createEmptyCardContent(masterCard);
  return { id: createId(), ...content };
}

const GRID_PRESETS: Record<Exclude<GridId, "custom">, { columns: number; rows: number }> = {
  "2x2": { columns: 2, rows: 2 },
  "2x4": { columns: 2, rows: 4 },
  "3x3": { columns: 3, rows: 3 },
};

export function createGrid(id: GridId): GridConfig {
  if (id === "custom") {
    return { id, columns: 2, rows: 2, customCardWidth: 90, customCardHeight: 55 };
  }
  const preset = GRID_PRESETS[id];
  return { id, columns: preset.columns, rows: preset.rows };
}

export function createDefaultProject(): Project {
  const now = new Date().toISOString();
  const masterCard: MasterCard = { front: createDefaultMasterSide(), back: createDefaultMasterSide() };
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: createId(),
    name: "Neues Kartenprojekt",
    description: "",
    category: "allgemein",
    paperSize: "A4",
    grid: createGrid("2x4"),
    cardCount: 8,
    masterCard,
    cards: Array.from({ length: 8 }, () => createCard(masterCard)),
    createdAt: now,
    updatedAt: now,
  };
}
