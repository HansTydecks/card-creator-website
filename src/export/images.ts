import type { Project } from "../state/schema";
import { getCardSize } from "../render/layout";
import { buildCardSideScene } from "../render/scene";
import { renderScene } from "../render/targets/renderTarget";
import { CanvasTarget, preloadImagesIntoCache } from "../render/targets/canvasTarget";
import type { Scene } from "../render/commands";

const EXPORT_PX_PER_MM = 12; // ~300dpi

function collectImageSrcs(scene: Scene): string[] {
  return scene.commands.filter((c) => c.type === "image").map((c) => c.src);
}

async function renderSceneToPngBlob(scene: Scene, cardSize: { width: number; height: number }): Promise<Blob> {
  await preloadImagesIntoCache(collectImageSrcs(scene));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cardSize.width * EXPORT_PX_PER_MM);
  canvas.height = Math.round(cardSize.height * EXPORT_PX_PER_MM);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  const target = new CanvasTarget(ctx, EXPORT_PX_PER_MM);
  await renderScene(target, scene);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG-Export fehlgeschlagen."))), "image/png");
  });
}

/** One PNG per card per side, bundled into a ZIP (via JSZip, loaded on demand). */
export async function generateImagesZipBlob(project: Project): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const cardSize = getCardSize(project.paperSize, project.grid);

  for (let i = 0; i < project.cards.length; i++) {
    const card = project.cards[i];
    if (!card) continue;
    const num = String(i + 1).padStart(3, "0");
    const sceneOptions = { cardIndex: i, totalCards: project.cards.length };

    const frontScene = buildCardSideScene(project.masterCard.front, card.front, cardSize, sceneOptions);
    zip.file(`karte-${num}-vorderseite.png`, await renderSceneToPngBlob(frontScene, cardSize));

    const backScene = buildCardSideScene(project.masterCard.back, card.back, cardSize, sceneOptions);
    zip.file(`karte-${num}-rueckseite.png`, await renderSceneToPngBlob(backScene, cardSize));
  }

  return zip.generateAsync({ type: "blob" });
}
