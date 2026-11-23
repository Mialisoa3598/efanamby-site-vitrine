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

describe.each(["fr", "en", "mg", "es"] as const)("fonctionnalités : détail des cartes (%s)", (code) => {
  const items = DICTS[code].features.items;

  it("9 cartes, chacune avec 2 ou 3 lignes de détail courtes (elles doivent tenir dans une carte de 305 px de haut)", () => {
    expect(items).toHaveLength(9);
    for (const item of items) {
      expect(item.details.length, item.title).toBeGreaterThanOrEqual(2);
      expect(item.details.length, item.title).toBeLessThanOrEqual(3);
      for (const d of item.details) expect(d.length, d).toBeLessThanOrEqual(60);
    }
  });

  it("n'a pas deux fois la même ligne de détail dans une carte", () => {
    for (const item of items) expect(new Set(item.details).size, item.title).toBe(item.details.length);
  });
});

describe("retours du 23/11 (soir)", () => {
  it("Profil joueur : les abréviations des attributs suivent la langue", () => {
    const attrs = (code: keyof typeof DICTS) => DICTS[code].features.items[4].details[1];
    expect(attrs("fr")).toContain("TIR, PAS, DRI, DEF, PHY, GK");
    expect(attrs("en")).toContain("SHO, PAS, DRI, DEF, PHY, GK");
    expect(attrs("en")).not.toMatch(/\bTIR\b/);
    expect(attrs("es")).toContain("TIR, PAS, REG, DEF, FÍS, POR");
    expect(attrs("es")).not.toMatch(/\b(PHY|DRI|GK)\b/);
    expect(attrs("mg")).toContain("SHO, PAS, DRI, DEF, PHY, GK");
    expect(attrs("mg")).not.toMatch(/\bTIR\b/);
  });

  it("Liste des matchs : le détail ne répète pas le texte court de la carte (filtres par équipe, compétition, statut)", () => {
    for (const code of ["fr", "en", "mg", "es"] as const) {
      const item = DICTS[code].features.items[2];
      expect(item.details.some((d) => /^(Filtres?|Filters?|Filtros?|Sivana)/i.test(d)), code).toBe(false);
    }
  });

  it("Rapport de match et Tarifs : « sur demande » remplace « à envoyer manuellement » dans les 4 langues", () => {
    const old = /manuellement|manually|manualmente|alefa an-tanana/i;
    for (const code of ["fr", "en", "mg", "es"] as const) {
      const bad = leaves(DICTS[code]).filter(([, v]) => typeof v === "string" && old.test(v));
      expect(bad.map(([k]) => k), code).toEqual([]);
    }
    expect(fr.features.items[7].text).toBe("Export PDF/CSV. Partage WhatsApp sur demande");
    expect(en.features.items[7].text).toBe("PDF/CSV export. WhatsApp sharing on request");
  });

  it("Accueil : une phrase de transition sous le titre « outils globaux », dans les 4 langues", () => {
    for (const code of ["fr", "en", "mg", "es"] as const) expect(DICTS[code].home.problemsIntro.length, code).toBeGreaterThan(30);
  });

  it("Références : 5 cas (le 5e, les Barea en qualifications CAN 2027, est le plus récent) et le stade de CFFA vs COSFA", () => {
    for (const code of ["fr", "en", "mg", "es"] as const) {
      const cases = DICTS[code].references.cases;
      expect(cases, code).toHaveLength(5);
      expect(cases[4].title, code).toMatch(/Guinea|Guinée/);
      expect(cases[4].title, code).toMatch(/(CAN|AFCON) 2027/);
    }
    expect(fr.references.cases[0].text).toMatch(/Quart de finale/);
    expect(en.references.cases[0].text).toMatch(/Quarter-final/);
    expect(es.references.cases[0].text).toMatch(/Cuartos de final/);
  });

  it("Références : la section témoignage (Coach Lalaina) est retirée, texte et description de page compris (décision du chef, 23/11)", () => {
    for (const code of ["fr", "en", "mg", "es"] as const) {
      expect(DICTS[code].references, code).not.toHaveProperty("testimonial");
      expect(DICTS[code].alt, code).not.toHaveProperty("handshake");
      expect(JSON.stringify(DICTS[code]), code).not.toMatch(/Lalaina|témoignage|testimonial|testimonio/i);
    }
  });
});
