import type { Project } from "../state/schema";
import { getCardSize, getPageSize, paginate, resolveGrid, mirrorSlotsForDuplex } from "../render/layout";
import { buildCardSideScene } from "../render/scene";
import { renderScene } from "../render/targets/renderTarget";
import { PdfTarget } from "../render/targets/pdfTarget";

/**
 * Prints all front pages first, then all back pages (mirrored so card N's
 * back lines up behind card N's front) — the standard "print fronts, flip
 * the stack, print backs" workflow for printers without automatic duplex.
 */
export async function generatePdfBlob(project: Project): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pageSize = getPageSize(project.paperSize);
  const cardSize = getCardSize(project.paperSize, project.grid);
  const { columns, rows } = resolveGrid(project.paperSize, project.grid);
  const perPage = columns * rows;
  const pages = paginate(project.paperSize, project.grid, project.cards.length);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageSize.width, pageSize.height] });
  pdf.setProperties({ title: project.name, subject: project.description, creator: "Card Creator" });

  let pageStarted = false;
  const startPage = () => {
    if (pageStarted) pdf.addPage([pageSize.width, pageSize.height], "portrait");
    pageStarted = true;
  };

  for (const page of pages) {
    startPage();
    for (const slot of page.slots) {
      const card = project.cards[page.pageIndex * perPage + slot.indexOnPage];
      if (!card) continue;
      const scene = buildCardSideScene(project.masterCard.front, card.front, cardSize, {
        cardIndex: page.pageIndex * perPage + slot.indexOnPage,
        totalCards: project.cards.length,
      });
      await renderScene(new PdfTarget(pdf, slot.x, slot.y), scene);
    }
  }

  for (const page of pages) {
    startPage();
    const mirrored = mirrorSlotsForDuplex(project.paperSize, page.slots);
    for (const slot of mirrored) {
      const card = project.cards[page.pageIndex * perPage + slot.indexOnPage];
      if (!card) continue;
      const scene = buildCardSideScene(project.masterCard.back, card.back, cardSize, {
        cardIndex: page.pageIndex * perPage + slot.indexOnPage,
        totalCards: project.cards.length,
      });
      await renderScene(new PdfTarget(pdf, slot.x, slot.y), scene);
    }
  }

  return pdf.output("blob");
}
