import assert from "node:assert/strict";
import { test } from "node:test";
import { contrast } from "./brand";
import { OCCASIONS, PADRAO, easter, hoursSample, nextDate, occasion, offerUntil, upcoming } from "./occasions";

const ymd = (date: Date | null) => date && `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

test("movable dates fall on the right days", () => {
  assert.equal(ymd(easter(2026)), "2026-4-5");
  assert.equal(ymd(easter(2027)), "2027-3-28");
  const in2026 = (id: string) => ymd(occasion(id).date!(2026));
  assert.equal(in2026("carnaval"), "2026-2-17");
  assert.equal(in2026("corpus-christi"), "2026-6-4");
  assert.equal(in2026("maes"), "2026-5-10");
  assert.equal(in2026("pais"), "2026-8-9");
  assert.equal(in2026("black-friday"), "2026-11-27");
});

test("the next date rolls over to next year once it has passed", () => {
  const today = new Date(2026, 9, 12);
  assert.equal(ymd(nextDate(occasion("criancas"), today)), "2026-10-12");
  assert.equal(ymd(nextDate(occasion("pascoa"), today)), "2027-3-28");
  assert.equal(upcoming(today)[0].id, "criancas");
  assert.equal(nextDate(PADRAO, today), null);
});

test("every band keeps white text readable and the highlight visible", () => {
  for (const o of [PADRAO, ...OCCASIONS]) {
    for (const p of o.palettes) {
      assert.ok(contrast("#FFFFFF", p.band) >= 4.5, `${o.name} ${p.band}`);
      assert.ok(contrast(p.highlight, p.band) >= 3, `${o.name} ${p.highlight}`);
    }
  }
});

test("offers end the day before a holiday, and never on a Sunday", () => {
  const today = new Date(2026, 9, 12);
  assert.equal(offerUntil(occasion("natal"), today), "2026-12-24");
  assert.equal(offerUntil(occasion("black-friday"), today), "2026-11-27");
  assert.equal(offerUntil(occasion("maes"), new Date(2027, 0, 1)), "2027-05-08"); // Sunday 9 May
  assert.equal(offerUntil(occasion("pascoa"), new Date(2027, 0, 1)), "2027-03-27");
});

test("a holiday's hours list its days and when the store opens again", () => {
  const sample = hoursSample(occasion("tiradentes"), new Date(2027, 0, 1));
  assert.deepEqual(sample.rows, [{ days: "Quarta-feira, 21 de abril", hours: "Fechado" }]);
  assert.equal(sample.note, "Voltamos na quinta-feira, 22 de abril,\nno horário de sempre.");
  // Saturday holiday: Sunday is closed too, so the store opens on Monday.
  assert.match(hoursSample(occasion("natal"), new Date(2027, 0, 1)).note, /^Voltamos na segunda-feira, 27 de dezembro/);
  assert.equal(hoursSample(occasion("maes"), new Date(2027, 0, 1)).note, "Feliz Dia das Mães!");
  // Easter Sunday is closed anyway: the sign lists Good Friday and Saturday.
  assert.deepEqual(hoursSample(occasion("pascoa"), new Date(2027, 0, 1)).rows.map(r => r.days), ["Sexta-feira, 26 de março", "Sábado, 27 de março"]);
});
