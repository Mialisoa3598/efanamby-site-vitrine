"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { sendForm, type DevNote, type FormState } from "@/app/actions/send-form";
import { cn } from "@/lib/cn";
import {
  HONEYPOT_FIELD,
  LIMITS,
  isMessageRequired,
  parseForm,
  validate,
  type FieldError,
  type FieldErrors,
  type FormKind,
} from "@/lib/validation";
import { CheckCircleFill } from "../icons";
import { Button } from "../ui/button";

/** Visible uniquement avec `npm run dev` : explique pourquoi « Succès » s'affiche alors qu'aucun e-mail n'est parti. */
const DEV_NOTES: Record<DevNote, string> = {
  "dry-run": "aucun e-mail n'a été envoyé, car MAIL_DRY_RUN=1 est réglé dans .env.local. Le message est écrit dans le terminal ([mail:dry-run]). Retirez cette ligne et relancez npm run dev pour envoyer pour de vrai.",
  "robot-trap": "demande ignorée par l'anti-robot (champ piège rempli, souvent par l'autocomplétion du navigateur). Aucun e-mail envoyé.",
  "too-fast": "demande ignorée par l'anti-robot (formulaire envoyé moins de 2 secondes après l'affichage de la page). Aucun e-mail envoyé.",
};

export type FormLabels = {
  name: string;
  namePlaceholder: string;
  structure: string;
  structurePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  message: string;
  messagePlaceholder: string;
  optional: string;
  consentBefore: string;
  consentLink: string;
  errorRequired: string;
  errorEmail: string;
  errorTooLong: string;
  errorConsent: string;
  errorSummary: string;
  success: string;
  successConfirmation: string;
  failure: string;
  send: string;
  sending: string;
  tabsLabel: string;
  tabTrial: string;
  tabDemo: string;
};

type Props = {
  variant: "contact" | "trial";
  locale: string;
  pageHref: string;
  privacyHref: string;
  recipient: string;
  labels: FormLabels;
};

const INITIAL: FormState = { status: "idle" };
const noopSubscribe = () => () => {};

export function RequestForm({ variant, locale, pageHref, privacyHref, recipient, labels: t }: Props) {
  const id = useId();
  const [state, action, pending] = useActionState(sendForm, INITIAL);
  // Type de demande : le choix de la personne l'emporte ; sinon « démo » si l'adresse porte ?formule=demo, sinon la valeur par défaut de la page.
  // L'adresse n'existe que dans le navigateur : côté serveur on lit « null », puis React relit la vraie valeur après l'affichage (sans écart d'hydratation).
  const formule = useSyncExternalStore(noopSubscribe, () => new URLSearchParams(window.location.search).get("formule"), () => null);
  const [picked, setPicked] = useState<FormKind | null>(null);
  const kind: FormKind = picked ?? (variant === "trial" ? (formule === "demo" ? "demo" : "trial") : "contact");
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const tsRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Horodatage d'affichage (piège à robots) : écrit une fois, à l'affichage, dans le champ caché.
  useEffect(() => {
    if (tsRef.current) tsRef.current.value = String(Date.now());
  }, []);

  const serverErrors = state.status === "error" && state.code === "invalid" ? state.errors : null;
  const errors: FieldErrors = clientErrors ?? serverErrors ?? {};
  const failed = state.status === "error" && state.code === "failed";
  const values = state.status === "error" ? state.values : null;
  const errorCount = Object.keys(errors).length;

  // Après une erreur renvoyée par le serveur : le focus va au résumé, puis chaque champ en erreur est annoncé.
  useEffect(() => {
    if (serverErrors) summaryRef.current?.focus();
  }, [serverErrors]);
  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
  }, [state.status]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const found = validate(parseForm(new FormData(event.currentTarget)));
    if (Object.keys(found).length > 0) {
      event.preventDefault();
      setClientErrors(found);
      requestAnimationFrame(() => summaryRef.current?.focus());
    } else {
      setClientErrors(null);
    }
  }

  const message = (code: FieldError): string =>
    ({ required: t.errorRequired, email: t.errorEmail, tooLong: t.errorTooLong, consent: t.errorConsent })[code];

  if (state.status === "success") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="flex flex-col items-start gap-4 py-6 text-mint outline-none">
        <CheckCircleFill size={40} className="text-green" />
        <p className="m-0 text-[18px] font-semibold leading-[1.4]">{t.success}</p>
        {state.confirmation && <p className="m-0 text-[14px] leading-[1.5] text-mint/80">{t.successConfirmation}</p>}
        {state.devNote && <p className="m-0 max-w-[460px] rounded-[8px] border border-dashed border-[#ffd166]/70 px-3 py-2 text-[12px] leading-[1.5] text-[#ffd166]">Mode développement : {DEV_NOTES[state.devNote]}</p>}
      </div>
    );
  }

  const optionalMark = (field: "structure" | "message") => (field === "message" && isMessageRequired(kind) ? null : <span className="font-normal text-mint/70"> ({t.optional})</span>);

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} noValidate className="text-mint">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="page" value={pageHref} />
      <input ref={tsRef} type="hidden" name="ts" defaultValue="" />
      {/* Piège à robots : invisible et hors de la navigation clavier. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {variant === "trial" && (
        <fieldset className="m-0 mb-[54px] flex h-14 gap-0 rounded-[10px] border-0 bg-white/[0.08] p-2 max-md:mb-8">
          <legend className="sr-only">{t.tabsLabel}</legend>
          {(["trial", "demo"] as const).map((k) => (
            <label key={k} className="relative flex-1 cursor-pointer">
              <input type="radio" name="kind-choice" value={k} checked={kind === k} onChange={() => setPicked(k)} className="peer sr-only" />
              <span className="flex h-10 items-center justify-center whitespace-nowrap rounded-[10px] px-3 text-[13px] font-semibold max-md:px-1 max-md:text-[12.5px] text-mint/70 transition-colors hover:text-mint peer-checked:bg-mint peer-checked:text-navy peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-green">
                {k === "trial" ? t.tabTrial : t.tabDemo}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {(errorCount > 0 || failed) && (
        <p ref={summaryRef} tabIndex={-1} role="alert" className="mb-5 mt-0 rounded-[10px] bg-[#ff9b9b]/15 px-4 py-3 text-[14px] leading-[1.4] text-[#ffb3b3] outline-none">
          {failed ? (
            <>
              {t.failure}{" "}
              <a href={`mailto:${recipient}`} className="font-semibold underline underline-offset-2">
                {recipient}
              </a>
              .
            </>
          ) : (
            t.errorSummary
          )}
        </p>
      )}

      <Field id={`${id}-name`} label={t.name} error={errors.name && message(errors.name)}>
        <input
          id={`${id}-name`}
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={LIMITS.name + 20}
          defaultValue={values?.name ?? ""}
          placeholder={t.namePlaceholder}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${id}-name-err` : undefined}
          className={INPUT}
        />
      </Field>
      <Field id={`${id}-structure`} label={t.structure} suffix={optionalMark("structure")} error={errors.structure && message(errors.structure)}>
        <input
          id={`${id}-structure`}
          name="structure"
          type="text"
          autoComplete="organization"
          maxLength={LIMITS.structure + 20}
          defaultValue={values?.structure ?? ""}
          placeholder={t.structurePlaceholder}
          aria-invalid={errors.structure ? true : undefined}
          aria-describedby={errors.structure ? `${id}-structure-err` : undefined}
          className={INPUT}
        />
      </Field>
      <Field id={`${id}-email`} label={t.email} error={errors.email && message(errors.email)}>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={LIMITS.email + 20}
          defaultValue={values?.email ?? ""}
          placeholder={t.emailPlaceholder}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${id}-email-err` : undefined}
          className={INPUT}
        />
      </Field>
      <Field id={`${id}-message`} label={t.message} suffix={optionalMark("message")} error={errors.message && message(errors.message)}>
        <textarea
          id={`${id}-message`}
          name="message"
          required={isMessageRequired(kind)}
          rows={4}
          maxLength={LIMITS.message + 200}
          defaultValue={values?.message ?? ""}
          placeholder={t.messagePlaceholder}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? `${id}-message-err` : undefined}
          className={cn(INPUT, "h-[116px] tiny:h-[104px] mini:h-[84px] resize-none py-4 leading-[1.5]")}
        />
      </Field>

      <div className="mb-5 mt-4">
        <label className="flex cursor-pointer items-start gap-3 text-[12px] leading-[1.5] text-mint/85">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={values?.consent ?? false}
            required
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? `${id}-consent-err` : undefined}
            className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-[#2fde97]"
          />
          <span>
            {t.consentBefore}{" "}
            <Link href={privacyHref} className="font-semibold text-mint underline underline-offset-2">
              {t.consentLink}
            </Link>
            .
          </span>
        </label>
        {errors.consent && (
          <p id={`${id}-consent-err`} className="m-0 mt-2 text-[13px] leading-[1.4] text-[#ffb3b3]">
            {message(errors.consent)}
          </p>
        )}
      </div>

      <div className="pl-2">
        <Button
          type="submit"
          disabled={pending}
          variant={variant === "trial" ? "green" : "mint"}
          full={variant === "trial"}
          icon={variant === "trial" ? null : "arrow"}
          className={variant === "trial" ? "" : "min-w-[121px] max-md:w-full"}
        >
          {pending ? t.sending : t.send}
        </Button>
      </div>
    </form>
  );
}

// Champ : fond clair translucide, coin bas-droit coupé ; champ actif : bordure verte de 1 px (vert à 60 %) et halo vert diffus de 30 px à 30 %
// (valeurs mesurées sur la capture envoyée par la stagiaire ; états absents du design system).
const INPUT =
  "cut-br rc block h-[62px] tiny:h-14 mini:h-12 w-full rounded-[10px] border border-transparent bg-white/[0.2] px-5 text-[14px] text-mint placeholder:text-[12px] placeholder:text-mint/70 [--cut:10px] [--r:10px] outline-none transition-colors focus:border-green/60 aria-[invalid=true]:border-[#ff9b9b]";

function Field({ id, label, suffix, error, children }: { id: string; label: string; suffix?: ReactNode; error?: string | false; children: ReactNode }) {
  return (
    <div className="mb-[19px] tiny:mb-[14px] mini:mb-2.5">
      <label htmlFor={id} className="mb-3 block text-[16px] font-semibold leading-5 tiny:mb-2">
        {label}
        {suffix}
      </label>
      <div className="rounded-[10px] transition-shadow duration-200 focus-within:shadow-[0_0_30px_rgb(47_222_151/0.3)]">{children}</div>
      {error && (
        <p id={`${id}-err`} className="m-0 mt-2 text-[13px] leading-[1.4] text-[#ffb3b3]">
          {error}
        </p>
      )}
    </div>
  );
}

