"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { CaretDown } from "../icons";

export type LanguageItem = { locale: string; label: string; short: string; open: boolean };

/** « FR » → « Fr » : l'initiale de la langue, telle qu'affichée dans le menu mobile (tient sur une seule ligne). */
const initials = (short: string) => short.charAt(0).toUpperCase() + short.slice(1).toLowerCase();

/** Sélecteur de langue : bouton + liste de liens (la page courante est conservée). Les langues non relues sont grisées. */
export function LanguageMenu({ current, items, label, soon, variant = "bar" }: { current: string; items: LanguageItem[]; label: string; soon: string; variant?: "bar" | "list" }) {
  const pathname = usePathname() ?? `/${current}`;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const rest = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  const currentItem = items.find((i) => i.locale === current) ?? items[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const isList = variant === "list";
  const closed = items.filter((i) => !i.open);

  const list = (
    <ul className={cn(isList ? "flex flex-nowrap gap-2" : "absolute right-0 top-full z-50 mt-3 min-w-[170px] rounded-[10px] bg-mint p-2 text-navy shadow-lg")}>
      {items.map((item) => {
        const isCurrent = item.locale === current;
        // Menu mobile : initiales seulement (Fr En Mg Es), zone tactile de 44 px ; le nom complet reste lu par les lecteurs d'écran.
        const common = isList
          ? "flex min-h-11 min-w-11 items-center justify-center rounded-[6px] px-3 text-[15px] font-medium"
          : "flex items-center justify-between gap-4 rounded-[6px] px-3 py-2 text-[14px] font-medium";
        return (
          <li key={item.locale}>
            {item.open ? (
              <a
                href={`/${item.locale}${rest}`}
                lang={item.locale}
                hrefLang={item.locale}
                title={isList ? item.label : undefined}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(common, !isList && "hover:bg-navy/10", isList && "border border-mint/40 text-mint", isCurrent && "font-bold", isCurrent && isList && "bg-mint text-navy")}
              >
                {isList ? (
                  <>
                    <span aria-hidden="true">{initials(item.short)}</span>
                    <span className="sr-only">{item.label}</span>
                  </>
                ) : (
                  item.label
                )}
              </a>
            ) : isList ? (
              <span className={cn(common, "border border-mint/20 text-mint opacity-50")} lang={item.locale} title={`${item.label} – ${soon}`}>
                <span aria-hidden="true">{initials(item.short)}</span>
                <span className="sr-only">{`${item.label}, ${soon}`}</span>
              </span>
            ) : (
              <span className={cn(common, "cursor-not-allowed opacity-50")} lang={item.locale}>
                {item.label}
                <span className="text-[11px] uppercase tracking-wide">{soon}</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );

  if (isList)
    return (
      <div aria-label={label} role="group">
        {list}
        {/* Les langues pas encore ouvertes sont grisées : une seule ligne explique pourquoi (au lieu d'un « bientôt » par langue, qui ne tiendrait pas sur une ligne). */}
        {closed.length > 0 && (
          <p aria-hidden="true" className="mt-2 text-[11px] uppercase tracking-wide text-mint/60">
            {closed.map((i) => initials(i.short)).join(" · ")} — {soon}
          </p>
        )}
      </div>
    );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${currentItem.short}, ${label} : ${currentItem.label}`}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-sm text-[14px] font-medium text-mint hover:opacity-80"
      >
        {currentItem.short}
        <CaretDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && list}
    </div>
  );
}
