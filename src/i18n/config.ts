// Langues du site : français (langue source), anglais, malgache, espagnol.
// Règle de la stagiaire (16/11) : une langue n'est ouverte au public que lorsqu'elle est jugée correcte.
// Décision du 20/11 : EN, MG et ES sont ouvertes (live: true) pour la mise en ligne.
// « live » = ouverte au public et indexable ; live: false = brouillon : accessible par son adresse seulement en mode aperçu
// (NEXT_PUBLIC_PREVIEW=1), 404 en production, absente du plan du site, grisée « bientôt » dans le sélecteur.
// Pour refermer une langue en urgence : repasser son « live » à false, puis redéployer.

export const LOCALES = ["fr", "en", "mg", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_INFO: Record<Locale, { label: string; short: string; hreflang: string; ogLocale: string; live: boolean }> = {
  fr: { label: "Français", short: "FR", hreflang: "fr", ogLocale: "fr_FR", live: true },
  en: { label: "English", short: "EN", hreflang: "en", ogLocale: "en_US", live: true },
  mg: { label: "Malagasy", short: "MG", hreflang: "mg", ogLocale: "mg_MG", live: true },
  es: { label: "Español", short: "ES", hreflang: "es", ogLocale: "es_ES", live: true },
};

export function hasLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Mode aperçu : les langues en brouillon sont ouvertes (NEXT_PUBLIC_PREVIEW=1). En production : seulement les langues « live ». */
export const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === "1";

export function isOpen(locale: Locale): boolean {
  return PREVIEW || LOCALE_INFO[locale].live;
}

export const LIVE_LOCALES: Locale[] = LOCALES.filter((l) => LOCALE_INFO[l].live);
