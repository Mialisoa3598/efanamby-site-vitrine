// Type commun à toutes les langues : mêmes clés, mêmes formes. Les valeurs sont des textes
// (ou null pour une réponse de FAQ encore à rédiger). Les longueurs des listes sont vérifiées par les tests.
import type { fr } from "./messages/fr";

type Widen<T> = T extends string
  ? string
  : T extends null
    ? null
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : T extends object
        ? { [K in keyof T]: Widen<T[K]> }
        : T;

export type Messages = Widen<typeof fr>;
