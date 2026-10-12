import assert from "node:assert/strict";
import { test } from "node:test";
import { HEADLINES, caption, inAWeek, validityText, type Offer } from "./offer";
import { marked } from "./themes";

const offer: Offer = { name: "Nozes chilenas quebradas", price: 4.79, oldPrice: 5, unit: "100g", headline: "Oferta", until: "2026-10-18", background: "white", theme: "padrao" };

test("an offer ends a week from today by default, across months and years", () => {
  assert.equal(inAWeek(new Date(2026, 9, 11)), "2026-10-18");
  assert.equal(inAWeek(new Date(2026, 9, 28, 23, 30)), "2026-11-04");
  assert.equal(inAWeek(new Date(2026, 11, 29)), "2027-01-05");
});

test("the validity reads as a date or as while stocks last", () => {
  assert.equal(validityText(offer), "Válida até 18 de outubro.");
  assert.equal(validityText({ until: "2027-01-01" }), "Válida até 1 de janeiro.");
  assert.equal(validityText({ until: null }), "Válida enquanto durarem os estoques.");
});

test("the caption carries the same validity as the post", () => {
  assert.match(caption(offer), /^Válida até 18 de outubro\.$/m);
  assert.match(caption({ ...offer, until: null }), /^Válida enquanto durarem os estoques\.$/m);
});

test("the Christmas headline reads plain in the caption, with its emoji", () => {
  assert.match(caption({ ...offer, theme: "natal", headline: HEADLINES.natal }), /^Oferta especial de Natal! 🎄$/m);
});

test("words between asterisks are highlighted, across line breaks", () => {
  assert.deepEqual(marked(HEADLINES.natal).map(w => `${w.word}${w.highlight ? "*" : ""}`), ["Oferta", "especial*", "de", "Natal"]);
  assert.deepEqual(marked("*Feliz Natal* e|bom ano").map(w => w.highlight), [true, true, false, false, false]);
});
