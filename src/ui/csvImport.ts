import type { Store } from "../state/store";
import type { TextFieldDef } from "../state/schema";
import { createEl } from "../utils/dom";
import { parseTable, type ParsedTable } from "../import/csv";
import { openModal } from "./modal";
import { toast } from "./toast";

interface ImportTarget {
  side: "front" | "back";
  field: TextFieldDef;
}

export function openCsvImportDialog(store: Store): void {
  const project = store.getProject();
  const targets: ImportTarget[] = [
    ...project.masterCard.front.fields.filter((f): f is TextFieldDef => f.kind === "text").map((field) => ({ side: "front" as const, field })),
    ...project.masterCard.back.fields.filter((f): f is TextFieldDef => f.kind === "text").map((field) => ({ side: "back" as const, field })),
  ];

  if (targets.length === 0) {
    openModal({
      title: "Karteninhalte importieren",
      body: "Lege zuerst mindestens ein Textfeld auf der Masterkarte an, bevor du Inhalte importierst.",
      actions: [{ label: "OK", variant: "primary" }],
    });
    return;
  }

  const body = createEl("div", { class: "csv-import" });
  body.append(
    createEl("p", { class: "field__hint" }, [
      "Füge eine Tabelle ein (z. B. aus Excel/Google Sheets kopiert). Erste Zeile = Spaltenüberschriften. Jede weitere Zeile wird zu einer Karte.",
    ]),
  );
  const textarea = createEl("textarea", { rows: "6", placeholder: "Frage;Antwort\nWas ist 2+2?;4\n…" });
  const mappingContainer = createEl("div", { class: "csv-import__mapping" });
  const previewInfo = createEl("p", { class: "field__hint" });
  body.append(textarea, mappingContainer, previewInfo);

  let parsed: ParsedTable = { headers: [], rows: [] };
  const selects: HTMLSelectElement[] = [];

  const rebuild = () => {
    parsed = parseTable(textarea.value);
    mappingContainer.replaceChildren();
    selects.length = 0;

    parsed.headers.forEach((header, colIndex) => {
      const row = createEl("div", { class: "field-row csv-import__map-row" });
      row.append(createEl("span", { class: "csv-import__col-label" }, [header.trim() || `Spalte ${colIndex + 1}`]));
      const select = createEl("select", {});
      select.append(createEl("option", { value: "" }, ["Ignorieren"]));
      for (const target of targets) {
        select.append(
          createEl("option", { value: `${target.side}:${target.field.id}` }, [
            `${target.side === "front" ? "Vorderseite" : "Rückseite"}: ${target.field.label}`,
          ]),
        );
      }
      const guess = targets.find((t) => t.field.label.trim().toLowerCase() === header.trim().toLowerCase());
      if (guess) select.value = `${guess.side}:${guess.field.id}`;
      selects.push(select);
      row.append(select);
      mappingContainer.append(row);
    });

    previewInfo.textContent = parsed.rows.length > 0 ? `${parsed.rows.length} Karte(n) erkannt.` : "";
  };

  textarea.addEventListener("input", rebuild);

  openModal({
    title: "Karteninhalte aus Tabelle importieren",
    body,
    actions: [
      { label: "Abbrechen", variant: "secondary" },
      {
        label: "Importieren",
        variant: "primary",
        onSelect: () => {
          if (parsed.rows.length === 0) return;
          const rows = parsed.rows.map((cells) => {
            const front: Record<string, string> = {};
            const back: Record<string, string> = {};
            selects.forEach((select, i) => {
              const value = select.value;
              if (!value) return;
              const [side, fieldId] = value.split(":") as ["front" | "back", string];
              const cellValue = cells[i] ?? "";
              (side === "front" ? front : back)[fieldId] = cellValue;
            });
            return { front, back };
          });
          store.applyBulkImport(rows);
          toast(`${rows.length} Karte(n) importiert.`, "success");
        },
      },
    ],
  });
}
