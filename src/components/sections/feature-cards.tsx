"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, FeatureIcons } from "@/components/icons";

// Une icône Phosphor (graisse regular) par carte, dans l'ordre de la maquette.
const ICON_ORDER = ["translate", "dashboard", "matches", "stats", "player", "multi", "tactical", "report", "players"] as const;

type Item = { title: string; text: string; details: readonly string[] };

/** Hauteur qu'une carte demande une fois ouverte : marges + pastille + titre + texte + détail (le détail replié garde sa hauteur naturelle dans scrollHeight). */
function openHeight(li: HTMLElement): number {
  const px = (el: Element, prop: "paddingTop" | "paddingBottom" | "marginTop") => parseFloat(getComputedStyle(el)[prop]) || 0;
  const q = (sel: string) => li.querySelector<HTMLElement>(sel);
  const body = q(".fc-body");
  const text = q(".fc-text");
  const more = q(".fc-more-in");
  if (!body || !text || !more) return 0;
  return px(li, "paddingTop") + (q(".fc-tile")?.offsetHeight ?? 0) + px(body, "paddingTop") + (q(".fc-head")?.offsetHeight ?? 0) + px(text, "marginTop") + text.offsetHeight + more.scrollHeight + px(li, "paddingBottom");
}

/**
 * Grille des 9 fonctionnalités (page Fonctionnalités). Modèle Figma du 23/11 : carte #DDECF4 au repos, violette quand elle est ouverte.
 *
 * - Ordinateur (souris) : la carte s'ouvre au survol, et aussi quand elle prend le focus au clavier (Tab). Tout est géré par le CSS (.fc dans globals.css).
 * - Tactile (téléphone, tablette) : un clic ouvre la carte, un second clic la referme ; une seule carte est ouverte à la fois. C'est `data-open` qui l'indique.
 * - Le texte détaillé est toujours dans la page (il est seulement replié) : Google et les lecteurs d'écran le lisent, carte ouverte ou non.
 */
export function FeatureCards({ items }: { items: readonly Item[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const grid = useRef<HTMLUListElement>(null);

  // Toutes les cartes prennent la hauteur de la plus chargée une fois ouverte (selon la langue et la largeur de l'écran) :
  // aucune carte ne grandit au survol, les espacements restent ceux du modèle. Sans JavaScript, le CSS garde les 305 px du modèle.
  useEffect(() => {
    const ul = grid.current;
    if (!ul) return;
    const fit = () => {
      const need = Math.max(0, ...[...ul.querySelectorAll<HTMLElement>(":scope > .fc")].map(openHeight));
      ul.style.setProperty("--fc-need", `${Math.ceil(need)}px`);
    };
    fit();
    let width = ul.clientWidth;
    const observer = new ResizeObserver(() => {
      if (ul.clientWidth === width) return;
      width = ul.clientWidth;
      fit();
    });
    observer.observe(ul);
    void document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={grid} className="mt-[56px] grid grid-cols-3 gap-9 [grid-auto-rows:1fr] max-xl:gap-6 max-[1100px]:grid-cols-2 max-md:mt-8 max-md:grid-cols-1 max-md:gap-4">
      {items.map((item, i) => {
        const Icon = FeatureIcons[ICON_ORDER[i]];
        const isOpen = open === i;
        return (
          <li key={item.title} data-reveal data-reveal-delay={i % 3} data-open={isOpen} className="fc">
            <span aria-hidden="true" className="fc-tile">
              <Icon size={28} />
            </span>
            <div className="fc-body">
              <div className="fc-head">
                <h3 className="fc-title">
                  <button type="button" className="fc-btn" aria-expanded={isOpen} aria-controls={`fc-more-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                    {item.title}
                  </button>
                </h3>
                <span aria-hidden="true" className="fc-arrows">
                  <ArrowUpRight size={32} className="fc-ar fc-ar-up" />
                  <ArrowDownLeft size={32} className="fc-ar fc-ar-down" />
                </span>
              </div>
              <p className="fc-text">{item.text}</p>
              <div id={`fc-more-${i}`} className="fc-more">
                <div className="fc-more-in">
                  <ul className="fc-list">
                    {item.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
