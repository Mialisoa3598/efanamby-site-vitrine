import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { path } from "@/lib/paths";
import { CONTACT } from "@/lib/site";
import { FacebookFill, LinkedinFill } from "../icons";
import { Logo } from "../logo";

export function Footer({ locale, t }: { locale: Locale; t: Messages }) {
  const links = [
    { href: path(locale, "features"), label: t.nav.features },
    { href: path(locale, "pricing"), label: t.nav.pricing },
    { href: path(locale, "references"), label: t.nav.references },
    { href: path(locale, "contact"), label: t.nav.contact },
  ];
  const legal = [
    { href: path(locale, "legal"), label: t.footer.legal },
    { href: path(locale, "terms"), label: t.footer.terms },
    { href: path(locale, "privacy"), label: t.footer.privacy },
  ];
  // href typé « string » : un lien Facebook vide (CONTACT.facebookHref = "") reste possible et s'affiche alors sans lien.
  const social: { name: string; href: string; Icon: typeof FacebookFill }[] = [
    { name: t.footer.facebook, href: CONTACT.facebookHref, Icon: FacebookFill },
    { name: t.footer.linkedin, href: CONTACT.linkedinHref, Icon: LinkedinFill },
  ];

  return (
    <footer className="rounded-t-[24px] bg-navy text-mint">
      <div className="wrap grid grid-cols-[1fr_auto] items-center gap-x-10 pb-[35px] pt-10 max-md:grid-cols-1 max-md:gap-y-5">
        <Link href={path(locale, "home")} aria-label={`${t.meta.siteName} – ${t.nav.home}`} className="w-fit">
          <Logo className="h-7 w-auto" />
        </Link>
        <p className="m-0 text-[12px] text-mint/70 md:text-right">{t.meta.slogan}</p>

        <nav aria-label={t.footer.label} className="mt-[18px] max-md:mt-0">
          <ul className="flex flex-wrap gap-x-[18px] gap-y-2 text-[13px] font-semibold max-md:gap-y-0">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:underline max-md:block max-md:py-2.5">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ul className="mt-[18px] flex gap-5 text-[13px] font-semibold max-md:mt-0">
          {social.map(({ name, href, Icon }) => (
            <li key={name}>
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline max-md:py-2.5">
                  <Icon size={16} />
                  {name}
                </a>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Icon size={16} />
                  {name}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-[16px] text-[12px] leading-[1.6] text-mint/60 md:col-span-2 max-md:mt-0">
          <ul className="flex flex-wrap gap-x-1">
            {legal.map((l, i) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:underline max-md:inline-block max-md:py-2">
                  {l.label}
                </Link>
                {i < legal.length - 1 && <span aria-hidden="true"> ·</span>}
              </li>
            ))}
          </ul>
          <p className="m-0">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
