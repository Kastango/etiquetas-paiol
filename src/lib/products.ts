export type CellType = "title" | "default" | "larger";
export interface Product { id: number; name: string; price: number; unit: string; cellType: CellType }

export const STORAGE_KEY = "products";
export const UNITS = ["100g", "kg", "un."];
export const CELL_TYPES: { value: CellType; label: string }[] = [
  { value: "title", label: "Título" },
  { value: "default", label: "Padrão" },
  { value: "larger", label: "Largo" },
];
/** Label widths in mm; rows fill the 200 mm printable width of an A4 sheet. */
export const CELL_WIDTH: Record<CellType, number> = { title: 65, default: 65, larger: 95 };
const ROW_WIDTH = 200, ROWS_PER_PAGE = 9;

export const currency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const decimal = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });


/** Accepts "4,79", "4.79", "R$ 1.234,56" and "1234.56". */
export function parsePrice(value: string) {
  const clean = value.replace(/R\$|\s/g, "");
  return Number(clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean);
}

/** A price typed in a field: "5" is R$ 5,00, as in a spreadsheet; empty is zero; null when unreadable. */
export function readPrice(text: string) {
  if (!text.trim()) return 0;
  const price = parsePrice(text);
  return Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : null;
}

export function readProducts(value: unknown): Product[] {
  if (!Array.isArray(value)) throw new Error("A lista de produtos não é válida.");
  return value.map((row, index) => {
    if (!row || typeof row.name !== "string" || typeof row.price !== "number" || !Number.isFinite(row.price) || row.price < 0) {
      throw new Error(`Confira o nome e o preço do produto na linha ${index + 1}.`);
    }
    return { id: index + 1, name: row.name, price: row.price, unit: typeof row.unit === "string" && row.unit ? row.unit : "100g",
      cellType: ["title", "larger"].includes(row.cellType) ? row.cellType : "default" };
  });
}

export function exportProducts(products: Product[]): string {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return "﻿name,price,unit,cellType\n" + products.map(p => [quote(p.name), p.price, quote(p.unit), p.cellType].join(",")).join("\n") + "\n";
}

export const CSV_TEMPLATE = exportProducts([
  { id: 1, name: "Castanhas", price: 0, unit: "100g", cellType: "title" },
  { id: 2, name: "Castanha de caju torrada sem sal", price: 6.99, unit: "100g", cellType: "default" },
  { id: 3, name: "Nozes chilenas | quebradas", price: 4.79, unit: "100g", cellType: "larger" },
]);

// Column names from the original export (name, price, unit), the cellType extension, and Portuguese headers.
const COLUMNS: Record<string, string> = { name: "name", nome: "name", produto: "name", price: "price", preco: "price", "preço": "price",
  valor: "price", unit: "unit", unidade: "unit", celltype: "cellType", tipo: "cellType" };
const TYPE_NAMES: Record<string, CellType> = { title: "title", titulo: "title", "título": "title", default: "default", padrao: "default",
  "padrão": "default", larger: "larger", largo: "larger" };

export function importProducts(text: string): Product[] {
  text = text.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/)[0];
  const delimiter = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";
  const rows: string[][] = []; let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted;
    } else if (char === delimiter && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field); if (row.some(v => v.trim())) rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (quoted) throw new Error("Há aspas abertas no CSV. Confira o arquivo.");
  row.push(field); if (row.some(v => v.trim())) rows.push(row);
  const header = rows.shift()?.map(v => COLUMNS[v.trim().toLowerCase()]);
  if (!header || !header.includes("name") || !header.includes("price")) {
    throw new Error("O CSV precisa das colunas name e price. Baixe o modelo para começar.");
  }
  return readProducts(rows.map((values, index) => {
    const get = (key: string) => values[header.indexOf(key)]?.trim() ?? "";
    const line = index + 2, rawType = get("cellType").toLowerCase();
    const cellType = rawType ? TYPE_NAMES[rawType] : "default";
    if (!cellType) throw new Error(`Tipo inválido na linha ${line}. Use title, default ou larger.`);
    const name = get("name"), rawPrice = get("price");
    if (!name) throw new Error(`Preencha o nome do produto na linha ${line}.`);
    const price = cellType === "title" ? 0 : parsePrice(rawPrice);
    if (cellType !== "title" && (!rawPrice || !Number.isFinite(price))) throw new Error(`Confira o preço na linha ${line}.`);
    return { name, price, unit: get("unit") || "100g", cellType };
  }));
}

/**
 * Pastes a block copied from Excel or Google Sheets (tab-separated) at row, col of the table, whose
 * columns are name, price, unit and label type. Rows past the end become new products when the
 * block starts at the name column; cells that cannot be read keep their current value.
 */
export function pasteGrid(products: Product[], row: number, col: number, text: string): Product[] {
  const lines = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n").map(line => line.split("\t"));
  const next = products.map(p => ({ ...p }));
  let id = products.reduce((max, p) => Math.max(max, p.id), 0);
  lines.forEach((cells, i) => {
    if (row + i >= next.length) {
      if (col !== 0 || !cells[0]?.trim()) return;
      next.push({ id: ++id, name: "", price: 0, unit: "100g", cellType: "default" });
    }
    const product = next[row + i];
    cells.forEach((raw, j) => {
      const value = raw.trim();
      const column = col + j;
      if (column === 0 && value) product.name = value;
      if (column === 1 && value) {
        const price = parsePrice(value);
        if (Number.isFinite(price) && price >= 0) product.price = Math.round(price * 100) / 100;
      }
      if (column === 2 && value) product.unit = value;
      if (column === 3 && TYPE_NAMES[value.toLowerCase()]) product.cellType = TYPE_NAMES[value.toLowerCase()];
    });
  });
  return next;
}

/**
 * As in the original sheet: wide labels first, two per row, then the others three per row,
 * each group in list order. Rows never exceed the printable width; nine rows per A4 page.
 */
export function labelPages(products: Product[]): Product[][][] {
  const rows: Product[][] = [];
  for (const group of [products.filter(p => p.cellType === "larger"), products.filter(p => p.cellType !== "larger")]) {
    let row: Product[] = [], width = 0;
    for (const product of group) {
      const size = CELL_WIDTH[product.cellType];
      if (row.length && width + size > ROW_WIDTH) { rows.push(row); row = []; width = 0; }
      row.push(product); width += size;
    }
    if (row.length) rows.push(row);
  }
  const pages: Product[][][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  return pages;
}

export function loadProducts(): Product[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? readProducts(JSON.parse(saved)) : [];
  } catch {
    return [];
  }
}
