// Test réel de l'envoi des e-mails, SANS passer par le site.
// Usage :  npm run test:mail -- adresse-qui-recevra-la-confirmation@exemple.com
// Il lit .env.local (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO…), puis envoie :
//   1. un message « TEST » à l'équipe (MAIL_TO, par défaut efanamby2025@gmail.com) ;
//   2. une confirmation d'essai gratuit à l'adresse donnée (par défaut : l'adresse de l'équipe).
// Avec MAIL_DRY_RUN=1 dans .env.local, rien n'est envoyé : les messages s'affichent ici.
import { existsSync, readFileSync } from "node:fs";

// Lecture minimale de .env.local (sans dépendance, valable sur toutes les versions de Node). Les variables déjà réglées gagnent.
function loadEnvLocal(file = ".env.local"): boolean {
  if (!existsSync(file)) return false;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^(["'])(.*)\1$/, "$2");
    if (value !== "" && process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
  return true;
}

const found = loadEnvLocal();
const env = process.env;
const dryRun = env.MAIL_DRY_RUN === "1";

console.log("\nTest d'envoi d'e-mails — e-Fanamby\n");
if (!found) console.log("  ! Pas de fichier .env.local à la racine du projet (voir GUIDE.md, section 6).");
console.log(`  Mode            : ${dryRun ? "à blanc (MAIL_DRY_RUN=1) : rien n'est envoyé" : "ENVOI RÉEL"}`);
console.log(`  Serveur SMTP    : ${env.SMTP_HOST || "(non réglé)"}${env.SMTP_PORT ? `:${env.SMTP_PORT}` : ""}`);
console.log(`  Compte          : ${env.SMTP_USER || "(non réglé)"}`);
console.log(`  Mot de passe    : ${env.SMTP_PASS ? "renseigné" : "(non réglé)"}`);

if (!dryRun && (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS)) {
  console.log("\n  ✗ SMTP_HOST, SMTP_USER et SMTP_PASS sont obligatoires dans .env.local pour un envoi réel.");
  console.log("    Pour Gmail : SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_USER=<l'adresse>, SMTP_PASS=<mot de passe d'application de 16 caractères>.\n");
  process.exit(1);
}

async function main(): Promise<void> {
  // Importés APRÈS la lecture de .env.local : le destinataire (MAIL_TO) est lu au chargement du module.
  const { FORM_RECIPIENT, CONTACT } = await import("../src/lib/site");
  const { sendConfirmationMail, sendFormMail } = await import("../src/lib/mail");

  const to = process.argv[2] ?? FORM_RECIPIENT ?? CONTACT.email;
  console.log(`  Équipe (MAIL_TO): ${FORM_RECIPIENT}`);
  console.log(`  Confirmation à  : ${to}\n`);

  const values = { kind: "trial" as const, name: "TEST e-Fanamby (à ignorer)", structure: "Test technique", email: to, message: "Ceci est un test d'envoi lancé par « npm run test:mail ».", consent: true };

  const team = await sendFormMail(values, { locale: "fr", page: "/fr/essai-gratuit (test)" });
  console.log(team.ok ? "  ✓ Message à l'équipe : envoyé" : `  ✗ Message à l'équipe : échec (${team.reason})`);
  const confirmation = await sendConfirmationMail(values, { locale: "fr" });
  console.log(confirmation.ok ? "  ✓ Confirmation       : envoyée" : `  ✗ Confirmation       : échec (${confirmation.reason})`);

  if (!team.ok || !confirmation.ok) {
    console.log("\n  Que vérifier : mot de passe d'application (pas le mot de passe du compte), validation en 2 étapes activée,");
    console.log("  SMTP_PORT=465, connexion internet. Le détail de l'erreur est affiché juste au-dessus (ligne « [mail] »).\n");
    process.exit(1);
  }
  console.log(dryRun ? "\n  Terminé (à blanc).\n" : "\n  Terminé. Vérifiez les deux boîtes de réception (et les courriers indésirables).\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
