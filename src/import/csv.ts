/**
 * Hand-rolled CSV/TSV parser for the "paste a table from Excel/Sheets" batch
 * import use case. Handles comma/semicolon/tab delimiters (auto-detected),
 * quoted fields with embedded delimiters/newlines, and "" escaped quotes.
 * Deliberately not a full RFC 4180 implementation — if real-world pasted
 * data turns out to break this, swap in a small library rather than
 * growing this by hand.
 */
export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

function detectDelimiter(sample: string): string {
  const candidates = [",", ";", "\t"];
  const firstLine = sample.split(/\r\n|\n/, 1)[0] ?? "";
  let best = ",";
  let bestCount = -1;
  for (const c of candidates) {
    const count = firstLine.split(c).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

export function parseTable(input: string): ParsedTable {
  const text = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"' && field.length === 0) {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === delimiter) {
      pushField();
      i += 1;
      continue;
    }
    if (char === "\n") {
      pushRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) pushRow();

  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim().length > 0));
  const [headers, ...dataRows] = nonEmptyRows;
  return { headers: headers ?? [], rows: dataRows };
}
