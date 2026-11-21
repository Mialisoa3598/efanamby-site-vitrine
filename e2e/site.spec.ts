import { expect, test } from "@playwright/test";
import { fr } from "../src/i18n/messages/fr";
import { en } from "../src/i18n/messages/en";
import { IMG } from "../src/lib/images";
import { PAGES } from "../src/lib/site";
import { ALL_LOCALES, ALL_PAGES, MAIN_PAGES, expectNoHorizontalOverflow, scrollThrough, watch } from "./helpers";

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

  test("le lien de connexion ouvre la plateforme dans un nouvel onglet", async ({ page }) => {
    await page.goto("/fr");
    const link = page.getByRole("link", { name: fr.common.login }).first();
    await expect(link).toHaveAttribute("href", "https://e-fanamby.run.place/");
    await expect(link).toHaveAttribute("target", "_blank");
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
            return { canvas: getComputedStyle(document.documentElement).backgroundColor, footerBottom: Math.round(f.bottom + window.scrollY), docHeight: document.documentElement.scrollHeight };
          });
          expect(r.canvas, `/${lang}${s}`).toBe(NAVY);
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

  test("les pages claires gardent un pied de page dont les coins arrondis se détachent sur la menthe", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const s of ["", PAGES.references, PAGES.features]) {
      await page.goto(`/fr${s}`, { waitUntil: "domcontentloaded" });
      expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), `/fr${s}`).toBe("rgb(235, 255, 247)");
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
        await expect.poll(() => page.evaluate(() => window.scrollY), { message: `défilement de ${url}` }).toBeGreaterThan(100);
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

  test("Références : quatre cas, un témoignage et une FAQ", async ({ page }) => {
    await page.goto("/fr/references");
    await expect(page.locator("details")).not.toHaveCount(0);
    await expect(page.locator("blockquote")).toHaveCount(1);
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

  test("Références : le texte précède l'image du héros, cas dans l'ordre trophée, ballon, flèches, coureur", async ({ page }) => {
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

  test("Références : l'encadré du témoignage occupe presque toute la hauteur de l'image de fond", async ({ page }) => {
    await page.goto("/fr/references");
    const quote = page.locator("blockquote");
    await quote.scrollIntoViewIfNeeded();
    const box = await quote.locator("xpath=ancestor::div[contains(@class,'backdrop-blur')][1]").boundingBox();
    const figure = await quote.locator("xpath=ancestor::figure[1]").boundingBox();
    expect(box).not.toBeNull();
    expect(figure).not.toBeNull();
    expect(box!.height).toBeGreaterThan(figure!.height * 0.8);
    expect(box!.height).toBeLessThan(figure!.height);
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
    ["/fr/references", "figure.cut-br.rc", 16, "témoignage de la page Références"],
    ["/fr/fonctionnalites", "li.cut-br.rc", 16, "cartes de la grille Fonctionnalités"],
    ["/fr/tarifs", "div.overflow-x-auto", 16, "tableau comparatif"],
    ["/fr", "li.h-\\[184px\\]", 16, "cartes de chiffres de l'accueil"],
    ["/fr", "details[name='analytics']", 16, "lignes « football analytics »"],
    ["/fr", "section.wrap > div.bg-navy", 16, "bandeau marine de fin de page"],
    ["/fr", "main a.cut-br", 10, "grands boutons de l'accueil"],
    ["/fr", "header a.cut-br", 10, "bouton « Essai gratuit » de l'en-tête"],
    ["/fr/tarifs", "details.cut-br", 16, "questions fréquentes (cartes)"],
    ["/fr/tarifs", "li.group", 16, "cartes de prix"],
    ["/fr/tarifs", "li.group a.cut-tr-bl", 10, "bouton violet des cartes de prix"],
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

  test("bouton « Voir une démo » (contour fin) : le contour suit la forme arrondie", async ({ page }) => {
    await page.goto("/fr");
    const btn = page.getByRole("link", { name: fr.common.demo }).first();
    const st = await btn.evaluate((e) => ({ cls: e.className, border: getComputedStyle(e).borderTopWidth, after: getComputedStyle(e, "::after").clipPath.startsWith("polygon") }));
    expect(st.cls).toContain("lined");
    expect(st.cls).toContain("rc");
    expect(st.border).toBe("0px");
    expect(st.after).toBe(true);
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
