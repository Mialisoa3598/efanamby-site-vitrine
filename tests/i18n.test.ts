import { describe, expect, it } from "vitest";
import { LOCALES, LOCALE_INFO, LIVE_LOCALES, DEFAULT_LOCALE, hasLocale, isOpen } from "@/i18n/config";
import { en } from "@/i18n/messages/en";
import { es } from "@/i18n/messages/es";
import { fr } from "@/i18n/messages/fr";
import { mg } from "@/i18n/messages/mg";

const DICTS = { fr, en, mg, es } as const;

/** Parcourt un objet de textes et renvoie la liste « chemin → valeur » de toutes les feuilles. */
function leaves(value: unknown, path = ""): [string, unknown][] {
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [[path, value]];
}

const frLeaves = new Map(leaves(fr));

describe("langues", () => {
  it("expose les 4 langues, le français par défaut", () => {
    expect([...LOCALES].sort()).toEqual(["en", "es", "fr", "mg"]);
    expect(DEFAULT_LOCALE).toBe("fr");
    expect(hasLocale("fr")).toBe(true);
    expect(hasLocale("de")).toBe(false);
    expect(hasLocale("")).toBe(false);
  });

  it("les quatre langues sont ouvertes au public (décision du 20/11)", () => {
    expect([...LIVE_LOCALES].sort()).toEqual(["en", "es", "fr", "mg"]);
    for (const l of LOCALES) expect(LOCALE_INFO[l].live).toBe(true);
  });

  it("isOpen : toutes les langues sont ouvertes ; une langue repassée à live: false se refermerait hors aperçu", () => {
    // Les tests tournent sans NEXT_PUBLIC_PREVIEW.
    for (const l of LOCALES) expect(isOpen(l)).toBe(true);
  });
});

describe.each(["en", "mg", "es"] as const)("textes : %s", (code) => {
  const dict = DICTS[code];
  const own = new Map(leaves(dict));

  it("a exactement les mêmes clés et la même longueur de listes que le français", () => {
    const missing = [...frLeaves.keys()].filter((k) => !own.has(k));
    const extra = [...own.keys()].filter((k) => !frLeaves.has(k));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it("n'a aucun texte vide ni resté en placeholder", () => {
    const bad = [...own].filter(([, v]) => typeof v === "string" && (v.trim() === "" || /\bTODO\b|À TRADUIRE|lorem ipsum/.test(v)));
    expect(bad.map(([k]) => k)).toEqual([]);
  });

  it("n'a une réponse de FAQ vide que là où le français n'en a pas encore", () => {
    const wrong = [...own].filter(([k, v]) => (v === null) !== (frLeaves.get(k) === null) && frLeaves.has(k));
    expect(wrong.map(([k]) => k)).toEqual([]);
  });

  it("garde les chiffres, prix et sigles de la maquette", () => {
    // Les valeurs non traduisibles (prix, pourcentages, nombres) doivent être identiques au français.
    const numeric = (s: string) => (s.match(/\d[\d .,]*\d|\d/g) ?? []).join("|");
    const diffs: string[] = [];
    for (const [k, v] of own) {
      const f = frLeaves.get(k);
      if (typeof v === "string" && typeof f === "string" && /^[+\d][\d .,%+Ar€$k]*$/.test(f) && numeric(v) !== numeric(f)) diffs.push(`${k}: ${f} ≠ ${v}`);
    }
    expect(diffs).toEqual([]);
  });

  it("garde le slogan et les noms de marque", () => {
    expect(dict.meta.siteName).toBe("e-Fanamby");
    expect(dict.meta.tagline).toBe(fr.meta.tagline);
  });
});

describe("français (langue source)", () => {
  it("n'a aucun texte vide", () => {
    const bad = [...frLeaves].filter(([, v]) => typeof v === "string" && v.trim() === "");
    expect(bad.map(([k]) => k)).toEqual([]);
  });

  it("contient le slogan officiel", () => {
    expect(fr.meta.slogan).toBe("Parions sur la data.");
  });
});
