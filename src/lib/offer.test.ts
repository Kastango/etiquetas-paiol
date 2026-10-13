import assert from "node:assert/strict";
import { test } from "node:test";
import { COLORS, caption, inAWeek, offerLogo, priceColour, validityText, type Offer } from "./offer";
import { contrast } from "./brand";
import { OCCASIONS, marked, occasion } from "./occasions";

const offer: Offer = { name: "Nozes chilenas quebradas", price: 4.79, oldPrice: 5, unit: "100g", headline: "Oferta", until: "2026-10-18", background: "white", theme: "padrao", palette: 0, logo: "auto", priceColour: "date" };

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
  assert.match(caption({ ...offer, theme: "natal", headline: occasion("natal").headlines[0] }), /^Oferta especial de Natal! 🎄$/m);
});

test("words between asterisks are highlighted, across line breaks", () => {
  assert.deepEqual(marked(occasion("natal").headlines[0]).map(w => `${w.word}${w.highlight ? "*" : ""}`), ["Oferta", "especial*", "de", "Natal"]);
  assert.deepEqual(marked("*Feliz Natal* e|bom ano").map(w => w.highlight), [true, true, false, false, false]);
});

test("the logo is the colour one unless the band hides its vinho roof, and can be set by hand", () => {
  const logo = (theme: string, choice: Offer["logo"] = "auto") => offerLogo({ ...offer, theme, logo: choice });
  assert.equal(logo("padrao"), "color");
  assert.equal(logo("natal"), "color");
  assert.equal(logo("consumidor"), "white");
  assert.equal(logo("maes"), "white");
  assert.equal(logo("natal", "white"), "white");
  assert.equal(logo("consumidor", "color"), "color");
});

test("on a date the price takes the band's colour, readable on both backgrounds", () => {
  assert.equal(priceColour(offer), COLORS.vinho);
  assert.equal(priceColour({ ...offer, theme: "natal" }), occasion("natal").palettes[0].band);
  assert.equal(priceColour({ ...offer, theme: "natal", priceColour: "vinho" }), COLORS.vinho);
  for (const o of OCCASIONS) for (const p of o.palettes) for (const background of ["#FFFFFF", COLORS.fundoPalha])
    // The price is large bold text (74 px and up), for which 3:1 is enough.
    assert.ok(contrast(p.band, background) >= 3, `${o.name} ${p.band} on ${background}`);
});
