import assert from "node:assert/strict";
import { test } from "node:test";
import { BUILT_IN_TYPES, checkType, findType, newTypeId, perRow, type LabelType } from "./label-types";

const gondola: LabelType = { id: "gondola", name: "Gôndola", width: 95, height: 60, price: "below" };
const types = [...BUILT_IN_TYPES, gondola];

test("finds a type by id or by name in any case and accent", () => {
  assert.equal(findType("larger", types)?.id, "larger");
  assert.equal(findType("Largo", types)?.id, "larger");
  assert.equal(findType("título", types)?.id, "title");
  assert.equal(findType(" GONDOLA ", types)?.id, "gondola");
  assert.equal(findType("Etiqueta grande", types), null);
});

test("a new type needs a unique name and a size that fits the sheet", () => {
  const fields = { name: "Mini", width: 40, height: 18, price: "below" as const };
  assert.equal(checkType(fields, types), null);
  assert.match(checkType({ ...fields, name: " " }, types)!, /nome/);
  assert.match(checkType({ ...fields, name: "gôndola" }, types)!, /Já existe/);
  assert.match(checkType({ ...fields, width: 210 }, types)!, /largura/);
  assert.match(checkType({ ...fields, height: Number.NaN }, types)!, /altura/);
});

test("ids come from the name and never repeat", () => {
  assert.equal(newTypeId("Etiqueta de gôndola", types), "etiqueta-de-gondola");
  assert.equal(newTypeId("Gôndola", types), "gondola-2");
  assert.equal(newTypeId("!!!", types), "tipo");
});

test("counts how many labels of a type fit side by side", () => {
  assert.deepEqual([...BUILT_IN_TYPES, gondola].map(perRow), [3, 2, 3, 2]);
  assert.equal(perRow({ ...gondola, width: 200 }), 1);
});
