import { notFound } from "next/navigation";

// Toute adresse inconnue dans une langue du site : 404 (affichée avec l'en-tête et le pied de page, voir ../not-found.tsx).
export const dynamicParams = true;
export default function CatchAll() {
  notFound();
}
