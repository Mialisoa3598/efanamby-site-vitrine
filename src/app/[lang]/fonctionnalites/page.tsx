import type { Metadata } from "next";
import { FeatureIcons } from "@/components/icons";
import { Photo } from "@/components/ui/photo";
import type { ImageKey } from "@/lib/images";
import { buildMetadata, loadPage, type PageProps } from "@/lib/page";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { t } = await loadPage(params);
  return buildMetadata(params, "features", t.seo.features);
}

// Une icône Phosphor (graisse regular) par carte, dans l'ordre de la maquette.
const ICON_ORDER = ["translate", "dashboard", "matches", "stats", "player", "multi", "tactical", "report", "players"] as const;
// Taille, position et flou de chaque filigrane, relevés dans l'export SVG de la maquette :
// « size » = côté de l'icône Phosphor (le tracé occupe 69 à 97 % du côté), « left/top » = position dans la carte (px, à 1280),
// « blur » = rayon du flou gaussien (stdDeviation du SVG), qui n'est pas le même pour toutes les icônes.
const WATERMARK = [
  { size: 329, left: 45, top: -31, blur: 20 },
  { size: 338, left: 55, top: -43, blur: 20 },
  { size: 344, left: 27, top: -38, blur: 14 },
  { size: 312, left: 67, top: -33, blur: 20 },
  { size: 300, left: 83, top: -21, blur: 18 },
  { size: 271, left: 101, top: -7, blur: 15 },
  { size: 303, left: 74, top: -17, blur: 17 },
  { size: 284, left: 84, top: -1, blur: 15 },
  { size: 308, left: 32, top: -13, blur: 15 },
] as const;

export default async function FeaturesPage({ params }: PageProps) {
  const { t } = await loadPage(params);
  const f = t.features;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-clip bg-navy pb-10 max-lg:pb-0">
        {/* Desktop : deux halos violets de la maquette. Sous 1024 px : un fond en pixels (pas en pourcentages, donc jamais étiré par la hauteur de la page) :
            dégradé vertical marine → violet, halo lavande en haut à droite et halo vif derrière l'ordinateur. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_100%_8%,rgb(120_105_255/0.55)_0%,transparent_70%),radial-gradient(80%_100%_at_35%_90%,#3b17e8_0%,rgb(65_26_255/0.5)_40%,transparent_75%)] max-lg:bg-[radial-gradient(460px_380px_at_100%_0%,rgb(125_110_255/0.5)_0%,transparent_72%),radial-gradient(560px_430px_at_62%_calc(100%-150px),rgb(88_58_255/0.75)_0%,rgb(65_26_255/0.38)_50%,transparent_78%),linear-gradient(180deg,#06062d_0%,#0c0a66_34%,#2412c8_72%,#3517e6_100%)]" />
        <div className="wrap relative min-h-[600px] max-xl:min-h-[540px] max-lg:min-h-0 max-lg:pb-6">
          <div className="max-w-[560px] pt-[76px] max-xl:max-w-[400px] max-xl:pt-12 max-lg:max-w-none max-md:pt-5">
            <h1 className="t-h1 m-0 text-mint">{f.title}</h1>
            <p className="t-body mt-4 max-w-[470px] text-mint/85 max-lg:max-w-none">{f.text}</p>
          </div>
          <ul className="absolute bottom-[63px] left-0 flex gap-7 max-xl:bottom-10 max-xl:gap-4 max-lg:static max-lg:mt-10 max-md:mt-6 max-md:flex-col max-md:gap-4">
            {f.modes.map((m) => (
              <li key={m.title} className="glass cut-br rc flex h-[95px] w-[238px] flex-col justify-center rounded-[16px] px-4 text-mint [--cut:24px] [--r:16px] max-xl:w-[232px] max-md:w-full">
                <p className="m-0 text-[24px] font-bold leading-[1.2] tracking-[-0.02em] max-xl:text-[22px] max-md:text-[24px]">{m.title}</p>
                <p className="m-0 mt-0.5 text-[14px]">{m.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="pointer-events-none absolute -right-[103px] top-[-12px] w-[920px] max-xl:-right-[70px] max-xl:top-auto max-xl:-bottom-10 max-xl:w-[660px] max-lg:relative max-lg:bottom-auto max-lg:left-1/2 max-lg:mt-4 max-lg:w-[min(124%,820px)] max-lg:max-w-none max-lg:-translate-x-1/2 max-md:left-0 max-md:-mt-6 max-md:w-[152%] max-md:-translate-x-[17%]">
          <Photo name="laptopHands" alt={t.alt.laptopHands} priority className="h-auto w-full" sizes="(max-width: 767px) 152vw, (max-width: 1024px) 124vw, 920px" />
        </div>
      </section>

      {/* GRILLE DES 9 FONCTIONNALITÉS */}
      <section className="sheet pb-[93px] pt-[64px] max-md:pt-12">
        <div className="wrap">
          <h2 className="t-h2 m-0">
            {f.gridTitle} <span className="text-violet">{f.gridAccent}</span>
          </h2>
          <ul className="mt-[56px] grid grid-cols-3 gap-8 max-lg:grid-cols-2 max-lg:gap-5 max-md:grid-cols-1 max-md:mt-8">
            {f.items.map((item, i) => {
              const Icon = FeatureIcons[ICON_ORDER[i]];
              const w = WATERMARK[i];
              return (
                <li
                  key={item.title}
                  data-reveal
                  data-reveal-delay={i % 3}
                  className="cut-br rc relative flex h-[342px] flex-col justify-end overflow-hidden rounded-[16px] bg-[linear-gradient(225deg,#8c85ff_0%,#c9cbfb_48%,#eafaf3_100%)] p-5 pb-[18px] [--cut:50px] [--r:16px] max-md:h-[300px]"
                >
                  <span aria-hidden="true" className="pointer-events-none absolute text-violet" style={{ left: w.left, top: w.top, filter: `blur(${w.blur}px)` }}>
                    <Icon size={w.size} />
                  </span>
                  <h3 className="relative m-0 text-[20px] font-bold leading-[1.25]">{item.title}</h3>
                  <p className="relative m-0 mt-2 max-w-[240px] text-[13.5px] leading-[1.35]">{item.text}</p>
                </li>
              );
            })}
          </ul>
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
