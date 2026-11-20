import localFont from "next/font/local";

// Police de la charte : Mozilla Text, hébergée dans le projet (aucune requête vers Google au chargement).
export const mozillaText = localFont({
  src: [
    { path: "../fonts/MozillaText-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/MozillaText-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/MozillaText-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/MozillaText-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mozilla-text",
  display: "swap",
});
