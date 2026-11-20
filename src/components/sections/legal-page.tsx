import type { Messages } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { path } from "@/lib/paths";
import { Button } from "../ui/button";

/** Page juridique : le texte définitif est en attente (décision du 16/11 : loi nationale 2014-038, entité juridique à venir). */
export function LegalPage({ lang, t, title }: { lang: Locale; t: Messages; title: string }) {
  return (
    <>
      <section className="bg-navy pb-[72px] pt-[64px] max-md:pt-10">
        <div className="wrap">
          <h1 className="m-0 text-[52px] font-bold leading-[1.1] tracking-[-0.025em] text-mint max-md:text-[34px]">{title}</h1>
        </div>
      </section>
      <section className="sheet pb-[120px] pt-[72px] max-md:pt-12">
        <div className="wrap">
          <p className="m-0 max-w-[640px] text-[16px] leading-[1.6]">{t.legal.pending}</p>
          <Button href={path(lang, "home")} variant="violet" className="mt-8">
            {t.common.backHome}
          </Button>
        </div>
      </section>
    </>
  );
}
