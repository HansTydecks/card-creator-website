const MAX_DIMENSION = 1600;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    img.src = src;
  });
}

export interface PreparedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Reads an uploaded file and, if it exceeds MAX_DIMENSION on its longest
 * side (typical for unedited phone-camera photos), downsamples it via an
 * offscreen canvas before storing — otherwise every project export/autosave
 * would carry multi-megabyte base64 blobs per image, risking the
 * localStorage quota on nothing but oversized source photos.
 */
export async function prepareUploadedImage(file: File): Promise<PreparedImage> {
  const originalDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(originalDataUrl);
  const { naturalWidth: w, naturalHeight: h } = img;

  if (w <= MAX_DIMENSION && h <= MAX_DIMENSION) {
    return { dataUrl: originalDataUrl, width: w, height: h };
  }

  const scale = MAX_DIMENSION / Math.max(w, h);
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl: originalDataUrl, width: w, height: h };
  ctx.drawImage(img, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.85), width, height };
}
