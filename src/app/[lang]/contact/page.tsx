import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EnvelopeFill, FacebookFill, LinkedinFill, WhatsappFill } from "@/components/icons";
import { RequestForm } from "@/components/forms/request-form";
import { formLabels } from "@/components/forms/labels";
import { buildMetadata, loadPage, type PageProps } from "@/lib/page";
import { path } from "@/lib/paths";
import { CONTACT, FORM_RECIPIENT, PAGES } from "@/lib/site";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { t } = await loadPage(params);
  return buildMetadata(params, "contact", t.seo.contact);
}

export default async function ContactPage({ params }: PageProps) {
  const { lang, t } = await loadPage(params);
  const channels: { key: string; icon: ReactNode; text: string; href?: string; external?: boolean }[] = [
    { key: "email", icon: <EnvelopeFill size={28} />, text: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { key: "linkedin", icon: <LinkedinFill size={28} />, text: CONTACT.linkedinDisplay, href: CONTACT.linkedinHref, external: true },
    { key: "whatsapp", icon: <WhatsappFill size={28} />, text: CONTACT.whatsappDisplay, href: CONTACT.whatsappHref, external: true },
    { key: "facebook", icon: <FacebookFill size={28} />, text: CONTACT.facebookDisplay, href: CONTACT.facebookHref || undefined, external: true },
  ];

  return (
    <div className="page-ends-navy relative isolate overflow-hidden bg-navy pb-[66px] max-md:pb-12">
      {/* Lueur verte du bas de page (relevée sur la maquette) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_810px_520px_at_50%_calc(100%-51px),rgb(164_213_199)_0%,rgb(158_213_196)_4%,rgb(138_205_184)_13%,rgb(98_182_156)_23%,rgb(60_153_128)_33%,rgb(34_120_104)_42%,rgb(22_88_85)_52%,rgb(17_63_73)_62%,rgb(14_44_64)_71%,rgb(8_16_50)_90%,rgb(6_6_45)_100%)]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-3.5 bg-[linear-gradient(to_top,#06062d_0%,transparent_100%)]" />

      <div className="wrap grid grid-cols-[1fr_556px] gap-x-12 pt-[23px] max-lg:grid-cols-1 max-lg:gap-y-10">
        <div className="flex flex-col justify-between gap-12 pt-9 max-lg:pt-4">
          <div>
            <h1 className="m-0 text-[64px] font-bold leading-[1.1] tracking-[-0.025em] text-mint max-md:text-[44px]">{t.contact.title}</h1>
            <p className="m-0 mt-3 text-[16px] leading-[1.5] text-mint">{t.contact.text}</p>
          </div>
          <div>
            <h2 className="sr-only">{t.contact.channels}</h2>
            <ul className="m-0 flex list-none flex-col gap-4 p-0 pl-[5px] text-[12px] text-mint">
              {channels.map((c) => (
                <li key={c.key} className="flex items-center gap-3">
                  {c.icon}
                  {c.href ? (
                    <a href={c.href} {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="underline-offset-4 hover:underline max-md:-my-2 max-md:inline-block max-md:py-2">
                      {c.text}
                    </a>
                  ) : (
                    <span>{c.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="glass-panel rounded-[20px] px-10 pb-10 pt-[42px] max-md:px-5 max-md:py-8">
          <RequestForm variant="contact" locale={lang} pageHref={`/${lang}${PAGES.contact}`} privacyHref={path(lang, "privacy")} recipient={FORM_RECIPIENT} labels={formLabels(t)} />
        </div>
      </div>
    </div>
  );
}
