import {
  createCard,
  createDefaultProject,
  createGrid,
  createImageField,
  createTextField,
  type Card,
  type CardSide,
  type FieldDef,
  type GridId,
  type ImageContent,
  type MasterCardSide,
  type PaperSize,
  type Project,
  type ProjectCategory,
} from "./schema";
import { resyncCardContentWithMaster } from "./content";
import { History } from "./history";
import { Autosave } from "./autosave";

export interface Selection {
  side: CardSide;
  fieldId: string;
}

export interface StoreState {
  project: Project;
  selection: Selection | null;
  editorSide: CardSide;
}

type Listener = (state: StoreState) => void;

/**
 * Small pub/sub state container — intentionally not a Redux-style reducer
 * system. Each public method is a named intent (addTextField, setPaperSize,
 * ...) that mutates the live project in place and then either commits a
 * history checkpoint immediately (discrete actions) or just notifies
 * subscribers (continuous actions like drag/slider updates, where the caller
 * is expected to call commitCheckpoint() once the interaction ends).
 */
export class Store {
  private project: Project;
  private selection: Selection | null = null;
  private editorSide: CardSide = "front";
  private listeners = new Set<Listener>();
  private readonly history = new History();
  private readonly autosave = new Autosave();

  constructor(initialProject: Project = createDefaultProject()) {
    this.project = initialProject;
    this.history.reset(this.project);
  }

  getState(): StoreState {
    return { project: this.project, selection: this.selection, editorSide: this.editorSide };
  }

  getProject(): Project {
    return this.project;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }

  /** Discrete action: mutate, push a history checkpoint, autosave, notify. */
  private mutate(fn: (project: Project) => void): void {
    fn(this.project);
    this.project.updatedAt = new Date().toISOString();
    this.commitCheckpoint();
  }

  /** Continuous action (drag/slider): mutate + notify only. Caller must call commitCheckpoint() when done. */
  mutateLive(fn: (project: Project) => void): void {
    fn(this.project);
    this.notify();
  }

  commitCheckpoint(): void {
    this.history.push(this.project);
    this.autosave.schedule(this.project);
    this.notify();
  }

  // --- project lifecycle ---

  replaceProject(project: Project, opts: { resetHistory?: boolean } = { resetHistory: true }): void {
    this.project = project;
    this.selection = null;
    this.editorSide = "front";
    if (opts.resetHistory !== false) this.history.reset(this.project);
    this.autosave.schedule(this.project);
    this.notify();
  }

  saveNow(): void {
    this.autosave.writeNow(this.project);
  }

  readAutosave() {
    return this.autosave.read();
  }

  clearAutosave(): void {
    this.autosave.clear();
  }

  // --- undo/redo ---

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  undo(): void {
    const previous = this.history.undo();
    if (!previous) return;
    this.project = previous;
    this.notify();
  }

  redo(): void {
    const next = this.history.redo();
    if (!next) return;
    this.project = next;
    this.notify();
  }

  // --- project meta / setup ---

  updateProjectMeta(patch: Partial<Pick<Project, "name" | "description" | "category">>): void {
    this.mutate((p) => Object.assign(p, patch as Partial<Project>));
  }

  setCategory(category: ProjectCategory): void {
    this.mutate((p) => (p.category = category));
  }

  setPaperSize(paperSize: PaperSize): void {
    this.mutate((p) => (p.paperSize = paperSize));
  }

  setGrid(gridId: GridId): void {
    this.mutate((p) => (p.grid = createGrid(gridId)));
  }

  setCustomCardSize(widthMm: number, heightMm: number): void {
    this.mutate((p) => {
      p.grid.customCardWidth = Math.max(10, widthMm);
      p.grid.customCardHeight = Math.max(10, heightMm);
    });
  }

  setCardCount(count: number): void {
    this.mutate((p) => {
      const target = Math.max(1, Math.min(500, Math.round(count)));
      if (target > p.cards.length) {
        const toAdd = target - p.cards.length;
        for (let i = 0; i < toAdd; i++) p.cards.push(createCard(p.masterCard));
      } else if (target < p.cards.length) {
        p.cards.length = target;
      }
      p.cardCount = target;
    });
  }

  // --- master card editing ---

  setEditorSide(side: CardSide): void {
    this.editorSide = side;
    this.notify();
  }

  updateMasterSideSettings(side: CardSide, patch: Partial<Omit<MasterCardSide, "fields">>, opts: { live?: boolean } = {}): void {
    const apply = (p: Project) => Object.assign(p.masterCard[side], patch);
    if (opts.live) this.mutateLive(apply);
    else this.mutate(apply);
  }

  addTextField(side: CardSide): string {
    const field = createTextField({ zIndex: this.nextZIndex(side) });
    this.mutate((p) => p.masterCard[side].fields.push(field));
    this.selectField(side, field.id);
    return field.id;
  }

  addImageField(side: CardSide): string {
    const field = createImageField({ zIndex: this.nextZIndex(side) });
    this.mutate((p) => p.masterCard[side].fields.push(field));
    this.selectField(side, field.id);
    return field.id;
  }

  private nextZIndex(side: CardSide): number {
    const fields = this.project.masterCard[side].fields;
    return fields.length === 0 ? 1 : Math.max(...fields.map((f) => f.zIndex)) + 1;
  }

  updateField(side: CardSide, fieldId: string, patch: Partial<FieldDef>, opts: { live?: boolean } = {}): void {
    const apply = (p: Project) => {
      const field = p.masterCard[side].fields.find((f) => f.id === fieldId);
      if (field) Object.assign(field, patch);
    };
    if (opts.live) this.mutateLive(apply);
    else this.mutate(apply);
  }

  removeField(side: CardSide, fieldId: string): void {
    this.mutate((p) => {
      p.masterCard[side].fields = p.masterCard[side].fields.filter((f) => f.id !== fieldId);
      resyncCardContentWithMaster(p);
    });
    if (this.selection?.fieldId === fieldId) this.selectField(side, null);
  }

  moveFieldLayer(side: CardSide, fieldId: string, direction: "forward" | "backward"): void {
    this.mutate((p) => {
      const fields = p.masterCard[side].fields;
      const sorted = [...fields].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((f) => f.id === fieldId);
      const swapIdx = direction === "forward" ? idx + 1 : idx - 1;
      if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;
      const a = sorted[idx]!;
      const b = sorted[swapIdx]!;
      const tmp = a.zIndex;
      a.zIndex = b.zIndex;
      b.zIndex = tmp;
    });
  }

  selectField(side: CardSide, fieldId: string | null): void {
    this.selection = fieldId ? { side, fieldId } : null;
    this.notify();
  }

  // --- per-card content ---

  setCardText(cardId: string, side: CardSide, fieldId: string, value: string, opts: { live?: boolean } = {}): void {
    const apply = (p: Project) => {
      const card = p.cards.find((c) => c.id === cardId);
      if (card) card[side].text[fieldId] = value;
    };
    if (opts.live) this.mutateLive(apply);
    else this.mutate(apply);
  }

  setCardImage(cardId: string, side: CardSide, fieldId: string, image: ImageContent | null): void {
    this.mutate((p) => {
      const card = p.cards.find((c) => c.id === cardId);
      if (card) card[side].images[fieldId] = image;
    });
  }

  addCard(): Card {
    const card = createCard(this.project.masterCard);
    this.mutate((p) => {
      p.cards.push(card);
      p.cardCount = p.cards.length;
    });
    return card;
  }

  removeCard(cardId: string): void {
    this.mutate((p) => {
      p.cards = p.cards.filter((c) => c.id !== cardId);
      p.cardCount = p.cards.length;
    });
  }

  /** Applies parsed CSV/table rows to cards in order, one row per card, creating cards as needed. */
  applyBulkImport(rows: Array<{ front?: Record<string, string>; back?: Record<string, string> }>): void {
    this.mutate((p) => {
      while (p.cards.length < rows.length) p.cards.push(createCard(p.masterCard));
      rows.forEach((row, i) => {
        const card = p.cards[i];
        if (!card) return;
        if (row.front) Object.assign(card.front.text, row.front);
        if (row.back) Object.assign(card.back.text, row.back);
      });
      p.cardCount = p.cards.length;
    });
  }
}
