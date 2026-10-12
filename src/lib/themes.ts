export type Theme = "padrao" | "natal";

/**
 * The look of offers and the hours sign. Natal follows the 2022 Christmas posts: a red band, the highlighted
 * word in yellow and, in the story, the string of lights from that PSD (scripts/extract-christmas-lights.py).
 * The red is a little deeper than the PSD's #EF4C4F so the white validity text keeps 4.5:1. On red the
 * logo is the white one, as the brand guide asks for coloured backgrounds.
 */
export const THEMES: Record<Theme, {
  label: string; band: string; highlight: string; logo: string; emoji: string; lights?: string;
}> = {
  padrao: { label: "Padrão", band: "#347265", highlight: "#F0CDA2", logo: "/brand/paiol-horizontal-reversed.png", emoji: "🍃" },
  natal: { label: "Natal", band: "#D9363C", highlight: "#FECC55", logo: "/brand/paiol-horizontal-white.png", emoji: "🎄", lights: "/seasons/natal-luzes.png" },
};

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
