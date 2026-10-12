import { store } from "./brand";
import { decimal } from "./products";
import { THEMES, marked, unmarked, type Theme } from "./themes";

export type OfferFormat = "square" | "portrait" | "story";
export type OfferBackground = "white" | "palha";
export interface Offer {
  name: string;
  price: number;
  oldPrice: number;
  unit: string;
  headline: string;
  /** Last day of the offer as YYYY-MM-DD, or null while stocks last. */
  until: string | null;
  background: OfferBackground;
  theme: Theme;
}
/** `logo` and `lights` are the theme's. */
export interface OfferAssets { photo: HTMLImageElement | null; logo: HTMLImageElement; lights: HTMLImageElement | null; sans: string; display: string }

/** The headline each theme starts with. */
export const HEADLINES: Record<Theme, string> = { padrao: "Oferta", natal: "Oferta | *especial* | de Natal" };

interface Box { x: number; y: number; w: number; h: number }
interface Layout {
  width: number; height: number;
  /**
   * "row": headline and validity left, logo right. "stack": everything centred, logo under the validity.
   * The block is centred between y and contentBottom, ending no lower than safeBottom.
   */
  band: { y: number; contentBottom: number; safeBottom?: number; style: "row" | "stack" };
  photo: Box; text: Box & { align: "left" | "center" };
  nameSize: number; headlineSize: number;
}

const MARGIN = 80;
export const FORMATS: Record<OfferFormat, { label: string; ratio: string; layout: Layout }> = {
  square: { label: "Feed", ratio: "1:1", layout: {
    width: 1080, height: 1080, photo: { x: 475, y: 90, w: 555, h: 640 }, text: { x: MARGIN, y: 90, w: 375, h: 640, align: "left" },
    band: { y: 800, contentBottom: 1080, style: "row" }, nameSize: 46, headlineSize: 112 } },
  portrait: { label: "Retrato", ratio: "4:5", layout: {
    width: 1080, height: 1350, photo: { x: 140, y: 60, w: 800, h: 700 }, text: { x: MARGIN, y: 770, w: 920, h: 290, align: "left" },
    band: { y: 1070, contentBottom: 1350, style: "row" }, nameSize: 54, headlineSize: 112 } },
  // Stories keep content out of the top 250 px, under Instagram's progress bar and profile name. The
  // band's block is centred in the whole band so the green looks balanced, but ends 150 px above the
  // bottom, clear of the reply bar on phones that draw it over the story.
  story: { label: "Story", ratio: "9:16", layout: {
    width: 1080, height: 1920, photo: { x: 150, y: 240, w: 780, h: 700 }, text: { x: MARGIN, y: 955, w: 920, h: 300, align: "center" },
    band: { y: 1300, contentBottom: 1920, safeBottom: 1770, style: "stack" }, nameSize: 60, headlineSize: 128 } },
};

export const COLORS = { verde: "#347265", vinho: "#8D313B", palha: "#F0CDA2", texto: "#243C34", muted: "#6B7C75", fundoPalha: "#FBF1E4" };

/** Largest size up to max at which text wraps into at most maxLines lines of width. */
function fit(ctx: CanvasRenderingContext2D, text: string, font: (size: number) => string, width: number, max: number, min: number, maxLines: number) {
  for (let size = max; ; size -= 2) {
    ctx.font = font(size);
    const lines: string[] = [];
    for (const paragraph of text.split(/\s*\|\s*|\n/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; } else line = next;
      }
      if (line) lines.push(line);
    }
    const fits = lines.length <= maxLines && lines.every(l => ctx.measureText(l).width <= width);
    if (fits || size <= min) return { size, lines: lines.slice(0, maxLines) };
  }
}

/** Height of capitals and of descenders for the current font, measured on the glyphs. */
function metrics(ctx: CanvasRenderingContext2D) {
  const m = ctx.measureText("Hg");
  return { cap: ctx.measureText("H").actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent };
}

const money = (value: number) => `R$ ${decimal(value)}`;

const pad = (n: number) => String(n).padStart(2, "0");
/** YYYY-MM-DD in local time, the format of <input type="date">. */
export const isoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
/** A week from today: the default end of an offer. */
export const inAWeek = (today = new Date()) => isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7));

/** "Válida até 18 de outubro." or "Válida enquanto durarem os estoques." */
export function validityText(offer: Pick<Offer, "until">) {
  if (!offer.until) return "Válida enquanto durarem os estoques.";
  const [year, month, day] = offer.until.split("-").map(Number);
  return `Válida até ${new Date(year, month - 1, day).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}.`;
}

/*
 * The bowl shadows of the original offer PSDs: two Photoshop drop shadows in Multiply under global
 * light at 137°, both with 8% noise, measured on a bowl about 564 px wide.
 */
const LIGHT = (137 * Math.PI) / 180;
const SHADOWS = [
  { distance: 30, size: 16, opacity: 0.23, rgb: [43, 13, 13] },
  { distance: 77, size: 62, opacity: 0.39, rgb: [33, 8, 8] },
];
const NOISE = 0.08, PSD_BOWL = 564;
const shadowCache = new WeakMap<HTMLImageElement, { key: string; canvas: HTMLCanvasElement; pad: number }>();

/** Seeded so the preview and the downloaded PNG get the same grain. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shadows(img: HTMLImageElement, w: number, h: number) {
  const key = `${w}x${h}`;
  const cached = shadowCache.get(img);
  if (cached?.key === key) return cached;
  const scale = w / PSD_BOWL;
  const pad = Math.ceil((77 + 62 * 2.5) * scale);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w + pad * 2);
  canvas.height = Math.ceil(h + pad * 2);
  const out = canvas.getContext("2d")!;
  const layer = document.createElement("canvas");
  layer.width = canvas.width;
  layer.height = canvas.height;
  const ctx = layer.getContext("2d", { willReadFrequently: true })!;
  const next = random(137);
  for (const shadow of SHADOWS) {
    // Draw the bowl far off-canvas so only its blurred shadow lands on the layer.
    ctx.clearRect(0, 0, layer.width, layer.height);
    ctx.save();
    ctx.shadowColor = "#000";
    // Photoshop spreads a shadow of size S over about twice the canvas blur of S.
    ctx.shadowBlur = shadow.size * 1.8 * scale;
    ctx.shadowOffsetX = -Math.cos(LIGHT) * shadow.distance * scale + layer.width;
    ctx.shadowOffsetY = Math.sin(LIGHT) * shadow.distance * scale;
    ctx.drawImage(img, pad - layer.width, pad, w, h);
    ctx.restore();
    const data = ctx.getImageData(0, 0, layer.width, layer.height);
    const [r, g, b] = shadow.rgb;
    for (let i = 0; i < data.data.length; i += 4) {
      const a = data.data[i + 3];
      if (!a) continue;
      // Photoshop's noise scatters the opacity of each pixel; 8% reads as a fine grain.
      const grain = 1 + (next() * 2 - 1) * NOISE * 3;
      data.data[i] = r; data.data[i + 1] = g; data.data[i + 2] = b;
      data.data[i + 3] = Math.max(0, Math.min(255, a * shadow.opacity * grain));
    }
    ctx.putImageData(data, 0, 0);
    out.drawImage(layer, 0, 0);
  }
  const entry = { key, canvas, pad };
  shadowCache.set(img, entry);
  return entry;
}

export function drawOffer(ctx: CanvasRenderingContext2D, offer: Offer, format: OfferFormat, assets: OfferAssets) {
  const L = FORMATS[format].layout;
  const sans = (weight: number) => (size: number) => `${weight} ${size}px ${assets.sans}`;
  const display = (size: number) => `900 ${size}px ${assets.display}`;
  ctx.canvas.width = L.width;
  ctx.canvas.height = L.height;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = offer.background === "palha" ? COLORS.fundoPalha : "#FFFFFF";
  ctx.fillRect(0, 0, L.width, L.height);

  if (assets.photo) {
    const { photo: box } = L, img = assets.photo;
    const scale = Math.min(box.w / img.naturalWidth, box.h / img.naturalHeight);
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
    const x = box.x + (box.w - w) / 2, y = box.y + (box.h - h) / 2;
    const shadow = shadows(img, w, h);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(shadow.canvas, x - shadow.pad, y - shadow.pad);
    ctx.restore();
    ctx.drawImage(img, x, y, w, h);
  }

  // Name, previous price and price, vertically centred in the text box.
  const T = L.text, S = L.nameSize, centred = T.align === "center";
  const anchor = centred ? T.x + T.w / 2 : T.x;
  const name = fit(ctx, offer.name || "Nome do produto", sans(700), T.w, S, Math.round(S * 0.7), centred ? 2 : 3);
  const showOld = offer.oldPrice > offer.price && offer.price > 0;
  const priceSize = Math.round(S * 1.6), oldSize = Math.round(S * 0.72), unitSize = Math.round(S * 0.6);
  const nameLead = name.size * 1.18;
  const height = name.lines.length * nameLead + S * 0.45 + (showOld ? oldSize * 1.2 : 0) + priceSize * 0.95;
  let y = T.y + (T.h - height) / 2;
  ctx.textAlign = centred ? "center" : "left";
  ctx.fillStyle = COLORS.texto;
  ctx.font = sans(700)(name.size);
  for (const line of name.lines) { y += nameLead; ctx.fillText(line, anchor, y - name.size * 0.22); }
  y += S * 0.45;
  if (showOld) {
    y += oldSize * 1.2;
    ctx.font = sans(500)(oldSize);
    ctx.fillStyle = COLORS.muted;
    const text = money(offer.oldPrice), w = ctx.measureText(text).width;
    ctx.fillText(text, anchor, y - oldSize * 0.2);
    ctx.fillRect((centred ? anchor - w / 2 : anchor) - 2, y - oldSize * 0.55, w + 4, Math.max(3, oldSize * 0.08));
  }
  y += priceSize * 0.95;
  ctx.textAlign = "left";
  const price = money(offer.price);
  ctx.font = sans(800)(priceSize);
  const priceWidth = ctx.measureText(price).width;
  ctx.font = sans(500)(unitSize);
  const unitGap = unitSize * 0.4, unitWidth = offer.unit ? unitGap + ctx.measureText(offer.unit).width : 0;
  const priceX = centred ? anchor - (priceWidth + unitWidth) / 2 : anchor;
  ctx.font = sans(800)(priceSize);
  ctx.fillStyle = COLORS.vinho;
  ctx.fillText(price, priceX, y - priceSize * 0.08);
  if (offer.unit) {
    ctx.font = sans(500)(unitSize);
    ctx.fillStyle = COLORS.texto;
    ctx.fillText(offer.unit, priceX + priceWidth + unitGap, y - priceSize * 0.08);
  }

  drawBand(ctx, offer, L, assets, sans, display);
}

/** Draws a line word by word, highlighted words in `highlight`; `flags` gives each word's mark, in order. */
function drawMarked(ctx: CanvasRenderingContext2D, line: string, x: number, y: number, flags: boolean[], colour: string, highlight: string) {
  const words = line.split(" "), space = ctx.measureText(" ").width;
  const align = ctx.textAlign;
  const width = ctx.measureText(line).width;
  let at = align === "center" ? x - width / 2 : x;
  ctx.textAlign = "left";
  for (const word of words) {
    ctx.fillStyle = flags.shift() ? highlight : colour;
    ctx.fillText(word, at, y);
    at += ctx.measureText(word).width + space;
  }
  ctx.textAlign = align;
}

/**
 * The band, green or the theme's colour. Positions come from the glyphs' measured bounds: the headline's
 * capitals and the validity's baseline delimit the block, and the logo is placed by its drawing, not its
 * image, whose SVG source pads the drawing by 8% of its height on every side. The headline takes up to
 * three lines, as large as fits the band's height.
 */
function drawBand(ctx: CanvasRenderingContext2D, offer: Offer, L: Layout, assets: OfferAssets,
  sans: (weight: number) => (size: number) => string, display: (size: number) => string) {
  const { band } = L, theme = THEMES[offer.theme];
  ctx.fillStyle = theme.band;
  ctx.fillRect(0, band.y, L.width, L.height - band.y);
  const logo = assets.logo, ratio = logo.naturalWidth / logo.naturalHeight;
  const drawLogo = (left: number, top: number, height: number) => {
    const imageHeight = height * 1.16, pad = height * 0.08;
    ctx.drawImage(logo, left - pad, top - pad, imageHeight * ratio, imageHeight);
  };
  const logoWidth = (height: number) => height * 1.16 * ratio - height * 0.16;

  const stack = band.style === "stack";
  // The lights hang into the story's bottom right corner, as in the 2022 Christmas story.
  if (stack && assets.lights) ctx.drawImage(assets.lights, L.width - assets.lights.naturalWidth, L.height - assets.lights.naturalHeight);
  const validitySize = Math.round(L.headlineSize * (stack ? 0.24 : 0.22));
  const logoHeight = stack ? Math.round(L.headlineSize * 0.8) : 0;
  // In a row the logo matches the text block's height, so the headline gets what is left of the width.
  const rowLogo = Math.round(L.headlineSize * 1.05);
  const room = stack ? L.width - MARGIN * 2 : L.width - MARGIN * 2 - logoWidth(rowLogo) - rowLogo * 0.86;
  const validity = fit(ctx, validityText(offer), sans(500), room, validitySize, Math.round(validitySize * 0.75), 1);
  ctx.font = sans(500)(validity.size);
  const validityCap = metrics(ctx).cap;
  const height = stack ? (band.safeBottom ?? band.contentBottom) - band.y - L.headlineSize * 1.25 - 60 : band.contentBottom - band.y - 100;
  const text = unmarked(offer.headline).trim() || "Oferta";
  let head = fit(ctx, text, display, room, L.headlineSize, 40, 3);
  const headHeight = (size: number, lines: number) => size * (0.72 + 0.98 * (lines - 1) + 0.3) + validityCap;
  while (head.size > 40 && headHeight(head.size, head.lines.length) > height) head = fit(ctx, text, display, room, head.size - 2, 40, 3);
  ctx.font = display(head.size);
  const headCap = metrics(ctx).cap, headLead = head.size * 0.98;
  const validityGap = head.size * 0.3;
  const textHeight = headCap + (head.lines.length - 1) * headLead + validityGap + validityCap;
  const flags = marked(offer.headline.trim() || "Oferta").map(word => word.highlight);

  if (stack) {
    const logoGap = L.headlineSize * 0.45;
    const total = textHeight + logoGap + logoHeight;
    let top = Math.min(band.y + (band.contentBottom - band.y - total) / 2, (band.safeBottom ?? band.contentBottom) - total);
    const centre = L.width / 2;
    ctx.textAlign = "center";
    ctx.font = display(head.size);
    head.lines.forEach((line, i) => drawMarked(ctx, line, centre, top + headCap + i * headLead, flags, "#FFFFFF", theme.highlight));
    top += headCap + (head.lines.length - 1) * headLead;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = sans(500)(validity.size);
    ctx.fillText(validity.lines[0], centre, top + validityGap + validityCap);
    top += validityGap + validityCap;
    drawLogo(centre - logoWidth(logoHeight) / 2, top + logoGap, logoHeight);
    ctx.textAlign = "left";
    return;
  }

  const blockHeight = Math.max(textHeight, rowLogo);
  const top = band.y + (band.contentBottom - band.y - blockHeight) / 2;
  const textTop = top + (blockHeight - textHeight) / 2;
  ctx.font = display(head.size);
  head.lines.forEach((line, i) => {
    // Optical left edge: the glyph's own side bearing would push the headline right of the margin.
    const bearing = ctx.measureText(line).actualBoundingBoxLeft;
    drawMarked(ctx, line, MARGIN + bearing, textTop + headCap + i * headLead, flags, "#FFFFFF", theme.highlight);
  });
  ctx.fillStyle = "#FFFFFF";
  ctx.font = sans(500)(validity.size);
  ctx.fillText(validity.lines[0], MARGIN, textTop + textHeight);
  drawLogo(L.width - MARGIN - logoWidth(rowLogo), top + (blockHeight - rowLogo) / 2, rowLogo);
}

/** A caption in the Paiol voice (see the Tom de voz section of the brand page). */
export function caption(offer: Offer) {
  const unit = offer.unit === "100g" ? "a cada 100 g" : offer.unit === "kg" ? "o quilo" : offer.unit;
  const was = offer.oldPrice > offer.price ? ` (antes ${money(offer.oldPrice)})` : "";
  const headline = unmarked(offer.headline).replace(/\s*\|\s*/g, " ").trim() || "Oferta";
  const offerLines = [`${headline}! ${THEMES[offer.theme].emoji}`, `${offer.name.replace(/\s*\|\s*/g, " ")} por ${money(offer.price)} ${unit}${was}.`, validityText(offer)];
  return [
    ...offerLines.filter(Boolean),
    "",
    `Esperamos por você na ${store.address} 💚`,
    `Dúvidas e pedidos pelo WhatsApp ${store.whatsapp}.`,
    "",
    "#oferta #produtosnaturais",
  ].join("\n");
}
