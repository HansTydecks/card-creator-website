import type { GridConfig, PaperSize } from "../state/schema";

export interface MmSize {
  width: number;
  height: number;
}

export interface CardSlot {
  /** Position/size of this card on its page, in mm from the page's top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Index within the current page (0-based, row-major). */
  indexOnPage: number;
}

export interface PageLayout {
  pageIndex: number;
  slots: CardSlot[];
}

const PAGE_MARGIN_MM = 10;
// Wide enough that two adjacent cards' cut marks (each reaching
// CUT_MARK_OFFSET_MM + CUT_MARK_LENGTH_MM past their own edge) never touch:
// 2 * (0.75 + 2.5) = 6.5mm < 7mm gutter.
const CARD_GUTTER_MM = 7;

const PAGE_SIZES: Record<PaperSize, MmSize> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
};

export function getPageSize(paperSize: PaperSize): MmSize {
  return PAGE_SIZES[paperSize];
}

/** Effective grid (columns/rows/card size) actually used to lay out the page. */
export function resolveGrid(paperSize: PaperSize, grid: GridConfig): { columns: number; rows: number; cardSize: MmSize } {
  const page = getPageSize(paperSize);
  const usableWidth = page.width - 2 * PAGE_MARGIN_MM;
  const usableHeight = page.height - 2 * PAGE_MARGIN_MM;

  if (grid.id === "custom") {
    const cardWidth = grid.customCardWidth ?? 90;
    const cardHeight = grid.customCardHeight ?? 55;
    const columns = Math.max(1, Math.floor((usableWidth + CARD_GUTTER_MM) / (cardWidth + CARD_GUTTER_MM)));
    const rows = Math.max(1, Math.floor((usableHeight + CARD_GUTTER_MM) / (cardHeight + CARD_GUTTER_MM)));
    return { columns, rows, cardSize: { width: cardWidth, height: cardHeight } };
  }

  const { columns, rows } = grid;
  const cardWidth = (usableWidth - (columns - 1) * CARD_GUTTER_MM) / columns;
  const cardHeight = (usableHeight - (rows - 1) * CARD_GUTTER_MM) / rows;
  return { columns, rows, cardSize: { width: cardWidth, height: cardHeight } };
}

export function getCardSize(paperSize: PaperSize, grid: GridConfig): MmSize {
  return resolveGrid(paperSize, grid).cardSize;
}

/** Splits `cardCount` cards across as many pages as needed, one slot grid per page. */
export function paginate(paperSize: PaperSize, grid: GridConfig, cardCount: number): PageLayout[] {
  const page = getPageSize(paperSize);
  const { columns, rows, cardSize } = resolveGrid(paperSize, grid);
  const perPage = columns * rows;
  const pageCount = Math.max(1, Math.ceil(cardCount / perPage));

  const contentWidth = columns * cardSize.width + (columns - 1) * CARD_GUTTER_MM;
  const contentHeight = rows * cardSize.height + (rows - 1) * CARD_GUTTER_MM;
  const offsetX = (page.width - contentWidth) / 2;
  const offsetY = (page.height - contentHeight) / 2;

  const pages: PageLayout[] = [];
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const slots: CardSlot[] = [];
    const cardsOnThisPage = Math.min(perPage, cardCount - pageIndex * perPage);
    for (let i = 0; i < cardsOnThisPage; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      slots.push({
        x: offsetX + col * (cardSize.width + CARD_GUTTER_MM),
        y: offsetY + row * (cardSize.height + CARD_GUTTER_MM),
        width: cardSize.width,
        height: cardSize.height,
        indexOnPage: i,
      });
    }
    pages.push({ pageIndex, slots });
  }
  return pages;
}

/**
 * Mirrors slot X positions left-right within the same grid, so a back-side
 * page printed on the reverse of a front-side page lines up for duplex
 * cutting (card N's back sits directly behind card N's front).
 */
export function mirrorSlotsForDuplex(paperSize: PaperSize, slots: CardSlot[]): CardSlot[] {
  const page = getPageSize(paperSize);
  return slots.map((slot) => ({ ...slot, x: page.width - slot.x - slot.width }));
}

export const CUT_MARK_LENGTH_MM = 2.5;
export const CUT_MARK_OFFSET_MM = 0.75;
