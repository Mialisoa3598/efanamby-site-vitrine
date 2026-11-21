// Vérification avant mise en ligne : liste ce qui bloque encore la publication.
// Usage : npm run check:launch          → affiche la liste (code de sortie 0)
//         npm run check:launch -- --strict → code de sortie 1 s'il reste un point bloquant (utile avant de promouvoir en production)
import { LIVE_LOCALES, LOCALES, LOCALE_INFO } from "../src/i18n/config";
import { fr } from "../src/i18n/messages/fr";
import { CONTACT } from "../src/lib/site";

type Item = { level: "bloquant" | "à valider"; text: string };
const items: Item[] = [];
const add = (level: Item["level"], text: string) => items.push({ level, text });

// 1. Réponses de FAQ pas encore rédigées (masquées en production).
function nullAnswers(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => nullAnswers(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    const own = "q" in o && "a" in o && o.a === null ? [`${path} : « ${String(o.q)} »`] : [];
    return [...own, ...Object.entries(o).flatMap(([k, v]) => nullAnswers(v, path ? `${path}.${k}` : k))];
  }
  return [];
}
for (const q of nullAnswers(fr)) add("à valider", `Réponse de FAQ à rédiger (masquée en production) → ${q}`);

// 2. Langues : fermées, ou ouvertes sans relecture native.
for (const l of LOCALES) {
  if (!LOCALE_INFO[l].live) add("à valider", `Langue « ${LOCALE_INFO[l].label} » fermée au public (live: false dans src/i18n/config.ts) : elle ne sera pas visible en ligne`);
  else if (l !== "fr") add("à valider", `Langue « ${LOCALE_INFO[l].label} » ouverte (décision du 20/11) sans relecture par un locuteur natif : à faire relire dès que possible`);
}
if (!LIVE_LOCALES.includes("fr")) add("bloquant", "Le français n'est pas ouvert.");

// 3. Variables d'environnement (Vercel → Settings → Environment Variables).
const env = process.env;
if (!env.NEXT_PUBLIC_SITE_URL) add("bloquant", "NEXT_PUBLIC_SITE_URL absente (ex. https://e-fanamby.mg) : adresses canoniques, sitemap et robots.txt");
for (const k of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"]) if (!env[k]) add("bloquant", `${k} absente : les formulaires ne peuvent pas envoyer d'e-mail`);
if (!env.SMTP_PORT) add("à valider", "SMTP_PORT absente (465 par défaut)");
if (!env.MAIL_FROM) add("à valider", "MAIL_FROM absente (l'expéditeur sera SMTP_USER)");
if (env.MAIL_DRY_RUN === "1") add("bloquant", "MAIL_DRY_RUN=1 : aucun e-mail n'est envoyé (réservé aux tests)");
if (env.ALLOW_INDEXING !== "1") add("bloquant", "ALLOW_INDEXING absente ou ≠ 1 : robots.txt reste fermé aux moteurs de recherche (c'est voulu jusqu'au jour J ; à régler à 1 sur Vercel au moment de la mise en ligne)");
if (env.NEXT_PUBLIC_PREVIEW === "1") add("bloquant", "NEXT_PUBLIC_PREVIEW=1 : les langues en brouillon sont ouvertes et le site n'est pas indexé");

// 4. Contenus et liens à confirmer.
if (!CONTACT.facebookHref) add("à valider", "Adresse de la page Facebook manquante (src/lib/site.ts → CONTACT.facebookHref)");
add("bloquant", "Pages Mentions légales, CGU et Confidentialité : texte en attente (entité juridique à créer) ; elles sont en noindex");

const blocking = items.filter((i) => i.level === "bloquant");
const toCheck = items.filter((i) => i.level === "à valider");

console.log("\nVérification avant mise en ligne — e-Fanamby\n");
console.log(`Bloquant (${blocking.length})`);
for (const i of blocking) console.log(`  ✗ ${i.text}`);
console.log(`\nÀ valider (${toCheck.length})`);
for (const i of toCheck) console.log(`  • ${i.text}`);
console.log("");

if (process.argv.includes("--strict") && blocking.length > 0) process.exit(1);
