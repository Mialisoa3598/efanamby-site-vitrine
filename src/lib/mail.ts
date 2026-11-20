import "server-only";
import nodemailer from "nodemailer";
import { DEFAULT_LOCALE, hasLocale, isOpen, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/dictionaries";
import { CONTACT, FORM_RECIPIENT } from "./site";
import type { FormKind, FormValues } from "./validation";

const SUBJECT: Record<FormKind, string> = {
  contact: "Message via le formulaire Contact",
  trial: "Demande d'essai gratuit",
  demo: "Demande de démo",
};

/** Une seule ligne, sans retour chariot : empêche l'injection d'en-têtes dans un objet ou un nom. */
function oneLine(s: string): string {
  return s.replace(/[\r\n]+/g, " ").slice(0, 150);
}

export type MailResult = { ok: true } | { ok: false; reason: "not-configured" | "send-failed" };

/** Moyen d'envoi : SMTP, ou simple composition du message en mode test (MAIL_DRY_RUN=1). `null` = SMTP pas configuré. */
function createTransport(dryRun: boolean) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (dryRun) return nodemailer.createTransport({ jsonTransport: true });
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT ?? 465);
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass }, connectionTimeout: 10_000, socketTimeout: 15_000 });
}

/** Expéditeur avec un nom lisible (« e-Fanamby ») : la personne reconnaît le message, et les filtres anti-spam le jugent moins anonyme. MAIL_FROM peut déjà contenir « Nom <adresse> ». */
const sender = () => {
  const from = process.env.MAIL_FROM;
  if (from?.includes("<")) return from;
  return { name: "e-Fanamby", address: from ?? process.env.SMTP_USER ?? CONTACT.email };
};

/**
 * Envoie la demande à l'équipe e-Fanamby (SMTP).
 * Variables : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM. MAIL_DRY_RUN=1 : n'envoie rien, écrit le message dans les journaux (tests).
 */
export async function sendFormMail(values: FormValues, meta: { locale: string; page: string }): Promise<MailResult> {
  const dryRun = process.env.MAIL_DRY_RUN === "1";
  const transporter = createTransport(dryRun);
  if (!transporter) return { ok: false, reason: "not-configured" };

  const body = [
    `Type de demande : ${SUBJECT[values.kind]}`,
    `Nom : ${values.name}`,
    `Structure : ${values.structure || "—"}`,
    `E-mail : ${values.email}`,
    `Langue du site : ${meta.locale}`,
    `Page : ${meta.page}`,
    "",
    "Message :",
    values.message || "(aucun message)",
  ].join("\n");

  try {
    const info = await transporter.sendMail({
      from: sender(),
      to: FORM_RECIPIENT,
      replyTo: values.email,
      subject: `[e-Fanamby] ${SUBJECT[values.kind]} – ${oneLine(values.name)}`,
      text: body,
    });
    if (dryRun) {
      console.info("[mail:dry-run]", String((info as { message?: unknown }).message ?? ""));
      console.warn("[mail:dry-run] MAIL_DRY_RUN=1 : ce message n'a PAS été envoyé. Retirez MAIL_DRY_RUN de .env.local pour envoyer pour de vrai.");
    }
    return { ok: true };
  } catch (error) {
    console.error("[mail] envoi impossible :", error instanceof Error ? error.message : error);
    return { ok: false, reason: "send-failed" };
  }
}

/**
 * E-mail de confirmation envoyé à la personne (essai gratuit / démo). Dans la langue du site qu'elle utilisait (français si la langue n'est pas ouverte).
 * Aucun texte saisi par la personne n'y est repris : le formulaire ne peut pas servir à envoyer un message de son choix à une tierce adresse.
 * « Répondre » écrit à l'équipe ; l'en-tête Auto-Submitted (auto-generated) évite les boucles de réponses automatiques.
 */
export async function sendConfirmationMail(values: FormValues, meta: { locale: string }): Promise<MailResult> {
  const dryRun = process.env.MAIL_DRY_RUN === "1";
  const transporter = createTransport(dryRun);
  if (!transporter) return { ok: false, reason: "not-configured" };

  const locale: Locale = hasLocale(meta.locale) && isOpen(meta.locale) ? meta.locale : DEFAULT_LOCALE;
  const t = await getMessages(locale);
  const m = t.mail;
  const demo = values.kind === "demo";
  const text = [
    m.hello,
    "",
    demo ? m.receivedDemo : m.receivedTrial,
    m.next,
    "",
    `${m.question} ${CONTACT.whatsappDisplay}`,
    "",
    m.signature,
    t.meta.slogan,
    "",
    "--",
    m.why,
  ].join("\n");

  try {
    const info = await transporter.sendMail({
      from: sender(),
      to: values.email,
      replyTo: FORM_RECIPIENT,
      subject: demo ? m.subjectDemo : m.subjectTrial,
      text,
      headers: { "Auto-Submitted": "auto-generated" },
    });
    if (dryRun) console.info("[mail:dry-run]", String((info as { message?: unknown }).message ?? ""));
    return { ok: true };
  } catch (error) {
    console.error("[mail] confirmation impossible :", error instanceof Error ? error.message : error);
    return { ok: false, reason: "send-failed" };
  }
}
