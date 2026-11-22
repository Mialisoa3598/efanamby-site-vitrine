import type { Metadata } from "next";
import { CtaBand } from "@/components/sections/cta-band";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { Photo } from "@/components/ui/photo";
import { cn } from "@/lib/cn";
import { buildMetadata, loadPage, type PageProps } from "@/lib/page";
import { path } from "@/lib/paths";
import Link from "next/link";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { t } = await loadPage(params);
  return buildMetadata(params, "home", { title: t.meta.homeTitle, description: t.meta.homeDescription });
}

// Placement des 4 cartes « problèmes » et de la photo dans la grille de 4 colonnes (maquette desktop).
const PROBLEM_SLOTS = [
  { col: "col-start-2 row-start-1", tone: "violet" },
  { col: "col-start-3 row-start-1", tone: "outline" },
  { col: "col-start-2 row-start-2", tone: "outline" },
  { col: "col-start-4 row-start-2", tone: "violet" },
] as const;

export default async function HomePage({ params }: PageProps) {
  const { lang, t } = await loadPage(params);
  const h = t.home;
  const trialHref = path(lang, "trial");

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-clip bg-navy pb-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_95%_at_80%_92%,#411aff_0%,rgb(65_26_255/0.55)_38%,transparent_72%)] max-lg:bg-[radial-gradient(150%_620px_at_78%_100%,#411aff_0%,rgb(65_26_255/0.62)_34%,rgb(65_26_255/0.2)_62%,transparent_82%)]" />
        <div className="wrap relative grid min-h-[595px] items-center max-xl:min-h-[500px] max-lg:min-h-0 max-lg:py-14 max-md:pb-3 max-md:pt-5">
          <div className="relative z-10 max-w-[640px] pt-2 max-xl:max-w-[470px] max-lg:max-w-none">
            <h1 className="t-h1 m-0 text-mint">
              {h.heroTitle[0]}
              <br />
              {h.heroTitle[1]}
            </h1>
            <p className="t-body-lg mt-8 max-w-[560px] font-normal text-mint/85 max-md:mt-4">{h.heroText}</p>
            <div className="mt-[26px] flex flex-wrap gap-3 max-md:mt-5 max-md:flex-col">
              <Button href={trialHref} icon="arrow-box" size="lg" className="min-w-[224px] max-md:h-[60px] max-md:w-full max-md:min-w-0 max-md:[--cut:14px] max-md:[--r:10px]">
                {t.common.trial}
              </Button>
              <Button href={`${trialHref}?formule=demo`} variant="outline-light" icon="play" size="lg" className="min-w-[224px] max-md:h-[60px] max-md:w-full max-md:min-w-0 max-md:[--cut:14px] max-md:[--r:10px]">
                {t.common.demo}
              </Button>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-5 h-[620px] w-[575px] max-xl:h-[480px] max-xl:w-[440px] max-lg:relative max-lg:right-auto max-lg:top-auto max-lg:ml-auto max-lg:mt-2 max-lg:h-auto max-lg:w-[min(108%,700px)] max-lg:max-w-none max-lg:translate-x-[4%]">
          <Photo name="ball" alt={t.alt.ball} priority className="absolute -left-[6px] -top-[31px] z-10 size-[160px] max-xl:size-[120px] max-lg:left-[2%] max-lg:top-[2%] max-lg:size-[24%]" />
          <Photo name="laptopPlatform" alt={t.alt.laptopPlatform} priority className="absolute right-0 top-0 w-[575px] max-xl:w-[440px] max-lg:static max-lg:ml-auto max-lg:w-[100%]" sizes="(max-width: 1024px) 110vw, 575px" />
        </div>
      </section>

      {/* PROBLÈMES */}
      <section className="sheet overflow-x-clip pt-20 max-md:pt-14">
        <div className="wrap relative">
          <h2 className="t-h2 relative m-0 max-w-[800px] text-navy">{h.problemsTitle}</h2>
          <div className="relative mt-[44px]">
          {/* Lueur de la maquette (Figma « Vector 27 ») : même tache violette (#411AFF à 32 %), même flou (72 px), calée sur la grille de cartes. Elle est derrière les cartes (la liste suivante est « relative ») et derrière le panneau marine plus bas, qui est lui aussi « relative » : il passe par-dessus au lieu de la laisser transparaître. Pour la changer : le tracé « d », l'opacité (fillOpacity) ou le flou (stdDeviation). */}
          <svg aria-hidden="true" focusable="false" viewBox="0 0 1136 496" preserveAspectRatio="none" className="pointer-events-none absolute left-0 top-0 h-[496px] w-full overflow-visible max-xl:h-full max-md:hidden">
            <defs>
              <filter id="home-glow" filterUnits="userSpaceOnUse" x="-320" y="-280" width="1776" height="1056" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation="72" />
              </filter>
            </defs>
            <path d="M1134.8 496H0C0 496 249.455 271.3 419.925 294.11C589.478 316.8 757.365 20.926 990.82 86.512C1166.33 135.817 1134.8 496 1134.8 496Z" fill="#411AFF" fillOpacity="0.32" filter="url(#home-glow)" />
          </svg>
          {/* Mobile (cartes empilées) : la tache de la maquette serait écrasée sur 340 px de large. On garde une lueur douce et centrée, visible derrière la colonne de cartes. */}
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[6%] hidden h-[820px] w-[150%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(123_108_255/0.55)_0%,rgb(123_108_255/0.42)_42%,rgb(123_108_255/0.2)_72%,transparent_100%)] max-md:block" />
          <ul className="relative grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">
            {h.problems.map((text, i) => {
              const slot = PROBLEM_SLOTS[i];
              const violet = slot.tone === "violet";
              return (
                <li
                  key={text}
                  data-reveal
                  data-reveal-delay={i % 4}
                  className={cn(
                    "cut-tr-bl rc relative flex h-[230px] items-end rounded-[16px] p-10 pb-[44px] [--cut:30px] [--r:16px] max-xl:col-auto max-xl:row-auto max-xl:h-[200px] max-md:h-[190px]",
                    slot.col,
                    i < 2 ? (i === 0 ? "max-xl:order-1" : "max-xl:order-2") : i === 2 ? "max-xl:order-4" : "max-xl:order-5",
                    violet ? "bg-violet text-white" : "lined bg-white/35 text-navy [--bc:var(--color-navy)]",
                  )}
                >
                  <span aria-hidden="true" className={cn("absolute left-3 top-[13px] h-[30px] w-[28px] rounded-tl-[14px] border-l-[10px] border-t-[10px]", violet ? "border-mint" : "border-navy")} />
                  <span className="max-w-[230px] whitespace-pre-line text-[24px] font-medium leading-[1.18]">{text}</span>
                </li>
              );
            })}
            <li aria-hidden="true" className="col-start-1 row-start-2 h-[230px] max-xl:order-3 overflow-hidden rounded-[16px] cut-tr-bl rc [--cut:30px] [--r:16px] max-xl:col-auto max-xl:col-span-2 max-xl:row-auto max-xl:h-[200px] max-md:col-span-1 max-md:h-[180px]">
              <div className="relative size-full"><Photo name="notebook" alt="" className="size-full object-cover" sizes="270px" /><div className="absolute inset-0 bg-[#2a1fa0]/30" /></div>
            </li>
          </ul>
          </div>
        </div>
      </section>

      {/* FOOTBALL ANALYTICS */}
      <section className="pt-32 max-md:pt-16">
        <div className="wrap relative grid grid-cols-[500px_508px] justify-between gap-x-12 rounded-[24px] bg-navy px-10 pb-16 pt-14 max-xl:grid-cols-[1fr_1fr] max-lg:grid-cols-1 max-lg:gap-10 max-md:p-6">
          <div className="flex flex-col">
            <h2 className="t-h2 m-0 text-mint">
              {h.analyticsTitle}
              <br />
              <span className="text-green">{h.analyticsAccent}</span>
            </h2>
            {/* Chaque ligne se déplie (flèche cliquable) : <details> accessible au clavier, sans JavaScript, une seule ligne ouverte à la fois. */}
            <ul className="mt-9 flex flex-col gap-7 max-md:gap-5">
              {h.analyticsItems.map((item, i) => (
                <li key={item.title} data-reveal data-reveal-delay={i}>
                  <details name="analytics" className="group cut-br rc rounded-[16px] bg-mint px-8 text-navy on-light [--cut:28px] [--r:16px] max-md:px-5">
                    <summary className="flex min-h-[105px] cursor-pointer items-center justify-between gap-4 rounded-sm text-[24px] font-medium leading-[1.2] group-open:min-h-0 group-open:items-start group-open:pt-9 group-open:pb-0 max-md:min-h-[84px] max-md:text-[19px] max-md:group-open:pt-7">
                      {item.title}
                      <span className="shrink-0 text-violet">
                        <ArrowDownRight size={40} className="group-open:hidden" />
                        <ArrowUpRight size={40} className="hidden group-open:block" />
                      </span>
                    </summary>
                    <p className="m-0 mt-3 max-w-[400px] pb-8 text-[15px] leading-[1.55] font-normal max-md:pb-6 max-md:text-[14px]">{item.text}</p>
                  </details>
                </li>
              ))}
            </ul>
            <Link href={path(lang, "features")} className="t-link mt-auto flex items-center gap-3 pt-8 text-green hover:underline">
              {t.common.seeFeatures}
              <ArrowRight size={22} />
            </Link>
          </div>
          <div data-reveal data-reveal-delay="1" className="overflow-hidden rounded-[30px] max-lg:max-h-[420px]">
            <div className="relative size-full"><Photo name="goal" alt={t.alt.goal} className="h-full w-full object-cover" sizes="(max-width: 1024px) 90vw, 508px" /><div aria-hidden="true" className="absolute inset-0 bg-navy/45" /></div>
          </div>
        </div>
      </section>

      {/* CONFIANCE */}
      <section className="pt-[120px] max-md:pt-16">
        <div className="wrap">
          <div className="grid grid-cols-[328px_1fr] items-stretch gap-6 max-lg:grid-cols-1">
            <div className="flex flex-col justify-between max-lg:gap-4">
              <h2 className="t-h2 m-0 text-[30px] max-md:text-[26px]">{h.trustTitle}</h2>
              <Link href={path(lang, "references")} className="t-link flex translate-y-2 items-center gap-2 self-start text-navy hover:underline max-lg:translate-y-0 max-md:-my-2.5 max-md:py-2.5">
                {t.common.seeReferences}
                <ArrowRight size={16} />
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              {h.stats.map((s, i) => (
                <li key={s.title} data-reveal data-reveal-delay={i} className="cut-tr-bl rc flex h-[184px] flex-col rounded-[16px] bg-[linear-gradient(135deg,#5233f2_0%,#9d92f7_52%,#d3f6e6_100%)] px-7 pt-5 [--cut:20px] [--r:16px]">
                  <p className="m-0 text-[64px] font-bold leading-[1.05] text-navy">
                    <CountUp value={s.value} />
                  </p>
                  <p className="m-0 mt-2 text-[14px] font-bold text-navy">{s.title}</p>
                  <p className="m-0 mt-1 max-w-[230px] text-[13px] leading-[1.4] text-navy">{s.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal className="relative mt-4 overflow-hidden rounded-[20px]">
            <Photo name="jersey" alt={t.alt.jersey} className="h-[387px] w-full object-cover max-md:h-[220px]" sizes="(max-width: 1280px) 90vw, 1136px" />
            <div aria-hidden="true" className="absolute inset-0 bg-[#0a1a6e]/45 mix-blend-multiply" />
          </div>
        </div>
      </section>

      <div className="pb-[55px] pt-[72px] max-md:pt-14">
        <CtaBand title={h.ctaTitle} button={t.common.trial} href={trialHref} />
      </div>
    </>
  );
}
