import type { Project } from "../state/schema";
import { getCardSize } from "../render/layout";
import { buildCardSideScene } from "../render/scene";
import { renderScene } from "../render/targets/renderTarget";
import { SvgTarget } from "../render/targets/svgTarget";
import { createEmptySideContent } from "../state/schema";

/** Exports the master-card design itself (front + back, with field placeholders) as vector SVG — not per-card content, which has no single "the" visual since every card differs. */
export async function generateMasterSvgZipBlob(project: Project): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const cardSize = getCardSize(project.paperSize, project.grid);

  for (const side of ["front", "back"] as const) {
    const masterSide = project.masterCard[side];
    const content = createEmptySideContent(masterSide);
    const scene = buildCardSideScene(masterSide, content, cardSize, { showPlaceholders: true });
    const target = new SvgTarget(cardSize.width, cardSize.height);
    await renderScene(target, scene);
    zip.file(`masterkarte-${side === "front" ? "vorderseite" : "rueckseite"}.svg`, target.toSvgString());
  }

  return zip.generateAsync({ type: "blob" });
}
