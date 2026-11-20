// Informations communes au site. Une seule source de vérité pour les liens, les contacts et l'adresse du site.

export const SITE_NAME = "e-Fanamby";

/** Adresse publique du site (sans « / » final). À régler dans Vercel : NEXT_PUBLIC_SITE_URL=https://e-fanamby.mg */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Lien vers la vraie plateforme (sort du site vitrine). */
export const PLATFORM_URL = "https://e-fanamby.run.place/";

/** Pages, dans l'ordre de la navigation. */
export const PAGES = {
  home: "",
  features: "/fonctionnalites",
  pricing: "/tarifs",
  references: "/references",
  contact: "/contact",
  trial: "/essai-gratuit",
  legal: "/mentions-legales",
  terms: "/cgu",
  privacy: "/confidentialite",
} as const;
export type PageKey = keyof typeof PAGES;

export const NAV_KEYS = ["home", "features", "pricing", "references", "contact"] as const;

/** Contacts (à confirmer avant publication). */
export const CONTACT = {
  email: "efanamby2025@gmail.com",
  whatsappDisplay: "+261 34 77 155 08",
  whatsappHref: "https://wa.me/261347715508",
  linkedinDisplay: "linkedin.com/company/e-Fanamby",
  linkedinHref: "https://www.linkedin.com/company/e-Fanamby",
  facebookDisplay: "e-Fanamby",
  /** Page Facebook e-Fanamby (lien confirmé le 18/11). Vide = le nom s'affiche sans lien. */
  facebookHref: "https://www.facebook.com/profile.php?id=61591732342702",
} as const;

/** Destinataire des formulaires (décision du 16/11 : e-mail). */
export const FORM_RECIPIENT = process.env.MAIL_TO ?? CONTACT.email;
