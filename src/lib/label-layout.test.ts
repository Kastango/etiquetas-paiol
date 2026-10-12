import assert from "node:assert/strict";
import { test } from "node:test";
import { layoutName, measure } from "./label-layout";
import type { Product } from "./products";

const label = (name: string, cellType: Product["cellType"] = "default", price = 4.79): Product =>
  ({ id: 0, name, price, unit: "100g", cellType });
const fitsWidth = (product: Product) => {
  const { size, lines, width } = layoutName(product);
  return lines.every(line => measure(line, 700, size) <= width);
};

test("keeps short names at full size", () => {
  const { size, lines } = layoutName(label("Óleo de Coco", "larger", 12.23));
  assert.equal(size, 18);
  assert.deepEqual(lines, ["Óleo de", "Coco"]);
  assert.equal(layoutName(label("Kombucha de Hibisco e Gengibre", "title")).size, 20);
});

test("shrinks a word too wide for the space beside the price", () => {
  const product = label("sajdoifjasdoiga", "larger", 10);
  const { size, lines } = layoutName(product);
  assert.ok(size < 18);
  assert.deepEqual(lines, ["sajdoifjasdoiga"]);
  assert.ok(fitsWidth(product));
});

test("hyphenates a word that does not fit at any size", () => {
  const product = label("Pneumoultramicroscopicossilicovulcanoconiótico", "larger", 1234.56);
  const { lines } = layoutName(product);
  assert.ok(lines.length > 1 && lines[0].endsWith("-"));
  assert.equal(lines.join("").replaceAll("-", ""), "Pneumoultramicroscopicossilicovulcanoconiótico");
  assert.ok(fitsWidth(product));
});

test("every line fits for long names in every label type", () => {
  const name = "Mix de castanhas torradas e salgadas com uva-passa branca e cranberry desidratado";
  for (const cellType of ["default", "larger", "title"] as const) assert.ok(fitsWidth(label(name, cellType, 123.45)), cellType);
});

test("a | forces a line break", () => {
  assert.deepEqual(layoutName(label("Castanha | do Pará", "title")).lines, ["Castanha", "do Pará"]);
});
