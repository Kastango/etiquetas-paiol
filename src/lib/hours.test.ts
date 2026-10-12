import assert from "node:assert/strict";
import { test } from "node:test";
import { store } from "./brand";
import { defaultHours, hoursText } from "./hours";

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
