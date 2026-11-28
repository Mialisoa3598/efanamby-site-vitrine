import type { Metadata } from "next";
import { ArrowsLeftRightFill, PersonRunFill, SoccerBallFill, TrophyFill } from "@/components/icons";
import { CtaBand } from "@/components/sections/cta-band";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { Faq } from "@/components/ui/faq";
import { Photo } from "@/components/ui/photo";
import { PREVIEW } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { buildMetadata, loadPage, type PageProps } from "@/lib/page";
import { path } from "@/lib/paths";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { t } = await loadPage(params);
  return buildMetadata(params, "references", t.seo.references);
}

// Icônes confirmées par la stagiaire (16/11) : trophée = CFFA, ballon = Barea (qualifications CAN 2027), coureur = Toki, flèches = Disciples FC.
// Échange du 27/11 : le contenu (icône + texte) des deux premières cartes est inversé, les fonds restent à leur place :
// carte sombre (1re) = Barea / ballon, carte claire (2e) = CFFA / trophée. L'ordre des textes dans les fichiers de langue suit (cases[0] = Barea, cases[1] = CFFA).
const CASE_STYLE = [
  { Icon: SoccerBallFill, size: 38, dark: true },
  { Icon: TrophyFill, size: 44, dark: false },
  { Icon: PersonRunFill, size: 38, dark: false },
  { Icon: ArrowsLeftRightFill, size: 36, dark: true },
] as const;

export default async function ReferencesPage({ params }: PageProps) {
  const { lang, t } = await loadPage(params);
  const r = t.references;
  // Les réponses encore « à rédiger » ne sont pas publiées : visibles seulement en mode aperçu (avec la mention).
  const faq = r.faq
    .filter((f) => f.a !== null || PREVIEW)
    .map((f) => ({ q: f.q, a: f.a ?? "[À rédiger avec l'équipe e-Fanamby]" }));

  return (
    <>
      {/* HERO */}
      <section className="hero-fill bg-navy pb-[69px] pt-[18px] max-md:pt-2 lg:flex lg:flex-col">
        <div className="wrap relative isolate flex min-h-[502px] flex-col overflow-hidden rounded-[16px] lg:flex-1 max-lg:min-h-0 max-lg:overflow-visible">
          <div className="flex flex-1 flex-col justify-between px-10 pb-[31px] pt-[43px] max-lg:px-0 max-lg:pb-0 max-lg:pt-8 max-md:pt-6">
            <div>
              <h1 className="m-0 text-[52px] font-bold leading-[1.1] tracking-[-0.025em] text-mint max-md:text-[38px]">
                {r.title[0]}
                <br />
                {r.title[1]}
              </h1>
              <p className="t-body m-0 mt-5 max-w-[470px] text-mint/85 max-lg:max-w-none max-md:mt-4">{r.heroText}</p>
            </div>
            <ul className="mt-10 flex gap-[30px] max-lg:gap-4 max-md:mt-8 max-md:grid max-md:grid-cols-2">
              {r.stats.map((s) => (
                <li key={s.value} className="glass cut-br rc flex h-[122px] w-[200px] flex-col justify-center rounded-[16px] px-5 text-mint [--cut:24px] [--r:16px] max-md:h-[112px] max-md:w-auto max-md:px-4">
                  <p className="m-0 text-[56px] font-bold leading-none tracking-[-0.02em] max-md:text-[42px]">
                    <CountUp value={s.value} />
                  </p>
                  <p className="m-0 mt-2 text-[13px] leading-[1.25]">
                    {s.label[0]}
                    <br />
                    {s.label[1]}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          {/* Photo : fond de toute la carte sur desktop ; sous 1024 px, bloc placé après le texte, dont le haut se fond dans le marine. */}
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-[16px] max-lg:relative max-lg:inset-auto max-lg:z-0 max-lg:mt-8 max-lg:h-[440px] max-md:mt-6 max-md:h-[360px]">
            <Photo name="ceremony" alt={t.alt.ceremony} priority className="absolute inset-0 size-full object-cover max-lg:object-[74%_50%]" sizes="(max-width: 1280px) 100vw, 1137px" />
            <div aria-hidden="true" className="absolute inset-0 bg-navy/50" />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,#06062d_0%,#06062d_31%,rgb(6_6_45/0.78)_40%,rgb(6_6_45/0.42)_52%,rgb(6_6_45/0.1)_62%,transparent_66%),linear-gradient(180deg,transparent_72%,rgb(6_6_45/0.55)_100%)] max-lg:bg-[linear-gradient(180deg,#06062d_0%,rgb(6_6_45/0.82)_14%,rgb(6_6_45/0.35)_36%,transparent_60%),linear-gradient(0deg,rgb(6_6_45/0.6)_0%,transparent_26%)]" />
            <p className="absolute bottom-6 right-6 m-0 text-[14px] text-mint/70 max-lg:bottom-4 max-lg:right-4">{r.caption}</p>
          </div>
        </div>
      </section>

      {/* CAS CONCRETS */}
      <section className="sheet pb-[44px] pt-[100px] max-md:pb-6 max-md:pt-14">
        <div className="wrap grid grid-cols-[558px_270px_270px] justify-between gap-x-5 gap-y-5 max-xl:grid-cols-2 max-md:grid-cols-1">
          <h2 className="t-h2 col-span-1 m-0 max-xl:col-span-2 max-md:col-span-1">
            {r.casesTitle}
            <br />
            <span className="text-violet">{r.casesAccent}</span>
          </h2>
          {r.cases.slice(0, 2).map((c, i) => (
            <CaseCard key={c.title} {...c} style={CASE_STYLE[i]} className={i === 0 ? "max-xl:order-1" : "max-xl:order-2"} />
          ))}
          <div data-reveal className="relative h-[230px] overflow-hidden rounded-[16px] cut-tr-bl rc [--cut:30px] [--r:16px] max-xl:order-5 max-xl:col-span-2 max-md:hidden">
            <Photo name="tacticalBoard" alt={t.alt.tacticalBoard} className="size-full object-cover" sizes="(max-width: 1024px) 90vw, 558px" />
            <div aria-hidden="true" className="absolute inset-0 bg-navy/35" />
          </div>
          {r.cases.slice(2).map((c, i) => (
            <CaseCard key={c.title} {...c} style={CASE_STYLE[i + 2]} className={i === 0 ? "max-xl:order-4" : "max-xl:order-3"} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="pb-[55px] pt-[56px] max-md:pt-14">
        <div data-reveal className="wrap grid grid-cols-[1fr_574px] max-xl:grid-cols-[1fr_minmax(0,500px)] max-xl:gap-x-10 max-lg:grid-cols-1 max-lg:gap-10">
          <div className="flex flex-col justify-between gap-10 pb-[35px] pt-6 max-lg:p-0">
            <h2 className="t-h2 m-0">
              {r.faqTitle} <span className="text-violet">{r.faqAccent}</span>
            </h2>
            <div className="max-w-[360px] max-lg:max-w-none">
              <p className="m-0 text-[14px] leading-[20px]">{r.faqIntro}</p>
              <Button href={path(lang, "contact")} variant="violet-grad" size="sm" className="mt-4">
                {t.common.contactUs}
              </Button>
            </div>
          </div>
          <div className="max-w-[520px] max-lg:max-w-none"><Faq items={faq} name="faq-references" /></div>
        </div>
      </section>

      <div className="pb-[70px]">
        <CtaBand title={r.ctaTitle} button={t.common.trial} href={path(lang, "trial")} tall />
      </div>
    </>
  );
}

function CaseCard({ title, text, style, className }: { title: string; text: string; style: (typeof CASE_STYLE)[number]; className?: string }) {
  const { Icon, size, dark } = style;
  return (
    <article
      data-reveal
      className={cn(
        "cut-tr-bl rc relative flex h-[230px] flex-col justify-between rounded-[16px] px-6 pb-6 pt-[26px] [--cut:30px] [--r:16px]",
        dark ? "bg-[linear-gradient(180deg,#07072f_0%,#2a10b4_100%)] text-white" : "bg-[#d6f7e9] text-navy",
        className,
      )}
    >
      <Icon size={size} />
      <div>
        <h3 className="m-0 max-w-[200px] text-[18px] font-semibold leading-[1.2]">{title}</h3>
        <p className="m-0 mt-3 max-w-[204px] text-[14px] leading-[1.25]">{text}</p>
      </div>
    </article>
  );
}
