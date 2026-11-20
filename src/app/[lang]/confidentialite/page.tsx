import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal-page";
import { buildMetadata, loadPage, type PageProps } from "@/lib/page";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { t } = await loadPage(params);
  // Texte pas encore rédigé : la page n'est pas indexée.
  return { ...(await buildMetadata(params, "privacy", t.seo.privacy)), robots: { index: false, follow: true } };
}

export default async function PrivacyPage({ params }: PageProps) {
  const { lang, t } = await loadPage(params);
  return <LegalPage lang={lang} t={t} title={t.seo.privacy.title} />;
}
