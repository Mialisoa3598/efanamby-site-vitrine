"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Apparition douce des blocs au défilement (décision du 18/11 : animations « légères », sans bibliothèque).
 *
 * Comment ça marche : tout élément portant l'attribut `data-reveal` est visible par défaut (sans JavaScript, à l'impression, pour les robots).
 * Ici, une fois la page affichée, on cache SEULEMENT ceux qui sont sous la ligne de flottaison, puis on les révèle quand ils arrivent à l'écran.
 * L'apparence (distance, durée, courbe) est dans globals.css. Rien n'est animé pour les personnes qui ont demandé « réduire les animations ».
 *
 * L'état est porté par un attribut (`data-reveal-state`), pas par une classe : React ne le touche jamais, même s'il met à jour la classe de l'élément.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const timers: number[] = [];
    const hidden = new Set<HTMLElement>();
    let observer: IntersectionObserver | undefined;

    // Un tour d'horloge après l'affichage : la nouvelle page est bien en place, y compris après un changement de page.
    const frame = requestAnimationFrame(() => {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            observer?.unobserve(el);
            el.dataset.revealState = "shown";
            // Une fois fini, l'élément retrouve ses propres transitions (survol, etc.) : on retire l'état.
            timers.push(
              window.setTimeout(() => {
                delete el.dataset.revealState;
                hidden.delete(el);
              }, 1300),
            );
          }
        },
        { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
      );

      const limit = window.innerHeight * 0.94;
      for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
        // Déjà à l'écran (ou au-dessus) au chargement : pas d'animation, donc pas de clignotement en haut de page.
        if (el.dataset.revealState || el.getBoundingClientRect().top < limit) continue;
        el.dataset.revealState = "hidden";
        hidden.add(el);
        observer.observe(el);
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      // Rien ne doit rester caché si on quitte la page en cours de route.
      hidden.forEach((el) => delete el.dataset.revealState);
    };
  }, [pathname]);

  return null;
}
