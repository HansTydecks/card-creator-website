import type { Card, CardSide, CardSideContent, FieldDef, ImageContent, MasterCard, Project } from "./schema";

export interface FilledTextField {
  field: Extract<FieldDef, { kind: "text" }>;
  value: string;
}

export interface FilledImageField {
  field: Extract<FieldDef, { kind: "image" }>;
  value: ImageContent;
}

/**
 * Single canonical definition of "does this field have content", reused by
 * every exporter (PDF/Word/images) and by the UI. Centralizing this is what
 * prevents the class of bug where one export path's ad hoc check (e.g. an
 * array `.length` check against what's actually a keyed object) silently
 * disagrees with another and drops content.
 */
export function iterateFilledTextFields(
  masterSide: MasterCard[CardSide],
  content: CardSideContent,
): FilledTextField[] {
  const result: FilledTextField[] = [];
  for (const field of masterSide.fields) {
    if (field.kind !== "text") continue;
    const value = content.text[field.id];
    if (value && value.trim().length > 0) result.push({ field, value });
  }
  return result.sort((a, b) => a.field.zIndex - b.field.zIndex);
}

export function iterateFilledImageFields(
  masterSide: MasterCard[CardSide],
  content: CardSideContent,
): FilledImageField[] {
  const result: FilledImageField[] = [];
  for (const field of masterSide.fields) {
    if (field.kind !== "image") continue;
    const value = content.images[field.id];
    if (value) result.push({ field, value });
  }
  return result.sort((a, b) => a.field.zIndex - b.field.zIndex);
}

export function hasAnyContent(masterSide: MasterCard[CardSide], content: CardSideContent): boolean {
  return (
    iterateFilledTextFields(masterSide, content).length > 0 ||
    iterateFilledImageFields(masterSide, content).length > 0
  );
}

export function cardHasAnyContent(project: Project, card: Card): boolean {
  return (
    hasAnyContent(project.masterCard.front, card.front) || hasAnyContent(project.masterCard.back, card.back)
  );
}

/**
 * Keeps every card's content record in sync with the master card's field
 * list whenever a field is added or removed there. Because content is keyed
 * by stable field id (not array index), existing content for untouched
 * fields is never shifted/misaligned by this — it only adds missing keys and
 * drops orphaned ones.
 */
export function resyncCardContentWithMaster(project: Project): void {
  for (const card of project.cards) {
    resyncSide(project.masterCard.front, card.front);
    resyncSide(project.masterCard.back, card.back);
  }
}

function resyncSide(masterSide: MasterCard[CardSide], content: CardSideContent): void {
  const validIds = new Set(masterSide.fields.map((f) => f.id));

  for (const id of Object.keys(content.text)) {
    if (!validIds.has(id)) delete content.text[id];
  }
  for (const id of Object.keys(content.images)) {
    if (!validIds.has(id)) delete content.images[id];
  }
  for (const field of masterSide.fields) {
    if (field.kind === "text" && !(field.id in content.text)) content.text[field.id] = "";
    if (field.kind === "image" && !(field.id in content.images)) content.images[field.id] = null;
  }
}
