import assert from "node:assert/strict";
import { test } from "node:test";
import { caption, inAWeek, validityText, type Offer } from "./offer";

const offer: Offer = { name: "Nozes chilenas quebradas", price: 4.79, oldPrice: 5, unit: "100g", headline: "Oferta", until: "2026-10-18", background: "white" };

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
