import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { examples, logos, monoLogos, monoSeals, palette, rgb, seals, store } from "./brand";

// The skill repeats the brand data so it works on its own in any assistant; these tests keep the copies equal.
const skill = readFileSync(new URL("../../public/brand/paiol-marca/SKILL.md", import.meta.url), "utf8");

test("the skill carries every brand colour with its HEX and RGB", () => {
  for (const swatch of palette) {
    assert.ok(skill.includes(`| ${swatch.name} | ${swatch.hex} | ${rgb(swatch.hex).join(" ")} |`), swatch.name);
  }
});

test("the skill names every logo file of the kit", () => {
  for (const logo of [...logos, ...monoLogos, ...seals, ...monoSeals]) assert.ok(skill.includes(`\`${logo.file}\``), logo.file);
});

test("the skill has the store's details and the site's writing examples", () => {
  for (const fact of [store.address, store.whatsapp, store.instagram, ...store.hours.map(h => h.split(": ")[1])]) {
    assert.ok(skill.includes(fact), fact);
  }
  for (const example of examples) assert.ok(skill.includes(example.prefer), example.channel);
});
