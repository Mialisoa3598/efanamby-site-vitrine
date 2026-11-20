"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { ArrowUpRight, CloseIcon, MenuIcon } from "../icons";
import { LanguageMenu, type LanguageItem } from "./language-menu";
import { NavLinks, type NavItem } from "./nav-links";

/** Menu des petits écrans : bouton burger qui ouvre un panneau plein écran sous l'en-tête. */
export function MobileMenu({ items, navLabel, openLabel, closeLabel, login, loginHref, trial, trialHref, locale, languages, languageLabel, languageSoon }: {
  items: NavItem[];
  navLabel: string;
  openLabel: string;
  closeLabel: string;
  login: string;
  loginHref: string;
  trial: string;
  trialHref: string;
  locale: string;
  languages: LanguageItem[];
  languageLabel: string;
  languageSoon: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button type="button" aria-expanded={open} aria-controls="menu-mobile" aria-label={open ? closeLabel : openLabel} onClick={() => setOpen((v) => !v)} className="-mr-3 grid size-11 place-items-center rounded-md text-mint">
        {open ? <CloseIcon size={36} /> : <MenuIcon size={28} />}
      </button>
      {open && (
        <div id="menu-mobile" className="fixed inset-x-0 bottom-0 top-[76px] z-40 overflow-y-auto bg-navy">
          {/* Maquette du menu mobile : les cinq liens en bas de l'écran, un filet fin et une flèche par ligne (pas de séparation entre les lignes : 24 px). */}
          <div className="wrap flex min-h-full flex-col justify-between gap-10 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] pt-4">
            {/* Hors maquette (elle ne montre que les cinq liens) : actions gardées pour que rien ne disparaisse du mobile, discrètes, en haut. */}
            <div className="flex flex-col items-start gap-5">
              <div className="flex w-full items-center justify-between gap-4">
                <a href={loginHref} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-[16px] font-semibold text-mint underline underline-offset-4">
                  {login}
                </a>
                <Button href={trialHref} icon="arrow-box" tight>
                  {trial}
                </Button>
              </div>
              <LanguageMenu current={locale} items={languages} label={languageLabel} soon={languageSoon} variant="list" />
            </div>
            <NavLinks
              items={items}
              label={navLabel}
              onNavigate={() => setOpen(false)}
              listClassName="max-lg:gap-6"
              itemClassName="flex h-[54px] items-center justify-between gap-3 border-b-[0.5px] border-mint text-[32px] font-medium leading-none max-[389px]:text-[26px] aria-[current=page]:no-underline"
              trailing={<ArrowUpRight size={40} className="-mr-2 shrink-0" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}
