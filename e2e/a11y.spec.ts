import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ALL_LOCALES, ALL_PAGES } from "./helpers";

// Accessibilité automatique (axe-core, règles WCAG 2.0/2.1/2.2 niveaux A et AA). Complète, sans la remplacer, une relecture au clavier et au lecteur d'écran.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function audit(page: import("@playwright/test").Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations.map((v) => `${v.id} (${v.impact}) : ${v.help} → ${v.nodes.length} élément(s), ex. ${v.nodes[0]?.target.join(" ")}`);
}

for (const [, suffix] of ALL_PAGES) {
  for (const width of [1280, 390]) {
    test(`fr${suffix || "/"} à ${width}px : aucune violation axe`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      expect(await audit(page, `/fr${suffix}`)).toEqual([]);
    });
  }
}

// Les autres langues partagent les mêmes composants : on contrôle les pages à formulaire et les tarifs.
for (const lang of ALL_LOCALES.filter((l) => l !== "fr")) {
  for (const suffix of ["", "/tarifs", "/contact"]) {
    test(`${lang}${suffix || "/"} : aucune violation axe`, async ({ page }) => {
      expect(await audit(page, `/${lang}${suffix}`)).toEqual([]);
    });
  }
}

test("formulaire en erreur : aucune violation axe", async ({ page }) => {
  await page.goto("/fr/contact");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.locator("p[role=alert]")).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
});

test("menu mobile ouvert : aucune violation axe", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/fr");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
});

test("langue ouverte dans le sélecteur : aucune violation axe", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("button", { name: /Langue/ }).click();
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
});
