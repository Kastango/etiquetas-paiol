import assert from "node:assert/strict";
import { test } from "node:test";
import { layoutLabel, measure } from "./label-layout";
import { BUILT_IN_TYPES, typeOf, type LabelType } from "./label-types";
import type { Product } from "./products";

const label = (name: string, cellType = "default", price = 4.79): Product => ({ id: 0, name, price, unit: "100g", cellType });
const layoutName = (product: Product, types: LabelType[] = BUILT_IN_TYPES) => layoutLabel(product, typeOf(product, types)).name;
const fitsWidth = (product: Product, types?: LabelType[]) => {
  const { size, lines, width } = layoutName(product, types);
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

test("scales a custom type's text with its height", () => {
  const types: LabelType[] = [...BUILT_IN_TYPES, { id: "gondola", name: "Gôndola", width: 95, height: 60, price: "below" },
    { id: "mini", name: "Mini", width: 40, height: 18, price: "below" }];
  const big = layoutLabel(label("Granola", "gondola"), types[3]), small = layoutLabel(label("Granola", "mini"), types[4]);
  assert.equal(big.name.size, 36);
  assert.equal(big.price!.value, 48);
  assert.ok(small.name.size < 18 && small.price!.value < 24);
  for (const product of [label("Castanha de caju torrada sem sal", "gondola"), label("Castanha de caju torrada sem sal", "mini")]) {
    assert.ok(fitsWidth(product, types), product.cellType);
  }
});

test("puts the price under the name when beside it the name would get too little room", () => {
  const narrow: LabelType = { id: "estreita", name: "Estreita", width: 50, height: 30, price: "beside" };
  const layout = layoutLabel(label("Nozes", "estreita", 123.45), narrow);
  assert.equal(layout.beside, false);
  assert.ok(layoutLabel(label("Nozes", "larger", 4.79), BUILT_IN_TYPES[1]).beside);
});
