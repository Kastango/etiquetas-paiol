import assert from "node:assert/strict";
import { test } from "node:test";
import { store } from "./brand";
import { SAMPLES, defaultHours, hoursText, withTheme } from "./hours";

test("the text joins each row's hours into a sentence", () => {
  assert.equal(hoursText(defaultHours()), [
    "Horário de funcionamento 🍃",
    "Segunda a sexta: das 8h30 às 12h00 e 13h30 às 18h30",
    "Sábado: das 8h30 às 12h30",
    "Domingo: fechado",
    "",
    `Esperamos por você na ${store.address} 💚`,
    `WhatsApp: ${store.whatsapp}`,
  ].join("\n"));
});

test("empty rows, the notice and a missing WhatsApp", () => {
  const hours = { ...defaultHours(), rows: [{ days: "Feriado", hours: "Fechado" }, { days: " ", hours: "" }], note: "Voltamos na terça!", whatsapp: "" };
  assert.equal(hoursText(hours), ["Horário de funcionamento 🍃", "Feriado: fechado", "Voltamos na terça!", "", `Esperamos por você na ${store.address} 💚`].join("\n"));
});

test("switching theme swaps only the text still at the old theme's sample", () => {
  const natal = withTheme(defaultHours(), "natal");
  assert.deepEqual([natal.title, natal.rows, natal.note], [SAMPLES.natal.title, SAMPLES.natal.rows, SAMPLES.natal.note]);
  assert.match(hoursText(natal), /^Horário de fim de ano 🎄$/m);
  const edited = { ...natal, rows: [{ days: "24 de dezembro", hours: "Das 8h às 13h" }] };
  const back = withTheme(edited, "padrao");
  assert.deepEqual([back.title, back.rows, back.note], [SAMPLES.padrao.title, edited.rows, SAMPLES.padrao.note]);
});
