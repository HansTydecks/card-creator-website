import type { DrawCommand, ImageCommand, LineCommand, RectCommand, Scene, StrokeRectCommand, TextCommand, TextureCommand } from "../commands";

/**
 * Thin per-output adapter. Each concrete target (canvas/PDF/SVG) implements
 * these primitives however its underlying API works; all layout/business
 * logic already happened once in scene.ts, so every implementation here is
 * "just drawing", not deciding what to draw. Methods may return a Promise
 * (PDF/SVG targets rasterize images asynchronously via <canvas> before
 * embedding); the live canvas target stays fully synchronous.
 */
export interface RenderTarget {
  drawRect(cmd: RectCommand): void | Promise<void>;
  drawStrokeRect(cmd: StrokeRectCommand): void | Promise<void>;
  drawLine(cmd: LineCommand): void | Promise<void>;
  drawText(cmd: TextCommand): void | Promise<void>;
  drawImage(cmd: ImageCommand): void | Promise<void>;
  drawTexture(cmd: TextureCommand): void | Promise<void>;
}

export async function renderScene(target: RenderTarget, scene: Scene): Promise<void> {
  for (const cmd of scene.commands) {
    await dispatch(target, cmd);
  }
}

function dispatch(target: RenderTarget, cmd: DrawCommand): void | Promise<void> {
  switch (cmd.type) {
    case "rect":
      return target.drawRect(cmd);
    case "strokeRect":
      return target.drawStrokeRect(cmd);
    case "line":
      return target.drawLine(cmd);
    case "text":
      return target.drawText(cmd);
    case "image":
      return target.drawImage(cmd);
    case "texture":
      return target.drawTexture(cmd);
  }
}
