// Validation des formulaires : un seul module, utilisé par le navigateur (retour immédiat) ET par le serveur (qui ne fait confiance à rien).

export const LIMITS = { name: 100, structure: 120, email: 254, message: 2000 } as const;

export const FORM_KINDS = ["contact", "trial", "demo"] as const;
export type FormKind = (typeof FORM_KINDS)[number];

/**
 * Demandes qui reçoivent un e-mail de confirmation (décision du 18/11 : l'essai gratuit ; la démo, demandée sur la même page, aussi).
 * Le formulaire Contact n'en envoie pas. Pour changer : modifier cette liste.
 */
/** Nom du champ-piège anti-robot. Volontairement banal : « website », « url »… sont remplis par l'autocomplétion de certains navigateurs. */
export const HONEYPOT_FIELD = "hp_note";

export const CONFIRMED_KINDS: readonly FormKind[] = ["trial", "demo"];

export type FieldName = "name" | "structure" | "email" | "message" | "consent";
export type FieldError = "required" | "email" | "tooLong" | "consent";
export type FieldErrors = Partial<Record<FieldName, FieldError>>;

export type FormValues = {
  kind: FormKind;
  name: string;
  structure: string;
  email: string;
  message: string;
  consent: boolean;
};

// Adresse simple : pas d'espace, un seul « @ », et aucun des caractères < > " ( ) , ; : [ ] \ qui servent à écrire un nom d'affichage ou un commentaire dans un en-tête d'e-mail.
const EMAIL = /^[^\s@<>"(),;:\\[\]]+@[^\s@<>"(),;:\\[\]]+\.[^\s@<>"(),;:\\[\]]{2,}$/;

function text(data: FormData, key: string): string {
  const v = data.get(key);
  // Retire les caractères de contrôle (sauf retours à la ligne dans le message) et les espaces de bord.
  return typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim() : "";
}

export function parseForm(data: FormData): FormValues {
  const kind = text(data, "kind");
  return {
    kind: (FORM_KINDS as readonly string[]).includes(kind) ? (kind as FormKind) : "contact",
    name: text(data, "name"),
    structure: text(data, "structure"),
    email: text(data, "email"),
    message: text(data, "message"),
    consent: data.get("consent") === "on" || data.get("consent") === "true",
  };
}

/** Le message est obligatoire pour une question libre (page Contact), facultatif pour une demande d'essai ou de démo. */
export function isMessageRequired(kind: FormKind): boolean {
  return kind === "contact";
}

export function validate(v: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!v.name) errors.name = "required";
  else if (v.name.length > LIMITS.name) errors.name = "tooLong";

  if (v.structure.length > LIMITS.structure) errors.structure = "tooLong";

  if (!v.email) errors.email = "required";
  else if (v.email.length > LIMITS.email) errors.email = "tooLong";
  else if (!EMAIL.test(v.email)) errors.email = "email";

  if (!v.message) {
    if (isMessageRequired(v.kind)) errors.message = "required";
  } else if (v.message.length > LIMITS.message) errors.message = "tooLong";

  if (!v.consent) errors.consent = "consent";
  return errors;
}

export const FIELD_ORDER: readonly FieldName[] = ["name", "structure", "email", "message", "consent"];
