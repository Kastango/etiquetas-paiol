import { BUILT_IN_TYPES, SHEET, findType, perRow, typeOf, type LabelType } from "./label-types";

/** cellType is the id of the product's label type (src/lib/label-types.ts). */
export interface Product { id: number; name: string; price: number; unit: string; cellType: string }

export const STORAGE_KEY = "products";
export const UNITS = ["100g", "kg", "un."];

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
      cellType: typeof row.cellType === "string" && row.cellType ? row.cellType : "default" };
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

/** Reads a CSV; the type column takes a type's id or name, among `types`. */
export function importProducts(text: string, types: LabelType[] = BUILT_IN_TYPES): Product[] {
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
    const line = index + 2, rawType = get("cellType");
    const type = rawType ? findType(rawType, types) : BUILT_IN_TYPES[0];
    if (!type) {
      throw new Error(`O tipo “${rawType}” da linha ${line} não existe aqui. Crie-o em Tipos de etiqueta ou use: ${types.map(t => t.name).join(", ")}.`);
    }
    const name = get("name"), rawPrice = get("price"), priced = type.price !== "none";
    if (!name) throw new Error(`Preencha o nome do produto na linha ${line}.`);
    const price = priced ? parsePrice(rawPrice) : 0;
    if (priced && (!rawPrice || !Number.isFinite(price))) throw new Error(`Confira o preço na linha ${line}.`);
    return { name, price, unit: get("unit") || "100g", cellType: type.id };
  }));
}

/**
 * Pastes a block copied from Excel or Google Sheets (tab-separated) at row, col of the table, whose
 * columns are name, price, unit and label type. Rows past the end become new products when the
 * block starts at the name column; cells that cannot be read keep their current value.
 */
export function pasteGrid(products: Product[], row: number, col: number, text: string, types: LabelType[] = BUILT_IN_TYPES): Product[] {
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
      const type = column === 3 && value ? findType(value, types) : null;
      if (type) product.cellType = type.id;
    });
  });
  return next;
}

/**
 * Each row holds labels of one size, so the sheet cuts in straight lines: sizes from the widest
 * (then tallest), as the original sheet put its wide labels first; each size in list order. Rows
 * fill the printable width and pages break when the next row would not fit their height.
 */
export function labelPages(products: Product[], types: LabelType[] = BUILT_IN_TYPES): Product[][][] {
  const sizes = new Map<string, { type: LabelType; products: Product[] }>();
  for (const product of products) {
    const type = typeOf(product, types), key = `${type.width}x${type.height}`;
    if (sizes.has(key)) sizes.get(key)!.products.push(product);
    else sizes.set(key, { type, products: [product] });
  }
  const pages: Product[][][] = [];
  let page: Product[][] = [], used = 0;
  for (const { type, products: group } of [...sizes.values()].sort((a, b) => b.type.width - a.type.width || b.type.height - a.type.height)) {
    for (let i = 0; i < group.length; i += perRow(type)) {
      if (page.length && used + SHEET.gap + type.height > SHEET.height) { pages.push(page); page = []; }
      used = page.length ? used + SHEET.gap + type.height : type.height;
      page.push(group.slice(i, i + perRow(type)));
    }
  }
  if (page.length) pages.push(page);
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
