import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Lower case without accents or hyphens, for matching product names typed in different ways. */
export const plain = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/-/g, " ").toLowerCase();

export const slug = (text: string) => plain(text).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
