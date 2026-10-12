import { plain, slug } from "./utils";

/** Where a label shows the price: under the name, beside it, or nowhere (section titles). */
export type PriceLayout = "below" | "beside" | "none";
export interface LabelType { id: string; name: string; width: number; height: number; price: PriceLayout }

export const LABEL_TYPES_KEY = "label-types";

/** The labels of the original sheet. Their ids are the cellType values of CSVs from the original version. */
export const BUILT_IN_TYPES: LabelType[] = [
  { id: "default", name: "Padrão", width: 65, height: 30, price: "below" },
  { id: "larger", name: "Largo", width: 95, height: 30, price: "beside" },
  { id: "title", name: "Título", width: 65, height: 30, price: "none" },
];

export const PRICE_LAYOUTS: { value: PriceLayout; label: string }[] = [
  { value: "below", label: "Embaixo do nome" },
  { value: "beside", label: "Ao lado do nome" },
  { value: "none", label: "Sem preço (título)" },
];

/** Printable area of an A4 sheet with 5 mm margins, and the hairline between labels, in mm. */
export const SHEET = { width: 200, height: 287, gap: 0.2 };
export const LIMITS = { width: { min: 30, max: SHEET.width }, height: { min: 15, max: SHEET.height } };

/** A product's type; one whose type was deleted prints as Padrão. */
export const typeOf = (product: { cellType: string }, types: LabelType[]) =>
  types.find(type => type.id === product.cellType) ?? BUILT_IN_TYPES[0];

export const perRow = (type: LabelType) => Math.floor((SHEET.width + SHEET.gap) / (type.width + SHEET.gap));

/** A type by id or by name in any case and accent: "larger", "Largo", "gondola" for "Gôndola". */
export function findType(text: string, types: LabelType[]) {
  const key = plain(text.trim());
  return types.find(type => type.id === text.trim() || plain(type.name) === key) ?? null;
}

/** What is wrong with a type being created or edited, or null. */
export function checkType(type: Omit<LabelType, "id">, others: LabelType[]) {
  if (!type.name.trim()) return "Dê um nome ao tipo de etiqueta.";
  if (others.some(other => plain(other.name) === plain(type.name.trim()))) return `Já existe um tipo chamado “${type.name.trim()}”.`;
  for (const [key, label] of [["width", "largura"], ["height", "altura"]] as const) {
    const { min, max } = LIMITS[key];
    if (!(type[key] >= min && type[key] <= max)) return `A ${label} precisa ficar entre ${min} e ${max} mm.`;
  }
  return null;
}

/** A new type's id: its name as a slug, unique among the types. */
export function newTypeId(name: string, types: LabelType[]) {
  const base = slug(name) || "tipo";
  let id = base;
  for (let n = 2; types.some(type => type.id === id); n++) id = `${base}-${n}`;
  return id;
}

/** The built-in types followed by the ones created in this browser. */
export function loadLabelTypes(): LabelType[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(LABEL_TYPES_KEY) ?? "[]");
    const custom = (Array.isArray(saved) ? saved : []).filter((type): type is LabelType =>
      typeof type?.id === "string" && typeof type.name === "string" && !findType(type.id, BUILT_IN_TYPES)
      && PRICE_LAYOUTS.some(layout => layout.value === type.price) && checkType(type, []) === null);
    return [...BUILT_IN_TYPES, ...custom];
  } catch {
    return BUILT_IN_TYPES;
  }
}

export function saveLabelTypes(types: LabelType[]) {
  localStorage.setItem(LABEL_TYPES_KEY, JSON.stringify(types.filter(type => !BUILT_IN_TYPES.some(builtIn => builtIn.id === type.id))));
}
