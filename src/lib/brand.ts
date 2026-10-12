import productPhotos from "../../public/products/index.json";
import { plain } from "./utils";

export interface Swatch { name: string; hex: string; role: string }
export const palette: Swatch[] = [
  { name: "Verde Paiol", hex: "#347265", role: "Cor da marca. Fundos, faixas e títulos." },
  { name: "Vinho", hex: "#8D313B", role: "Destaque de oferta e preço. Telhado do paiol." },
  { name: "Palha", hex: "#F0CDA2", role: "Apoio sobre verde e fundos suaves." },
  { name: "Dourado", hex: "#BFA574", role: "Detalhes e ilustrações. Nunca em texto." },
  { name: "Verde escuro", hex: "#243C34", role: "Texto corrido sobre fundos claros." },
  { name: "Branco", hex: "#FFFFFF", role: "Respiro, fundos e texto sobre verde." },
];

export const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG contrast ratio between two colours. */
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export const pairs = [
  { text: "#243C34", background: "#FFFFFF" },
  { text: "#FFFFFF", background: "#347265" },
  { text: "#8D313B", background: "#FFFFFF" },
  { text: "#243C34", background: "#F0CDA2" },
  { text: "#F0CDA2", background: "#347265" },
  { text: "#BFA574", background: "#FFFFFF" },
];

export interface Logo { file: string; name: string; use: string; background: "light" | "green"; ratio: number }
export const logos: Logo[] = [
  { file: "paiol-horizontal-color", name: "Horizontal", use: "Principal. Site, documentos, assinaturas e fundos claros.", background: "light", ratio: 79.21 / 27.61 },
  { file: "paiol-horizontal-reversed", name: "Horizontal sobre verde", use: "Faixas verdes, rodapé dos posts e fachada.", background: "green", ratio: 79.21 / 27.61 },
  { file: "paiol-horizontal-tagline-color", name: "Horizontal com assinatura", use: "Placas, fachada e materiais em que a loja se apresenta.", background: "light", ratio: 81.91 / 27.61 },
  { file: "paiol-stacked-color", name: "Empilhada", use: "Espaços quadrados: sacolas, adesivos e perfil.", background: "light", ratio: 72.28 / 54.98 },
  { file: "paiol-stacked-reversed", name: "Empilhada sobre verde", use: "A versão do cartão de visitas.", background: "green", ratio: 72.28 / 54.98 },
  { file: "paiol-symbol", name: "Símbolo", use: "Avatar, ícone do site e espaços pequenos.", background: "light", ratio: 23.51 / 27.61 },
];
export const monoLogos: Logo[] = [
  { file: "paiol-horizontal-green", name: "Monocromática verde", use: "Embalagens, sacolas e impressão só em verde.", background: "light", ratio: 79.21 / 27.61 },
  { file: "paiol-horizontal-black", name: "Monocromática preta", use: "Notas, recibos e impressoras sem cor.", background: "light", ratio: 79.21 / 27.61 },
  { file: "paiol-horizontal-white", name: "Branca", use: "Sobre fotos, vidro e fundos escuros ou coloridos.", background: "green", ratio: 79.21 / 27.61 },
  { file: "paiol-symbol-green", name: "Símbolo monocromático", use: "Selos e espaços pequenos. Também em preto e branco.", background: "light", ratio: 23.51 / 27.61 },
];

/** The name around the barn, for round spaces. */
export const seals: Logo[] = [
  { file: "paiol-seal-color", name: "Selo", use: "Adesivos, carimbos, sacolas e embalagens.", background: "light", ratio: 1 },
  { file: "paiol-seal-disc", name: "Selo verde", use: "Adesivo redondo e foto de perfil. Já vem com o círculo verde.", background: "light", ratio: 1 },
  { file: "paiol-seal-stacked-color", name: "Selo com nome", use: "Quando o nome precisa aparecer grande: potes, tampas e brindes.", background: "light", ratio: 1 },
  { file: "paiol-seal-stacked-disc", name: "Selo com nome verde", use: "Adesivo redondo com o nome em destaque.", background: "light", ratio: 1 },
];
export const monoSeals: Logo[] = [
  { file: "paiol-seal-black", name: "Selo preto", use: "Carimbo e impressão sem cor.", background: "light", ratio: 1 },
  { file: "paiol-seal-white", name: "Selo branco", use: "Sobre fotos e fundos escuros.", background: "green", ratio: 1 },
  { file: "paiol-seal-stacked-black", name: "Selo com nome preto", use: "Carimbo e impressão sem cor.", background: "light", ratio: 1 },
  { file: "paiol-seal-stacked-white", name: "Selo com nome branco", use: "Sobre fotos e fundos escuros.", background: "green", ratio: 1 },
];

/** Store facts shared by captions, the facade and the kit. The card says Centro; Google Maps says Vila Nova,
 * so materials leave the neighbourhood out until the owners confirm it. */
export const store = {
  address: "R. Palmas, 1561, Francisco Beltrão",
  whatsapp: "(46) 92001-1470",
  instagram: "@paiolprodutosnaturais",
  hours: ["Segunda a sexta: 8h30 às 12h e 13h30 às 18h30", "Sábado: 8h30 às 12h30"],
};

/** What customers praise in the Google reviews (4,5 stars, 22 reviews): the promises the brand keeps. */
export const pillars = [
  { title: "Variedade", quote: "Sempre encontro tudo o que preciso em produtos naturais, suplementos, chás…" },
  { title: "Preço justo", quote: "Melhor custo benefício da cidade!" },
  { title: "Organização", quote: "Tudo organizadinho em pacotinhos." },
  { title: "Atendimento", quote: "A equipe é atenciosa e o ambiente é muito agradável." },
];

export const voice = [
  { title: "Acolhedora", text: "Convida e recebe: “Vem você também!”, “Esperamos por você!”. Trata por você, com carinho e sem formalidade." },
  { title: "Prática", text: "Produto, preço e unidade primeiro. Frases curtas, uma ideia por vez, como no balcão." },
  { title: "Verdadeira", text: "Conta o que o produto tem, sem prometer o que ele não faz. Mostra a loja e a equipe de verdade." },
];

/** How the Paiol already writes, from its Instagram and its replies to reviews. */
export const vocabulary = {
  use: ["Aqui na Paiol você encontra…", "Esperamos por você!", "Vem você também!", "Coisas boas chegando toda semana",
    "precinho que cabe no seu bolso", "Ofertas da semana!", "Precisando, estamos à disposição!"],
  emoji: "💚 🍃 🫶🏻 ☘️ — até três por texto, no fim da frase.",
  hashtags: "Uma ou duas, no fim: #produtosnaturais, #oferta.",
  name: "Sempre “Paiol”, com P maiúsculo, também no meio da frase.",
};

export const examples = [
  { channel: "Oferta", prefer: "Ofertas da semana! 🍃 Nozes chilenas quebradas por R$ 4,79 a cada 100 g. Válido enquanto durarem os estoques.",
    avoid: "OFERTA IMPERDÍVEL!!! Corre que vai acabar!!!" },
  { channel: "Produto", prefer: "Rico em proteínas, fibras e ferro, o feijão é comum na mesa dos brasileiros. Você já conhece as variedades? Aqui na Paiol você encontra algumas opções 🫘",
    avoid: "Feijão que emagrece e acaba com a anemia." },
  { channel: "Suplemento", prefer: "Magnésio com inositol: conheça um pouco mais. Para saber se é para você, converse com seu médico ou nutricionista 💚",
    avoid: "Magnésio que trata ansiedade e insônia. Pode tomar sem medo!" },
  { channel: "Avaliação", prefer: "Muito obrigada, Renata! Que bom que você gostou da organização e dos preços 💚 Precisando, estamos à disposição!",
    avoid: "Agradecemos o seu contato. Atenciosamente, a gerência." },
];

export const checklist = [
  "Nome do produto igual ao da etiqueta da loja",
  "Texto com o jeito da Paiol: acolhedor, prático e verdadeiro",
  "Preço, unidade e validade conferidos",
  "Preço anterior só quando for maior que o da oferta",
  "Foto do produto que está à venda, sem distorção",
  "Logo da Paiol inteira e sem alterações",
];

export const facade = [
  { name: "Placa branca", mockup: "fachada-placa-branca", art: "placa-branca", recommended: true,
    alt: "Fachada com a nova placa branca, maior, e a logo colorida",
    text: "O branco destaca a logo na parede turquesa e de longe. A placa cresce sobre a parede vazia e a logo fica no centro, com folga." },
  { name: "Placa verde Paiol", mockup: "fachada-placa-verde", art: "placa-verde", recommended: false,
    alt: "Fachada com a nova placa verde Paiol, maior, e a logo com nome branco",
    text: "Mais sóbria e mais próxima do cartão. Na parede turquesa, o verde escuro perde contraste à distância." },
  { name: "Parede no verde Paiol", mockup: "fachada-verde-paiol", art: "placa-branca", recommended: false,
    alt: "Fachada com parede e toldo repintados no verde Paiol e a placa branca",
    text: "Placa branca e parede e toldo pintados no verde da marca. A loja inteira fica com a cor da Paiol; exige pintura." },
];

/** The square light box on the column by the door, seen in Street View. */
export const boxSign = [
  { name: "Bandeira branca", mockup: "bandeira-branca", art: "bandeira-branca", recommended: true,
    alt: "Placa de bandeira quadrada branca com a logo empilhada e o WhatsApp",
    text: "Se destaca na parede verde atrás dela e funciona acesa à noite." },
  { name: "Bandeira verde Paiol", mockup: "bandeira-verde", art: "bandeira-verde", recommended: false,
    alt: "Placa de bandeira quadrada verde Paiol com a logo empilhada e o WhatsApp",
    text: "Igual ao cartão de visitas. Contra a parede verde, se apoia mais na luz da caixa." },
];

export interface Photo { name: string; src: string; keywords: string[] }

/** Product photos cut out of the original offer PSDs by scripts/extract-product-photos.py. */
export const photos: Photo[] = productPhotos;

/** The library photo sharing the most words with a product name, if any. */
export function matchPhoto(name: string): Photo | null {
  const words = new Set(plain(name).split(/[^a-z0-9]+/));
  let best: Photo | null = null, score = 0;
  for (const photo of photos) {
    const shared = photo.keywords.filter(word => words.has(word)).length;
    if (shared > score) { best = photo; score = shared; }
  }
  return best;
}
