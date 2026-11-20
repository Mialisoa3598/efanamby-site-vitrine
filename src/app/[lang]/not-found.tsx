import { NotFoundContent, type NotFoundCopy } from "@/components/sections/not-found-content";
import { LOCALES } from "@/i18n/config";
import { getMessages } from "@/i18n/dictionaries";
import { path } from "@/lib/paths";

// Ne lit ni les en-têtes ni les cookies : sinon toutes les pages du site deviennent dynamiques (voir not-found-content.tsx).
export default async function NotFound() {
  const entries = await Promise.all(
    LOCALES.map(async (lang) => {
      const t = await getMessages(lang);
      return [lang, { title: t.notFound.title, text: t.notFound.text, back: t.common.backHome, href: path(lang, "home") }] as const;
    }),
  );
  return <NotFoundContent copy={Object.fromEntries(entries) as NotFoundCopy} />;
}
