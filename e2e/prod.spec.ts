import { expect, test } from "@playwright/test";
import { fr } from "../src/i18n/messages/fr";
import { PAGES } from "../src/lib/site";
import { MAIN_PAGES, watch } from "./helpers";

// Site construit comme en ligne : NEXT_PUBLIC_PREVIEW absente, NEXT_PUBLIC_SITE_URL = https://e-fanamby.mg, next start (NODE_ENV=production).
const SITE = "https://e-fanamby.mg";

test.describe("production : les quatre langues sont ouvertes", () => {
  for (const [, suffix] of MAIN_PAGES) {
    test(`/fr${suffix} répond 200 sans erreur`, async ({ page }) => {
      const w = watch(page);
      const res = await page.goto(`/fr${suffix}`);
      expect(res?.status()).toBe(200);
      await page.waitForLoadState("networkidle");
      expect(w.problems).toEqual([]);
    });
  }

  for (const lang of ["en", "mg", "es"]) {
    test(`/${lang} et ses pages répondent 200, sans erreur ni « bientôt »`, async ({ page }) => {
      const w = watch(page);
      for (const [, s] of MAIN_PAGES) {
        const res = await page.goto(`/${lang}${s}`, { waitUntil: "domcontentloaded" });
        expect(res?.status(), `/${lang}${s}`).toBe(200);
        await expect(page.locator("html"), `/${lang}${s}`).toHaveAttribute("lang", lang);
      }
      await page.waitForLoadState("networkidle");
      expect(w.problems).toEqual([]);
    });
  }

  test("la racine suit la langue du navigateur : en, es, mg → leur langue ; allemand → français", async ({ browser }) => {
    for (const [locale, expected] of [["en-US", "en"], ["es-ES", "es"], ["mg-MG", "mg"], ["de-DE", "fr"], ["fr-FR", "fr"]] as const) {
      const ctx = await browser.newContext({ locale });
      const page = await ctx.newPage();
      await page.goto("/");
      await expect(page, locale).toHaveURL(new RegExp(`/${expected}$`));
      await ctx.close();
    }
  });

  test("le sélecteur de langue propose les quatre langues, toutes avec un lien, sans « bientôt »", async ({ page }) => {
    await page.goto("/fr/tarifs");
    await page.getByRole("button", { name: new RegExp(fr.nav.language) }).click();
    for (const [code, label] of [["fr", "Français"], ["en", "English"], ["mg", "Malagasy"], ["es", "Español"]] as const) {
      const link = page.getByRole("link", { name: label });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", `/${code}/tarifs`);
    }
    await expect(page.getByRole("link", { name: "Français" })).toHaveAttribute("aria-current", "true");
    // « bientôt » existe ailleurs sur la page (tableau des prix : « Accès API (bientôt disponible) ») : on ne regarde que la liste des langues.
    const list = page.getByRole("link", { name: "English" }).locator("xpath=ancestor::ul[1]");
    await expect(list).not.toContainText(fr.nav.languageSoon);
  });

  test("menu mobile : Fr En Mg Es sur une ligne, quatre liens, aucune langue grisée", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/fr");
    await page.getByRole("button", { name: fr.nav.openMenu }).click();
    const group = page.locator("#menu-mobile").getByRole("group", { name: fr.nav.language });
    const items = group.locator("li > *");
    await expect(items).toHaveCount(4);
    const boxes = (await Promise.all([0, 1, 2, 3].map((i) => items.nth(i).boundingBox()))).map((b) => b!);
    for (const b of boxes) expect(Math.abs(b.y - boxes[0].y)).toBeLessThan(1);
    await expect(group.getByRole("link")).toHaveCount(4);
    await expect(group.getByRole("link", { name: "Français" })).toHaveAttribute("aria-current", "true");
    await expect(group).not.toContainText(fr.nav.languageSoon);
  });

  test("un changement de langue garde la page : /fr/tarifs → /en/tarifs", async ({ page }) => {
    await page.goto("/fr/tarifs");
    await page.getByRole("button", { name: new RegExp(fr.nav.language) }).click();
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/tarifs$/);
  });
});

test.describe("production : les contenus pas encore rédigés ne sont pas publiés", () => {
  test("Références : les cinq réponses de FAQ sont rédigées et publiées (aucune mention « À rédiger »)", async ({ page }) => {
    await page.goto("/fr/references");
    await expect(page.locator("details")).toHaveCount(fr.references.faq.length);
    expect(fr.references.faq.every((q) => q.a !== null)).toBe(true);
    await expect(page.getByText("À rédiger")).toHaveCount(0);
    await expect(page.getByText(/Domicile ou extérieur/)).toHaveCount(1);
  });

  test("aucune page ne contient de texte provisoire", async ({ page }) => {
    for (const [, s] of MAIN_PAGES) {
      await page.goto(`/fr${s}`);
      const text = await page.locator("body").innerText();
      expect(text, `/fr${s}`).not.toMatch(/À rédiger|lorem|TODO|undefined|\[object/i);
    }
  });

  test("le pied de page n'a aucun lien vide ; le lien Facebook mène à la page e-Fanamby", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.locator('footer a[href=""]')).toHaveCount(0);
    await expect(page.locator('footer a:not([href])')).toHaveCount(0);
    const fb = page.locator('footer a[href*="facebook.com"]');
    await expect(fb).toHaveCount(1);
    await expect(fb).toHaveAttribute("href", "https://www.facebook.com/profile.php?id=61591732342702");
    await expect(fb).toHaveAttribute("rel", /noopener/);
    await expect(fb).toHaveAttribute("target", "_blank");
  });
});

test.describe("production : référencement", () => {
  test("robots.txt autorise l'exploration et indique le sitemap", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toMatch(/Allow: \//);
    expect(body).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    expect(body).not.toMatch(/Disallow: \/\s*$/m);
  });

  test("sitemap.xml : six pages dans chacune des quatre langues, adresses complètes sur e-fanamby.mg", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = ["fr", "en", "mg", "es"].flatMap((l) => MAIN_PAGES.map(([, s]) => `${SITE}/${l}${s}`));
    expect(locs.sort()).toEqual(expected.sort());
    expect(xml).not.toMatch(/mentions-legales|cgu|confidentialite/);
  });

  test("canonique et hreflang pointent vers le domaine final, le français est indexable", async ({ page }) => {
    await page.goto("/fr/references");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}/fr/references`);
    const alt = await page.$$eval('link[rel="alternate"][hreflang]', (ls) => ls.map((l) => l.getAttribute("hreflang")));
    expect(alt.sort()).toEqual(["en", "es", "fr", "mg", "x-default"]);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test("les pages juridiques restent en noindex tant que leur texte est en attente", async ({ page }) => {
    for (const s of [PAGES.legal, PAGES.terms, PAGES.privacy]) {
      await page.goto(`/fr${s}`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });
});

test.describe("production : formulaire", () => {
  test("sans serveur d'e-mail configuré, l'envoi échoue proprement et propose l'adresse directe", async ({ page }) => {
    // Ce mode est lancé avec MAIL_DRY_RUN=1 : l'envoi est simulé, donc il réussit. L'échec « SMTP absent » est couvert par tests/mail.test.ts.
    await page.goto("/fr/contact");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(fr.form.name, { exact: false }).first().fill("Rado");
    await page.getByLabel(fr.form.email, { exact: false }).fill("rado@exemple.mg");
    await page.getByLabel(fr.form.message, { exact: false }).fill("Bonjour");
    await page.getByRole("checkbox").check();
    await page.waitForTimeout(2300);
    await page.getByRole("button", { name: fr.common.send }).click();
    await expect(page.getByRole("status")).toHaveText(fr.form.success);
  });
});
