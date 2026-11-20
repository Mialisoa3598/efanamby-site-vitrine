import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LIVE_LOCALES, LOCALE_INFO, hasLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/dictionaries";
import type { Messages } from "@/i18n/types";
import { PAGES, SITE_NAME, type PageKey } from "./site";

export type PageProps = { params: Promise<{ lang: string }> };

/** Langue et textes de la page (404 si la langue est inconnue). */
export async function loadPage(params: PageProps["params"]): Promise<{ lang: Locale; t: Messages }> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return { lang, t: await getMessages(lang) };
}

/** Titre, description, adresse canonique et alternatives de langue (hreflang : langues relues seulement). */
export async function buildMetadata(params: PageProps["params"], page: PageKey, seo: { title: string; description?: string }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const languages: Record<string, string> = Object.fromEntries(LIVE_LOCALES.map((l) => [l, `/${l}${PAGES[page]}`]));
  languages["x-default"] = `/fr${PAGES[page]}`;
  const title = page === "home" ? { absolute: seo.title } : seo.title;
  return {
    title,
    description: seo.description,
    alternates: { canonical: `/${lang}${PAGES[page]}`, languages },
    // Une page qui définit « openGraph » remplace celui du layout : on répète donc le nom du site, la langue et le type.
    openGraph: { title: seo.title, description: seo.description, url: `/${lang}${PAGES[page]}`, siteName: SITE_NAME, locale: LOCALE_INFO[lang].ogLocale, type: "website" },
  };
}
