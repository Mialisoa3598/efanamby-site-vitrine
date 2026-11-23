import { expect, type Page } from "@playwright/test";
import { LOCALES, type Locale } from "../src/i18n/config";
import { PAGES } from "../src/lib/site";

export const ALL_LOCALES: readonly Locale[] = LOCALES;
export const ALL_PAGES = Object.entries(PAGES) as [keyof typeof PAGES, string][];
/** Les six pages de la maquette (les pages juridiques sont des textes en attente). */
export const MAIN_PAGES = ALL_PAGES.filter(([k]) => !["legal", "terms", "privacy"].includes(k));

/** Surveille la page : erreurs de console, erreurs JavaScript, requêtes en échec et réponses 4xx/5xx. */
export function watch(page: Page): { problems: string[] } {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console: ${m.text().slice(0, 200)}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on("requestfailed", (r) => {
    const error = r.failure()?.errorText ?? "";
    // Next coupe lui-même ses requêtes internes une fois la réponse lue : préchargements (?_rsc=) et appels d'action serveur (en-tête next-action).
    // Ce n'est pas une erreur du site : la réponse 200 est bien reçue (surveillée plus bas) et l'action n'est exécutée qu'une fois.
    if (error.includes("ERR_ABORTED") && (r.url().includes("_rsc=") || "next-action" in r.headers())) return;
    problems.push(`requestfailed: ${r.method()} ${r.url()} ${error}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`);
  });
  return { problems };
}

/** Fait défiler la page jusqu'en bas pour déclencher le chargement différé des images, puis revient en haut. */
export async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Amène chaque image dans l'écran, puis attend qu'elle soit chargée (ou en erreur) : pas de course contre le chargement différé.
    for (const img of Array.from(document.images)) {
      img.scrollIntoView({ block: "center" });
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          setTimeout(done, 10_000);
        });
      }
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(scroll, `défilement horizontal : la page fait ${scroll}px pour une fenêtre de ${client}px`).toBeLessThanOrEqual(client);
}

/** Couleurs de plusieurs pixels d'une zone de la page (capture lue dans une page vierge, pour ne pas dépendre de la politique de sécurité du site). Points en px dans la zone. */
export async function pixelsAt(page: Page, clip: { x: number; y: number; width: number; height: number }, points: [number, number][]): Promise<number[][]> {
  const png = await page.screenshot({ clip });
  const blank = await page.context().newPage();
  await blank.goto("about:blank");
  const rgb = await blank.evaluate(
    async ({ b64, pts }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return pts.map(([x, y]) => Array.from(ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data.slice(0, 3)));
    },
    { b64: png.toString("base64"), pts: points },
  );
  await blank.close();
  return rgb;
}
