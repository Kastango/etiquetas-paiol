import type { LabelType } from "./label-types";
import { decimal, type Product } from "./products";
import { CHARS, WIDTHS } from "./label-widths";

/*
 * Lays out each label before react-pdf does. Sizes are those of the original 30 mm tall labels,
 * scaled with the type's height. The name gets the largest font size at which it fits its box
 * without breaking words, else the largest at which it fits with long words hyphenated. Lines come
 * back already broken, so a name never runs into the price beside it.
 */

const PT_PER_MM = 72 / 25.4;
export const LINE_HEIGHT = 1.11;
// At 30 mm tall: font sizes in pt, padding and gaps in mm.
const BASE = { height: 30, padding: 4, small: 16, value: 24, valueMargin: 4, gapAbove: 1.5, gapBeside: 3 };
const SIZES = { title: [20, 18, 16, 14, 12], name: [18, 16, 14, 13, 12, 11, 10] };
const SAFETY = 0.97; // react-pdf kerns; leave a little room
const MIN_NAME_SHARE = 0.35; // a price beside the name moves under it rather than leave the name less of the width

type Weight = keyof typeof WIDTHS;

/** Width in pt of one line of Poppins. */
export function measure(text: string, weight: Weight, size: number) {
  let units = 0;
  for (const c of text) {
    const index = CHARS.indexOf(c);
    units += index < 0 ? 600 : WIDTHS[weight][index];
  }
  return (units * size) / 1000;
}

type Price = { small: number; value: number; valueMargin: number; gapAbove: number; gapBeside: number };

function priceWidth(product: Product, price: Price) {
  return measure("R$", 500, price.small) + measure(decimal(product.price), 800, price.value) + 2 * price.valueMargin
    + measure(product.unit, 500, price.small);
}

/** Splits a word too long for any line into pieces that end in a hyphen. */
function hyphenate(word: string, size: number, width: number) {
  const pieces: string[] = [];
  let piece = "";
  for (const c of word) {
    if (piece && measure(`${piece}${c}-`, 700, size) > width) { pieces.push(`${piece}-`); piece = ""; }
    piece += c;
  }
  return [...pieces, piece];
}

/** Greedy word wrap; null when a word does not fit a line and breaking words is off. */
function wrap(paragraphs: string[], size: number, width: number, breakWords: boolean) {
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (measure(word, 700, size) > width) {
        if (!breakWords) return null;
        const pieces = hyphenate(word, size, width);
        if (line) lines.push(line);
        lines.push(...pieces.slice(0, -1));
        line = pieces.at(-1)!;
        continue;
      }
      const joined = line ? `${line} ${word}` : word;
      if (line && measure(joined, 700, size) > width) { lines.push(line); line = word; }
      else line = joined;
    }
    lines.push(line);
  }
  return lines;
}

export interface LabelLayout {
  /** mm */
  width: number; height: number; padding: number;
  name: { size: number; lines: string[]; width: number };
  /** null when the label shows no price: a title type, or a price of zero. */
  price: Price | null;
  beside: boolean;
}

/** Font sizes, spacing and name lines of a product's label. A "|" in the name forces a line break, as in the original labels. */
export function layoutLabel(product: Product, type: LabelType): LabelLayout {
  const scale = Math.min(2, Math.max(0.6, type.height / BASE.height));
  const at = (value: number) => Math.round(value * scale * 10) / 10;
  const padding = at(BASE.padding);
  const price = type.price !== "none" && product.price > 0
    ? { small: at(BASE.small), value: at(BASE.value), valueMargin: at(BASE.valueMargin), gapAbove: at(BASE.gapAbove), gapBeside: at(BASE.gapBeside) }
    : null;
  const inner = (type.width - 2 * padding) * PT_PER_MM;
  const besideWidth = price ? inner - price.gapBeside * PT_PER_MM - priceWidth(product, price) : 0;
  const beside = type.price === "beside" && price !== null && besideWidth >= inner * MIN_NAME_SHARE;
  const width = beside ? besideWidth : inner;
  // The box is the height inside the padding plus some of the padding itself.
  const height = (type.height - 1.25 * padding) * PT_PER_MM - (price && !beside ? price.value + price.gapAbove * PT_PER_MM : 0);
  const sizes = (price ? SIZES.name : SIZES.title).map(at);
  const paragraphs = product.name.split(/\s*\|\s*/);
  const fits = (lines: string[] | null, size: number): lines is string[] =>
    lines !== null && lines.length * size * LINE_HEIGHT <= height;
  const result = (size: number, lines: string[]) => ({ width: type.width, height: type.height, padding, name: { size, lines, width }, price, beside });

  for (const breakWords of [false, true]) {
    for (const size of sizes) {
      const lines = wrap(paragraphs, size, width * SAFETY, breakWords);
      if (fits(lines, size)) return result(size, lines);
    }
  }
  const size = sizes.at(-1)!; // too long for the label at any size: smallest, overflowing below
  return result(size, wrap(paragraphs, size, width * SAFETY, true)!);
}
