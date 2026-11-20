import type { MetadataRoute } from "next";
import { PREVIEW } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";

// Le site n'est ouvert aux moteurs de recherche qu'à trois conditions réunies :
//  1. déploiement de production (pas les aperçus Vercel) ;
//  2. pas en mode aperçu des langues (NEXT_PUBLIC_PREVIEW) ;
//  3. interrupteur de mise en ligne ALLOW_INDEXING=1, à régler le jour J seulement.
// Ainsi, le premier déploiement sur Vercel (qui est « production » sur l'adresse *.vercel.app) reste fermé tant qu'on n'a pas décidé d'ouvrir.
const indexable = (process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production") && !PREVIEW && process.env.ALLOW_INDEXING === "1";

export default function robots(): MetadataRoute.Robots {
  return indexable
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_URL}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
