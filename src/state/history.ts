import type { Project } from "./schema";

const MAX_ENTRIES = 50;

/**
 * Two-stack undo/redo over full-project snapshots. Snapshots are only
 * pushed at meaningful boundaries (see Store — on pointerup/blur/discrete
 * actions, not on every keystroke or drag-move), so this stays cheap despite
 * cloning the whole project each time.
 */
export class History {
  private undoStack: Project[] = [];
  private redoStack: Project[] = [];

  push(project: Project): void {
    this.undoStack.push(structuredClone(project));
    if (this.undoStack.length > MAX_ENTRIES) this.undoStack.shift();
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): Project | null {
    if (!this.canUndo()) return null;
    const current = this.undoStack.pop();
    if (current) this.redoStack.push(current);
    const previous = this.undoStack.at(-1);
    return previous ? structuredClone(previous) : null;
  }

  redo(): Project | null {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(next);
    return structuredClone(next);
  }

  reset(project: Project): void {
    this.undoStack = [structuredClone(project)];
    this.redoStack = [];
  }
}
