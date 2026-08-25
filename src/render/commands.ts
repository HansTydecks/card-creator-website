import type { BorderStyle, ImageFit, TextAlign, TextureId } from "../state/schema";

export interface RectCommand {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  radius?: number;
  opacity?: number;
}

export interface StrokeRectCommand {
  type: "strokeRect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  lineWidth: number;
  style: BorderStyle;
  radius?: number;
}

export interface LineCommand {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  lineWidth: number;
}

export interface TextCommand {
  type: "text";
  x: number;
  y: number;
  width: number;
  height: number;
  lines: string[];
  fontFamily: string;
  fontSize: number; // pt
  lineHeight: number; // mm
  fontWeight: "normal" | "bold";
  italic: boolean;
  align: TextAlign;
  color: string;
  opacity: number;
  rotation: number; // degrees, around the field's own center
}

export interface ImageCommand {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  fit: ImageFit;
  radius: number;
  opacity: number;
  rotation: number;
}

export interface TextureCommand {
  type: "texture";
  x: number;
  y: number;
  width: number;
  height: number;
  textureId: TextureId;
  baseColor: string;
}

export type DrawCommand = RectCommand | StrokeRectCommand | LineCommand | TextCommand | ImageCommand | TextureCommand;

export interface Scene {
  /** Card size in mm — the coordinate space every command's x/y/width/height is expressed in. */
  width: number;
  height: number;
  commands: DrawCommand[];
}
