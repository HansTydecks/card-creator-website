export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = Number.parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Perceptual relative luminance per WCAG 2.x. */
export function relativeLuminance({ r, g, b }: RGB): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Cut-mark / print-guide color that reliably contrasts against an arbitrary
 * background: literal color inversion, per the original product spec
 * ("Schnittkantenfarbe entspricht dem Negativ der Hintergrundfarbe"). Falls
 * back toward the higher-contrast pole of pure black/white when the true
 * negative would still be too close to the background (e.g. mid-gray).
 */
export function getContrastColor(backgroundHex: string): string {
  const bg = hexToRgb(backgroundHex);
  const negative = { r: 255 - bg.r, g: 255 - bg.g, b: 255 - bg.b };
  if (contrastRatio(bg, negative) >= 2.5) {
    return rgbToHex(negative);
  }
  const black: RGB = { r: 0, g: 0, b: 0 };
  const white: RGB = { r: 255, g: 255, b: 255 };
  return contrastRatio(bg, black) >= contrastRatio(bg, white) ? "#000000" : "#ffffff";
}
