import { House, ImageIcon, Palette, Tags } from "lucide-react";

export const tools = [
  { href: "/etiquetas", label: "Etiquetas", icon: Tags, description: "Etiquetas de preço para a loja, prontas para imprimir em A4." },
  { href: "/ofertas", label: "Ofertas", icon: ImageIcon, description: "Posts de oferta para o Instagram em feed, retrato e story." },
  { href: "/marca", label: "Marca", icon: Palette, description: "Logo, cores, fontes e o jeito de falar da Paiol." },
];

/** The phone tab bar also needs a way home, which the desktop menu gets from the logo. */
export const tabs = [{ href: "/", label: "Início", icon: House }, ...tools];
