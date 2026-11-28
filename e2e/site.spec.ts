import { expect, test } from "@playwright/test";
import { fr } from "../src/i18n/messages/fr";
import { en } from "../src/i18n/messages/en";
import { IMG } from "../src/lib/images";
import { PAGES } from "../src/lib/site";
import { ALL_LOCALES, ALL_PAGES, MAIN_PAGES, expectNoHorizontalOverflow, pixelsAt, scrollThrough, watch } from "./helpers";

// Largeurs d'écran contrôlées (décision du 18/11) : iPhone 15 (393), Galaxy S24 Ultra (412), iPhone XR (414), petits téléphones (320, 360, 375, 390),
// grands téléphones (430), tablettes (600 à 1180), ordinateurs (1280 à 1920).
const DEVICE_WIDTHS = [320, 360, 375, 390, 393, 412, 414, 430, 600, 768, 820, 1024, 1180, 1280, 1440, 1920];

// ───────────────────────────── Chaque page × chaque langue ─────────────────────────────
for (const lang of ALL_LOCALES) {
  for (const [, suffix] of ALL_PAGES) {
    const url = `/${lang}${suffix}`;

    test.describe(`${url}`, () => {
      test("répond 200, structure correcte, aucune erreur", async ({ page }) => {
        const w = watch(page);
        const res = await page.goto(url);
        expect(res?.status()).toBe(200);
        await page.waitForLoadState("networkidle");

        await expect(page.locator("html")).toHaveAttribute("lang", lang);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator("h1")).not.toBeEmpty();
        expect((await page.title()).length).toBeGreaterThan(3);
        await expect(page.locator("main#contenu")).toHaveCount(1);
        await expect(page.locator("header")).toHaveCount(1);
        await expect(page.locator("footer")).toHaveCount(1);
        // Pas de saut de niveau dans les titres (h1 → h2 → h3).
        const levels = await page.$$eval("h1,h2,h3,h4", (els) => els.map((e) => Number(e.tagName[1])));
        levels.reduce((prev, cur) => {
          expect(cur - prev, `saut de titre h${prev} → h${cur}`).toBeLessThanOrEqual(1);
          return cur;
        }, 0);
        expect(w.problems).toEqual([]);
      });

      test("aucun défilement horizontal de 320 à 1920 px (iPhone 15 = 393, Galaxy S24 Ultra = 412, iPhone XR = 414)", async ({ page }) => {
        await page.goto(url);
        await scrollThrough(page);
        for (const width of DEVICE_WIDTHS) {
          await page.setViewportSize({ width, height: width < 700 ? 850 : 900 });
          await expectNoHorizontalOverflow(page);
        }
      });

      for (const width of [390, 1280]) {
        test(`pas de défilement horizontal à ${width}px, images chargées avec un texte alternatif`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(url);
          await scrollThrough(page);
          await expectNoHorizontalOverflow(page);

          const imgs = await page.$$eval("img", (els) => els.map((e) => ({ src: e.currentSrc || e.src, alt: e.getAttribute("alt"), ok: e.complete && e.naturalWidth > 0, hidden: e.offsetParent === null && getComputedStyle(e).position !== "fixed" })));
          for (const i of imgs) {
            expect(i.alt, `alt manquant : ${i.src}`).not.toBeNull();
            if (!i.hidden) expect(i.ok, `image non chargée : ${i.src}`).toBe(true);
          }
        });
      }
    });
  }
}

// ───────────────────────────── Liens internes ─────────────────────────────
for (const lang of ALL_LOCALES) {
  test(`liens internes de /${lang} : tous répondent 200`, async ({ page, request }) => {
    const hrefs = new Set<string>();
    for (const [, suffix] of ALL_PAGES) {
      await page.goto(`/${lang}${suffix}`);
      for (const h of await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""))) {
        if (h.startsWith("/") && !h.startsWith("//")) hrefs.add(h.split("#")[0]);
      }
    }
    expect(hrefs.size).toBeGreaterThan(8);
    for (const h of hrefs) {
      const r = await request.get(h);
      expect(r.status(), `lien cassé : ${h}`).toBe(200);
      // Un lien interne reste dans la langue courante.
      if (h && !/\.(svg|png|ico|webp|xml|txt)$/.test(h)) expect(h.startsWith(`/${lang}`), `lien hors langue : ${h}`).toBe(true);
    }
  });

  test(`liens externes de /${lang} : ouverture sécurisée`, async ({ page }) => {
    await page.goto(`/${lang}`);
    const bad = await page.$$eval("a[target=_blank]", (as) => as.filter((a) => !/noopener/.test(a.getAttribute("rel") ?? "")).map((a) => a.getAttribute("href")));
    expect(bad).toEqual([]);
  });
}

// ───────────────────────────── Navigation ─────────────────────────────
test.describe("navigation (bureau)", () => {
  test("le menu mène à chaque page et marque la page courante", async ({ page }) => {
    await page.goto("/fr");
    const nav = page.getByRole("navigation", { name: fr.nav.label });
    const targets: [string, string][] = [
      [fr.nav.features, PAGES.features],
      [fr.nav.pricing, PAGES.pricing],
      [fr.nav.references, PAGES.references],
      [fr.nav.contact, PAGES.contact],
      [fr.nav.home, PAGES.home],
    ];
    for (const [label, suffix] of targets) {
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/fr${suffix}/?$`));
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
      await expect(nav.locator("[aria-current=page]")).toHaveCount(1);
    }
  });

  test("« Essai gratuit » (en-tête et accueil) ouvre le formulaire d'essai ; « Voir une démo » présélectionne la démo", async ({ page }) => {
    await page.goto("/fr");
    await page.getByRole("link", { name: fr.common.demo }).first().click();
    await expect(page).toHaveURL(/\/fr\/essai-gratuit\?formule=demo$/);
    await expect(page.getByRole("radio", { name: fr.trial.tabDemo })).toBeChecked();
  });

  test("aucun lien « Se connecter » sur le site vitrine (en-tête ni menu mobile), dans les quatre langues", async ({ page }) => {
    const labels = ["Se connecter", "Log in", "Hiditra", "Iniciar sesión"];
    for (const [lang, label] of [["fr", labels[0]], ["en", labels[1]], ["mg", labels[2]], ["es", labels[3]]]) {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${lang}`);
      await expect(page.getByRole("link", { name: label, exact: true }), `${lang} bureau`).toHaveCount(0);
      await expect(page.locator('a[href*="run.place"]'), `${lang} bureau`).toHaveCount(0);
      await page.setViewportSize({ width: 390, height: 800 });
      await page.locator('button[aria-controls="menu-mobile"]').click();
      await expect(page.locator("#menu-mobile"), `${lang} mobile : menu ouvert`).toBeVisible();
      await expect(page.getByRole("link", { name: label, exact: true }), `${lang} mobile`).toHaveCount(0);
    }
  });

  test("menu mobile : « Essai gratuit » ouvre la page et ferme le menu, comme les autres liens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    for (const lang of ["fr", "en"]) {
      await page.goto(`/${lang}`);
      await page.getByRole("button", { name: fr.nav.openMenu }).or(page.locator('button[aria-controls="menu-mobile"]')).first().click();
      const menu = page.locator("#menu-mobile");
      await expect(menu).toBeVisible();
      await menu.getByRole("link", { name: /essai gratuit|free trial/i }).click();
      await expect(page, lang).toHaveURL(new RegExp(`/${lang}/essai-gratuit$`));
      await expect(menu, `${lang} : menu fermé après « Essai gratuit »`).toHaveCount(0);
    }
  });

  test("mobile : les deux boutons de l'accueil et « Envoyer » du formulaire de contact remplissent la largeur", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/fr");
    const hero = page.locator("main section").first();
    const boxes = await hero.locator("a.t-button, a[class*='cut-br']").evaluateAll((els) =>
      els.slice(0, 2).map((e) => {
        const r = e.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      }),
    );
    expect(boxes).toHaveLength(2);
    for (const b of boxes) {
      expect(b.w, "bouton de l'accueil : pleine largeur du contenu (390 − 2 × 24)").toBeGreaterThanOrEqual(330);
      expect(b.h, "bouton de l'accueil : hauteur du modèle (≈ 60 px)").toBeGreaterThanOrEqual(58);
    }

    await page.goto("/fr/contact");
    const form = page.locator("form").first();
    const send = form.getByRole("button", { name: fr.common.send });
    const sendBox = (await send.boundingBox())!;
    const fieldBox = (await form.getByLabel(fr.form.email, { exact: false }).boundingBox())!;
    // Le bouton garde le léger retrait de 8 px du modèle (identique à « Essai gratuit ») : il remplit tout le reste de la largeur.
    expect(fieldBox.width - sendBox.width, "« Envoyer » : remplit la largeur du formulaire").toBeLessThanOrEqual(10);

    await page.goto("/fr/essai-gratuit");
    const trialSend = (await page.locator("form").first().getByRole("button", { name: fr.common.send }).boundingBox())!;
    expect(Math.abs(sendBox.width - trialSend.width), "« Envoyer » (Contact) : même largeur que « Envoyer » d'Essai gratuit").toBeLessThanOrEqual(2);
  });

  test("le lien d'évitement mène au contenu", async ({ page }) => {
    await page.goto("/fr/tarifs");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: fr.common.skip });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#contenu$/);
  });

  test("le sélecteur de langue conserve la page courante", async ({ page }) => {
    await page.goto("/fr/tarifs");
    await page.getByRole("button", { name: new RegExp(fr.nav.language) }).click();
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/tarifs$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("navigation", { name: en.nav.label })).toBeVisible();
  });

  test("le sélecteur de langue se ferme avec Échap", async ({ page }) => {
    await page.goto("/fr");
    const button = page.getByRole("button", { name: new RegExp(fr.nav.language) });
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("navigation (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("le menu burger s'ouvre, mène à une page et se referme", async ({ page }) => {
    await page.goto("/fr");
    const open = page.getByRole("button", { name: fr.nav.openMenu });
    await open.click();
    const menu = page.locator("#menu-mobile");
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: fr.nav.pricing, exact: true }).click();
    await expect(page).toHaveURL(/\/fr\/tarifs$/);
    await expect(menu).toHaveCount(0);
  });

  test("Échap referme le menu et le défilement de la page est rendu", async ({ page }) => {
    await page.goto("/fr");
    await page.getByRole("button", { name: fr.nav.openMenu }).click();
    await page.keyboard.press("Escape");
    await expect(page.locator("#menu-mobile")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  });

  test("les langues sont proposées dans le menu", async ({ page }) => {
    await page.goto("/fr/contact");
    await page.getByRole("button", { name: fr.nav.openMenu }).click();
    await page.locator("#menu-mobile").getByRole("link", { name: "Español" }).click();
    await expect(page).toHaveURL(/\/es\/contact$/);
  });

  test("menu mobile : langues en initiales (Fr En Mg Es), sur une seule ligne, zones tactiles de 44 px", async ({ page }) => {
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/fr");
      await page.getByRole("button", { name: fr.nav.openMenu }).click();
      const links = page.locator("#menu-mobile a[hreflang]");
      await expect(links, `largeur ${width}`).toHaveCount(4);
      const texts = await links.evaluateAll((els) => els.map((e) => e.querySelector("[aria-hidden]")?.textContent));
      expect(texts).toEqual(["Fr", "En", "Mg", "Es"]);
      const boxes = (await Promise.all([0, 1, 2, 3].map((i) => links.nth(i).boundingBox()))).map((b) => b!);
      for (const b of boxes) {
        expect(Math.abs(b.y - boxes[0].y), `une seule ligne à ${width} px`).toBeLessThan(1);
        expect(b.width).toBeGreaterThanOrEqual(44);
        expect(b.height).toBeGreaterThanOrEqual(44);
      }
      expect(boxes[3].x + boxes[3].width, `pas de débordement à ${width} px`).toBeLessThanOrEqual(width - 16);
      // Le nom complet reste celui que lit un lecteur d'écran.
      await expect(links.nth(2)).toHaveAccessibleName("Malagasy");
    }
  });
});

// ───────────────────────────── En-tête fixe ─────────────────────────────
// Retour iPhone du 20/11 : sous le pied de page, Safari montrait une bande claire sur toutes les pages sauf Contact.
// Cause : <html> n'avait pas de fond propre et prenait celui de <body> (menthe). Désormais <html> est marine partout.
test.describe("fond sous le pied de page (aucune bande claire après le footer)", () => {
  const NAVY = "rgb(6, 6, 45)";
  const suffixes = [...MAIN_PAGES.map(([, s]) => s), PAGES.legal, "/page-qui-n-existe-pas"];

  for (const [width, height] of [[390, 844], [1280, 900]] as const) {
    test(`le fond de la page est marine et le pied de page termine le document, sur toutes les pages (${width} px)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      for (const lang of ["fr", "en", "mg", "es"]) {
        for (const s of suffixes) {
          await page.goto(`/${lang}${s}`, { waitUntil: "domcontentloaded" });
          const r = await page.evaluate(() => {
            const f = document.querySelector("footer")!.getBoundingClientRect();
            return {
              canvas: getComputedStyle(document.documentElement).backgroundColor,
              // Safari sur iPhone prolonge la couleur du <body> sous le pied de page et sous la barre d'outils flottante : elle doit être marine.
              body: getComputedStyle(document.body).backgroundColor,
              footerBottom: Math.round(f.bottom + window.scrollY),
              docHeight: document.documentElement.scrollHeight,
            };
          });
          expect(r.canvas, `/${lang}${s}`).toBe(NAVY);
          expect(r.body, `/${lang}${s} : le <body> doit être marine (Safari iPhone)`).toBe(NAVY);
          expect(Math.abs(r.footerBottom - r.docHeight), `/${lang}${s} : quelque chose dépasse sous le pied de page`).toBeLessThanOrEqual(1);
        }
      }
    });
  }

  test("page 404 sur un grand écran : le bloc marine rejoint le pied de page, sans bande menthe entre les deux", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1400 });
    await page.goto("/fr/page-qui-n-existe-pas");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const r = await page.evaluate(() => {
      const block = document.querySelector("main > div")!.getBoundingClientRect();
      const footer = document.querySelector("footer")!.getBoundingClientRect();
      return { blockBottom: Math.round(block.bottom), footerTop: Math.round(footer.top), body: getComputedStyle(document.body).backgroundColor };
    });
    expect(Math.abs(r.blockBottom - r.footerTop)).toBeLessThanOrEqual(1);
    expect(r.body).toBe(NAVY);
  });

  test("les pages claires gardent un pied de page dont les coins arrondis se détachent sur la menthe (enveloppe .page-body)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const s of ["", PAGES.references, PAGES.features]) {
      await page.goto(`/fr${s}`, { waitUntil: "domcontentloaded" });
      const r = await page.evaluate(() => ({
        body: getComputedStyle(document.body).backgroundColor,
        wrap: getComputedStyle(document.querySelector(".page-body")!).backgroundColor,
      }));
      expect(r.wrap, `/fr${s}`).toBe("rgb(235, 255, 247)");
      expect(r.body, `/fr${s}`).toBe(NAVY);
    }
  });

  test("les pages qui finissent en marine (contact, essai gratuit, 404) n'ont aucune menthe derrière le pied de page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const s of [PAGES.contact, PAGES.trial, "/page-qui-n-existe-pas"]) {
      await page.goto(`/fr${s}`, { waitUntil: "domcontentloaded" });
      const wrap = await page.evaluate(() => getComputedStyle(document.querySelector(".page-body")!).backgroundColor);
      expect(wrap, `/fr${s}`).toBe(NAVY);
    }
  });
});

test.describe("en-tête fixe (reste en haut pendant le défilement)", () => {
  const scrollToBottom = (page: import("@playwright/test").Page) =>
    page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.documentElement.scrollHeight);
    });

  for (const [name, viewport] of [["bureau 1280 px", { width: 1280, height: 800 }], ["mobile 390 px", { width: 390, height: 844 }]] as const) {
    test(`l'en-tête reste collé en haut, au-dessus du contenu (${name})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      for (const url of ["/fr", "/fr/tarifs", "/fr/references", "/fr/contact"]) {
        await page.goto(url);
        await scrollToBottom(page);
        // Depuis le 27/11 la page Contact tient presque dans l'écran d'un ordinateur : elle ne défile plus que de quelques dizaines de pixels.
        const minScroll = url.endsWith("/contact") && viewport.width >= 1024 ? 20 : 100;
        await expect.poll(() => page.evaluate(() => window.scrollY), { message: `défilement de ${url}` }).toBeGreaterThan(minScroll);
        const box = (await page.locator("header").boundingBox())!;
        expect(box.y, `${url} : en-tête en haut de l'écran`).toBeCloseTo(0, 0);
        expect(box.height).toBeCloseTo(76, 0);
        // Il passe au-dessus du contenu : au point (milieu, 10 px), c'est bien l'en-tête qu'on touche.
        const onTop = await page.evaluate((w) => !!document.elementFromPoint(w / 2, 10)?.closest("header"), viewport.width);
        expect(onTop, `${url} : l'en-tête est au-dessus du contenu`).toBe(true);
      }
    });
  }

  test("mobile : le menu burger reste accessible et s'ouvre sous l'en-tête, même en bas de page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/fr/tarifs");
    await scrollToBottom(page);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    await page.getByRole("button", { name: fr.nav.openMenu }).click();
    const panel = (await page.locator("#menu-mobile").boundingBox())!;
    expect(panel.y).toBeCloseTo(76, 0);
    expect(panel.y + panel.height).toBeCloseTo(844, 0);
    // L'en-tête (avec la croix de fermeture) reste visible au-dessus du panneau.
    await page.getByRole("button", { name: fr.nav.closeMenu }).click();
    await expect(page.locator("#menu-mobile")).toHaveCount(0);
  });

  test("le lien d'évitement ne cache pas le contenu sous l'en-tête fixe", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/fr/tarifs");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#contenu$/);
    await expect.poll(async () => (await page.locator("#contenu").boundingBox())!.y).toBeGreaterThanOrEqual(70);
  });
});

// ───────────────────────────── Contenu clé ─────────────────────────────
test.describe("contenu (français)", () => {
  test("Tarifs : les quatre prix de la maquette et le tableau comparatif", async ({ page }) => {
    await page.goto("/fr/tarifs");
    const body = page.locator("main");
    await expect(body).toContainText("150.000 Ar");
    await expect(body).toContainText("300.000 Ar");
    await expect(body).toContainText("225.000 Ar");
    await expect(page.locator("table")).toHaveCount(1);
    await expect(page.locator("table caption, table th[scope]").first()).toBeAttached();
  });

  test("Références : quatre cas et une FAQ, sans section témoignage (retirée sur décision du chef, 23/11)", async ({ page }) => {
    for (const lang of ALL_LOCALES) {
      await page.goto(`/${lang}/references`);
      await expect(page.locator("details")).not.toHaveCount(0);
      await expect(page.locator("main article")).toHaveCount(4);
      await expect(page.locator("blockquote")).toHaveCount(0);
      await expect(page.locator("main figure")).toHaveCount(0);
      expect(await page.locator("main").innerText()).not.toMatch(/Lalaina/);
    }
  });

  test("Références : après les cartes de cas, la FAQ suit avec une vraie respiration (ni collée, ni trou)", async ({ page }) => {
    for (const width of [1440, 820, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/fr/references");
      // Bas de la grille des cas (cartes + photo du tableau tactique, qui passe sous les cartes sur tablette).
      const cards = await page.locator("main section.sheet > .wrap").first().evaluate((e) => e.getBoundingClientRect().bottom + window.scrollY);
      const faqTop = await page.locator("#faq h2").evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
      expect(faqTop - cards, `${width} px`).toBeGreaterThan(80);
      expect(faqTop - cards, `${width} px`).toBeLessThan(230);
    }
  });

  test("Références : POESAM 2026 = finaliste (pas de présence à la cérémonie), et le cas « CFFA vs COSFA » ne laisse pas croire à un contrat", async ({ page }) => {
    await page.goto("/fr/references");
    const text = await page.locator("main").innerText();
    expect(text).toMatch(/finaliste/i);
    expect(text).not.toMatch(/pr[ée]sence|pr[ée]sents? (à|lors)/i);
    expect(text).toContain("CFFA vs COSFA");
    expect(text).not.toMatch(/CFFA\s*[-–]\s*PFL/);
  });

  test("Accueil : le slogan est dans le pied de page", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.locator("footer")).toContainText(fr.meta.slogan.replace(/\.$/, ""));
  });
});

// ───────────────────────────── FAQ ─────────────────────────────
test.describe("FAQ", () => {
  for (const [url, name] of [["/fr/references", "faq-references"], ["/fr/tarifs", "faq-tarifs"]] as const) {
    test(`${url} : fermée au départ, une seule question ouverte à la fois, un second clic referme`, async ({ page }) => {
      await page.goto(url);
      const items = page.locator(`details[name="${name}"]`);
      expect(await items.count()).toBeGreaterThan(2);
      // Au départ : seules les questions sont visibles.
      for (let i = 0; i < (await items.count()); i++) await expect(items.nth(i)).not.toHaveAttribute("open", "");
      await items.nth(0).locator("summary").click();
      await expect(items.nth(0)).toHaveAttribute("open", "");
      await items.nth(1).locator("summary").click();
      await expect(items.nth(1)).toHaveAttribute("open", "");
      await expect(items.nth(0)).not.toHaveAttribute("open", "");
      // Un second clic sur la question ouverte ne laisse que la question.
      await items.nth(1).locator("summary").click();
      await expect(items.nth(1)).not.toHaveAttribute("open", "");
      // Clavier : Entrée ouvre la question, puis la referme.
      await items.nth(2).locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(items.nth(2)).toHaveAttribute("open", "");
      await page.keyboard.press("Enter");
      await expect(items.nth(2)).not.toHaveAttribute("open", "");
    });
  }

  test("Références : les cinq réponses sont rédigées (rien à rédiger), délai d'analyse de 6h40 et 24h", async ({ page }) => {
    await page.goto("/fr/references");
    await expect(page.locator("details")).toHaveCount(5);
    await expect(page.getByText("[À rédiger avec l'équipe e-Fanamby]")).toHaveCount(0);
    await page.getByText("Combien de temps pour le rapport ?").click();
    await expect(page.getByText(/6h40 à analyser.*24h au plus tôt/)).toBeVisible();
    await page.getByText("Domicile ou extérieur ?").click();
    await expect(page.getByText("L'équipe à domicile et celle à l'extérieur sont à configurer avant le match.")).toBeVisible();
  });
});

// ───────────────────────────── Cartes tarifs ─────────────────────────────
test.describe("Tarifs : les quatre cartes", () => {
  for (const width of [1440, 1280, 1024, 768, 390]) {
    test(`même largeur et même hauteur à ${width} px, sans contour coloré au repos`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/fr/tarifs");
      const cards = page.locator("li.group");
      await expect(cards).toHaveCount(4);
      const boxes = await cards.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; }));
      for (const b of boxes) {
        expect(Math.abs(b.w - boxes[0].w)).toBeLessThanOrEqual(1);
        expect(Math.abs(b.h - boxes[0].h)).toBeLessThanOrEqual(1);
      }
      for (let i = 0; i < 4; i++) {
        await expect(cards.nth(i)).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
      }
    });
  }

  test("le contour violet n'apparaît qu'au survol ou au focus clavier de la carte", async ({ page }) => {
    await page.goto("/fr/tarifs");
    const cards = page.locator("li.group");
    await cards.nth(1).hover();
    await expect(cards.nth(1)).toHaveCSS("border-top-color", "rgb(65, 26, 255)");
    await expect(cards.nth(0)).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
    await page.mouse.move(0, 0);
    await expect(cards.nth(1)).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
    await cards.nth(2).getByRole("link").first().focus();
    await expect(cards.nth(2)).toHaveCSS("border-top-color", "rgb(65, 26, 255)");
  });
});

// ───────────────────────────── Mise en page mobile ─────────────────────────────
test.describe("mise en page mobile (390 px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Accueil : analyse, préparation, image, montage, puis « Rien en temps réel »", async ({ page }) => {
    await page.goto("/fr");
    const items = page.locator("ul.grid-cols-4 > li");
    await expect(items).toHaveCount(5);
    const tops = await items.evaluateAll((els) => els.map((e) => ({ text: (e.textContent ?? "").replace(/\s+/g, " ").trim(), top: e.getBoundingClientRect().top + window.scrollY, hidden: e.getAttribute("aria-hidden") === "true" })));
    const ordered = [...tops].sort((a, b) => a.top - b.top);
    const [p0, p1] = fr.home.problems;
    const flat = (v: string) => v.replace(/\s+/g, " ").trim();
    expect(ordered.map((o) => (o.hidden ? "image" : o.text))).toEqual([flat(p0), flat(p1), "image", flat(fr.home.problems[2]), flat(fr.home.problems[3])]);
  });

  test("Références : le texte précède l'image du héros, cas dans l'ordre ballon (Barea CAN 2027), trophée (CFFA), flèches, coureur", async ({ page }) => {
    await page.goto("/fr/references");
    const h1 = await page.locator("h1").boundingBox();
    const hero = await page.locator("main section").first().locator("img").first().boundingBox();
    expect(h1).not.toBeNull();
    expect(hero).not.toBeNull();
    expect(hero!.y).toBeGreaterThan(h1!.y + h1!.height);
    expect(hero!.width).toBeGreaterThan(300);

    const cases = page.locator("main article");
    await expect(cases).toHaveCount(4);
    const order = await cases.evaluateAll((els) => els.map((e) => ({ title: e.querySelector("h3")?.textContent ?? "", top: e.getBoundingClientRect().top + window.scrollY })).sort((a, b) => a.top - b.top).map((x) => x.title));
    expect(order).toEqual([fr.references.cases[0].title, fr.references.cases[1].title, fr.references.cases[3].title, fr.references.cases[2].title]);

    // La photo du tableau tactique est masquée sur mobile.
    const tactical = page.locator(`main img[alt="${fr.alt.tacticalBoard}"]`);
    if ((await tactical.count()) > 0) await expect(tactical.first()).toBeHidden();
  });

  test("Fonctionnalités : l'image du héros est grande et ne déborde pas de l'écran", async ({ page }) => {
    await page.goto("/fr/fonctionnalites");
    await expectNoHorizontalOverflow(page);
    const img = await page.locator("main section").first().locator("img[alt]").last().boundingBox();
    expect(img).not.toBeNull();
    expect(img!.width).toBeGreaterThan(390);
  });

  test("Formulaire : un halo vert apparaît autour du champ en cours de saisie", async ({ page }) => {
    await page.goto("/fr/essai-gratuit");
    const field = page.locator("form input[name=\"name\"]");
    await field.focus();
    // Le halo apparaît en fondu (200 ms) : on attend la fin de la transition.
    const wrapper = field.locator("xpath=..");
    await expect(wrapper).toHaveCSS("box-shadow", /rgba\(47, 222, 151, 0\.3\)/);
  });
});

// ───────────────────────────── Pages d'erreur ─────────────────────────────
test.describe("zones tactiles et lisibilité sur mobile", () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test("pied de page, coordonnées de Contact et liens texte : au moins 32 px de haut", async ({ page }) => {
    for (const [url, selector] of [
      ["/fr", "footer a:not([aria-label]), main a.t-link"],
      ["/fr/contact", "main ul a[href]"],
      ["/fr/tarifs", 'main a[href$="#faq"]'],
    ] as const) {
      await page.goto(url);
      const small = await page.$$eval(selector, (els) => els.map((e) => ({ t: (e.textContent ?? "").trim().slice(0, 30), h: Math.round(e.getBoundingClientRect().height) })).filter((x) => x.h < 32));
      expect(small, `${url} : cibles trop basses`).toEqual([]);
    }
  });
});

test.describe("Tarifs : lisibilité du texte des cartes", () => {
  for (const [width, size] of [[1440, "10px"], [1280, "10px"], [1279, "13px"], [1024, "13px"], [768, "13px"], [393, "13px"]] as const) {
    test(`texte des listes à ${size} à ${width} px (10 px de la maquette seulement à partir de 1280 px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/fr/tarifs");
      await expect(page.locator("main ul li ul li").first()).toHaveCSS("font-size", size);
    });
  }
});

test.describe("animations légères", () => {
  const stats = (page: import("@playwright/test").Page) => page.locator("main ul li p:has(.count-up)");

  test("les blocs sous la ligne de flottaison apparaissent au défilement, aucun ne reste caché, la page ne change pas de hauteur", async ({ page }) => {
    await page.goto("/fr/fonctionnalites");
    await page.waitForLoadState("networkidle");
    await expect.poll(() => page.locator('[data-reveal-state="hidden"]').count()).toBeGreaterThan(0);
    const before = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
    });
    await expect(page.locator('[data-reveal-state="hidden"]')).toHaveCount(0);
    // Une fois l'animation finie, l'état est retiré : l'élément retrouve ses propres transitions.
    await expect(page.locator("[data-reveal-state]")).toHaveCount(0, { timeout: 5000 });
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(before);
    await expectNoHorizontalOverflow(page);
  });

  test("les blocs déjà visibles au chargement ne sont pas animés (pas de clignotement en haut de page)", async ({ page }) => {
    await page.goto("/fr/tarifs");
    await page.waitForLoadState("networkidle");
    // Les quatre cartes de prix sont dans l'écran à 1280×900 : jamais cachées.
    await expect(page.locator('main li[data-reveal]:has-text("Essai gratuit")').first()).not.toHaveAttribute("data-reveal-state", /.+/);
  });

  test("compteurs : le chiffre final est « 8 » et « +165 » sur Références", async ({ page }) => {
    await page.goto("/fr/references");
    await expect(stats(page).nth(0)).toHaveText(fr.references.stats[0].value, { timeout: 5000 });
    await expect(stats(page).nth(1)).toHaveText(fr.references.stats[1].value, { timeout: 5000 });
  });

  test.describe("mouvement réduit", () => {
    test.use({ reducedMotion: "reduce" });
    test("rien n'est caché ni animé, les chiffres sont là tout de suite", async ({ page }) => {
      await page.goto("/fr/references");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("[data-reveal-state]")).toHaveCount(0);
      await expect(stats(page).nth(1)).toHaveText(fr.references.stats[1].value);
      await expect(stats(page).nth(1).locator(".count-up")).toHaveCSS("opacity", "1");
    });
  });

  test.describe("sans JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    test("tout le contenu est visible, les chiffres apparaissent d'eux-mêmes", async ({ page }) => {
      await page.goto("/fr/references");
      await expect(page.locator("[data-reveal-state]")).toHaveCount(0);
      await expect(stats(page).nth(1)).toHaveText(fr.references.stats[1].value);
      await expect(stats(page).nth(1).locator(".count-up")).toHaveCSS("opacity", "1", { timeout: 4000 });
    });
  });
});

test.describe("404", () => {
  test("adresse inconnue dans une langue : 404 dans cette langue, avec lien de retour", async ({ page }) => {
    const res = await page.goto("/fr/page-inexistante");
    expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText(fr.notFound.title);
    await expect(page.getByRole("link", { name: fr.common.backHome })).toHaveAttribute("href", "/fr");
    await expect(page.locator("header")).toHaveCount(1);
  });

  test("la 404 est traduite", async ({ page }) => {
    const res = await page.goto("/en/nothing-here/deeper");
    expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText(en.notFound.title);
  });

  test("langue inconnue : 404", async ({ page }) => {
    const res = await page.goto("/zz/tarifs", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(404);
  });
});

// ───────────────────────────── Langue du navigateur ─────────────────────────────
test.describe("redirection de la racine", () => {
  // « locale » règle la langue du navigateur (en-tête Accept-Language des requêtes).
  for (const [locale, expected] of [["es-ES", "es"], ["mg-MG", "mg"], ["de-DE", "fr"], ["en-US", "en"], ["fr-FR", "fr"]] as const) {
    test(`navigateur en « ${locale} » → /${expected}`, async ({ browser }) => {
      const ctx = await browser.newContext({ locale });
      const page = await ctx.newPage();
      await page.goto("/");
      await expect(page).toHaveURL(new RegExp(`/${expected}$`));
      await ctx.close();
    });
  }

  test("une adresse sans langue garde son chemin : /tarifs → /fr/tarifs", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "de-DE" });
    const page = await ctx.newPage();
    await page.goto("/tarifs");
    await expect(page).toHaveURL(/\/fr\/tarifs$/);
    await ctx.close();
  });
});

// ───────────────────────────── Référencement ─────────────────────────────
test.describe("SEO (mode aperçu)", () => {
  test("adresse canonique, hreflang des quatre langues et x-default", async ({ page, baseURL }) => {
    await page.goto("/fr/tarifs");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${baseURL}/fr/tarifs`);
    const alt = await page.$$eval('link[rel="alternate"][hreflang]', (ls) => ls.map((l) => `${l.getAttribute("hreflang")}=${l.getAttribute("href")}`));
    expect(alt.sort()).toEqual(["fr", "en", "mg", "es"].map((l) => `${l}=${baseURL}/${l}/tarifs`).concat(`x-default=${baseURL}/fr/tarifs`).sort());
  });

  test("les quatre langues sont indexables (pas de noindex) ; l'anglais a sa propre adresse canonique", async ({ page, baseURL }) => {
    for (const lang of ["fr", "en", "mg", "es"]) {
      await page.goto(`/${lang}`);
      await expect(page.locator('meta[name="robots"]'), lang).toHaveCount(0);
    }
    await page.goto("/en/tarifs");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${baseURL}/en/tarifs`);
  });

  test("les pages juridiques (texte en attente) sont en noindex", async ({ page }) => {
    for (const s of [PAGES.legal, PAGES.terms, PAGES.privacy]) {
      await page.goto(`/fr${s}`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("titre, description et Open Graph sur les six pages", async ({ page }) => {
    for (const [, s] of MAIN_PAGES) {
      await page.goto(`/fr${s}`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{20,}/);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "fr_FR");
    }
    await page.goto("/fr/tarifs");
    expect(await page.title()).toBe(`${fr.seo.pricing.title} · e-Fanamby`);
    await page.goto("/fr");
    expect(await page.title()).toBe(fr.meta.homeTitle);
  });

  test("robots.txt bloque l'exploration en mode aperçu", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toMatch(/Disallow: \//);
    expect(body).not.toMatch(/Allow: \//);
  });

  test("sitemap.xml : les six pages dans chacune des quatre langues, sans pages juridiques", async ({ request, baseURL }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = ["fr", "en", "mg", "es"].flatMap((l) => MAIN_PAGES.map(([, s]) => `${baseURL}/${l}${s}`));
    expect(locs.sort()).toEqual(expected.sort());
    expect(xml).not.toMatch(/mentions-legales|cgu|confidentialite/);
  });

  test("icônes : favicon, apple-touch-icon et thème", async ({ page, request }) => {
    await page.goto("/fr");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#06062d");
    for (const sel of ['link[rel="icon"][type="image/svg+xml"]', 'link[rel="apple-touch-icon"]']) {
      const href = await page.locator(sel).first().getAttribute("href");
      expect((await request.get(href!)).status()).toBe(200);
    }
  });
});

// ───────────────────────────── Sécurité ─────────────────────────────
test("en-têtes de sécurité, sans signature du serveur", async ({ request }) => {
  const h = (await request.get("/fr")).headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("les images sont servies avec un cache long", async ({ request }) => {
  const r = await request.get(IMG.ball.src);
  expect(r.status()).toBe(200);
  expect(r.headers()["cache-control"]).toContain("immutable");
});

// ───────────────────────────── Accueil : lignes dépliables « football analytics » ─────────────────────────────
test.describe("Accueil : lignes « football analytics »", () => {
  test("fermées au départ, la flèche (le résumé) déplie le détail, une seule ouverte à la fois, clavier compris", async ({ page }) => {
    await page.goto("/fr");
    const items = page.locator('details[name="analytics"]');
    await expect(items).toHaveCount(3);
    for (let i = 0; i < 3; i++) await expect(items.nth(i)).not.toHaveAttribute("open", "");
    // Le texte de détail est celui du fichier de textes, et n'est visible qu'une fois la ligne ouverte.
    await expect(page.getByText(fr.home.analyticsItems[0].text)).toBeHidden();
    await items.nth(0).locator("summary").click();
    await expect(items.nth(0)).toHaveAttribute("open", "");
    await expect(page.getByText(fr.home.analyticsItems[0].text)).toBeVisible();
    await items.nth(1).locator("summary").click();
    await expect(items.nth(1)).toHaveAttribute("open", "");
    await expect(items.nth(0)).not.toHaveAttribute("open", "");
    // Clavier : Entrée referme la ligne ouverte.
    await items.nth(1).locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(items.nth(1)).not.toHaveAttribute("open", "");
  });
});

// ───────────────────────────── Accueil : lueur derrière les cartes ─────────────────────────────
test.describe("Accueil : lueur violette de la maquette", () => {
  // Couleur moyenne d'une zone de la page (captée puis lue dans une page vierge, pour ne pas dépendre de la politique de sécurité du site).
  async function meanColor(page: import("@playwright/test").Page, clip: { x: number; y: number; width: number; height: number }): Promise<number[]> {
    const png = await page.screenshot({ clip });
    const blank = await page.context().newPage();
    await blank.goto("about:blank");
    const rgb = await blank.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let r = 0, g = 0, b = 0;
      const n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      return [r / n, g / n, b / n];
    }, png.toString("base64"));
    await blank.close();
    return rgb;
  }

  test("bureau : la lueur teinte le fond entre les cartes, et le panneau marine suivant reste uni", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/fr");
    await page.waitForLoadState("networkidle");

    const glow = page.locator("svg:has(#home-glow)");
    await expect(glow).toBeVisible();
    const top = await glow.evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
    await page.evaluate((y) => window.scrollTo(0, y - 80), top);
    const g = (await glow.boundingBox())!;
    // Case vide de la grille (3e colonne, 2e rangée) : sans lueur ce serait le menthe du fond (235, 255, 247).
    const [r, , b] = await meanColor(page, { x: g.x + 640, y: g.y + 300, width: 100, height: 100 });
    expect(r, "la lueur doit teinter le fond (rouge nettement sous 235)").toBeLessThan(215);
    expect(b, "teinte violette : bleu élevé").toBeGreaterThan(235);

    // Le panneau « football analytics » : le haut du panneau (sans texte) est marine uni, la lueur ne passe pas à travers.
    const panel = page.locator("section:has(details[name='analytics']) > .wrap").first();
    const pTop = await panel.evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
    await page.evaluate((y) => window.scrollTo(0, y - 80), pTop);
    const p = (await panel.boundingBox())!;
    const [pr, pg, pb] = await meanColor(page, { x: p.x + 40, y: p.y + 8, width: 100, height: 24 });
    expect(Math.abs(pr - 6), "panneau marine : rouge").toBeLessThan(8);
    expect(Math.abs(pg - 6), "panneau marine : vert").toBeLessThan(8);
    expect(Math.abs(pb - 45), "panneau marine : bleu").toBeLessThan(8);
  });

  test("mobile : la tache de la maquette est remplacée par une lueur douce, sans défilement horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/fr");
    await expect(page.locator("svg:has(#home-glow)")).toBeHidden();
    await expectNoHorizontalOverflow(page);
  });
});

// ───────────────────────────── Pages à bas marine : pas de bande claire avant le pied de page ─────────────────────────────
test.describe("Contact et Essai gratuit : le bas de page reste marine (pas de bande menthe)", () => {
  // Couleur d'un pixel de la page (capté puis lu dans une page vierge, pour ne pas dépendre de la politique de sécurité du site).
  async function pixel(page: import("@playwright/test").Page, x: number, y: number): Promise<number[]> {
    const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
    const blank = await page.context().newPage();
    await blank.goto("about:blank");
    const rgb = await blank.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = 1;
      c.height = 1;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
    }, png.toString("base64"));
    await blank.close();
    return rgb;
  }

  const SIZES = [
    { width: 1280, height: 1400 },
    { width: 1918, height: 1300 },
    { width: 768, height: 1600 },
    { width: 390, height: 1700 },
  ];
  for (const path of ["/fr/contact", "/fr/essai-gratuit"]) {
    for (const size of SIZES) {
      test(`${path} à ${size.width}×${size.height} : la page marine rejoint le pied de page, coins compris`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

        const geo = await page.evaluate(() => {
          const root = document.querySelector("main > .page-ends-navy")!.getBoundingClientRect();
          const footer = document.querySelector("footer")!.getBoundingClientRect();
          return { rootBottom: root.bottom, footerTop: footer.top, bodyBg: getComputedStyle(document.body).backgroundColor };
        });
        expect(Math.abs(geo.rootBottom - geo.footerTop), "aucun espace entre la page marine et le pied de page").toBeLessThanOrEqual(1);
        expect(geo.bodyBg, "fond du site marine derrière les coins arrondis du pied de page").toBe("rgb(6, 6, 45)");

        // Coin haut-gauche du pied de page (là où l'arrondi laisse voir le fond) : marine, jamais menthe (235, 255, 247).
        const [r, g, b] = await pixel(page, 1, Math.round(geo.footerTop) + 1);
        expect(r + g + b, "le coin du pied de page ne doit pas être clair").toBeLessThan(200);
      });
    }
  }
});

// ───────────────────────────── Angles : mêmes rayons que la maquette ─────────────────────────────
test.describe("Angles arrondis relevés sur les maquettes", () => {
  // [page, sélecteur, rayon du coin haut-gauche attendu en px, description]
  const CASES: [string, string, number, string][] = [
    ["/fr", "section.sheet", 24, "haut de la feuille claire"],
    ["/fr", "li.cut-tr-bl.rc", 16, "cartes « fonctionnalités » de l'accueil"],
    ["/fr/references", "article.cut-tr-bl.rc", 16, "cartes de cas de la page Références"],
    ["/fr/tarifs", "div.overflow-x-auto", 16, "tableau comparatif"],
    ["/fr", "li.h-\\[184px\\]", 16, "cartes de chiffres de l'accueil"],
    ["/fr", "details[name='analytics']", 16, "lignes « football analytics »"],
    ["/fr", "section.wrap > div.bg-navy", 16, "bandeau marine de fin de page"],
    ["/fr", "main a.cut-br", 10, "grands boutons de l'accueil"],
    ["/fr", "header a.cut-br", 10, "bouton « Essai gratuit » de l'en-tête"],
    ["/fr/tarifs", "details.cut-br", 16, "questions fréquentes (cartes)"],
    ["/fr/tarifs", "li.group", 16, "cartes de prix"],
    ["/fr/tarifs", "li.group a.t-button", 10, "bouton violet des cartes de prix"],
    ["/fr/tarifs", "a.t-button:has-text(\"Demander une démo\")", 10, "bouton « Demander une démo » de la photo"],
    ["/fr/contact", ".glass-panel", 20, "panneau du formulaire"],
    ["/fr/contact", "input.cut-br", 10, "champ de formulaire"],
    ["/fr/contact", "button[type=submit]", 10, "bouton d'envoi"],
    ["/fr/essai-gratuit", ".glass-panel", 20, "panneau du formulaire d'essai"],
    ["/fr/references", "li.glass.cut-br", 16, "chiffres de la page Références"],
    ["/fr/fonctionnalites", "li.glass.cut-br", 16, "cartes de modes"],
  ];
  for (const [path, selector, radius, label] of CASES) {
    test(`${path} : ${label} → rayon ${radius} px`, async ({ page }) => {
      await page.goto(path);
      const px = await page.locator(selector).first().evaluate((e) => getComputedStyle(e).borderTopLeftRadius);
      expect(parseFloat(px)).toBe(radius);
    });
  }

  test("Tarifs : le bouton « Demander une démo » est en bas à droite de la photo", async ({ page }) => {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/fr/tarifs");
      const btn = page.getByRole("link", { name: fr.common.requestDemo });
      const box = await btn.evaluate((e) => {
        const b = e.getBoundingClientRect();
        const p = (e as HTMLElement).offsetParent!.getBoundingClientRect();
        return { left: b.left - p.left, right: p.right - b.right, bottom: p.bottom - b.bottom, panel: p.width };
      });
      expect(box.right, `marge droite à ${width} px`).toBeLessThanOrEqual(28);
      expect(box.left, `le bouton est dans la moitié droite à ${width} px`).toBeGreaterThan(box.panel / 2 - 60);
      expect(box.bottom).toBeLessThanOrEqual(28);
    }
  });

  test("tableau comparatif : les quatre coins sont arrondis de 16 px", async ({ page }) => {
    await page.goto("/fr/tarifs");
    const r = await page.locator("div.overflow-x-auto").first().evaluate((e) => {
      const c = getComputedStyle(e);
      return [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].map(parseFloat);
    });
    expect(r).toEqual([16, 16, 16, 16]);
  });

  test("lignes « football analytics » : arrondies à 16 px aussi quand on les ouvre", async ({ page }) => {
    await page.goto("/fr");
    const rows = page.locator("details[name='analytics']");
    // Les lignes apparaissent en fondu quand on défile jusqu'à elles : on attend la fin du mouvement avant de cliquer (sinon le clic peut tomber à côté).
    await rows.first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll("details[name='analytics']")].every((el) => { let o = 1; let moved = false; for (let n: Element | null = el; n; n = n.parentElement) { o *= parseFloat(getComputedStyle(n).opacity); if (getComputedStyle(n).transform !== "none") moved = true; } return o === 1 && !moved; }));
    for (let i = 0; i < 3; i++) {
      await rows.nth(i).locator("summary").click();
      await expect(rows.nth(i)).toHaveAttribute("open", "");
      const st = await rows.nth(i).evaluate((e) => ({ r: getComputedStyle(e).borderTopLeftRadius, v: getComputedStyle(e).getPropertyValue("--r").trim(), cls: e.className }));
      expect(parseFloat(st.r)).toBe(16);
      expect(st.v).toBe("16px");
      expect(st.cls).toContain("rc");
      // le texte de détail est visible une fois la ligne ouverte
      await expect(rows.nth(i).locator("p")).toBeVisible();
    }
  });

  test("tous les boutons : coins arrondis de 10 px et sommets des coins coupés arrondis (classe rc), sur toutes les pages", async ({ page }) => {
    const pages = ["/fr", "/fr/fonctionnalites", "/fr/tarifs", "/fr/references", "/fr/contact", "/fr/essai-gratuit"];
    for (const path of pages) {
      await page.goto(path);
      const bad = await page.locator("a.t-button, button.t-button").evaluateAll((els) =>
        els
          .filter((e) => !e.classList.contains("rc") || parseFloat(getComputedStyle(e).borderTopLeftRadius) !== 10 || parseFloat(getComputedStyle(e).getPropertyValue("--r")) < 8)
          .map((e) => (e.textContent ?? "").trim().slice(0, 30) + " → " + e.className.slice(0, 60)),
      );
      expect(bad, `boutons à coins vifs sur ${path}`).toEqual([]);
    }
  });

  test("bouton « Voir une démo » (contour fin) : le contour suit la forme arrondie et mesure 0,5 px", async ({ page }) => {
    await page.goto("/fr");
    const btn = page.getByRole("link", { name: fr.common.demo }).first();
    const st = await btn.evaluate((e) => ({ cls: e.className, border: getComputedStyle(e).borderTopWidth, lw: getComputedStyle(e).getPropertyValue("--lw").trim(), after: getComputedStyle(e, "::after").clipPath.startsWith("polygon") }));
    expect(st.cls).toContain("lined");
    expect(st.cls).toContain("rc");
    expect(st.border).toBe("0px");
    expect(parseFloat(st.lw)).toBe(0.5);
    expect(st.after).toBe(true);
  });

  // Demande du 27/11 : tous les boutons (pleins ou à contour) ont la forme de la maquette « Envoyer » : coins arrondis de 10 px, coin BAS-DROIT coupé et arrondi.
  // La coupe garde la proportion de la maquette (14 px pour 60 px de haut ≈ 23 %) : on vérifie 20 à 27 % de la hauteur, jamais de coupe haut-droit / bas-gauche.
  test("tous les boutons ont la même forme : coin bas-droit coupé (≈ 23 % de la hauteur), jamais de coupe haut-droit / bas-gauche", async ({ page }) => {
    const pages = ["/fr", "/fr/fonctionnalites", "/fr/tarifs", "/fr/references", "/fr/contact", "/fr/essai-gratuit", "/fr/mentions-legales", "/fr/page-inconnue"];
    for (const path of pages) {
      await page.goto(path);
      const bad = await page.locator("a.t-button, button.t-button").evaluateAll((els) =>
        els
          .map((e) => {
            const h = e.getBoundingClientRect().height;
            const cut = parseFloat(getComputedStyle(e).getPropertyValue("--cut"));
            return { name: (e.textContent ?? "").trim().slice(0, 24), cls: e.className, ratio: cut / h, h };
          })
          .filter((b) => !b.cls.includes("cut-br") || b.cls.includes("cut-tr-bl") || b.ratio < 0.2 || b.ratio > 0.27)
          .map((b) => `${b.name} (h ${b.h}, coupe/hauteur ${b.ratio.toFixed(2)}) → ${b.cls.slice(0, 50)}`),
      );
      expect(bad, `boutons de forme différente sur ${path}`).toEqual([]);
    }
  });

  test("boutons : même forme à 390 px (mobile, boutons de 60 px à coupe de 14 px)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/fr");
    const hero = page.locator("main section").first().locator("a.t-button");
    await expect(hero).toHaveCount(2);
    const st = await hero.evaluateAll((els) => els.map((e) => ({ h: e.getBoundingClientRect().height, cut: getComputedStyle(e).getPropertyValue("--cut").trim(), r: getComputedStyle(e).getPropertyValue("--r").trim(), cls: e.className })));
    for (const s of st) {
      expect(s.h).toBe(60);
      expect(s.cut).toBe("14px");
      expect(s.r).toBe("10px");
      expect(s.cls).toContain("cut-br");
    }
  });

  test("pied de page : coins hauts arrondis de 24 px", async ({ page }) => {
    await page.goto("/fr");
    const px = await page.locator("footer").evaluate((e) => getComputedStyle(e).borderTopLeftRadius);
    expect(parseFloat(px)).toBe(24);
  });
});

// ───────────────────────────── Tarifs : tableau ─────────────────────────────
test.describe("Tarifs : tableau comparatif", () => {
  test("aucune cellule vide : chaque cellule porte un texte, une coche ou un tiret", async ({ page }) => {
    await page.goto("/fr/tarifs");
    const cells = page.locator("tbody td");
    const empty = await cells.evaluateAll((els) => els.filter((e) => !e.textContent?.trim() && !e.querySelector("svg")).length);
    expect(empty).toBe(0);
  });

  test("le bouton « Demander une démo » est en bas à droite de la photo, avec une marge", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/fr/tarifs");
    const btn = page.getByRole("link", { name: fr.common.requestDemo });
    const photo = btn.locator("xpath=..");
    const b = (await btn.boundingBox())!;
    const p = (await photo.boundingBox())!;
    expect(p.x + p.width - (b.x + b.width)).toBeGreaterThanOrEqual(16);
    expect(b.x - p.x).toBeGreaterThan(p.width / 3);
    expect(p.y + p.height - (b.y + b.height)).toBeGreaterThanOrEqual(16);
  });
});

// ───────────────────────────── Références : en-tête ─────────────────────────────
test.describe("Références : en-tête", () => {
  test("la légende #POESAM2026 ne touche pas le bord de la photo, et la phrase sous le titre est affichée", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/fr/references");
    await expect(page.getByText(fr.references.heroText)).toBeVisible();
    const cap = page.getByText(fr.references.caption);
    const c = (await cap.boundingBox())!;
    const photo = (await cap.locator("xpath=..").boundingBox())!;
    expect(photo.x + photo.width - (c.x + c.width)).toBeGreaterThanOrEqual(16);
    expect(photo.y + photo.height - (c.y + c.height)).toBeGreaterThanOrEqual(16);
  });
});

// ───────────────────────────── Menu mobile (maquette iPhone 13/14) ─────────────────────────────
test.describe("Menu mobile : maquette", () => {
  test("cinq liens en bas de l'écran : lignes de 54 px espacées de 24 px, filet fin, flèche, texte de 32 px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/fr");
    await page.getByRole("button", { name: fr.nav.openMenu }).click();
    const links = page.locator("#menu-mobile nav a");
    await expect(links).toHaveCount(5);
    const geo = await links.evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        return { top: r.top, bottom: r.bottom, h: Math.round(r.height), fs: s.fontSize, border: s.borderBottomWidth, svg: e.querySelectorAll("svg").length };
      }),
    );
    for (const g of geo) {
      expect(g.h).toBe(54);
      expect(g.fs).toBe("32px");
      expect(g.svg).toBe(1);
      expect(parseFloat(g.border)).toBeGreaterThan(0);
      expect(parseFloat(g.border)).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < geo.length; i++) expect(Math.round(geo[i].top - geo[i - 1].bottom)).toBe(24);
    // Ancrés en bas : le dernier filet est à ~40 px du bas de l'écran.
    expect(844 - geo[4].bottom).toBeGreaterThanOrEqual(30);
    expect(844 - geo[4].bottom).toBeLessThanOrEqual(50);
    await expectNoHorizontalOverflow(page);
  });

  test("la croix de fermeture ferme le menu et rend la page à nouveau défilante", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/fr");
    await page.getByRole("button", { name: fr.nav.openMenu }).click();
    await page.getByRole("button", { name: fr.nav.closeMenu }).click();
    await expect(page.locator("#menu-mobile")).toHaveCount(0);
  });
});

// ───────────────────────────── Fonctionnalités : cartes ouvertes au survol (ordinateur) et au clic (tactile) ─────────────────────────────
// Modèle Figma du 23/11 : carte #DDECF4 au repos, violette ouverte ; coins haut-droit et bas-gauche coupés, haut-gauche et bas-droit arrondis de 20 px.
test.describe("Fonctionnalités : cartes ouvertes au survol (ordinateur)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  const ready = async (page: import("@playwright/test").Page, lang = "fr") => {
    await page.goto(`/${lang}/fonctionnalites`);
    await page.waitForLoadState("networkidle");
    // La hauteur commune des cartes est posée par le script une fois la page affichée.
    await expect.poll(() => page.locator("li.fc").first().locator("xpath=..").evaluate((e) => (e as HTMLElement).style.getPropertyValue("--fc-need"))).not.toBe("");
  };

  test("9 cartes au modèle : fond #DDECF4, pastille violette, mêmes marges et même hauteur sur toutes", async ({ page }) => {
    await ready(page);
    const cards = page.locator("li.fc");
    await expect(cards).toHaveCount(9);
    const rows = await cards.evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        const rel = (sel: string) => e.querySelector(sel)!.getBoundingClientRect();
        return {
          h: r.height,
          bg: getComputedStyle(e).backgroundColor,
          tileBg: getComputedStyle(e.querySelector(".fc-tile")!).backgroundColor,
          marks: [rel(".fc-tile").left - r.left, rel(".fc-tile").top - r.top, rel(".fc-title").left - r.left, r.bottom - rel(".fc-text").bottom],
        };
      }),
    );
    for (const r of rows) {
      expect(r.bg).toBe("rgb(221, 236, 244)");
      expect(r.tileBg).toBe("rgb(65, 26, 255)");
      // Marges du modèle : 38 px à gauche, 42 px au-dessus de la pastille et sous le texte.
      expect(r.marks).toEqual([38, 42, 38, 42]);
      expect(Math.abs(r.h - rows[0].h)).toBeLessThan(0.5);
    }
    expect(rows[0].h).toBeGreaterThanOrEqual(305);
  });

  test("forme du modèle : haut-droit et bas-gauche coupés en biais, haut-gauche et bas-droit arrondis", async ({ page }) => {
    await ready(page);
    const card = page.locator("li.fc").first();
    await card.evaluate((e) => window.scrollTo(0, window.scrollY + e.getBoundingClientRect().top - 150));
    await page.mouse.move(0, 0);
    // Depuis le 27/11 le hero remplit l'écran : les cartes sont sous la ligne de flottaison et apparaissent en fondu quand on défile. On attend la fin du fondu avant de relever les pixels.
    await page.waitForFunction(() => {
      let o = 1;
      for (let n: Element | null = document.querySelector("li.fc"); n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
      return o === 1;
    });
    const b = (await card.boundingBox())!;
    const { width: w, height: h } = b;
    const at = await pixelsAt(page, { x: b.x, y: b.y, width: w, height: h }, [
      [w / 2, 3], // milieu du bord haut : dans la carte
      [w / 2, h - 4], // milieu du bord bas
      [3, h / 2], // milieu du bord gauche
      [w - 4, h / 2], // milieu du bord droit
      [w - 12, 12], // coin haut-droit : COUPÉ en biais (un arrondi de 20 px le garderait)
      [12, h - 12], // coin bas-gauche : coupé
      [12, 12], // coin haut-gauche : ARRONDI (une coupe l'enlèverait)
      [w - 12, h - 12], // coin bas-droit : arrondi
      [2, 2], // tout au bout de l'arrondi haut-gauche : hors de la carte
      [w - 2, h - 2],
    ]);
    const CARD = [221, 236, 244];
    const PAGE = [235, 255, 247];
    expect(at.slice(0, 4)).toEqual([CARD, CARD, CARD, CARD]);
    expect(at[4], "coin haut-droit coupé").toEqual(PAGE);
    expect(at[5], "coin bas-gauche coupé").toEqual(PAGE);
    expect(at[6], "coin haut-gauche arrondi, pas coupé").toEqual(CARD);
    expect(at[7], "coin bas-droit arrondi, pas coupé").toEqual(CARD);
    expect(at[8]).toEqual(PAGE);
    expect(at[9]).toEqual(PAGE);
  });

  test("le détail est dans la page même quand la carte est fermée (Google et lecteurs d'écran)", async ({ page }) => {
    await ready(page);
    const total = fr.features.items.reduce((n, i) => n + i.details.length, 0);
    await expect(page.locator("li.fc .fc-list li")).toHaveCount(total);
    for (const item of fr.features.items) for (const d of item.details) expect(await page.locator("li.fc").allInnerTexts()).toEqual(expect.arrayContaining([expect.stringContaining(d)]));
    // Fermé : replié (hauteur nulle, transparent), mais jamais « display: none » ni « hidden ».
    const closed = await page.locator("li.fc").first().locator(".fc-more").evaluate((e) => ({ h: e.getBoundingClientRect().height, o: getComputedStyle(e).opacity, d: getComputedStyle(e).display, v: getComputedStyle(e).visibility }));
    expect(closed).toEqual({ h: 0, o: "0", d: "grid", v: "visible" });
  });

  test("survol : fond violet, détail déplié, flèche ↙, pastille inversée, la carte ne change pas de taille", async ({ page }) => {
    await ready(page);
    const card = page.locator("li.fc").first();
    await card.evaluate((e) => window.scrollTo(0, window.scrollY + e.getBoundingClientRect().top - 150));
    // Depuis le 27/11 les cartes sont sous la ligne de flottaison : on attend la fin du fondu d'apparition avant de survoler (sinon la carte bouge sous la souris).
    await page.waitForFunction(() => {
      let o = 1;
      let moved = false;
      for (let n: Element | null = document.querySelector("li.fc"); n; n = n.parentElement) {
        o *= parseFloat(getComputedStyle(n).opacity);
        if (getComputedStyle(n).transform !== "none") moved = true;
      }
      return o === 1 && !moved;
    });
    const before = (await card.boundingBox())!;
    await card.hover();
    const more = card.locator(".fc-more");
    await expect(more).toHaveCSS("opacity", "1");
    await expect.poll(async () => (await more.boundingBox())!.height).toBeGreaterThan(80);
    await expect(card).toHaveCSS("color", "rgb(235, 255, 247)");
    await expect.poll(() => card.evaluate((e) => getComputedStyle(e, "::before").opacity)).toBe("1");
    await expect(card.locator(".fc-tile")).toHaveCSS("background-color", "rgb(235, 255, 247)");
    await expect(card.locator(".fc-ar-down")).toHaveCSS("opacity", "1");
    await expect(card.locator(".fc-ar-up")).toHaveCSS("opacity", "0");
    const after = (await card.boundingBox())!;
    expect([after.width, after.height]).toEqual([before.width, before.height]);
    // Tout le détail reste à l'intérieur de la carte.
    for (const li of await card.locator(".fc-list li").all()) {
      const r = (await li.boundingBox())!;
      expect(r.y).toBeGreaterThan(after.y + 100);
      expect(r.y + r.height).toBeLessThanOrEqual(after.y + after.height - 38);
      expect(r.x + r.width).toBeLessThanOrEqual(after.x + after.width - 20);
    }
    // On quitte la carte : elle se referme.
    await page.mouse.move(0, 0);
    await expect(more).toHaveCSS("opacity", "0");
    await expect(card.locator(".fc-ar-up")).toHaveCSS("opacity", "1");
  });

  test("clavier : Tab sur le titre d'une carte l'ouvre", async ({ page }) => {
    await ready(page);
    const btn = page.locator("li.fc button.fc-btn").nth(1);
    for (let i = 0; i < 80 && !(await btn.evaluate((e) => e === document.activeElement)); i++) await page.keyboard.press("Tab");
    await expect(btn).toBeFocused();
    await expect(page.locator("li.fc").nth(1).locator(".fc-more")).toHaveCSS("opacity", "1");
    await expect(page.locator("li.fc").nth(0).locator(".fc-more")).toHaveCSS("opacity", "0");
  });

  test("clic sur la flèche (ordinateur) : la carte reste ouverte sur son détail quand la souris la quitte", async ({ page }) => {
    await ready(page);
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none !important}" });
    const cards = page.locator("li.fc");
    const opacity = (i: number) => cards.nth(i).locator(".fc-more").evaluate((e) => getComputedStyle(e).opacity);
    const rest = await cards.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    await cards.nth(1).evaluate((e) => window.scrollTo(0, window.scrollY + e.getBoundingClientRect().top - 150));

    // Clic exactement sur la flèche : la carte est épinglée.
    await cards.nth(1).hover();
    const arrow = (await cards.nth(1).locator(".fc-arrows").boundingBox())!;
    await page.mouse.click(arrow.x + 10, arrow.y + 4);
    await expect(cards.nth(1)).toHaveAttribute("data-open", "true");
    await expect(cards.nth(1).locator("button.fc-btn")).toHaveAttribute("aria-expanded", "true");

    // La souris part ailleurs : la carte garde son détail, son fond violet et sa flèche ↙.
    await page.mouse.move(0, 0);
    expect(await opacity(1)).toBe("1");
    await expect(cards.nth(1)).toHaveCSS("color", "rgb(235, 255, 247)");
    await expect(cards.nth(1).locator(".fc-ar-down")).toHaveCSS("opacity", "1");
    expect(await opacity(0)).toBe("0");

    // Survoler une autre carte l'ouvre le temps du survol, sans détacher la carte épinglée ; aucune carte ne change de taille.
    await cards.nth(2).hover();
    expect(await opacity(2)).toBe("1");
    expect(await opacity(1)).toBe("1");
    expect(await cards.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)))).toEqual(rest);
    await page.mouse.move(0, 0);
    expect(await opacity(2)).toBe("0");
    expect(await opacity(1)).toBe("1");

    // Un clic sur une autre carte déplace l'épinglage.
    await cards.nth(2).hover();
    await page.mouse.click((await cards.nth(2).boundingBox())!.x + 100, (await cards.nth(2).boundingBox())!.y + 60);
    await page.mouse.move(0, 0);
    expect(await opacity(2)).toBe("1");
    expect(await opacity(1)).toBe("0");

    // Second clic sur la carte épinglée, souris toujours dessus : elle revient tout de suite à l'état normal (fermée, flèche ↗), sans attendre.
    await cards.nth(2).hover();
    const b2 = (await cards.nth(2).boundingBox())!;
    await page.mouse.click(b2.x + 100, b2.y + 60);
    await expect(cards.nth(2)).toHaveAttribute("data-open", "false");
    await expect(cards.nth(2)).toHaveAttribute("data-closed", "true");
    await expect(cards.nth(2).locator(".fc-more")).toHaveCSS("opacity", "0");
    await expect(cards.nth(2).locator(".fc-ar-up")).toHaveCSS("opacity", "1");
    await expect(cards.nth(2).locator(".fc-ar-down")).toHaveCSS("opacity", "0");
    await expect(cards.nth(2)).toHaveCSS("color", "rgb(6, 6, 45)");
    await expect(cards.nth(2).locator("button.fc-btn")).toHaveAttribute("aria-expanded", "false");
    // Elle reste fermée tant que la souris bouge sur elle…
    await page.mouse.move(b2.x + 150, b2.y + 120);
    expect(await opacity(2)).toBe("0");
    // …et le survol fonctionne de nouveau dès qu'on l'a quittée puis retrouvée.
    await page.mouse.move(0, 0);
    await expect(cards.nth(2)).toHaveAttribute("data-closed", "false");
    await cards.nth(2).hover();
    expect(await opacity(2)).toBe("1");
    await page.mouse.move(0, 0);
    expect(await opacity(2)).toBe("0");
  });

  test("clavier : Entrée sur le titre épingle la carte, Entrée à nouveau la referme tout de suite", async ({ page }) => {
    await ready(page);
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none !important}" });
    const btn = page.locator("li.fc button.fc-btn").nth(1);
    const card = page.locator("li.fc").nth(1);
    for (let i = 0; i < 80 && !(await btn.evaluate((e) => e === document.activeElement)); i++) await page.keyboard.press("Tab");
    await expect(btn).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(card).toHaveAttribute("data-open", "true");
    await expect(card.locator(".fc-more")).toHaveCSS("opacity", "1");
    await page.keyboard.press("Enter");
    await expect(card).toHaveAttribute("data-open", "false");
    await expect(card.locator(".fc-more")).toHaveCSS("opacity", "0"); // le focus clavier est encore là, mais la carte est fermée
    await page.keyboard.press("Enter");
    await expect(card.locator(".fc-more")).toHaveCSS("opacity", "1");
  });

  // Aucune carte ne doit grandir à l'ouverture, ni laisser un texte sortir ou toucher la pastille, quelles que soient la langue et la largeur.
  for (const lang of ALL_LOCALES) {
    for (const width of [1440, 1280, 1100, 768, 393]) {
      test(`${lang} à ${width} px : ouvertes une à une, les 9 cartes gardent leur hauteur et tout le texte tient dedans`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await ready(page, lang);
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none !important}" });
        const heights = await page.locator("li.fc").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height * 10) / 10));
        expect(new Set(heights).size, "toutes les cartes ont la même hauteur").toBe(1);
        const cards = page.locator("li.fc");
        const bad: string[] = [];
        for (let i = 0; i < 9; i++) {
          const li = cards.nth(i);
          await li.evaluate((e) => window.scrollTo(0, window.scrollY + e.getBoundingClientRect().top - 150));
          const b = (await li.boundingBox())!;
          await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
          const m = await li.evaluate((e) => {
            const r = e.getBoundingClientRect();
            const tile = e.querySelector(".fc-tile")!.getBoundingClientRect();
            const title = e.querySelector(".fc-title")!.getBoundingClientRect();
            const last = [...e.querySelectorAll(".fc-list li")].at(-1)!.getBoundingClientRect();
            const clipped = [...e.querySelectorAll(".fc-title, .fc-text, .fc-list li")].some((n) => n.scrollWidth > n.clientWidth + 1);
            return { h: r.height, gap: title.top - tile.bottom, below: r.bottom - last.bottom, clipped };
          });
          if (Math.abs(m.h - heights[i]) > 0.5) bad.push(`#${i + 1} grandit de ${(m.h - heights[i]).toFixed(1)} px`);
          if (m.gap < 18) bad.push(`#${i + 1} titre trop près de la pastille (${m.gap.toFixed(0)} px)`);
          if (m.below < 28) bad.push(`#${i + 1} dernier texte trop près du bas (${m.below.toFixed(0)} px)`);
          if (m.clipped) bad.push(`#${i + 1} texte coupé`);
        }
        expect(bad).toEqual([]);
      });
    }
  }
});

test.describe("Fonctionnalités : cartes ouvertes au clic (téléphone et tablette)", () => {
  test.use({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });

  test("un clic ouvre la carte, un second la referme, une seule carte est ouverte à la fois", async ({ page }) => {
    await page.goto("/fr/fonctionnalites");
    await page.waitForLoadState("networkidle");
    const cards = page.locator("li.fc");
    const open = () => cards.evaluateAll((els) => els.map((e, i) => ((e as HTMLElement).dataset.open === "true" ? i : -1)).filter((i) => i >= 0));
    const expanded = () => cards.evaluateAll((els) => els.map((e, i) => (e.querySelector("button")!.getAttribute("aria-expanded") === "true" ? i : -1)).filter((i) => i >= 0));
    const heights = () => cards.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    const rest = await heights();
    expect(await open()).toEqual([]);

    await cards.nth(4).scrollIntoViewIfNeeded();
    await cards.nth(4).tap();
    expect(await open()).toEqual([4]);
    expect(await expanded()).toEqual([4]);
    await expect(cards.nth(4).locator(".fc-more")).toHaveCSS("opacity", "1");
    await expect(cards.nth(4)).toHaveCSS("color", "rgb(235, 255, 247)");
    await expect.poll(() => cards.nth(4).evaluate((e) => getComputedStyle(e, "::before").opacity)).toBe("1");

    // Une autre carte : la première se referme.
    await cards.nth(6).scrollIntoViewIfNeeded();
    await cards.nth(6).tap();
    expect(await open()).toEqual([6]);
    await expect(cards.nth(4).locator(".fc-more")).toHaveCSS("opacity", "0");

    // Second clic sur la même carte : elle se referme.
    await cards.nth(6).tap();
    expect(await open()).toEqual([]);
    expect(await expanded()).toEqual([]);
    expect(await heights()).toEqual(rest);
  });

  test("le clic fonctionne sur toute la carte, pas seulement sur le titre", async ({ page }) => {
    await page.goto("/fr/fonctionnalites");
    await page.waitForLoadState("networkidle");
    const card = page.locator("li.fc").nth(2);
    await card.scrollIntoViewIfNeeded();
    const b = (await card.boundingBox())!;
    await page.touchscreen.tap(b.x + b.width / 2, b.y + 60); // vide, entre la pastille et le titre
    await expect(card).toHaveAttribute("data-open", "true");
  });

  test("un appui sur la flèche ouvre la carte aussi", async ({ page }) => {
    await page.goto("/fr/fonctionnalites");
    await page.waitForLoadState("networkidle");
    const card = page.locator("li.fc").nth(3);
    await card.scrollIntoViewIfNeeded();
    const a = (await card.locator(".fc-arrows").boundingBox())!;
    await page.touchscreen.tap(a.x + 10, a.y + 4);
    await expect(card).toHaveAttribute("data-open", "true");
  });
});


// ───────────────────────────── Retours de la stagiaire du 23/11 au soir ─────────────────────────────
test.describe("retours du 23/11 (soir) : Fonctionnalités, Accueil, Références", () => {
  // Fonctionnalités : aucune ligne de détail ne doit être rognée à droite (le « and » du détail Multilingual, en anglais, était coupé).
  for (const lang of ALL_LOCALES) {
    for (const width of [1920, 1440, 1280, 1100, 768, 390]) {
      test(`détail des cartes : aucun mot rogné à droite (${lang}, ${width} px)`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${lang}/fonctionnalites`);
        await page.waitForLoadState("networkidle");
        await page.evaluate(() => document.fonts.ready);
        const cut = await page.$$eval("li.fc", (cards) =>
          cards.flatMap((card) => {
            const clip = card.querySelector(".fc-more-in")!.getBoundingClientRect();
            return [...card.querySelectorAll(".fc-list li")].flatMap((li) => {
              const range = document.createRange();
              range.selectNodeContents(li);
              const right = Math.max(...[...range.getClientRects()].map((r) => r.right));
              return right > clip.right + 0.5 ? [`${li.textContent} (dépasse de ${(right - clip.right).toFixed(1)} px)`] : [];
            });
          }),
        );
        expect(cut).toEqual([]);
      });
    }
  }

  test("Fonctionnalités (EN) : « Four languages: French, Malagasy, English and Spanish » reste entier", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/fonctionnalites");
    await page.waitForLoadState("networkidle");
    const li = page.locator("li.fc").first().locator(".fc-list li").first();
    await expect(li).toHaveText(en.features.items[0].details[0]);
    const [liBox, clipBox] = await Promise.all([li.boundingBox(), page.locator("li.fc").first().locator(".fc-more-in").boundingBox()]);
    expect(liBox!.x + liBox!.width).toBeLessThanOrEqual(clipBox!.x + clipBox!.width + 0.5);
  });

  test("Accueil : une phrase de transition relie le titre aux cartes, dans les 4 langues", async ({ page }) => {
    for (const lang of ALL_LOCALES) {
      await page.goto(`/${lang}`);
      const intro = page.locator("main section.sheet h2 + p").first();
      await expect(intro).toBeVisible();
      const expected = { fr: fr.home.problemsIntro, en: en.home.problemsIntro }[lang as "fr" | "en"];
      if (expected) await expect(intro).toHaveText(expected);
      const [h2, p, firstCard] = await Promise.all([
        page.locator("main section.sheet h2").first().boundingBox(),
        intro.boundingBox(),
        page.locator("ul.grid-cols-4 > li").first().boundingBox(),
      ]);
      expect(p!.y).toBeGreaterThan(h2!.y + h2!.height - 1);
      expect(firstCard!.y).toBeGreaterThan(p!.y + p!.height + 16);
    }
  });

  test("Références : CFFA vs COSFA précise « quart de finale » dans les 4 langues", async ({ page }) => {
    const words = { fr: /Quart de finale/i, en: /Quarter-final/i, es: /Cuartos de final/i, mg: /1\/4 famaranana/i } as const;
    for (const lang of ALL_LOCALES) {
      await page.goto(`/${lang}/references`);
      const card = page.locator("main article", { has: page.locator("h3", { hasText: "CFFA vs COSFA" }) });
      await expect(card).toHaveCount(1);
      await expect(card).toContainText(words[lang]);
    }
  });

  test("Références (ordinateur) : Barea (carte sombre, ballon) puis CFFA (carte claire, trophée), même taille, grille d'origine", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/fr/references");
    await page.waitForLoadState("networkidle");
    await scrollThrough(page);
    await page.evaluate(() => document.querySelectorAll("main section.sheet [data-reveal]").forEach((el) => el.scrollIntoView({ block: "center" })));
    await page.waitForFunction(() => [...document.querySelectorAll("main section.sheet [data-reveal]")].every((el) => getComputedStyle(el).transform === "none"));
    await expect(page.locator("main article")).toHaveCount(4);
    const box = async (title: string) => (await page.locator("main article", { has: page.locator("h3", { hasText: title }) }).boundingBox())!;
    const barea = await box("Guinée-Bissau");
    const cffa = await box("CFFA vs COSFA");
    const toki = await box("Toki");
    const disciples = await box("Disciples");
    const photo = (await page.locator(`main img[alt="${fr.alt.tacticalBoard}"]`).first().boundingBox())!;
    const title = (await page.locator("main section.sheet h2").first().boundingBox())!;
    await expect(page.locator("main")).not.toContainText("CHAN 2024");
    await expect(page.locator("main")).not.toContainText("Burkina");

    // Première rangée : titre, Barea (CAN 2027), CFFA, toutes les cartes à la même taille (pas de grande carte). Échange du 27/11 : Barea passe à gauche.
    expect(Math.abs(barea.y - cffa.y)).toBeLessThan(2);
    expect(cffa.x).toBeGreaterThan(barea.x + barea.width);
    for (const c of [barea, cffa, toki, disciples]) {
      expect(c.width).toBeCloseTo(270, 0);
      expect(c.height).toBeCloseTo(230, 0);
    }
    // Deuxième rangée : photo du tableau tactique, Toki, Disciples.
    expect(Math.abs(toki.y - disciples.y)).toBeLessThan(2);
    expect(Math.abs(photo.y - toki.y)).toBeLessThan(2);
    expect(toki.y).toBeGreaterThan(cffa.y + cffa.height + 10);
    expect(photo.height).toBeCloseTo(230, 0);
    expect(photo.x + photo.width).toBeLessThan(toki.x);
    expect(title.y).toBeLessThan(photo.y);
  });

  test("Références (tablette 820 px) : la carte de CFFA suit celle des Barea, côte à côte", async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 900 });
    await page.goto("/fr/references");
    await scrollThrough(page);
    await page.evaluate(() => document.querySelectorAll("main section.sheet [data-reveal]").forEach((el) => el.scrollIntoView({ block: "center" })));
    await page.waitForFunction(() => [...document.querySelectorAll("main section.sheet [data-reveal]")].every((el) => getComputedStyle(el).transform === "none"));
    const barea = (await page.locator("main article", { has: page.locator("h3", { hasText: "Guinée-Bissau" }) }).boundingBox())!;
    const cffa = (await page.locator("main article", { has: page.locator("h3", { hasText: "CFFA vs COSFA" }) }).boundingBox())!;
    expect(Math.abs(barea.y - cffa.y)).toBeLessThan(2);
    expect(cffa.x).toBeGreaterThan(barea.x);
    expect(Math.abs(barea.width - cffa.width)).toBeLessThan(2);
  });

  test("Références : les deux premières cartes ont échangé icône et texte, les fonds restent à leur place (sombre puis claire)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/fr/references");
    const cards = page.locator("main article");
    await expect(cards).toHaveCount(4);
    const info = await cards.evaluateAll((els) =>
      els
        .map((e) => ({
          title: e.querySelector("h3")?.textContent ?? "",
          left: e.getBoundingClientRect().left,
          top: e.getBoundingClientRect().top + window.scrollY,
          dark: getComputedStyle(e).backgroundImage.includes("gradient"),
          icon: e.querySelector("svg")?.getAttribute("viewBox") ?? "",
          iconSize: Math.round(e.querySelector("svg")?.getBoundingClientRect().width ?? 0),
        }))
        .sort((a, b) => a.top - b.top || a.left - b.left),
    );
    // Première rangée : carte sombre = Barea (ballon, 38 px), carte claire = CFFA (trophée, 44 px).
    expect(info[0].title).toBe(fr.references.cases[0].title);
    expect(info[0].title).toContain("Barea");
    expect(info[0].dark).toBe(true);
    expect(info[0].iconSize).toBe(38);
    expect(info[1].title).toBe(fr.references.cases[1].title);
    expect(info[1].title).toContain("CFFA");
    expect(info[1].dark).toBe(false);
    expect(info[1].iconSize).toBe(44);
    expect(info[0].left).toBeLessThan(info[1].left);
  });

  test("Accueil : le compteur « Matchs analysés » affiche 23", async ({ page }) => {
    await page.goto("/fr");
    const card = page.locator("li.h-\\[184px\\]", { hasText: fr.home.stats[0].title });
    await card.scrollIntoViewIfNeeded();
    await expect(card).toContainText("23", { timeout: 5000 });
    await expect(card).not.toContainText(/\b8\b/);
  });

  test("Accueil : le titre dit que le football local n'a pas d'outils d'analyse, suivi de la phrase de transition (4 langues)", async ({ page }) => {
    const titles = {
      fr: "Le football local n'a pas d'outils d'analyse.",
      en: "Local football has no analysis tools.",
      es: "El fútbol local no tiene herramientas de análisis.",
    } as const;
    for (const lang of ALL_LOCALES) {
      await page.goto(`/${lang}`);
      const h2 = page.locator("main section.sheet h2").first();
      if (lang in titles) await expect(h2).toHaveText(titles[lang as keyof typeof titles]);
      await expect(page.locator("main")).not.toContainText(/Les outils globaux|Global tools ignore|herramientas globales ignoran/);
      const [t, p, card] = await Promise.all([h2.boundingBox(), page.locator("main section.sheet h2 + p").first().boundingBox(), page.locator("ul.grid-cols-4 > li").first().boundingBox()]);
      expect(p!.y).toBeGreaterThan(t!.y + t!.height - 1);
      expect(card!.y).toBeGreaterThan(p!.y + p!.height + 16);
    }
  });
});

// ───────────────────────────── Première section de chaque page : adaptée à tout écran (demande du 27/11) ─────────────────────────────
// Sur ordinateur (≥ 1024 px), la première section remplit la hauteur visible : la feuille claire suivante n'apparaît que par son arrondi (24 px) au bas de l'écran,
// jamais un titre coupé à moitié. Si le contenu est plus grand que l'écran, la section s'agrandit : rien n'est coupé.
test.describe("Première section adaptée à n'importe quel écran", () => {
  const SCREENS: [number, number][] = [
    [1024, 768],
    [1280, 720],
    [1366, 768],
    [1440, 900],
    [1536, 864],
    [1526, 784], // écran de la stagiaire : 1907×980 pixels à 125 % d'affichage Windows
    [1534, 781],
    [1913, 978],
    [1920, 1080],
    [2560, 1300],
  ];
  const HEROES: [string, string][] = [
    ["/fr", "Accueil"],
    ["/fr/fonctionnalites", "Fonctionnalités"],
    ["/fr/references", "Références"],
  ];

  for (const [w, h] of SCREENS) {
    test(`${w}×${h} : Accueil, Fonctionnalités et Références remplissent l'écran (feuille claire à 24 px du bas), contenu entièrement visible`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      for (const [path, name] of HEROES) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const r = await page.evaluate(() => {
          const hero = document.querySelector("main > section")!;
          const sheet = hero.nextElementSibling!.getBoundingClientRect();
          const bottoms = [...hero.querySelectorAll("h1, h1 + p, a.t-button, ul li")].map((e) => e.getBoundingClientRect().bottom);
          return { vh: innerHeight, sheetTop: sheet.top, lowestContent: Math.max(...bottoms), scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth };
        });
        expect(r.sheetTop, `${name} à ${w}×${h} : la feuille claire commence à 24 px du bas de l'écran`).toBeCloseTo(r.vh - 24, 0);
        expect(r.lowestContent, `${name} à ${w}×${h} : le contenu du hero ne passe pas sous la feuille`).toBeLessThanOrEqual(r.sheetTop);
        expect(r.scrollW, `${name} à ${w}×${h} : pas de défilement horizontal`).toBeLessThanOrEqual(r.clientW);
      }
    });
  }

  test("l'image du hero repose sur le bas de la section (pas de bord net au milieu de l'écran) sur Accueil et Fonctionnalités", async ({ page }) => {
    for (const [w, h] of [[1280, 720], [1913, 978], [2560, 1300]] as const) {
      await page.setViewportSize({ width: w, height: h });
      for (const path of ["/fr", "/fr/fonctionnalites"]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const gap = await page.evaluate(() => {
          const hero = document.querySelector("main > section")!;
          const img = [...hero.querySelectorAll("img")].reduce((a, b) => (b.getBoundingClientRect().width > a.getBoundingClientRect().width ? b : a));
          const sheetTop = hero.nextElementSibling!.getBoundingClientRect().top;
          return sheetTop - img.getBoundingClientRect().bottom;
        });
        // L'image finit au plus tard sous la feuille claire (écart ≤ 1 px) : elle déborde de moins de 90 px sous la feuille (partie cachée), jamais de vide visible.
        expect(gap, `${path} à ${w}×${h}`).toBeLessThanOrEqual(1);
        expect(gap, `${path} à ${w}×${h}`).toBeGreaterThanOrEqual(-90);
      }
    }
  });

  test("Tarifs : le titre et les quatre cartes sont en haut, la section remplit l'écran (le tableau ne commence pas à moitié visible)", async ({ page }) => {
    for (const [w, h] of [[1913, 978], [1920, 1080], [2560, 1300]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/fr/tarifs");
      await page.waitForLoadState("networkidle");
      const r = await page.evaluate(() => {
        const hero = document.querySelector("main > div")!.getBoundingClientRect();
        const table = document.querySelector("#table-title")!.getBoundingClientRect();
        return { heroBottom: hero.bottom, vh: innerHeight, tableTop: table.top };
      });
      expect(r.heroBottom, `Tarifs à ${w}×${h}`).toBeGreaterThanOrEqual(r.vh - 1);
      expect(r.tableTop, `le titre du tableau n'est pas à moitié coupé à ${w}×${h}`).toBeGreaterThanOrEqual(r.vh);
    }
  });

  test("Contact : tout le formulaire et les liens (jusqu'à Facebook) sont visibles sans défiler, de 1280×720 à 1913×978", async ({ page }) => {
    for (const [w, h] of [[1280, 720], [1366, 768], [1440, 900], [1526, 784], [1534, 781], [1913, 978]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/fr/contact");
      await page.waitForLoadState("networkidle");
      const r = await page.evaluate(() => {
        const send = document.querySelector("button[type=submit]")!.getBoundingClientRect();
        const panel = document.querySelector(".glass-panel")!.getBoundingClientRect();
        const links = [...document.querySelectorAll("main ul li a, main ul li span")].map((e) => e.getBoundingClientRect().bottom);
        return { vh: innerHeight, sendBottom: send.bottom, panelBottom: panel.bottom, linksBottom: Math.max(...links) };
      });
      expect(r.sendBottom, `bouton Envoyer à ${w}×${h}`).toBeLessThanOrEqual(r.vh);
      expect(r.panelBottom, `panneau du formulaire à ${w}×${h}`).toBeLessThanOrEqual(r.vh);
      expect(r.linksBottom, `dernier lien (Facebook) à ${w}×${h}`).toBeLessThanOrEqual(r.vh);
    }
  });

  test("Contact à 1526×784 (écran réel, Windows 125 %) : tailles d'origine (titre 64 px, champs 62 px, message 116 px), éléments remontés comme sur la capture du 27/11", async ({ page }) => {
    await page.setViewportSize({ width: 1526, height: 784 });
    await page.goto("/fr/contact");
    await page.waitForLoadState("networkidle");
    const r = await page.evaluate(() => {
      const h1 = document.querySelector("h1")!;
      const rect = (e: Element) => e.getBoundingClientRect();
      const inputs = [...document.querySelectorAll("input.cut-br")].filter((e) => rect(e).width > 0 && rect(e).left > 0).map((e) => rect(e).height);
      const area = rect(document.querySelector("textarea")!);
      const panel = rect(document.querySelector(".glass-panel")!);
      const firstLabel = rect([...document.querySelectorAll(".glass-panel label")].find((l) => rect(l).width > 0 && rect(l).left > 0 && /Nom/.test(l.textContent ?? ""))!);
      const links = [...document.querySelectorAll("main ul li a, main ul li span")].map((e) => rect(e).bottom);
      return {
        vh: innerHeight, h1Font: getComputedStyle(h1).fontSize, h1Centre: (rect(h1).top + rect(h1).bottom) / 2, inputs, areaH: area.height,
        panelBottom: panel.bottom, labelCentre: (firstLabel.top + firstLabel.bottom) / 2, linksBottom: Math.max(...links),
        scrollH: document.documentElement.scrollHeight, contentBottom: document.querySelector("main > div")!.getBoundingClientRect().bottom,
      };
    });
    expect(r.h1Font).toBe("64px");
    for (const h of r.inputs) expect(h).toBe(62);
    expect(r.areaH).toBe(116);
    // Positions de la capture (÷ 1,25) : titre ≈ 136, étiquette « Nom » ≈ 117, bas du panneau ≈ 750, ligne Facebook ≈ 737.
    expect(r.h1Centre).toBeGreaterThan(128);
    expect(r.h1Centre).toBeLessThan(146);
    expect(r.labelCentre).toBeGreaterThan(110);
    expect(r.labelCentre).toBeLessThan(126);
    expect(r.panelBottom).toBeGreaterThan(740);
    expect(r.panelBottom).toBeLessThanOrEqual(r.vh - 20);
    expect(r.linksBottom).toBeLessThanOrEqual(r.panelBottom);
    // La section de contact tient dans l'écran : on voit tout sans défiler (le pied de page est juste dessous).
    expect(r.contentBottom).toBeLessThanOrEqual(r.vh);
  });

  test("Contact : les tailles ne sont réduites que sur les écrans vraiment bas (≤ 766 px : champs 56 px ; ≤ 700 px : 48 px)", async ({ page }) => {
    for (const [w, h, input, area] of [[1366, 768, 62, 116], [1280, 720, 56, 104], [1366, 657, 48, 84]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/fr/contact");
      await page.waitForLoadState("networkidle");
      const r = await page.evaluate(() => ({
        input: [...document.querySelectorAll("input.cut-br")].find((e) => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().left > 0)!.getBoundingClientRect().height,
        area: document.querySelector("textarea")!.getBoundingClientRect().height,
      }));
      expect(r.input, `champ à ${w}×${h}`).toBe(input);
      expect(r.area, `message à ${w}×${h}`).toBe(area);
    }
  });

  test("Contact : sur un grand écran (2560×1300) l'espacement d'origine est conservé et le pied de page reste en bas", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1300 });
    await page.goto("/fr/contact");
    await page.waitForLoadState("networkidle");
    const r = await page.evaluate(() => ({ input: document.querySelector("input.cut-br")!.getBoundingClientRect().height, footerBottom: document.querySelector("footer")!.getBoundingClientRect().bottom, vh: innerHeight, scrollH: document.documentElement.scrollHeight }));
    expect(r.input).toBe(62);
    expect(r.scrollH).toBe(r.vh);
    expect(Math.round(r.footerBottom)).toBe(r.vh);
  });

  test("Contact et Essai gratuit : en dessous de 1024 px (tablette, téléphone) la mise en page n'est pas resserrée", async ({ page }) => {
    for (const path of ["/fr/contact", "/fr/essai-gratuit"]) {
      await page.setViewportSize({ width: 820, height: 700 });
      await page.goto(path);
      const h = await page.locator("input.cut-br").first().evaluate((e) => e.getBoundingClientRect().height);
      expect(h, path).toBe(62);
    }
  });

  test("Accueil : le bloc de gauche (titre, texte, boutons) est remonté au-dessus du centre de la zone visible, sans toucher l'en-tête", async ({ page }) => {
    for (const [w, h] of [[1024, 768], [1280, 720], [1526, 784], [1920, 1080], [2560, 1300]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/fr");
      await page.waitForLoadState("networkidle");
      const r = await page.evaluate(() => {
        const hero = document.querySelector("main > section")!;
        const h1 = hero.querySelector("h1")!.getBoundingClientRect();
        const btns = [...hero.querySelectorAll("a.t-button")].map((e) => e.getBoundingClientRect().bottom);
        const header = document.querySelector("header")!.getBoundingClientRect().bottom;
        const sheetTop = hero.nextElementSibling!.getBoundingClientRect().top;
        return { top: h1.top, bottom: Math.max(...btns), header, sheetTop };
      });
      const visibleCentre = (r.header + r.sheetTop) / 2;
      const lift = visibleCentre - (r.top + r.bottom) / 2;
      expect(lift, `Accueil ${w}×${h} : le bloc est au-dessus du centre`).toBeGreaterThan(20);
      expect(lift, `Accueil ${w}×${h} : sans exagérer`).toBeLessThan(110);
      expect(r.top - r.header, `Accueil ${w}×${h} : marge sous l'en-tête`).toBeGreaterThan(60);
    }
  });

  test("Fonctionnalités : l'ordinateur est agrandi (≥ 1000 px de large à 1526×784), sous l'en-tête et à plus de 40 px du texte et des cartes, en FR, EN et ES", async ({ page }) => {
    for (const [w, h] of [[1280, 720], [1366, 768], [1440, 900], [1526, 784], [1920, 1080], [2560, 1300]] as const) {
      await page.setViewportSize({ width: w, height: h });
      for (const lang of ["fr", "en", "es"]) {
        await page.goto(`/${lang}/fonctionnalites`);
        await page.waitForLoadState("networkidle");
        const r = await page.evaluate(() => {
          const hero = document.querySelector("main > section")!;
          const img = hero.querySelector("img")!.getBoundingClientRect();
          const textRight = Math.max(...[...hero.querySelectorAll("h1, h1 + p")].map((e) => { const g = document.createRange(); g.selectNodeContents(e); return g.getBoundingClientRect().right; }));
          const cardsRight = Math.max(...[...hero.querySelectorAll("ul li")].map((e) => e.getBoundingClientRect().right));
          const header = document.querySelector("header")!.getBoundingClientRect().bottom;
          return { imgW: img.width, laptopLeft: img.left + img.width * 0.209, laptopTop: img.top + img.height * 0.107, textRight, cardsRight, header, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth };
        });
        if (w === 1526) expect(r.imgW, `image ${lang} à ${w}×${h}`).toBeGreaterThanOrEqual(1000);
        expect(r.imgW, `image ${lang} à ${w}×${h} : jamais plus petite qu'avant (920 px)`).toBeGreaterThanOrEqual(920);
        expect(r.laptopLeft - Math.max(r.textRight, r.cardsRight), `${lang} à ${w}×${h} : l'ordinateur ne touche ni le texte ni les cartes`).toBeGreaterThan(40);
        expect(r.laptopTop, `${lang} à ${w}×${h} : l'ordinateur n'est pas masqué par l'en-tête`).toBeGreaterThan(r.header + 20);
        expect(r.scrollW).toBeLessThanOrEqual(r.clientW);
      }
    }
  });

  test("Fonctionnalités : texte de 18 px comme l'Accueil, cartes de modes plus grandes dès 1440 px de large, groupe remonté au centre optique", async ({ page }) => {
    await page.setViewportSize({ width: 1526, height: 784 });
    await page.goto("/fr");
    const home = await page.evaluate(() => getComputedStyle(document.querySelector("main > section h1 + p")!).fontSize);
    await page.goto("/fr/fonctionnalites");
    await page.waitForLoadState("networkidle");
    const big = await page.evaluate(() => {
      const hero = document.querySelector("main > section")!;
      const card = hero.querySelector("ul li")!.getBoundingClientRect();
      const title = getComputedStyle(hero.querySelector("ul li p")!).fontSize;
      const h1 = hero.querySelector("h1")!.getBoundingClientRect();
      const cardsBottom = Math.max(...[...hero.querySelectorAll("ul li")].map((e) => e.getBoundingClientRect().bottom));
      const header = document.querySelector("header")!.getBoundingClientRect().bottom;
      const sheetTop = hero.nextElementSibling!.getBoundingClientRect().top;
      return { fs: getComputedStyle(hero.querySelector("h1 + p")!).fontSize, w: card.width, h: card.height, title, lift: (header + sheetTop) / 2 - (h1.top + cardsBottom) / 2 };
    });
    expect(big.fs).toBe(home);
    expect(big.fs).toBe("18px");
    expect([big.w, big.h, big.title]).toEqual([264, 108, "26px"]);
    expect(big.lift).toBeGreaterThan(20);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/fr/fonctionnalites");
    const small = await page.evaluate(() => { const c = document.querySelector("main > section ul li")!.getBoundingClientRect(); return [c.width, c.height]; });
    expect(small).toEqual([238, 95]);
  });

  test("404 : le contenu est centré dans la hauteur libre, le pied de page reste en bas", async ({ page }) => {
    await page.setViewportSize({ width: 1913, height: 978 });
    await page.goto("/fr/page-inconnue");
    const r = await page.evaluate(() => {
      const h1 = document.querySelector("h1")!.getBoundingClientRect();
      const header = document.querySelector("header")!.getBoundingClientRect();
      const footer = document.querySelector("footer")!.getBoundingClientRect();
      return { h1Center: (h1.top + h1.bottom) / 2, mid: (header.bottom + footer.top) / 2 };
    });
    expect(Math.abs(r.h1Center - r.mid)).toBeLessThan(140);
  });
});
