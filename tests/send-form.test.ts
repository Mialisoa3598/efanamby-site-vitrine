import { beforeEach, describe, expect, it, vi } from "vitest";

const sendFormMail = vi.fn();
const sendConfirmationMail = vi.fn();
const headerStore = new Map<string, string>();

vi.mock("@/lib/mail", () => ({
  sendFormMail: (...a: unknown[]) => sendFormMail(...a),
  sendConfirmationMail: (...a: unknown[]) => sendConfirmationMail(...a),
}));
vi.mock("next/headers", () => ({ headers: async () => ({ get: (k: string) => headerStore.get(k.toLowerCase()) ?? null }) }));

type SendForm = typeof import("@/app/actions/send-form").sendForm;
let sendForm: SendForm;

function data(fields: Record<string, string> = {}): FormData {
  const d = new FormData();
  const base = { kind: "contact", name: "Rado", structure: "", email: "rado@exemple.mg", message: "Bonjour", consent: "on", locale: "fr", page: "/fr/contact", ...fields };
  for (const [k, v] of Object.entries(base)) d.set(k, v);
  return d;
}
const idle = { status: "idle" } as const;

beforeEach(async () => {
  // Module rechargé à chaque test : la limite d'envois (mémoire du module) repart de zéro.
  vi.resetModules();
  sendFormMail.mockReset().mockResolvedValue({ ok: true });
  sendConfirmationMail.mockReset().mockResolvedValue({ ok: true });
  headerStore.clear();
  headerStore.set("x-forwarded-for", "10.0.0.1");
  ({ sendForm } = await import("@/app/actions/send-form"));
});

describe("sendForm", () => {
  it("envoie le message et répond « success » pour une demande valide", async () => {
    expect(await sendForm(idle, data())).toEqual({ status: "success" });
    expect(sendFormMail).toHaveBeenCalledTimes(1);
    expect(sendFormMail.mock.calls[0][1]).toEqual({ locale: "fr", page: "/fr/contact" });
  });

  it("renvoie les erreurs de champ sans envoyer de mail", async () => {
    const r = await sendForm(idle, data({ email: "pas-un-mail", name: "", consent: "" }));
    expect(r).toMatchObject({ status: "error", code: "invalid", errors: { email: "email", name: "required", consent: "consent" } });
    expect(sendFormMail).not.toHaveBeenCalled();
  });

  it("rend les valeurs saisies pour ne pas vider le formulaire", async () => {
    const r = await sendForm(idle, data({ email: "x", name: "Rado" }));
    expect(r.status === "error" && r.values.name).toBe("Rado");
  });

  it("le piège à robots (champ-piège rempli) répond « success » sans rien envoyer", async () => {
    expect(await sendForm(idle, data({ hp_note: "http://spam.example" }))).toEqual({ status: "success" });
    expect(sendFormMail).not.toHaveBeenCalled();
  });

  it("un formulaire envoyé en moins de 2 secondes est ignoré en silence", async () => {
    expect(await sendForm(idle, data({ ts: String(Date.now() - 300) }))).toEqual({ status: "success" });
    expect(sendFormMail).not.toHaveBeenCalled();
  });

  it("un formulaire envoyé après 2 secondes passe, et l'absence d'horodatage aussi", async () => {
    await sendForm(idle, data({ ts: String(Date.now() - 5000) }));
    await sendForm(idle, data());
    expect(sendFormMail).toHaveBeenCalledTimes(2);
  });

  it("limite à 5 envois par adresse IP, sans toucher aux autres adresses", async () => {
    for (let i = 0; i < 5; i++) expect(await sendForm(idle, data())).toEqual({ status: "success" });
    expect(await sendForm(idle, data())).toMatchObject({ status: "error", code: "failed" });
    expect(sendFormMail).toHaveBeenCalledTimes(5);
    headerStore.set("x-forwarded-for", "10.0.0.2, 172.16.0.1");
    expect(await sendForm(idle, data())).toEqual({ status: "success" });
  });

  it("répond « failed » si l'envoi du mail échoue", async () => {
    sendFormMail.mockResolvedValueOnce({ ok: false, reason: "send-failed" });
    expect(await sendForm(idle, data())).toMatchObject({ status: "error", code: "failed" });
  });

  it("borne la langue et la page transmises", async () => {
    await sendForm(idle, data({ locale: "fr-FR-extra-long", page: "x".repeat(500) }));
    const meta = sendFormMail.mock.calls[0][1] as { locale: string; page: string };
    expect(meta.locale.length).toBeLessThanOrEqual(5);
    expect(meta.page.length).toBeLessThanOrEqual(200);
  });
});

describe("sendForm : e-mail de confirmation", () => {
  const trial = (fields: Record<string, string> = {}) => data({ kind: "trial", page: "/fr/essai-gratuit", ...fields });

  it("envoie une confirmation à la personne pour un essai gratuit, et le dit à l'écran", async () => {
    expect(await sendForm(idle, trial())).toEqual({ status: "success", confirmation: true });
    expect(sendConfirmationMail).toHaveBeenCalledTimes(1);
    expect(sendConfirmationMail.mock.calls[0][0]).toMatchObject({ kind: "trial", email: "rado@exemple.mg" });
    expect(sendConfirmationMail.mock.calls[0][1]).toEqual({ locale: "fr" });
  });

  it("en envoie aussi une pour une demande de démo", async () => {
    expect(await sendForm(idle, trial({ kind: "demo" }))).toEqual({ status: "success", confirmation: true });
  });

  it("n'en envoie pas pour le formulaire Contact", async () => {
    expect(await sendForm(idle, data())).toEqual({ status: "success" });
    expect(sendConfirmationMail).not.toHaveBeenCalled();
  });

  it("si la confirmation échoue, la demande reste réussie (sans mention de confirmation)", async () => {
    sendConfirmationMail.mockResolvedValueOnce({ ok: false, reason: "send-failed" });
    expect(await sendForm(idle, trial())).toEqual({ status: "success" });
  });

  it("si le message à l'équipe échoue, aucune confirmation n'est envoyée", async () => {
    sendFormMail.mockResolvedValueOnce({ ok: false, reason: "send-failed" });
    expect(await sendForm(idle, trial())).toMatchObject({ status: "error", code: "failed" });
    expect(sendConfirmationMail).not.toHaveBeenCalled();
  });

  it("limite à 2 confirmations par adresse et par heure (majuscules ignorées), mais la demande part toujours", async () => {
    await sendForm(idle, trial({ email: "Victime@exemple.mg" }));
    await sendForm(idle, trial({ email: "victime@exemple.mg" }));
    const third = await sendForm(idle, trial({ email: "VICTIME@exemple.mg" }));
    expect(third).toEqual({ status: "success" });
    expect(sendFormMail).toHaveBeenCalledTimes(3);
    expect(sendConfirmationMail).toHaveBeenCalledTimes(2);
    // une autre adresse n'est pas touchée
    expect(await sendForm(idle, trial({ email: "autre@exemple.mg" }))).toEqual({ status: "success", confirmation: true });
  });

  it("le piège à robots ne déclenche aucune confirmation", async () => {
    await sendForm(idle, trial({ hp_note: "http://spam.example" }));
    expect(sendConfirmationMail).not.toHaveBeenCalled();
  });
});
