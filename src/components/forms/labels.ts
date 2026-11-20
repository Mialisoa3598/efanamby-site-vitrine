import type { Messages } from "@/i18n/types";
import type { FormLabels } from "./request-form";

/** Textes du formulaire passés au composant client (uniquement ce dont il a besoin, pas tout le dictionnaire). */
export function formLabels(t: Messages): FormLabels {
  return { ...t.form, send: t.common.send, sending: t.common.sending, tabsLabel: t.trial.tabsLabel, tabTrial: t.trial.tabTrial, tabDemo: t.trial.tabDemo };
}
