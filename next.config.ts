import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

// Affiche la version du site au démarrage (dans le terminal) : permet de vérifier d'un coup d'œil qu'on a bien les derniers fichiers.
try {
  const first = readFileSync(join(process.cwd(), "VERSION.txt"), "utf8").split("\n")[0];
  console.info(`[e-Fanamby] ${first}`);
} catch {
  /* VERSION.txt absent : sans importance */
}

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Page 404 pour les adresses hors des langues du site (le site n'a pas de layout racine commun).
  experimental: { globalNotFound: true },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
