import { plain } from "./utils";

/*
 * Stock sites tag photos in English, so product names are translated with a glossary of what a
 * natural foods store sells. Portuguese puts the head noun first ("farinha de chia", "óleo de
 * coco") and adjectives after it; English reverses both, so nouns come out reversed and adjectives
 * first. Words the glossary does not know are dropped; a name with no known word is searched as typed.
 */

/** Things: what the photo shows. */
const NOUNS: Record<string, string> = {
  "castanha do para": "brazil nuts", "castanha do brasil": "brazil nuts", "castanha de caju": "cashews", caju: "cashews",
  castanha: "nuts", noz: "walnuts", nozes: "walnuts", "noz peca": "pecans", "noz moscada": "nutmeg", amendoa: "almonds",
  amendoim: "peanuts", "pasta de amendoim": "peanut butter", avela: "hazelnuts", pistache: "pistachios", macadamia: "macadamia nuts",
  ameixa: "prunes", damasco: "dried apricots", "uva passa": "raisins", passa: "raisins", tamara: "dates", cranberry: "cranberries",
  figo: "figs", "banana passa": "dried banana", cereja: "cherries", maraschino: "maraschino", goji: "goji berries", abacaxi: "pineapple",
  manga: "mango", maca: "apple", "maca peruana": "maca powder", coco: "coconut", "coco em flocos": "coconut flakes", flocos: "flakes",
  "flocos de milho": "corn flakes", sucrilhos: "corn flakes",
  chia: "chia", linhaca: "flaxseed", gergelim: "sesame seeds", girassol: "sunflower seeds", abobora: "pumpkin", semente: "seeds",
  quinoa: "quinoa", aveia: "oats", granola: "granola", arroz: "rice", "arroz integral": "brown rice", lentilha: "lentils",
  "grao de bico": "chickpeas", feijao: "beans", milho: "corn", pipoca: "popcorn", trigo: "wheat", centeio: "rye", cevada: "barley",
  mix: "mix", farinha: "flour", farelo: "bran", psyllium: "psyllium", tapioca: "tapioca", polvilho: "tapioca starch",
  acucar: "sugar", "acucar mascavo": "brown sugar", mel: "honey", cacau: "cacao", chocolate: "chocolate", cafe: "coffee", cha: "tea",
  sal: "salt", "sal rosa": "pink salt", "sal grosso": "coarse salt", colageno: "collagen", proteina: "protein", whey: "whey protein",
  canela: "cinnamon", cravo: "cloves", curcuma: "turmeric", acafrao: "turmeric", paprica: "paprika", pimenta: "pepper",
  "pimenta do reino": "black pepper", oregano: "oregano", manjericao: "basil", alecrim: "rosemary", gengibre: "ginger",
  cominho: "cumin", louro: "bay leaves", chimichurri: "chimichurri", vinagrete: "vinaigrette", tempero: "seasoning", erva: "herbs",
  hibisco: "hibiscus", camomila: "chamomile", "capim santo": "lemongrass", "capim limao": "lemongrass", "erva doce": "fennel seeds",
  hortela: "mint", oleo: "oil", azeite: "olive oil", "leite de coco": "coconut milk", biscoito: "cookies", barra: "bar",
};

/** Qualities: how it is prepared. An empty value swallows a phrase that would mislead ("sem pimenta"). */
const ADJECTIVES: Record<string, string> = {
  "com pimenta": "spicy", "sem pimenta": "", "sem sal": "unsalted",
  torrado: "roasted", torrada: "roasted", salgado: "salted", salgada: "salted",
  inteiro: "whole", inteira: "whole", defumado: "smoked", defumada: "smoked", desidratado: "dried", desidratada: "dried",
  cristalizado: "candied", cristalizada: "candied", picado: "chopped", picada: "chopped", moido: "ground", moida: "ground",
  "em po": "powder", fatiado: "sliced", fatiada: "sliced", laminado: "sliced", laminada: "sliced", caramelizado: "caramelized",
  caramelizada: "caramelized", organico: "organic", organica: "organic", picante: "spicy",
};

const LONGEST = 3; // words in the longest glossary entry

function lookup(phrase: string) {
  for (const key of [phrase, phrase.replace(/s\b/g, ""), phrase.replace(/es\b/g, "")]) {
    if (key in NOUNS) return { noun: NOUNS[key] };
    if (key in ADJECTIVES) return { adjective: ADJECTIVES[key] };
  }
  return null;
}

/** "Castanha de caju torrada sem sal" → "roasted unsalted cashews"; the name as typed when nothing is known. */
export function englishTerm(name: string) {
  const words = plain(name).replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
  const nouns: string[] = [], adjectives: string[] = [];
  for (let i = 0; i < words.length;) {
    // The longest phrase from here that the glossary knows, else one unknown word.
    let length = Math.min(LONGEST, words.length - i);
    let found = lookup(words.slice(i, i + length).join(" "));
    while (!found && length > 1) found = lookup(words.slice(i, i + --length).join(" "));
    i += length;
    if (found?.noun) nouns.unshift(found.noun);
    if (found?.adjective && !adjectives.includes(found.adjective)) adjectives.push(found.adjective);
  }
  return nouns.length ? [...adjectives, ...nouns].join(" ") : name.trim();
}

/** Stock sites with photos like the library's: one bowl, seen from above, on a plain background. */
export function stockSearches(name: string) {
  const term = englishTerm(name);
  const q = (suffix: string) => encodeURIComponent(`${term} ${suffix}`.trim());
  return {
    term,
    sites: [
      { label: "Pexels", href: `https://www.pexels.com/search/${q("bowl top view")}/` },
      { label: "Unsplash", href: `https://unsplash.com/s/photos/${q("bowl top view")}` },
      { label: "Freepik", href: `https://www.freepik.com/search?format=search&query=${q("bowl top view")}` },
      { label: "Google Imagens", href: `https://www.google.com/search?tbm=isch&q=${q("bowl top view white background")}` },
    ],
  };
}
