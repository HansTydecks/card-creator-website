import type { Project } from "../state/schema";
import { iterateFilledTextFields, iterateFilledImageFields } from "../state/content";

const MM_TO_PX = 3.78; // ~96dpi
const MAX_IMAGE_PX = 400;

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function detectImageType(dataUrl: string): "png" | "jpg" | "gif" | "bmp" {
  if (dataUrl.startsWith("data:image/jpeg")) return "jpg";
  if (dataUrl.startsWith("data:image/gif")) return "gif";
  if (dataUrl.startsWith("data:image/bmp")) return "bmp";
  return "png";
}

/**
 * Structured Word export: one heading per card, text fields as labeled
 * paragraphs, image fields embedded inline. Uses the same
 * iterateFilledTextFields/iterateFilledImageFields helpers every other
 * exporter uses (see state/content.ts) — the original app's Word export
 * used its own ad hoc `.length` check against what turned out to be a keyed
 * object rather than an array, so every card silently exported empty.
 */
export async function generateWordBlob(project: Project): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } = await import("docx");
  const children: InstanceType<typeof Paragraph>[] = [];

  children.push(new Paragraph({ text: project.name, heading: HeadingLevel.TITLE }));
  if (project.description) children.push(new Paragraph({ text: project.description }));

  project.cards.forEach((card, i) => {
    children.push(new Paragraph({ text: `Karte ${i + 1}`, heading: HeadingLevel.HEADING_1, pageBreakBefore: i > 0 }));

    for (const side of ["front", "back"] as const) {
      const masterSide = project.masterCard[side];
      const content = card[side];
      const textFields = iterateFilledTextFields(masterSide, content);
      const imageFields = iterateFilledImageFields(masterSide, content);
      if (textFields.length === 0 && imageFields.length === 0) continue;

      children.push(new Paragraph({ text: side === "front" ? "Vorderseite" : "Rückseite", heading: HeadingLevel.HEADING_2 }));

      for (const { field, value } of textFields) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `${field.label}: `, bold: true }), new TextRun(value)],
          }),
        );
      }

      for (const { field, value } of imageFields) {
        const widthPx = Math.min(MAX_IMAGE_PX, Math.round(field.width * MM_TO_PX));
        const heightPx = Math.round(widthPx * (value.naturalHeight / Math.max(1, value.naturalWidth)));
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                type: detectImageType(value.dataUrl),
                data: dataUrlToBytes(value.dataUrl),
                transformation: { width: widthPx, height: Math.max(1, heightPx) },
              }),
            ],
          }),
        );
      }
    }
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}
