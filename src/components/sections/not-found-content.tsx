"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/i18n/config";

export type NotFoundCopy = Record<Locale, { title: string; text: string; back: string; href: string }>;

/**
 * Contenu de la page 404 d'une langue. La page 404 ne reçoit pas les paramètres de l'adresse, et lire les en-têtes
 * du serveur dans `not-found.tsx` rendrait TOUTES les pages du site dynamiques (constaté le 18/11 : `ƒ` au lieu de `●`
 * dans le tableau de `npm run build`). On lit donc la langue dans l'adresse ici, côté composant.
 */
export function NotFoundContent({ copy }: { copy: NotFoundCopy }) {
  const first = (usePathname() ?? "").split("/")[1] ?? "";
  const c = copy[hasLocale(first) ? first : DEFAULT_LOCALE];
  return (
    <div className="page-ends-navy flex flex-col justify-center bg-navy pb-[120px] pt-[100px] text-center text-mint max-md:pb-20 max-md:pt-16">
      <div className="wrap">
        <p className="m-0 text-[14px] font-semibold uppercase tracking-[0.08em] text-green">404</p>
        <h1 className="m-0 mt-3 text-[52px] font-bold leading-[1.1] tracking-[-0.025em] max-md:text-[34px]">{c.title}</h1>
        <p className="m-0 mt-3 text-[16px]">{c.text}</p>
        <Button href={c.href} className="mt-8">
          {c.back}
        </Button>
      </div>
    </div>
  );
}
