/*
 * The looks of offers and the hours sign: Padrão, or a date of the year with a suggested palette, headlines
 * and hours. Natal follows the 2022 Christmas posts (red band, "especial" in yellow, the string of lights
 * from that story's PSD, scripts/extract-christmas-lights.py); the other dates follow its pattern.
 * White text on every band has at least 4.5:1 and the highlight at least 3:1 (occasions.test.ts). The
 * colour logo goes on the bands, as on the 2022 Christmas red, unless the band is so close to its vinho roof
 * that the roof disappears (logoFor); then the white one.
 */

export interface Palette { band: string; highlight: string }
export interface HoursRow { days: string; hours: string }
export interface HoursSample { title: string; rows: HoursRow[]; note: string }
export interface Occasion {
  id: string;
  name: string;
  /** Holidays close the store; the others are dates for offers. */
  holiday: boolean;
  /** The date in a given year; absent for Padrão. */
  date?: (year: number) => Date;
  palettes: Palette[];
  /** Suggested headlines; the first is the default. | breaks the line, *word* is highlighted. */
  headlines: string[];
  emoji: string;
  /** For holidays, the title of the hours sign; for the others, a greeting under the usual hours. */
  title?: string;
  greeting?: string;
  /** Extra days on the hours sign besides the date itself, as offsets in days with their hours. */
  around?: { offset: number; hours: string }[];
  lights?: string;
}

const VERDE = "#347265", VERDE_ESCURO = "#243C34", PALHA = "#F0CDA2", AMARELO = "#FECC55";
const brand = (highlight = PALHA): Palette => ({ band: VERDE, highlight });
const civic: Palette[] = [{ band: VERDE_ESCURO, highlight: PALHA }, brand()];

const fixed = (month: number, day: number) => (year: number) => new Date(year, month - 1, day);
/** Easter Sunday, by the anonymous Gregorian algorithm. */
export function easter(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
const fromEaster = (days: number) => (year: number) => addDays(easter(year), days);
/** The nth weekday (0 = Sunday) of a month. */
const nth = (month: number, weekday: number, n: number) => (year: number) => {
  const first = new Date(year, month - 1, 1);
  return new Date(year, month - 1, 1 + ((weekday - first.getDay() + 7) % 7) + 7 * (n - 1));
};
export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const PADRAO: Occasion = {
  id: "padrao", name: "Padrão", holiday: false, palettes: [brand()], emoji: "🍃",
  headlines: ["Oferta", "Ofertas da | *semana*", "Novidade"],
};

export const OCCASIONS: Occasion[] = [
  { id: "ano-novo", name: "Ano Novo", holiday: true, date: fixed(1, 1), emoji: "✨", title: "Horário de Ano Novo",
    palettes: [{ band: "#1F2A44", highlight: "#E8C468" }, { band: VERDE_ESCURO, highlight: "#E8C468" }],
    headlines: ["Oferta de | *Ano Novo*", "*Feliz* | Ano Novo"], around: [{ offset: -1, hours: "Das 8h30 às 12h00" }] },
  { id: "carnaval", name: "Carnaval", holiday: true, date: fromEaster(-47), emoji: "🎉", title: "Horário de Carnaval",
    palettes: [{ band: "#6A2C91", highlight: "#FFD23F" }, brand("#FFD23F")],
    headlines: ["Oferta de | *Carnaval*", "*Carnaval* | na Paiol"], around: [{ offset: -1, hours: "Das 8h30 às 12h00" }] },
  { id: "consumidor", name: "Dia do Consumidor", holiday: false, date: fixed(3, 15), emoji: "🛍️", greeting: "Semana do Consumidor na Paiol!",
    palettes: [{ band: "#8D313B", highlight: PALHA }, brand()],
    headlines: ["Dia do | *Consumidor*", "Semana do | *Consumidor*"] },
  { id: "pascoa", name: "Páscoa", holiday: true, date: easter, emoji: "🐣", title: "Horário de Páscoa",
    palettes: [{ band: "#5B3A29", highlight: "#F7C8D0" }, { band: "#7A4E9C", highlight: "#FFE3A3" }],
    headlines: ["Oferta de | *Páscoa*", "*Feliz* | Páscoa"], around: [{ offset: -2, hours: "Fechado" }, { offset: -1, hours: "Das 8h30 às 12h30" }] },
  { id: "tiradentes", name: "Tiradentes", holiday: true, date: fixed(4, 21), emoji: "🇧🇷", title: "Feriado de Tiradentes",
    palettes: civic, headlines: ["Oferta do | *feriado*"] },
  { id: "trabalho", name: "Dia do Trabalho", holiday: true, date: fixed(5, 1), emoji: "💚", title: "Feriado do Dia do Trabalho",
    palettes: civic, headlines: ["Oferta do | *feriado*"] },
  { id: "maes", name: "Dia das Mães", holiday: false, date: nth(5, 0, 2), emoji: "💐", greeting: "Feliz Dia das Mães!",
    palettes: [{ band: "#A8325E", highlight: "#FFD6E0" }, brand("#FFD6E0")],
    headlines: ["Especial | *Dia das Mães*", "Para a | *mãe*"] },
  { id: "namorados", name: "Dia dos Namorados", holiday: false, date: fixed(6, 12), emoji: "❤️", greeting: "Feliz Dia dos Namorados!",
    palettes: [{ band: "#B0243A", highlight: "#FFC2CC" }, brand("#FFC2CC")],
    headlines: ["Dia dos | *Namorados*", "Para quem | você *ama*"] },
  { id: "corpus-christi", name: "Corpus Christi", holiday: true, date: fromEaster(60), emoji: "💚", title: "Feriado de Corpus Christi",
    palettes: civic, headlines: ["Oferta do | *feriado*"] },
  { id: "junina", name: "Festa Junina", holiday: false, date: fixed(6, 24), emoji: "🌽", greeting: "Bom São João!",
    palettes: [{ band: "#A63D1A", highlight: "#FFD23F" }, brand("#FFD23F")],
    headlines: ["Arraiá da | *Paiol*", "Ofertas | *juninas*"] },
  { id: "pais", name: "Dia dos Pais", holiday: false, date: nth(8, 0, 2), emoji: "💚", greeting: "Feliz Dia dos Pais!",
    palettes: [{ band: "#1F4E79", highlight: PALHA }, brand()],
    headlines: ["Especial | *Dia dos Pais*", "Para o | *pai*"] },
  { id: "independencia", name: "Independência", holiday: true, date: fixed(9, 7), emoji: "🇧🇷", title: "Feriado da Independência",
    palettes: [brand(AMARELO), civic[0]], headlines: ["Oferta do | *feriado*"] },
  { id: "criancas", name: "Dia das Crianças", holiday: true, date: fixed(10, 12), emoji: "🎈", title: "Feriado de 12 de outubro",
    palettes: [{ band: "#1565A8", highlight: "#FFD23F" }, brand("#FFD23F")],
    headlines: ["Dia das | *Crianças*", "Lanche | *das crianças*"] },
  { id: "finados", name: "Finados", holiday: true, date: fixed(11, 2), emoji: "💚", title: "Feriado de Finados",
    palettes: civic, headlines: ["Oferta do | *feriado*"] },
  { id: "republica", name: "Proclamação da República", holiday: true, date: fixed(11, 15), emoji: "🇧🇷", title: "Feriado de 15 de novembro",
    palettes: civic, headlines: ["Oferta do | *feriado*"] },
  { id: "consciencia-negra", name: "Consciência Negra", holiday: true, date: fixed(11, 20), emoji: "💚", title: "Feriado de 20 de novembro",
    palettes: civic, headlines: ["Oferta do | *feriado*"] },
  { id: "black-friday", name: "Black Friday", holiday: false, date: year => addDays(nth(11, 4, 4)(year), 1), emoji: "🖤", greeting: "Black Friday na Paiol!",
    palettes: [{ band: "#151515", highlight: AMARELO }, { band: VERDE_ESCURO, highlight: AMARELO }],
    headlines: ["*Black* | Friday", "Black Friday | *Paiol*"] },
  { id: "natal", name: "Natal", holiday: true, date: fixed(12, 25), emoji: "🎄", title: "Horário de Natal",
    palettes: [{ band: "#D9363C", highlight: AMARELO }, brand(AMARELO)],
    headlines: ["Oferta | *especial* | de Natal", "*Feliz* | Natal"], around: [{ offset: -1, hours: "Das 8h30 às 12h00" }],
    lights: "/seasons/natal-luzes.png" },
];

export const occasion = (id: string) => OCCASIONS.find(o => o.id === id) ?? PADRAO;
export const palette = (id: string, index: number) => {
  const { palettes } = occasion(id);
  return palettes[index] ?? palettes[0];
};
export const LOGOS = { color: "/brand/paiol-horizontal-reversed.png", white: "/brand/paiol-horizontal-white.png" };
export type LogoChoice = keyof typeof LOGOS;

function lab(hex: string) {
  const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map(i => linear(parseInt(hex.slice(i, i + 2), 16) / 255));
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
/** Distance between two colours as the eye sees them (CIE76 ΔE). */
export const colourDistance = (a: string, b: string) => {
  const [p, q] = [lab(a), lab(b)];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
};
const ROOF = "#8D313B";
/**
 * The colour logo, unless the band is within ΔE 20 of its vinho roof, which then blends into it (Dia do
 * Consumidor's vinho, the pinks and reds of Mães and Namorados); the Christmas red, at 34, keeps it.
 */
export const logoFor = (band: string): LogoChoice => (colourDistance(band, ROOF) < 20 ? "white" : "color");

const day = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
/** The occasion's next date, today included. */
export function nextDate(o: Occasion, today = new Date()) {
  if (!o.date) return null;
  const date = o.date(today.getFullYear());
  return date < day(today) ? o.date(today.getFullYear() + 1) : date;
}
/** The occasions by their next date, the nearest first. */
export const upcoming = (today = new Date()) =>
  [...OCCASIONS].sort((a, b) => nextDate(a, today)!.getTime() - nextDate(b, today)!.getTime());

const capital = (text: string) => text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);
/** "terça-feira, 21 de abril" */
const spoken = (date: Date) => date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
/** "Terça-feira, 21 de abril" */
export const longDate = (date: Date) => capital(spoken(date));
/** "ter., 21/04" */
export const shortDate = (date: Date) => date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * Offers end the day before a holiday, or on the date itself; a Sunday, when the store is closed, moves to the
 * Saturday before. Null once that day has passed.
 */
export function offerUntil(o: Occasion, today = new Date()) {
  const date = nextDate(o, today);
  if (!date) return null;
  let until = o.holiday ? addDays(date, -1) : date;
  if (until.getDay() === 0) until = addDays(until, -1);
  return until < day(today) ? null : iso(until);
}

export const USUAL: HoursSample = {
  title: "Horário de funcionamento",
  rows: [
    { days: "Segunda a sexta", hours: "Das 8h30 às 12h00\ne 13h30 às 18h30" },
    { days: "Sábado", hours: "Das 8h30 às 12h30" },
    { days: "Domingo", hours: "Fechado" },
  ],
  note: "",
};

/**
 * The hours sign's starting text. Holidays list their days, closed on the date, and say when the store
 * opens again; other dates keep the usual hours with a greeting. The hours of the days around a holiday
 * are an example to check with the store.
 */
export function hoursSample(o: Occasion, today = new Date()): HoursSample {
  const date = nextDate(o, today);
  if (!date) return structuredClone(USUAL);
  if (!o.holiday) return { ...structuredClone(USUAL), note: o.greeting ?? "" };
  // A date on a Sunday, when the store is closed anyway (Easter), is left out when other days are listed.
  const own = date.getDay() === 0 && o.around?.length ? [] : [{ date, hours: "Fechado" }];
  const days = [...(o.around ?? []).map(a => ({ date: addDays(date, a.offset), hours: a.hours })), ...own]
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  let open = addDays(date, 1);
  while (open.getDay() === 0) open = addDays(open, 1);
  return {
    title: o.title ?? `Feriado: ${o.name}`,
    rows: days.map(d => ({ days: longDate(d.date), hours: d.hours })),
    note: `Voltamos ${open.getDay() === 6 ? "no" : "na"} ${spoken(open)},\nno horário de sempre.`,
  };
}

/** Words between asterisks are highlighted: "Oferta *especial* de Natal". */
export function marked(text: string) {
  const words: { word: string; highlight: boolean }[] = [];
  let inside = false;
  for (const token of text.replace(/\|/g, " ").split(/\s+/)) {
    const word = token.replace(/\*/g, "");
    if (!word) continue;
    if (token.startsWith("*")) inside = true;
    words.push({ word, highlight: inside });
    if (token.endsWith("*")) inside = false;
  }
  return words;
}

/** The text without the highlight marks, keeping | line breaks. */
export const unmarked = (text: string) => text.replace(/\*/g, "");
