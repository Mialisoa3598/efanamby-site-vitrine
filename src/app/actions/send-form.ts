"use server";

import { headers } from "next/headers";
import { sendConfirmationMail, sendFormMail } from "@/lib/mail";
import { FORM_RECIPIENT } from "@/lib/site";
import { CONFIRMED_KINDS, HONEYPOT_FIELD, parseForm, validate, type FieldErrors, type FormValues } from "@/lib/validation";

export type FormState =
  | { status: "idle" }
  | { status: "success"; confirmation?: boolean; devNote?: DevNote }
  | { status: "error"; code: "invalid"; errors: FieldErrors; values: FormValues }
  | { status: "error"; code: "failed"; values: FormValues };

/** Aide au développement (jamais renvoyée en production) : pourquoi « Succès » s'affiche sans qu'aucun e-mail ne parte. */
export type DevNote = "dry-run" | "robot-trap" | "too-fast";
const DEV = process.env.NODE_ENV === "development";

// Limite d'envois par adresse (mémoire de l'instance : suffisant contre un envoi en boucle simple, pas une protection absolue).
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

// Confirmation : au plus 2 par adresse et par heure, pour que le formulaire ne serve pas à inonder la boîte de quelqu'un d'autre.
const CONFIRM_WINDOW_MS = 60 * 60_000;
const CONFIRM_MAX = 2;
const confirmed = new Map<string, number[]>();

function mayConfirm(email: string): boolean {
  const key = email.toLowerCase();
  const now = Date.now();
  const recent = (confirmed.get(key) ?? []).filter((t) => now - t < CONFIRM_WINDOW_MS);
  if (recent.length >= CONFIRM_MAX) {
    confirmed.set(key, recent);
    return false;
  }
  recent.push(now);
  confirmed.set(key, recent);
  if (confirmed.size > 5000) confirmed.clear();
  return true;
}

/** « v***@yahoo.com » : pour les journaux, sans écrire l'adresse en entier. */
function maskEmail(email: string): string {
  const [name = "", domain = ""] = email.split("@");
  return `${name.slice(0, 1)}***@${domain}`;
}

export async function sendForm(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = parseForm(formData);

  // Piège à robots n°1 : champ invisible pour les humains (nom volontairement banal, pour que l'autocomplétion du navigateur ne le remplisse pas).
  // On répond « succès » pour ne rien apprendre au robot.
  const honeypot = formData.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    console.info("[form] ignoré : le champ piège anti-robot était rempli. Aucun e-mail envoyé.");
    return DEV ? { status: "success", devNote: "robot-trap" } : { status: "success" };
  }

  // Piège à robots n°2 : formulaire envoyé en moins de 2 secondes. (Sans JavaScript, l'horodatage est absent : on laisse passer.)
  const ts = Number(formData.get("ts"));
  if (Number.isFinite(ts) && ts > 0 && Date.now() - ts < 2000) {
    console.info("[form] ignoré : formulaire envoyé en moins de 2 secondes (anti-robot). Aucun e-mail envoyé.");
    return DEV ? { status: "success", devNote: "too-fast" } : { status: "success" };
  }

  const errors = validate(values);
  if (Object.keys(errors).length > 0) return { status: "error", code: "invalid", errors, values };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (tooMany(ip)) return { status: "error", code: "failed", values };

  const locale = String(formData.get("locale") ?? "fr").slice(0, 5);
  const page = String(formData.get("page") ?? "").slice(0, 200);
  const result = await sendFormMail(values, { locale, page });
  if (!result.ok) return { status: "error", code: "failed", values };
  const dryRun = process.env.MAIL_DRY_RUN === "1";
  // Le journal dit où part le message de l'équipe (MAIL_TO ou, à défaut, l'adresse de CONTACT) : c'est la première chose à regarder si « rien n'arrive ».
  console.info(dryRun ? `[form] ${values.kind} : MODE TEST (MAIL_DRY_RUN=1), rien n'a été envoyé.` : `[form] ${values.kind} : e-mail envoyé à l'équipe, destinataire ${FORM_RECIPIENT}.`);

  // La demande est partie : la confirmation à la personne est un plus. Si elle échoue, la demande reste réussie.
  if (!CONFIRMED_KINDS.includes(values.kind)) {
    console.info(`[form] ${values.kind} : pas de confirmation prévue pour ce formulaire (voir CONFIRMED_KINDS).`);
  } else if (!mayConfirm(values.email)) {
    console.info(`[form] ${values.kind} : confirmation NON envoyée à ${maskEmail(values.email)} (limite de 2 confirmations par adresse et par heure).`);
  } else {
    const confirmation = await sendConfirmationMail(values, { locale });
    if (confirmation.ok) {
      console.info(dryRun ? `[form] ${values.kind} : confirmation simulée pour ${maskEmail(values.email)}.` : `[form] ${values.kind} : confirmation acceptée par le serveur d'envoi pour ${maskEmail(values.email)} (si rien n'arrive : courriers indésirables, ou refus signalé par un message d'erreur dans la boîte de l'expéditeur).`);
      return { status: "success", confirmation: true, ...(DEV && dryRun && { devNote: "dry-run" as const }) };
    }
    console.info(`[form] ${values.kind} : confirmation NON envoyée à ${maskEmail(values.email)} (voir la ligne « [mail] confirmation impossible » juste au-dessus).`);
  }
  return DEV && dryRun ? { status: "success", devNote: "dry-run" } : { status: "success" };
}
