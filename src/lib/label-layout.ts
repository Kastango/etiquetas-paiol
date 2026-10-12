import { CELL_WIDTH, decimal, type Product } from "./products";
import { CHARS, WIDTHS } from "./label-widths";

/*
 * Fits each label name before react-pdf lays it out: the largest font size at which the name
 * fits its box without breaking words, else the largest at which it fits with long words hyphenated. Lines
 * come back already broken, so a name never runs into the price beside it.
 */

const PT_PER_MM = 72 / 25.4;
export const LINE_HEIGHT = 1.11;
export const PRICE = { small: 16, value: 24, valueMargin: 4, gapAbove: 1.5, gapBeside: 3 }; // pt, except the gaps in mm
const PADDING = 4; // mm, each side
const TEXT_HEIGHT = 25 * PT_PER_MM; // the 22 mm inside the padding plus some of the padding itself
const SIZES = { title: [20, 18, 16, 14, 12], name: [18, 16, 14, 13, 12, 11, 10] };
const SAFETY = 0.97; // react-pdf kerns; leave a little room

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

export const showsPrice = (product: Product) => product.cellType !== "title" && product.price > 0;

function priceWidth(product: Product) {
  return measure("R$", 500, PRICE.small) + measure(decimal(product.price), 800, PRICE.value) + 2 * PRICE.valueMargin
    + measure(product.unit, 500, PRICE.small);
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

export type NameLayout = { size: number; lines: string[]; width: number; beside: boolean };

/** Font size and lines for a label's name. A "|" in the name forces a line break, as in the original labels. */
export function layoutName(product: Product): NameLayout {
  const price = showsPrice(product);
  const beside = price && product.cellType === "larger";
  let width = (CELL_WIDTH[product.cellType] - 2 * PADDING) * PT_PER_MM;
  if (beside) width -= PRICE.gapBeside * PT_PER_MM + priceWidth(product);
  const height = TEXT_HEIGHT - (price && !beside ? PRICE.value + PRICE.gapAbove * PT_PER_MM : 0);
  const sizes = price ? SIZES.name : SIZES.title;
  const paragraphs = product.name.split(/\s*\|\s*/);
  const fits = (lines: string[] | null, size: number): lines is string[] =>
    lines !== null && lines.length * size * LINE_HEIGHT <= height;

  for (const breakWords of [false, true]) {
    for (const size of sizes) {
      const lines = wrap(paragraphs, size, width * SAFETY, breakWords);
      if (fits(lines, size)) return { size, lines, width, beside };
    }
  }
  const size = sizes.at(-1)!; // too long for the label at any size: smallest, overflowing below
  return { size, lines: wrap(paragraphs, size, width * SAFETY, true)!, width, beside };
}
