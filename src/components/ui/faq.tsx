import { cn } from "@/lib/cn";
import { ArrowDownRight, ArrowUpRight } from "../icons";

export type FaqItem = { q: string; a: string | null };

/**
 * Questions fréquentes en <details> : accessibles au clavier, sans JavaScript, une seule question ouverte à la fois.
 * Toutes fermées au départ ; un second clic sur la question ouverte la referme (seule la question reste visible).
 * Variante « plain » : lignes sur fond clair (page Références). Variante « card » : cartes menthe à coin coupé sur fond violet (page Tarifs).
 */
export function Faq({ items, name, variant = "plain" }: { items: readonly FaqItem[]; name: string; variant?: "plain" | "card" }) {
  const card = variant === "card";
  return (
    <div className={cn("flex flex-col", card ? "gap-5" : "gap-0")}>
      {items.map((item) => (
        <details
          key={item.q}
          name={name}
          className={cn("group", card && "cut-br rc rounded-[16px] bg-mint px-4 text-navy on-light [--cut:28px] [--r:16px]")}
        >
          <summary
            className={cn(
              "flex cursor-pointer justify-between gap-6 rounded-sm",
              card ? "min-h-[84px] items-center pr-3.5 group-open:min-h-0 group-open:items-start group-open:pb-0 group-open:pt-[13.5px]" : "items-center py-[26.5px] group-open:pb-0 max-md:py-5",
            )}
          >
            <span className={cn("font-semibold", card ? "max-w-[370px] text-[14px] leading-[19px]" : "text-[16px] leading-[1.3]")}>{item.q}</span>
            <span className="shrink-0 text-navy">
              <ArrowDownRight size={card ? 26 : 28} className="group-open:hidden" />
              <ArrowUpRight size={card ? 26 : 28} className="hidden group-open:block" />
            </span>
          </summary>
          {item.a && <p className={cn("m-0", card ? "mt-[7.5px] max-w-[400px] pb-4 text-[12px] leading-5" : "mt-1 max-w-[475px] pb-[6.5px] text-[14px] leading-[20px]")}>{item.a}</p>}
        </details>
      ))}
    </div>
  );
}
