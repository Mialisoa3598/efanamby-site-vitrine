import { expect, test, type Page } from "@playwright/test";
import { en } from "../src/i18n/messages/en";
import { fr } from "../src/i18n/messages/fr";
import { watch } from "./helpers";

const f = fr.form;

async function fillValid(page: Page, { message = "Bonjour, une question sur les tarifs." } = {}) {
  await page.getByLabel(f.name, { exact: false }).first().fill("Rado Rakoto");
  await page.getByLabel(f.structure, { exact: false }).fill("FC Test");
  await page.getByLabel(f.email, { exact: false }).fill("rado@exemple.mg");
  if (message) await page.getByLabel(f.message, { exact: false }).fill(message);
  await page.getByRole("checkbox").check();
}

// Le formulaire ignore (en silence) un envoi dans les 2 premières secondes : les tests d'envoi attendent ce délai.
async function waitHuman(page: Page) {
  await page.waitForTimeout(2300);
}

const submit = (page: Page) => page.getByRole("button", { name: fr.common.send });

test.describe("Contact", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fr/contact");
    await page.waitForLoadState("networkidle");
  });

  test("un formulaire vide affiche les erreurs, annonce le résumé et ne part pas", async ({ page }) => {
    await submit(page).click();
    const summary = page.locator("p[role=alert]");
    await expect(summary).toHaveText(f.errorSummary);
    await expect(summary).toBeFocused();
    await expect(page.getByText(f.errorRequired)).toHaveCount(3); // nom, e-mail, message
    await expect(page.getByText(f.errorConsent)).toHaveCount(1);
    await expect(page.getByLabel(f.name, { exact: false }).first()).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("chaque erreur est reliée à son champ (aria-describedby)", async ({ page }) => {
    await submit(page).click();
    const email = page.getByLabel(f.email, { exact: false });
    const id = await email.getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    await expect(page.locator(`[id="${id}"]`)).toHaveText(f.errorRequired);
  });

  test("une adresse e-mail invalide est refusée", async ({ page }) => {
    await fillValid(page);
    await page.getByLabel(f.email, { exact: false }).fill("pas-un-mail");
    await submit(page).click();
    await expect(page.getByText(f.errorEmail)).toBeVisible();
    await expect(page.getByText(f.errorRequired)).toHaveCount(0);
  });

  test("le consentement est obligatoire", async ({ page }) => {
    await fillValid(page);
    await page.getByRole("checkbox").uncheck();
    await submit(page).click();
    await expect(page.getByText(f.errorConsent)).toBeVisible();
  });

  test("un texte trop long est refusé", async ({ page }) => {
    await fillValid(page);
    await page.getByLabel(f.name, { exact: false }).first().fill("a".repeat(110));
    await submit(page).click();
    await expect(page.getByText(f.errorTooLong)).toBeVisible();
  });

  test("une demande valide est envoyée : message de confirmation annoncé", async ({ page }) => {
    const w = watch(page);
    await fillValid(page);
    await waitHuman(page);
    await submit(page).click();
    const ok = page.getByRole("status");
    await expect(ok).toHaveText(f.success);
    await expect(ok).toBeFocused();
    await expect(page.locator("form")).toHaveCount(0);
    expect(w.problems).toEqual([]);
  });

  test("le champ-piège rempli : confirmation affichée mais rien n'est envoyé", async ({ page }) => {
    await fillValid(page);
    await page.locator('input[name="hp_note"]').evaluate((el: HTMLInputElement) => (el.value = "http://spam.example"));
    await waitHuman(page);
    await submit(page).click();
    await expect(page.getByRole("status")).toHaveText(f.success);
  });

  test("le champ-piège est invisible et hors de la navigation clavier", async ({ page }) => {
    const trap = page.locator('input[name="hp_note"]');
    await expect(trap).toHaveAttribute("tabindex", "-1");
    await expect(trap.locator("xpath=ancestor::div[@aria-hidden='true']")).toHaveCount(1);
    const box = await trap.boundingBox();
    expect(box === null || box.x < 0).toBe(true);
  });

  test("le message est obligatoire sur Contact et le champ le dit (pas de « facultatif »)", async ({ page }) => {
    await expect(page.locator("label", { hasText: f.message })).not.toContainText(f.optional);
    await expect(page.locator("label", { hasText: f.structure })).toContainText(f.optional);
  });

  test("le formulaire se remplit et s'envoie au clavier", async ({ page }) => {
    await page.getByLabel(f.name, { exact: false }).first().focus();
    await page.keyboard.type("Rado Rakoto");
    await page.keyboard.press("Tab");
    await page.keyboard.type("FC Test");
    await page.keyboard.press("Tab");
    await page.keyboard.type("rado@exemple.mg");
    await page.keyboard.press("Tab");
    await page.keyboard.type("Bonjour");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space"); // coche le consentement
    await expect(page.getByRole("checkbox")).toBeChecked();
    await waitHuman(page);
    await page.keyboard.press("Tab"); // lien « politique de confidentialité »
    await page.keyboard.press("Tab"); // bouton Envoyer
    await expect(submit(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toHaveText(f.success);
  });

  test("le lien de confidentialité mène à la bonne page", async ({ page }) => {
    await page.getByRole("link", { name: f.consentLink }).click();
    await expect(page).toHaveURL(/\/fr\/confidentialite$/);
  });

  test("les coordonnées affichées correspondent à celles du site", async ({ page }) => {
    await expect(page.getByRole("link", { name: /efanamby2025@gmail\.com/ })).toHaveAttribute("href", "mailto:efanamby2025@gmail.com");
    await expect(page.locator('a[href^="https://wa.me/261347715508"]')).not.toHaveCount(0);
  });
});

test.describe("Essai gratuit / démo", () => {
  test("par défaut, l'onglet « Essai gratuit » est choisi et le message est facultatif", async ({ page }) => {
    await page.goto("/fr/essai-gratuit");
    await expect(page.getByRole("radio", { name: fr.trial.tabTrial })).toBeChecked();
    await expect(page.locator('input[name="kind"]')).toHaveValue("trial");
    await expect(page.locator("label", { hasText: f.message })).toContainText(f.optional);
  });

  test("?formule=demo présélectionne la démo", async ({ page }) => {
    await page.goto("/fr/essai-gratuit?formule=demo");
    await expect(page.getByRole("radio", { name: fr.trial.tabDemo })).toBeChecked();
    await expect(page.locator('input[name="kind"]')).toHaveValue("demo");
  });

  test("changer d'onglet change le type de demande", async ({ page }) => {
    await page.goto("/fr/essai-gratuit");
    const tab = (name: string) => page.locator("fieldset label", { hasText: name });
    await tab(fr.trial.tabDemo).click();
    await expect(page.locator('input[name="kind"]')).toHaveValue("demo");
    await tab(fr.trial.tabTrial).click();
    await expect(page.locator('input[name="kind"]')).toHaveValue("trial");
  });

  test("les onglets se choisissent aux flèches du clavier", async ({ page }) => {
    await page.goto("/fr/essai-gratuit");
    await page.getByRole("radio", { name: fr.trial.tabTrial }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: fr.trial.tabDemo })).toBeChecked();
  });

  test("sans message, une demande d'essai valide est envoyée, et la confirmation par e-mail est annoncée", async ({ page }) => {
    await page.goto("/fr/essai-gratuit");
    await page.waitForLoadState("networkidle");
    await fillValid(page, { message: "" });
    await waitHuman(page);
    await submit(page).click();
    const status = page.getByRole("status");
    await expect(status).toContainText(f.success);
    await expect(status).toContainText(f.successConfirmation);
  });

  test("une demande de démo reçoit aussi la confirmation par e-mail", async ({ page }) => {
    await page.goto("/fr/essai-gratuit?formule=demo");
    await page.waitForLoadState("networkidle");
    await fillValid(page, { message: "" });
    await waitHuman(page);
    await submit(page).click();
    await expect(page.getByRole("status")).toContainText(f.successConfirmation);
  });

  test("les erreurs gardent les valeurs déjà saisies", async ({ page }) => {
    await page.goto("/fr/essai-gratuit");
    await page.getByLabel(f.name, { exact: false }).first().fill("Rado Rakoto");
    await submit(page).click();
    await expect(page.getByLabel(f.name, { exact: false }).first()).toHaveValue("Rado Rakoto");
    await expect(page.getByText(f.errorRequired)).toHaveCount(1); // e-mail seul : le message est facultatif ici
  });
});

test.describe("Formulaire traduit", () => {
  test("anglais : libellés et erreurs en anglais", async ({ page }) => {
    await page.goto("/en/contact");
    await page.getByRole("button", { name: en.common.send }).click();
    await expect(page.locator("p[role=alert]")).toHaveText(en.form.errorSummary);
    await expect(page.getByText(en.form.errorConsent)).toBeVisible();
  });
});

test.describe("Mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("le formulaire reste utilisable à 390 px : champs complets dans l'écran, envoi possible", async ({ page }) => {
    await page.goto("/fr/contact");
    await page.waitForLoadState("networkidle");
    for (const label of [f.name, f.email, f.message]) {
      const box = await page.getByLabel(label, { exact: false }).first().boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
    await fillValid(page);
    await waitHuman(page);
    await submit(page).click();
    await expect(page.getByRole("status")).toHaveText(f.success);
  });
});
