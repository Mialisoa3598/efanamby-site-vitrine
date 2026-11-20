import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendConfirmationMail, sendFormMail } from "@/lib/mail";
import type { FormValues } from "@/lib/validation";

const values: FormValues = { kind: "trial", name: "Rado Rakoto", structure: "FC Test", email: "rado@exemple.mg", message: "Bonjour\nTout le monde", consent: true };

const ENV_KEYS = ["MAIL_DRY_RUN", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_TO", "MAIL_FROM"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("sendFormMail", () => {
  it("refuse d'envoyer quand le SMTP n'est pas configuré", async () => {
    expect(await sendFormMail(values, { locale: "fr", page: "/fr/essai-gratuit" })).toEqual({ ok: false, reason: "not-configured" });
  });

  it("exige l'hôte, l'utilisateur ET le mot de passe", async () => {
    process.env.SMTP_HOST = "smtp.exemple.com";
    process.env.SMTP_USER = "u";
    expect(await sendFormMail(values, { locale: "fr", page: "/" })).toEqual({ ok: false, reason: "not-configured" });
  });

  it("en mode test (MAIL_DRY_RUN), n'envoie rien et compose le message vers l'adresse prévue", async () => {
    process.env.MAIL_DRY_RUN = "1";
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const result = await sendFormMail(values, { locale: "mg", page: "/mg/essai-gratuit" });
    expect(result).toEqual({ ok: true });
    expect(log).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(String(log.mock.calls[0][1]));
    expect(sent.to[0].address).toBe("efanamby2025@gmail.com");
    expect(sent.replyTo[0].address).toBe("rado@exemple.mg");
    expect(sent.subject).toBe("[e-Fanamby] Demande d'essai gratuit – Rado Rakoto");
    expect(sent.text).toContain("Langue du site : mg");
    expect(sent.text).toContain("Page : /mg/essai-gratuit");
    expect(sent.text).toContain("Structure : FC Test");
    expect(sent.text).toContain("Bonjour\nTout le monde");
  });

  it("indique l'absence de structure et de message", async () => {
    process.env.MAIL_DRY_RUN = "1";
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendFormMail({ ...values, structure: "", message: "" }, { locale: "fr", page: "/fr/contact" });
    const sent = JSON.parse(String(log.mock.calls[0][1]));
    expect(sent.text).toContain("Structure : —");
    expect(sent.text).toContain("(aucun message)");
  });

  it("empêche l'injection d'en-têtes par le nom (retours à la ligne dans l'objet)", async () => {
    process.env.MAIL_DRY_RUN = "1";
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendFormMail({ ...values, name: "Rado\r\nBcc: victime@exemple.com" }, { locale: "fr", page: "/" });
    const sent = JSON.parse(String(log.mock.calls[0][1]));
    expect(sent.subject).not.toMatch(/[\r\n]/);
    expect(sent.bcc).toBeUndefined();
  });

  it("utilise MAIL_TO quand il est défini", async () => {
    // FORM_RECIPIENT est lu au chargement du module : on recharge le module avec la variable réglée.
    process.env.MAIL_DRY_RUN = "1";
    process.env.MAIL_TO = "autre@exemple.mg";
    vi.resetModules();
    const { sendFormMail: fresh } = await import("@/lib/mail");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await fresh(values, { locale: "fr", page: "/" });
    expect(JSON.parse(String(log.mock.calls[0][1])).to[0].address).toBe("autre@exemple.mg");
  });

  it("renvoie « send-failed » si le serveur SMTP est injoignable, sans planter", async () => {
    process.env.SMTP_HOST = "127.0.0.1";
    process.env.SMTP_PORT = "1"; // aucun serveur n'écoute ici
    process.env.SMTP_USER = "u";
    process.env.SMTP_PASS = "p";
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendFormMail(values, { locale: "fr", page: "/" })).toEqual({ ok: false, reason: "send-failed" });
  });
});

describe("sendConfirmationMail", () => {
  const visitor: FormValues = { kind: "trial", name: "Rado\r\nBcc: victime@exemple.com", structure: "FC Test <b>", email: "rado@exemple.mg", message: "Texte libre du visiteur", consent: true };
  const sentOf = (log: ReturnType<typeof vi.spyOn>) => JSON.parse(String(log.mock.calls[0][1]));

  it("refuse d'envoyer quand le SMTP n'est pas configuré", async () => {
    expect(await sendConfirmationMail(visitor, { locale: "fr" })).toEqual({ ok: false, reason: "not-configured" });
  });

  it("écrit à la personne, répond à l'équipe, et marque le message comme automatique", async () => {
    process.env.MAIL_DRY_RUN = "1";
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    expect(await sendConfirmationMail(visitor, { locale: "fr" })).toEqual({ ok: true });
    const sent = sentOf(log);
    expect(sent.to[0].address).toBe("rado@exemple.mg");
    expect(sent.replyTo[0].address).toBe("efanamby2025@gmail.com");
    expect(sent.subject).toBe("Votre demande d'essai gratuit e-Fanamby");
    expect(sent.text).toContain("Bonjour,");
    expect(sent.text).toContain("demande d'essai gratuit");
    expect(sent.text).toContain("+261 34 77 155 08");
    expect(sent.text).toContain("Parions sur la data.");
    expect(JSON.stringify(sent.headers)).toMatch(/Auto-Submitted/i);
    expect(JSON.stringify(sent.headers)).toMatch(/auto-generated/i);
    // expéditeur nommé « e-Fanamby » (message reconnaissable, moins anonyme pour les filtres anti-spam)
    expect(sent.from.name).toBe("e-Fanamby");
  });

  it("garde un expéditeur « Nom <adresse> » déjà fourni dans MAIL_FROM", async () => {
    process.env.MAIL_DRY_RUN = "1";
    process.env.MAIL_FROM = "Équipe e-Fanamby <contact@exemple.mg>";
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendConfirmationMail(visitor, { locale: "fr" });
    const sent = sentOf(log);
    expect(sent.from.name).toBe("Équipe e-Fanamby");
    expect(sent.from.address).toBe("contact@exemple.mg");
    delete process.env.MAIL_FROM;
  });

  it("ne reprend aucun texte saisi par la personne (ni nom, ni structure, ni message)", async () => {
    process.env.MAIL_DRY_RUN = "1";
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendConfirmationMail(visitor, { locale: "fr" });
    const sent = sentOf(log);
    for (const secret of ["Rado", "FC Test", "Texte libre", "victime@exemple.com"]) {
      expect(sent.subject).not.toContain(secret);
      expect(sent.text).not.toContain(secret);
    }
    expect(sent.bcc).toBeUndefined();
  });

  it("parle de démo pour une demande de démo", async () => {
    process.env.MAIL_DRY_RUN = "1";
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendConfirmationMail({ ...visitor, kind: "demo" }, { locale: "fr" });
    const sent = sentOf(log);
    expect(sent.subject).toBe("Votre demande de démo e-Fanamby");
    expect(sent.text).toContain("demande de démo");
  });

  it("reste en français quand la langue demandée n'est pas ouverte au public (ou inconnue)", async () => {
    process.env.MAIL_DRY_RUN = "1";
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendConfirmationMail(visitor, { locale: "mg" });
    await sendConfirmationMail(visitor, { locale: "xx" });
    expect(JSON.parse(String(log.mock.calls[0][1])).subject).toBe("Votre demande d'essai gratuit e-Fanamby");
    expect(JSON.parse(String(log.mock.calls[1][1])).subject).toBe("Votre demande d'essai gratuit e-Fanamby");
  });

  it("écrit dans la langue de la personne quand cette langue est ouverte (mode aperçu)", async () => {
    process.env.MAIL_DRY_RUN = "1";
    process.env.NEXT_PUBLIC_PREVIEW = "1";
    vi.resetModules();
    const { sendConfirmationMail: fresh } = await import("@/lib/mail");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await fresh(visitor, { locale: "es" });
    delete process.env.NEXT_PUBLIC_PREVIEW;
    expect(JSON.parse(String(log.mock.calls[0][1])).subject).toBe("Su solicitud de prueba gratuita de e-Fanamby");
  });

  it("renvoie « send-failed » si le serveur SMTP est injoignable, sans planter", async () => {
    process.env.SMTP_HOST = "127.0.0.1";
    process.env.SMTP_PORT = "1";
    process.env.SMTP_USER = "u";
    process.env.SMTP_PASS = "p";
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendConfirmationMail(visitor, { locale: "fr" })).toEqual({ ok: false, reason: "send-failed" });
  });
});
