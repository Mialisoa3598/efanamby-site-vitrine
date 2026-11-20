import type { Metadata } from "next";
import { RequestForm } from "@/components/forms/request-form";
import { formLabels } from "@/components/forms/labels";
import { Photo } from "@/components/ui/photo";
import { buildMetadata, loadPage, type PageProps } from "@/lib/page";
import { path } from "@/lib/paths";
import { FORM_RECIPIENT, PAGES } from "@/lib/site";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { t } = await loadPage(params);
  return buildMetadata(params, "trial", t.seo.trial);
}

export default async function TrialPage({ params }: PageProps) {
  const { lang, t } = await loadPage(params);
  return (
    <div className="page-ends-navy relative isolate overflow-hidden bg-navy pb-[141px] pt-[115px] max-md:pb-16 max-md:pt-14">
      {/* Photo de terrain en fond : le voile marine (relevé sur la maquette) est plein en haut et en bas, à 50 % au milieu. */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-[5px] -z-10 h-[855px] max-md:h-[700px]">
        <Photo name="pitch" alt="" className="size-full object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#06062d_0%,#06062d_9%,rgb(6_6_45/0.88)_15.1%,rgb(6_6_45/0.66)_26.8%,rgb(6_6_45/0.5)_38.5%,rgb(6_6_45/0.5)_79.4%,rgb(6_6_45/0.63)_85.3%,rgb(6_6_45/0.86)_91.1%,#06062d_100%)]" />
      </div>

      <div className="wrap text-center">
        <h1 className="m-0 text-[52px] font-bold leading-[1.1] tracking-[-0.022em] text-mint max-md:text-[34px]">{t.trial.title}</h1>
        <p className="m-0 mt-[11px] text-[16px] leading-[1.7] text-mint/90">{t.trial.text}</p>
      </div>

      <div className="mx-auto mt-[31px] w-full max-w-[556px] px-6 md:px-0">
        <div className="glass-panel rounded-[20px] px-10 pb-10 pt-9 text-left max-md:px-5 max-md:py-6">
          <RequestForm variant="trial" locale={lang} pageHref={`/${lang}${PAGES.trial}`} privacyHref={path(lang, "privacy")} recipient={FORM_RECIPIENT} labels={formLabels(t)} />
        </div>
      </div>
    </div>
  );
}
