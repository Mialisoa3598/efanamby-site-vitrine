import Link from "next/link";
import { LOCALES, LOCALE_INFO, isOpen, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { path } from "@/lib/paths";
import { NAV_KEYS } from "@/lib/site";
import { Logo } from "../logo";
import { Button } from "../ui/button";
import { LanguageMenu } from "./language-menu";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

export function Header({ locale, t }: { locale: Locale; t: Messages }) {
  const items = NAV_KEYS.map((key) => ({ href: path(locale, key), label: t.nav[key] }));
  const languages = LOCALES.map((l) => ({ locale: l, label: LOCALE_INFO[l].label, short: LOCALE_INFO[l].short, open: isOpen(l) }));
  const trialHref = path(locale, "trial");

  return (
    <header className="sticky top-0 z-50 bg-navy">
      <div className="wrap flex h-[76px] items-center justify-between gap-6">
        <Link href={path(locale, "home")} aria-label={`${t.meta.siteName} – ${t.nav.home}`} className="shrink-0 text-mint">
          <Logo className="h-[34px] w-auto" />
        </Link>

        <NavLinks items={items} label={t.nav.label} className="max-lg:hidden lg:ml-4 lg:mr-auto xl:ml-[91px]" itemClassName="px-0" />

        <div className="flex items-center gap-[30px] max-lg:hidden lg:max-xl:gap-5">
          <LanguageMenu current={locale} items={languages} label={t.nav.language} soon={t.nav.languageSoon} />
          <Button href={trialHref} icon="arrow-box" size="nav">
            {t.common.trial}
          </Button>
        </div>

        <MobileMenu
          items={items}
          navLabel={t.nav.label}
          openLabel={t.nav.openMenu}
          closeLabel={t.nav.closeMenu}
          trial={t.common.trial}
          trialHref={trialHref}
          locale={locale}
          languages={languages}
          languageLabel={t.nav.language}
          languageSoon={t.nav.languageSoon}
        />
      </div>
    </header>
  );
}
