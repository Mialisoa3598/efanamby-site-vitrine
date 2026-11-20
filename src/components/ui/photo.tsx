import Image from "next/image";
import { IMG, type ImageKey } from "@/lib/images";

/**
 * Photo du site. Les fichiers sont déjà en WebP et dimensionnés pour l'écran : « unoptimized » évite de consommer
 * le quota de transformations d'images de l'offre gratuite de Vercel (5 000 par mois).
 * « priority » seulement pour l'image au-dessus de la ligne de flottaison (meilleur LCP).
 */
export function Photo({ name, alt, className, priority = false, sizes }: { name: ImageKey; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  const img = IMG[name];
  return <Image src={img.src} width={img.width} height={img.height} alt={alt} className={className} priority={priority} sizes={sizes} unoptimized />;
}
