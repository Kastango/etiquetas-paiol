import assert from "node:assert/strict";
import { test } from "node:test";
import { englishTerm, stockSearches } from "./stock-search";

test("translates product names into stock photo terms", () => {
  const cases: Record<string, string> = {
    "Nozes chilenas quebradas": "walnuts",
    "Castanha de caju torrada sem sal": "roasted unsalted cashews",
    "Castanha-do-pará": "brazil nuts",
    "Farinha de chia": "chia flour",
    "Óleo de Coco": "coconut oil",
    "Coco em flocos médio": "coconut flakes",
    "Chá de Capim Santo": "lemongrass tea",
    "Páprica Defumada Premium": "smoked paprika",
    "Cereja-maraschino": "maraschino cherries",
    "Sementes de abóbora": "pumpkin seeds",
    "Chimichurri com pimenta": "spicy chimichurri",
    "Chimichurri sem pimenta": "chimichurri",
    "Amêndoas sem casca": "almonds",
    "Ameixa sem caroço": "prunes",
  };
  for (const [name, term] of Object.entries(cases)) assert.equal(englishTerm(name), term, name);
});

test("searches a name it does not know as typed", () => {
  assert.equal(englishTerm(" Kombucha Paiol "), "Kombucha Paiol");
});

test("every search asks for a bowl seen from above", () => {
  const { term, sites } = stockSearches("Nozes chilenas quebradas");
  assert.equal(term, "walnuts");
  for (const site of sites) assert.match(decodeURIComponent(site.href), /walnuts bowl top view/, site.label);
});
