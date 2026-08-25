import type { ImageFit } from "../state/schema";

export interface ImagePlacement {
  /** Source crop rect, in the image's own natural pixel space. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Destination rect, relative to the field box's top-left, in the box's own unit (mm). */
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

export function fitImageInBox(natW: number, natH: number, boxW: number, boxH: number, fit: ImageFit): ImagePlacement {
  if (natW <= 0 || natH <= 0 || boxW <= 0 || boxH <= 0) {
    return { sx: 0, sy: 0, sw: natW, sh: natH, dx: 0, dy: 0, dw: boxW, dh: boxH };
  }

  if (fit === "contain") {
    const scale = Math.min(boxW / natW, boxH / natH);
    const dw = natW * scale;
    const dh = natH * scale;
    return { sx: 0, sy: 0, sw: natW, sh: natH, dx: (boxW - dw) / 2, dy: (boxH - dh) / 2, dw, dh };
  }

  // cover
  const scale = Math.max(boxW / natW, boxH / natH);
  const visibleW = boxW / scale;
  const visibleH = boxH / scale;
  return {
    sx: (natW - visibleW) / 2,
    sy: (natH - visibleH) / 2,
    sw: visibleW,
    sh: visibleH,
    dx: 0,
    dy: 0,
    dw: boxW,
    dh: boxH,
  };
}
