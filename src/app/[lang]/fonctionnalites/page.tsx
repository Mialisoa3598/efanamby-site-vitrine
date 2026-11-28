import type { Metadata } from "next";
import { FeatureCards } from "@/components/sections/feature-cards";
import { Photo } from "@/components/ui/photo";
import type { ImageKey } from "@/lib/images";
import { buildMetadata, loadPage, type PageProps } from "@/lib/page";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { t } = await loadPage(params);
  return buildMetadata(params, "features", t.seo.features);
}

export default async function FeaturesPage({ params }: PageProps) {
  const { t } = await loadPage(params);
  const f = t.features;

  return (
    <>
      {/* HERO */}
      <section className="hero-fill relative overflow-clip bg-navy pb-10 max-lg:pb-0 lg:flex lg:flex-col">
        {/* Desktop : deux halos violets de la maquette. Sous 1024 px : un fond en pixels (pas en pourcentages, donc jamais étiré par la hauteur de la page) :
            dégradé vertical marine → violet, halo lavande en haut à droite et halo vif derrière l'ordinateur. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_100%_30%,rgb(120_105_255/0.55)_0%,transparent_70%),radial-gradient(80%_100%_at_35%_90%,#3b17e8_0%,rgb(65_26_255/0.5)_40%,transparent_75%)] max-lg:bg-[radial-gradient(460px_380px_at_100%_0%,rgb(125_110_255/0.5)_0%,transparent_72%),radial-gradient(560px_430px_at_62%_calc(100%-150px),rgb(88_58_255/0.75)_0%,rgb(65_26_255/0.38)_50%,transparent_78%),linear-gradient(180deg,#06062d_0%,#0c0a66_34%,#2412c8_72%,#3517e6_100%)]" />
        {/* Même échelle que l'Accueil : texte de 18 px, cartes plus grandes dès 1440 px de large, et groupe (titre, texte, cartes) centré puis remonté au centre optique (marge basse = 10 % de la hauteur d'écran). */}
        <div className="wrap relative min-h-[600px] max-xl:min-h-[540px] max-lg:min-h-0 max-lg:pb-6 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:pb-[clamp(24px,10svh,120px)]">
          <div className="max-w-[560px] max-xl:max-w-[400px] max-lg:max-w-none max-lg:pt-12 max-md:pt-5">
            <h1 className="t-h1 m-0 text-mint">{f.title}</h1>
            <p className="t-body mt-4 max-w-[470px] text-mint/85 max-lg:max-w-none md:mt-8 md:text-[18px]! md:leading-[1.55]! xl:max-w-[500px] min-[1440px]:max-w-[560px]">{f.text}</p>
          </div>
          <ul className="mt-[clamp(72px,16svh,200px)] flex gap-7 max-xl:mt-[160px] max-xl:gap-4 max-lg:mt-10 max-md:mt-6 max-md:flex-col max-md:gap-4">
            {f.modes.map((m) => (
              <li key={m.title} className="glass cut-br rc flex h-[95px] w-[238px] flex-col justify-center rounded-[16px] px-4 text-mint [--cut:24px] [--r:16px] max-xl:w-[232px] max-md:w-full min-[1440px]:h-[108px] min-[1440px]:w-[264px] min-[1440px]:px-5">
                <p className="m-0 text-[24px] font-bold leading-[1.2] tracking-[-0.02em] max-xl:text-[22px] min-[1440px]:text-[26px] max-md:text-[24px]">{m.title}</p>
                <p className="m-0 mt-0.5 text-[14px] min-[1440px]:text-[15px]">{m.text}</p>
              </li>
            ))}
          </ul>
        </div>
        {/* Image agrandie (≥ 1280 px de large) : largeur --lh-w = 1,68 × (hauteur d'écran − 156 px) pour que l'ordinateur occupe tout le premier écran comme sur l'Accueil, plafonnée à droite (73,6 % de la largeur − 9 px, ou − 94 px dès 1440 px car les cartes sont plus larges) pour ne jamais toucher le texte, jamais sous 920 px ni au-delà de 1240 px. Le débord à droite (mains) garde la même proportion : 11,2 % de la largeur. */}
        <div className="pointer-events-none absolute right-[calc(var(--lh-w)*-0.112)] bottom-[39px] w-[var(--lh-w)] [--lh-w:max(920px,min(calc((100svh-156px)*1.68),calc(73.6vw-9px),1240px))] min-[1440px]:[--lh-w:max(920px,min(calc((100svh-156px)*1.68),calc(73.6vw-94px),1240px))] max-xl:-right-[70px] max-xl:-bottom-10 max-xl:w-[660px] max-lg:relative max-lg:bottom-auto max-lg:left-1/2 max-lg:mt-4 max-lg:w-[min(124%,820px)] max-lg:max-w-none max-lg:-translate-x-1/2 max-md:left-0 max-md:-mt-6 max-md:w-[152%] max-md:-translate-x-[17%]">
          <Photo name="laptopHands" alt={t.alt.laptopHands} priority className="h-auto w-full" sizes="(max-width: 767px) 152vw, (max-width: 1024px) 124vw, 1100px" />
        </div>
      </section>

      {/* GRILLE DES 9 FONCTIONNALITÉS */}
      <section className="sheet pb-[93px] pt-[64px] max-md:pt-12">
        <div className="wrap">
          <h2 className="t-h2 m-0">
            {f.gridTitle} <span className="text-violet">{f.gridAccent}</span>
          </h2>
          <FeatureCards items={f.items} />
        </div>
      </section>

      {/* PUBLICS */}
      <section className="pb-[96px] max-md:pb-14">
        <div className="wrap grid grid-cols-[1fr_701px] gap-x-8 rounded-[20px] bg-navy py-10 pl-9 pr-10 max-xl:grid-cols-1 max-xl:gap-8 max-xl:px-8 max-md:p-6">
          <h2 className="t-h2 m-0 max-w-[290px] text-[36px] leading-[1.28] text-mint max-xl:max-w-none">
            {f.audiencesTitle} <span className="text-green">{f.audiencesAccent}</span>
          </h2>
          <ul className="grid grid-cols-3 gap-7 max-xl:gap-5 max-md:grid-cols-1">
            {f.audiences.map((a, i) => {
              // Même ordre que « audiences » dans les textes : club, médias, fédérations.
              const { name: photo, alt } = [
                { name: "audienceClub", alt: t.alt.audienceClub },
                { name: "audienceMedia", alt: t.alt.audienceMedia },
                { name: "audienceFederation", alt: t.alt.audienceFederation },
              ][i] as { name: ImageKey; alt: string };
              return (
                <li key={a.title} data-reveal data-reveal-delay={i} className="relative isolate h-[539px] overflow-hidden rounded-[16px] max-xl:h-[420px] max-md:h-[360px]">
                  <Photo name={photo} alt={alt} className="absolute inset-0 -z-10 size-full object-cover" sizes="(max-width: 768px) 90vw, 215px" />
                  <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(6_6_45/0.92)_0%,rgb(6_6_45/0.55)_35%,rgb(6_6_45/0.25)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-[18px] pb-[26px] text-mint">
                    <h3 className="m-0 text-[18px] font-bold leading-[1.05]">{a.title}</h3>
                    <p className="m-0 mt-1.5 text-[13px] leading-[1.3]">{a.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
