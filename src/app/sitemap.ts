import type { MetadataRoute } from "next";
import { LIVE_LOCALES } from "@/i18n/config";
import { PAGES, SITE_URL, type PageKey } from "@/lib/site";

// Pages à indexer : les six pages principales, dans les langues relues. Les pages juridiques (texte en attente) en sont exclues.
const INDEXED: PageKey[] = ["home", "features", "pricing", "references", "contact", "trial"];

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXED.flatMap((page) =>
    LIVE_LOCALES.map((lang) => ({
      url: `${SITE_URL}/${lang}${PAGES[page]}`,
      changeFrequency: "monthly" as const,
      priority: page === "home" ? 1 : 0.7,
      alternates: { languages: Object.fromEntries(LIVE_LOCALES.map((l) => [l, `${SITE_URL}/${l}${PAGES[page]}`])) },
    })),
  );
}
