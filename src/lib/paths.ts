import type { Locale } from "@/i18n/config";
import { PAGES, type PageKey } from "./site";

/** Adresse d'une page dans une langue : /fr, /fr/tarifs… */
export function path(locale: Locale, page: PageKey): string {
  return `/${locale}${PAGES[page]}`;
}
