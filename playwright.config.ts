import { defineConfig, devices } from "@playwright/test";

// Deux modes, car NEXT_PUBLIC_PREVIEW est figée à la construction du site :
//  - preview : site construit avec les 4 langues ouvertes (relecture) → e2e/site.spec.ts, e2e/forms.spec.ts, e2e/a11y.spec.ts
//  - prod    : site construit comme en ligne (français seul) → e2e/prod.spec.ts
// Lancer les deux à la suite : npm run test:e2e   (ou E2E_MODE=preview / E2E_MODE=prod pour un seul)
const mode = process.env.E2E_MODE === "prod" ? "prod" : "preview";
const port = mode === "prod" ? 3102 : 3101;
const siteUrl = mode === "prod" ? "https://e-fanamby.mg" : `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: mode === "prod" ? /prod\.spec\.ts/ : /(site|forms|a11y)\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure", ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
  webServer: {
    command: `npx next build && npx next start -p ${port}`,
    url: `http://localhost:${port}/fr`,
    timeout: 300_000,
    reuseExistingServer: false,
    stdout: "ignore",
    env: {
      MAIL_DRY_RUN: "1",
      NEXT_PUBLIC_SITE_URL: siteUrl,
      NEXT_PUBLIC_PREVIEW: mode === "prod" ? "" : "1",
      // Interrupteur de mise en ligne : ouvert uniquement pour simuler la production (voir src/app/robots.ts).
      ALLOW_INDEXING: mode === "prod" ? "1" : "",
    },
  },
});
