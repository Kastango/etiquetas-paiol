import assert from "node:assert/strict";
import { test } from "node:test";
import { exportProducts, importProducts, labelPages, parsePrice, pasteGrid, readPrice, type Product } from "./products";

const item = (name: string, cellType: Product["cellType"] = "default"): Product => ({ id: 0, name, price: 1, unit: "100g", cellType });

test("reads files exported by the original version", () => {
  const products = importProducts('name,price,unit\n"Nozes chilenas quebradas",4.79,100g\n"Amêndoas",5.99,\n');
  assert.deepEqual(products.map(p => [p.name, p.price, p.unit, p.cellType]), [
    ["Nozes chilenas quebradas", 4.79, "100g", "default"], ["Amêndoas", 5.99, "100g", "default"]]);
});

test("round-trips names with commas, quotes and line breaks", () => {
  const products: Product[] = [{ id: 1, name: 'Mix "da casa", torrado\ncom sal', price: 12.5, unit: "kg", cellType: "larger" },
    { id: 2, name: "Castanhas", price: 0, unit: "100g", cellType: "title" }];
  assert.deepEqual(importProducts(exportProducts(products)), products);
});

test("accepts spreadsheet exports with semicolons and Portuguese headers", () => {
  const [product] = importProducts("nome;preço;unidade;tipo\nCastanha do Pará;R$ 1.234,56;kg;Largo\n");
  assert.deepEqual([product.price, product.unit, product.cellType], [1234.56, "kg", "larger"]);
});

test("rejects rows it cannot read", () => {
  assert.throws(() => importProducts("produto,valor\nNozes,\n"), /linha 2/);
  assert.throws(() => importProducts("a,b\n1,2\n"), /colunas name e price/);
  assert.throws(() => importProducts('name,price\n"Nozes,4.79\n'), /aspas/);
  assert.equal(parsePrice("4,79"), 4.79);
});

test("puts wide labels first, then fills rows of three and paginates every nine rows", () => {
  const products = [item("L1", "larger"), ...[...Array(28)].map((_, i) => item(`P${i}`)), item("L2", "larger"), item("L3", "larger")];
  const pages = labelPages(products);
  assert.deepEqual(pages.map(rows => rows.length), [9, 3]);
  assert.deepEqual(pages[0].slice(0, 3).map(row => row.map(p => p.name)), [["L1", "L2"], ["L3"], ["P0", "P1", "P2"]]);
  assert.deepEqual(pages[1].at(-1)!.map(p => p.name), ["P27"]);
});

test("pastes a block from a spreadsheet over existing rows and appends the rest", () => {
  const products: Product[] = [{ id: 7, name: "Nozes", price: 4.79, unit: "100g", cellType: "default" }];
  const pasted = pasteGrid(products, 0, 0, "Nozes chilenas\t4,99\t100g\tLargo\r\nGranola\t3.2\tkg\t\r\n");
  assert.deepEqual(pasted, [
    { id: 7, name: "Nozes chilenas", price: 4.99, unit: "100g", cellType: "larger" },
    { id: 8, name: "Granola", price: 3.2, unit: "kg", cellType: "default" },
  ]);
  assert.equal(products[0].name, "Nozes", "the original list is not mutated");
});

test("pasting a price column updates prices only and ignores rows past the end", () => {
  const products: Product[] = [{ id: 1, name: "A", price: 1, unit: "100g", cellType: "default" }];
  assert.deepEqual(pasteGrid(products, 0, 1, "R$ 2,50\n3,00").map(p => [p.name, p.price]), [["A", 2.5]]);
  assert.equal(pasteGrid(products, 0, 1, "abc")[0].price, 1);
});

test("reads typed prices like a spreadsheet", () => {
  assert.deepEqual(["5", "4,79", "4.79", "R$ 1.234,567", "", "abc", "-2"].map(readPrice), [5, 4.79, 4.79, 1234.57, 0, null, null]);
});
