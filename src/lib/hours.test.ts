import assert from "node:assert/strict";
import { test } from "node:test";
import { store } from "./brand";
import { defaultHours, hoursText, withTheme } from "./hours";
import { USUAL } from "./occasions";

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
  const today = new Date(2026, 9, 12);
  const natal = withTheme(defaultHours(), "natal", today);
  assert.equal(natal.title, "Horário de Natal");
  assert.deepEqual(natal.rows, [{ days: "Quinta-feira, 24 de dezembro", hours: "Das 8h30 às 12h00" }, { days: "Sexta-feira, 25 de dezembro", hours: "Fechado" }]);
  assert.match(hoursText(natal), /^Horário de Natal 🎄$/m);
  const edited = { ...natal, rows: [{ days: "24 de dezembro", hours: "Das 8h às 13h" }] };
  const back = withTheme(edited, "padrao", today);
  assert.deepEqual([back.title, back.rows, back.note], [USUAL.title, edited.rows, USUAL.note]);
});
