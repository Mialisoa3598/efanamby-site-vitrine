import { describe, expect, it } from "vitest";
import { LIMITS, isMessageRequired, parseForm, validate, type FormValues } from "@/lib/validation";

function form(fields: Record<string, string>): FormData {
  const d = new FormData();
  for (const [k, v] of Object.entries(fields)) d.set(k, v);
  return d;
}

const valid: FormValues = { kind: "contact", name: "Rado", structure: "FC Test", email: "rado@exemple.mg", message: "Bonjour", consent: true };

describe("parseForm", () => {
  it("lit les champs, retire les espaces de bord et interprète la case de consentement", () => {
    const v = parseForm(form({ kind: "trial", name: "  Rado  ", structure: "", email: " a@b.mg ", message: "", consent: "on" }));
    expect(v).toEqual({ kind: "trial", name: "Rado", structure: "", email: "a@b.mg", message: "", consent: true });
  });

  it("retombe sur « contact » si le type est inconnu ou absent", () => {
    expect(parseForm(form({ kind: "admin" })).kind).toBe("contact");
    expect(parseForm(new FormData()).kind).toBe("contact");
  });

  it("accepte les trois types connus", () => {
    for (const kind of ["contact", "trial", "demo"] as const) expect(parseForm(form({ kind })).kind).toBe(kind);
  });

  it("le consentement n'est vrai que pour « on » ou « true »", () => {
    expect(parseForm(form({ consent: "on" })).consent).toBe(true);
    expect(parseForm(form({ consent: "true" })).consent).toBe(true);
    expect(parseForm(form({ consent: "off" })).consent).toBe(false);
    expect(parseForm(form({ consent: "" })).consent).toBe(false);
    expect(parseForm(new FormData()).consent).toBe(false);
  });

  it("retire les caractères de contrôle mais garde les retours à la ligne du message", () => {
    const v = parseForm(form({ name: "Ra\u0000do\u0007", message: "ligne 1\nligne 2\u001b" }));
    expect(v.name).toBe("Rado");
    expect(v.message).toBe("ligne 1\nligne 2");
  });

  it("ignore un fichier envoyé à la place d'un texte", () => {
    const d = new FormData();
    d.set("name", new File(["x"], "x.txt"));
    expect(parseForm(d).name).toBe("");
  });
});

describe("validate", () => {
  it("accepte une demande complète", () => {
    expect(validate(valid)).toEqual({});
  });

  it("le nom, l'e-mail et le consentement sont toujours obligatoires", () => {
    const errors = validate({ ...valid, name: "", email: "", consent: false });
    expect(errors).toEqual({ name: "required", email: "required", consent: "consent" });
  });

  it("le message est obligatoire pour Contact, facultatif pour l'essai et la démo", () => {
    expect(isMessageRequired("contact")).toBe(true);
    expect(isMessageRequired("trial")).toBe(false);
    expect(isMessageRequired("demo")).toBe(false);
    expect(validate({ ...valid, message: "" }).message).toBe("required");
    expect(validate({ ...valid, kind: "trial", message: "" })).toEqual({});
    expect(validate({ ...valid, kind: "demo", message: "" })).toEqual({});
  });

  it("la structure est facultative", () => {
    expect(validate({ ...valid, structure: "" })).toEqual({});
  });

  it.each(["rado", "rado@", "@exemple.mg", "rado@exemple", "rado@exemple.m", "ra do@exemple.mg", "rado@@exemple.mg", '"a>b"@exemple.mg', "Rado <rado@exemple.mg>", "rado(commentaire)@exemple.mg", "rado@exemple.mg,autre@exemple.mg", "rado@exemple.mg;autre@exemple.mg"])("refuse l'e-mail invalide « %s »", (email) => {
    expect(validate({ ...valid, email }).email).toBe("email");
  });

  it.each(["rado@exemple.mg", "rado.rakoto+club@fc-test.co.uk", "a@b.cd"])("accepte l'e-mail « %s »", (email) => {
    expect(validate({ ...valid, email }).email).toBeUndefined();
  });

  it("refuse les textes trop longs, et accepte la limite exacte", () => {
    expect(validate({ ...valid, name: "a".repeat(LIMITS.name) }).name).toBeUndefined();
    expect(validate({ ...valid, name: "a".repeat(LIMITS.name + 1) }).name).toBe("tooLong");
    expect(validate({ ...valid, structure: "a".repeat(LIMITS.structure + 1) }).structure).toBe("tooLong");
    expect(validate({ ...valid, message: "a".repeat(LIMITS.message) }).message).toBeUndefined();
    expect(validate({ ...valid, message: "a".repeat(LIMITS.message + 1) }).message).toBe("tooLong");
    expect(validate({ ...valid, email: "a".repeat(LIMITS.email) + "@b.mg" }).email).toBe("tooLong");
  });
});
