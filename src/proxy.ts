import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES, hasLocale, isOpen, type Locale } from "./i18n/config";

// Redirige « / » et les adresses sans préfixe de langue vers /fr, /en… selon la langue du navigateur (seulement parmi les langues ouvertes).
function preferred(request: NextRequest): Locale {
  const header = request.headers.get("accept-language") ?? "";
  const wanted = header
    .split(",")
    .map((part) => part.trim().split(";")[0].slice(0, 2).toLowerCase())
    .filter(Boolean);
  for (const code of wanted) if (hasLocale(code) && isOpen(code)) return code;
  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasPrefix) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/${preferred(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Ignore les fichiers internes et les fichiers publics (images, logos, favicon, sitemap, robots…).
  matcher: ["/((?!_next|api|images|logo|favicon|sitemap|robots|.*\\..*).*)"],
};
