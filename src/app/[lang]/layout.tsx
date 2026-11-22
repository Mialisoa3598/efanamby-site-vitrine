import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { mozillaText } from "../fonts";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { LIVE_LOCALES, LOCALES, LOCALE_INFO, hasLocale, isOpen } from "@/i18n/config";
import { getMessages } from "@/i18n/dictionaries";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getMessages(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.homeTitle, template: `%s · ${t.meta.siteName}` },
    description: t.meta.homeDescription,
    applicationName: t.meta.siteName,
    icons: { icon: [{ url: "/logo/favicon.svg", type: "image/svg+xml" }, { url: "/logo/favicon-32x32.png", sizes: "32x32", type: "image/png" }, { url: "/logo/favicon.ico", sizes: "any" }], apple: "/logo/apple-touch-icon.png" },
    openGraph: { siteName: t.meta.siteName, locale: LOCALE_INFO[lang].ogLocale, type: "website" },
    // Une langue non relue n'est pas indexée.
    robots: LIVE_LOCALES.includes(lang) ? undefined : { index: false, follow: false },
  };
}

export const viewport: Viewport = { themeColor: "#06062d", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang) || !isOpen(lang)) notFound();
  const t = await getMessages(lang);

  // suppressHydrationWarning : des extensions de navigateur ajoutent des attributs sur <html> avant l'hydratation.
  // data-scroll-behavior : Next le demande quand le CSS met scroll-behavior: smooth sur <html> (globals.css).
  return (
    <html lang={lang} className={mozillaText.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-green focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-navy">
          {t.common.skip}
        </a>
        <Header locale={lang} t={t} />
        {/* Le fond de <body> est marine (voir globals.css) : c'est la couleur que Safari iPhone étend sous le pied de page.
            La menthe est portée par ce conteneur, qui s'arrête exactement en bas du pied de page. */}
        <div className="page-body flex flex-1 flex-col">
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <Footer locale={lang} t={t} />
        </div>
        <ScrollReveal />
      </body>
    </html>
  );
}
