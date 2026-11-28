import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, MinusIcon, SparkleFill } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Faq } from "@/components/ui/faq";
import { Photo } from "@/components/ui/photo";
import { buildMetadata, loadPage, type PageProps } from "@/lib/page";
import { path } from "@/lib/paths";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { t } = await loadPage(params);
  return buildMetadata(params, "pricing", t.seo.pricing);
}

export default async function PricingPage({ params }: PageProps) {
  const { lang, t } = await loadPage(params);
  const p = t.pricing;
  const trialHref = path(lang, "trial");

  return (
    <>
      {/* HERO + CARTES : fond marine, lueur verte, feuille menthe qui passe derrière les cartes */}
      <div className="hero-fill-plain relative bg-navy pb-0">
        <div aria-hidden="true" className="absolute inset-x-0 top-[99px] h-[500px] bg-[radial-gradient(ellipse_700px_500px_at_50%_100%,rgb(172_221_205)_0%,rgb(157_215_197)_15%,rgb(74_168_141)_35%,rgb(26_106_94)_55%,rgb(18_67_75)_69%,rgb(11_35_59)_85%,rgb(6_6_45)_100%)] max-lg:top-[60px]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 top-[599px] rounded-t-[24px] bg-mint max-xl:top-[460px]" />
        <div className="wrap relative pt-[80px] max-md:pt-5">
          <h1 className="m-0 text-center text-[52px] font-bold leading-[1.1] tracking-[-0.025em] text-mint max-md:text-[34px]">{p.title}</h1>
          <p className="m-0 mt-1.5 text-center text-[16px] font-medium leading-[1.7] text-mint">{p.text}</p>

          {/* Les quatre cartes sont identiques (même largeur, même hauteur, même gabarit). Contour violet, pastille et prix violets, bouton plus clair :
              c'est l'état « survol / appui / focus clavier » de la maquette, appliqué à la carte touchée, pas une carte mise en avant. */}
          <ul className="mt-[80px] grid list-none grid-cols-4 gap-x-[17px] p-0 max-xl:auto-rows-fr max-xl:grid-cols-2 max-xl:gap-5 max-md:mt-7 max-md:grid-cols-1">
            {p.plans.map((plan, i) => (
              <li
                key={plan.tag}
                data-reveal
                data-reveal-delay={i}
                className="group flex flex-col rounded-[16px] border-2 border-transparent bg-mint px-[18px] pb-7 pt-[19px] shadow-[0_4px_12px_rgb(6_6_45/0.14)] transition-colors duration-150 hover:border-violet focus-within:border-violet active:border-violet xl:min-h-[592px]"
              >
                <p className="m-0 w-fit rounded-[4px] border border-navy px-2 py-1.5 text-[12px] leading-4 text-navy transition-colors duration-150 group-hover:border-violet-25 group-hover:bg-violet-25 group-hover:text-violet group-focus-within:border-violet-25 group-focus-within:bg-violet-25 group-focus-within:text-violet group-active:border-violet-25 group-active:bg-violet-25 group-active:text-violet">
                  {plan.tag}
                </p>
                <p className="m-0 mt-[9.5px] flex items-baseline gap-3 leading-[29px]">
                  <span className="text-[24px] font-bold transition-colors duration-150 group-hover:text-violet group-focus-within:text-violet group-active:text-violet">{plan.price}</span>
                  <span className="text-[16px]">{plan.unit}</span>
                </p>
                <p className="m-0 mt-[6.5px] text-[14px] leading-5">{plan.offer}</p>
                <Button href={trialHref} variant="violet" full className="mt-[22px] group-hover:bg-[#6a4dff] group-focus-within:bg-[#6a4dff] group-active:bg-[#6a4dff]">
                  {t.common.trial}
                </Button>
                <h2 className="m-0 mt-[56px] text-[18px] font-semibold leading-[22px]">{p.featuresLabel}</h2>
                <ul className="m-0 mt-3.5 flex list-none flex-col gap-2.5 p-0 text-[10px] leading-4 max-xl:text-[13px] max-xl:leading-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-[9px]">
                      {/* Boîte de la hauteur d'une ligne de texte : l'icône est centrée sur la 1re ligne quelle que soit la taille du texte. */}
                      <span aria-hidden="true" className="-ml-0.5 flex h-4 shrink-0 items-center max-xl:h-5">
                        <SparkleFill size={20} className="text-violet" />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* TABLEAU COMPARATIF */}
      <section aria-labelledby="table-title" className="pt-[80px] max-md:pt-14">
        <div className="wrap">
          <h2 id="table-title" className="t-h2 m-0 text-center">
            {p.tableTitle}
          </h2>
          <div
            data-reveal
            role="region"
            aria-label={p.tableCaption}
            tabIndex={0}
            className="relative mt-[35px] overflow-x-auto rounded-[16px] border border-navy/25 max-md:mt-8"
          >
            <table className="w-full min-w-[820px] max-md:min-w-[760px] table-fixed border-collapse text-left">
              <caption className="sr-only">{p.tableCaption}</caption>
              <colgroup>
                <col className="w-[288px] max-md:w-[150px]" />
                {p.tableHeads.map((h) => (
                  <col key={h} />
                ))}
              </colgroup>
              <thead>
                <tr className="h-[68px] bg-header-row">
                  <th scope="col" className="px-5">
                    <span className="sr-only">{p.tableCorner}</span>
                  </th>
                  {p.tableHeads.map((h) => (
                    <th key={h} scope="col" className="border-l border-navy/25 px-5 text-[18px] font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.rows.map((row) => (
                  <tr key={row.label} className="h-[81px] border-t border-navy/25">
                    <th scope="row" className="sticky left-0 z-10 bg-mint px-5 py-[14.5px] text-[16px] font-medium leading-[17px] max-md:px-3 max-md:text-[14px]">
                      {row.label.split(/(?<=\.)\s/).map((line, i) => (
                        <span key={i} className="block">
                          {line}
                        </span>
                      ))}
                    </th>
                    {row.cells.map((cell, i) => (
                      <td key={i} className="border-l border-navy/25 px-5 py-[14.5px] align-middle text-[14px] leading-[17px]">
                        <Cell value={cell} yes={p.yes} no={p.no} empty={p.empty} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* QUESTIONS */}
      <section aria-labelledby="pricing-faq" className="pb-[89px] pt-[81px] max-md:pb-14 max-md:pt-14">
        <div className="wrap">
          <div data-reveal className="grid grid-cols-[1fr_491px] gap-x-[42px] rounded-[16px] bg-violet px-8 py-[30px] max-xl:grid-cols-1 max-xl:gap-10 max-md:px-4 max-md:py-8">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <h2 id="pricing-faq" className="t-h2 m-0 text-mint">
                  {p.faqTitle}
                </h2>
                <div className="mt-[21px]">
                  <Faq items={p.faq} name="faq-tarifs" variant="card" />
                </div>
              </div>
              <Link
                href={`${path(lang, "references")}#faq`}
                className="on-dark inline-flex w-fit items-center gap-2 text-[13.5px] font-semibold text-mint underline underline-offset-4 max-md:-my-2.5 max-md:py-2.5"
              >
                {t.common.seeFullFaq}
                <ArrowRight size={20} />
              </Link>
            </div>
            <div className="relative h-[576px] overflow-hidden rounded-[16px] max-xl:h-[360px]">
              <Photo name="keyboard" alt={t.alt.keyboard} className="size-full object-cover" sizes="(max-width: 1024px) 90vw, 491px" />
              <div aria-hidden="true" className="absolute inset-0 bg-navy/50" />
              <Button
                href={`${trialHref}?formule=demo`}
                variant="mint"
                className="absolute bottom-7 right-7 max-md:bottom-5 max-md:right-5"
              >
                {t.common.requestDemo}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Cell({ value, yes, no, empty }: { value: string; yes: string; no: string; empty: string }) {
  if (value === "yes") {
    return (
      <>
        <Check size={29} className="-ml-1" />
        <span className="sr-only">{yes}</span>
      </>
    );
  }
  if (value === "no") {
    return (
      <>
        <MinusIcon size={35} className="-ml-[5px]" />
        <span className="sr-only">{no}</span>
      </>
    );
  }
  if (value === "empty") {
    return (
      <>
        <MinusIcon size={35} className="-ml-[5px]" />
        <span className="sr-only">{empty}</span>
      </>
    );
  }
  if (value.startsWith("yes:")) {
    return (
      <span className="flex items-center gap-3">
        <Check size={29} className="-ml-1 shrink-0" />
        <span className="sr-only">{yes} :</span>
        {value.slice(4)}
      </span>
    );
  }
  return <>{value}</>;
}
