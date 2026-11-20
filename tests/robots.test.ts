import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEYS = ["VERCEL_ENV", "NODE_ENV", "NEXT_PUBLIC_PREVIEW", "ALLOW_INDEXING", "NEXT_PUBLIC_SITE_URL"] as const;
const env = process.env as Record<string, string | undefined>;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = env[k];
    delete env[k];
  }
  vi.resetModules();
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete env[k];
    else env[k] = saved[k];
  }
});

// robots.ts lit l'environnement au chargement : on le recharge pour chaque cas.
async function robotsWith(vars: Record<string, string>) {
  Object.assign(env, vars);
  const mod = await import("@/app/robots");
  return mod.default();
}

describe("robots.txt : interrupteur de mise en ligne", () => {
  it("reste fermé sur la production Vercel tant que ALLOW_INDEXING n'est pas réglée", async () => {
    const r = await robotsWith({ VERCEL_ENV: "production" });
    expect(r.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(r.sitemap).toBeUndefined();
  });

  it("s'ouvre en production avec ALLOW_INDEXING=1", async () => {
    const r = await robotsWith({ VERCEL_ENV: "production", ALLOW_INDEXING: "1", NEXT_PUBLIC_SITE_URL: "https://e-fanamby.mg" });
    expect(r.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toBe("https://e-fanamby.mg/sitemap.xml");
  });

  it("reste fermé sur un aperçu Vercel, même avec ALLOW_INDEXING=1", async () => {
    const r = await robotsWith({ VERCEL_ENV: "preview", ALLOW_INDEXING: "1" });
    expect(r.rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("reste fermé en mode aperçu des langues, même avec ALLOW_INDEXING=1", async () => {
    const r = await robotsWith({ VERCEL_ENV: "production", ALLOW_INDEXING: "1", NEXT_PUBLIC_PREVIEW: "1" });
    expect(r.rules).toEqual({ userAgent: "*", disallow: "/" });
  });
});
