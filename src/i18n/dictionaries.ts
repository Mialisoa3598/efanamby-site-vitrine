import "server-only";
import type { Locale } from "./config";
import type { Messages } from "./types";

const dictionaries: Record<Locale, () => Promise<Messages>> = {
  fr: () => import("./messages/fr").then((m) => m.fr as unknown as Messages),
  en: () => import("./messages/en").then((m) => m.en),
  mg: () => import("./messages/mg").then((m) => m.mg),
  es: () => import("./messages/es").then((m) => m.es),
};

export async function getMessages(locale: Locale): Promise<Messages> {
  return dictionaries[locale]();
}
