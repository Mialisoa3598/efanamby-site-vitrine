import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { path } from "@/lib/paths";
import { NAV_KEYS, PAGES } from "@/lib/site";

describe("adresses des pages", () => {
  it("construit /fr pour l'accueil et /fr/tarifs pour les autres pages", () => {
    expect(path("fr", "home")).toBe("/fr");
    expect(path("fr", "pricing")).toBe("/fr/tarifs");
    expect(path("mg", "trial")).toBe("/mg/essai-gratuit");
    expect(path("es", "references")).toBe("/es/references");
  });

  it("chaque page est unique, commence par « / » (ou est vide pour l'accueil) et ne finit pas par « / »", () => {
    const values = Object.values(PAGES);
    expect(new Set(values).size).toBe(values.length);
    for (const v of values) {
      expect(v === "" || v.startsWith("/")).toBe(true);
      expect(v.endsWith("/")).toBe(false);
    }
  });

  it("la navigation ne contient que des pages existantes, dans l'ordre de la maquette", () => {
    expect([...NAV_KEYS]).toEqual(["home", "features", "pricing", "references", "contact"]);
    for (const k of NAV_KEYS) expect(k in PAGES).toBe(true);
  });

  it("toutes les langues donnent des adresses distinctes", () => {
    const all = LOCALES.flatMap((l) => Object.keys(PAGES).map((k) => path(l, k as keyof typeof PAGES)));
    expect(new Set(all).size).toBe(all.length);
  });
});
