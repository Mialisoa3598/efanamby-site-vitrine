import type { Metadata } from "next";
import "./globals.css";
import { mozillaText } from "./fonts";

// Adresse hors des langues du site (ou langue pas encore ouverte) : page minimale en français, sans en-tête ni pied de page.
export const metadata: Metadata = { title: "Page introuvable · e-Fanamby", robots: { index: false, follow: false } };

export default function GlobalNotFound() {
  return (
    <html lang="fr" className={mozillaText.variable}>
      <body className="grid min-h-dvh place-items-center bg-navy px-6 text-center text-mint">
        <main>
          <p className="m-0 text-[14px] font-semibold uppercase tracking-[0.08em] text-green">404</p>
          <h1 className="m-0 mt-3 text-[40px] font-bold leading-[1.1] tracking-[-0.02em]">Cette page n&apos;existe pas.</h1>
          <p className="m-0 mt-3 text-[16px]">Le lien est peut-être incorrect, ou la page a été déplacée.</p>
          {/* Chargement complet voulu : cette page est hors du dossier des langues, qui a sa propre mise en page. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/fr" className="mt-8 inline-flex h-[42px] items-center bg-green px-6 text-[14px] font-bold text-navy">
            Retour à l&apos;accueil
          </a>
        </main>
      </body>
    </html>
  );
}
