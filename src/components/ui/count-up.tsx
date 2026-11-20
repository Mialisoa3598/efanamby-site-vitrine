"use client";

import { useEffect, useRef } from "react";

/**
 * Chiffre qui « monte » de 0 à sa valeur quand il arrive à l'écran (ex. « +165 », « 8 »).
 * Le HTML contient déjà la vraie valeur : robots, personnes sans JavaScript et lecteurs d'écran lisent le bon chiffre.
 * L'animation est un effet visuel qui s'arrête tout seul ; rien n'est animé pour qui a demandé « réduire les animations ».
 * Seuls les textes de la forme « préfixe + chiffres + suffixe » (« +165 », « 8 ») s'animent ; tout autre texte reste tel quel.
 */
export function CountUp({ value, duration = 1100 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Le chiffre est invisible (CSS « .count-up ») le temps que la page s'active, pour ne pas voir la vraie valeur puis un retour à 0.
    // Dès que le script est prêt on le montre ; sans script, le CSS le montre tout seul après 1,5 s.
    const parts = value.match(/^(\D*)(\d+)(\D*)$/);
    const animate = !!parts && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window;
    const reveal = () => {
      el.style.animation = "none";
      el.style.opacity = "1";
    };
    const reset = () => {
      el.textContent = value;
      el.style.display = "";
      el.style.minWidth = "";
      el.style.animation = "";
      el.style.opacity = "";
    };
    if (!animate || !parts) {
      reveal();
      return reset;
    }

    const [, before, digits, after] = parts;
    const target = Number(digits);
    // Largeur finale réservée : le texte ne bouge pas de place pendant que le chiffre grandit.
    el.style.display = "inline-block";
    el.style.minWidth = `${el.offsetWidth}px`;
    el.textContent = `${before}0${after}`;
    reveal();

    let frame = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${before}${Math.round(target * eased)}${after}`;
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);

    // À l'impression, le vrai chiffre (jamais « 0 » ou un chiffre en route).
    const beforePrint = () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = value;
    };
    window.addEventListener("beforeprint", beforePrint);

    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      observer.disconnect();
      cancelAnimationFrame(frame);
      reset();
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="count-up" style={{ fontVariantNumeric: "tabular-nums" }}>
      {value}
    </span>
  );
}
