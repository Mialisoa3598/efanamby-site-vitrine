import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowUpRight, ArrowUpRightBold, Play } from "../icons";

type Variant = "green" | "outline-light" | "violet" | "violet-soft" | "violet-grad" | "mint";
type Size = "sm" | "md" | "lg";
type Icon = "arrow-box" | "arrow" | "play" | null;

const VARIANT: Record<Variant, string> = {
  green: "bg-green text-navy hover:bg-[#4fe8ad] active:bg-[#25c485]",
  "outline-light": "text-mint hover:bg-mint/10 active:bg-mint/20 [--bc:var(--color-mint)]",
  violet: "bg-violet text-white hover:bg-[#5a3cff] active:bg-[#2f0fd0]",
  "violet-soft": "bg-[#6a4dff] text-white hover:bg-[#5a3cff] active:bg-[#411aff]",
  "violet-grad": "bg-gradient-to-r from-violet to-[#25109f] text-white hover:brightness-110 active:brightness-90",
  mint: "bg-mint text-navy hover:bg-white active:bg-[#d3f5e6]",
};
const SIZE: Record<Size, string> = {
  sm: "h-[42px] px-5 gap-2",
  md: "h-[42px] px-6 gap-3",
  lg: "h-[50px] px-8 gap-3",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  icon?: Icon;
  full?: boolean;
  /** Forme du coin coupé ; par défaut : haut-droit + bas-gauche pour les violets, bas-droit pour les autres. */
  cut?: "br" | "tr-bl";
  /** Petite coupe de 7 px (gros boutons et bouton de l'en-tête) ; sinon coupe de 10 px (boutons de formulaire). Les coins sont arrondis de 10 px dans tous les cas. */
  tight?: boolean;
  className?: string;
  children: ReactNode;
};
type LinkProps = CommonProps & { href: string; external?: boolean; type?: never; disabled?: never; onClick?: never };
type ButtonProps = CommonProps & { href?: undefined; external?: never; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void };

export function Button(props: LinkProps | ButtonProps) {
  const { variant = "green", size = "md", icon = null, full, cut, tight = size === "lg", className, children } = props;
  const outline = variant === "outline-light";
  const trbl = cut ? cut === "tr-bl" : variant.startsWith("violet");
  // Demande du 19/11 : tous les boutons ont les quatre coins arrondis (10 px), y compris les sommets de la coupe (rayon 10 px ; 8 px pour la petite coupe de 7 px).
  // Coupe : 14 px (haut-droit/bas-gauche), 7 px (grands boutons et en-tête), 10 px (formulaires). Le contour fin du bouton « outline » suit la même forme (--rb).
  const shape = trbl
    ? "cut-tr-bl rc rounded-[10px] [--cut:14px] [--r:10px] [--rb:10px]"
    : tight
      ? "cut-br rc rounded-[10px] [--cut:7px] [--r:8px] [--rb:10px]"
      : "cut-br rc rounded-[10px] [--cut:10px] [--r:10px] [--rb:10px]";
  const base = cn(
    "t-button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    shape,
    outline && "lined [--lw:1.5px]",
    SIZE[size],
    full && "w-full",
    VARIANT[variant],
    className,
  );
  const content = (
    <>
      <span>{children}</span>
      {icon === "arrow-box" && (
        <span className="grid size-[18px] place-items-center rounded-[3px] bg-white text-navy">
          <ArrowUpRightBold size={12} />
        </span>
      )}
      {icon === "arrow" && <ArrowUpRight size={16} />}
      {icon === "play" && <Play size={16} />}
    </>
  );
  if (props.href !== undefined) {
    if (props.external) {
      return (
        <a href={props.href} className={base} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return (
      <Link href={props.href} className={base}>
        {content}
      </Link>
    );
  }
  return (
    <button type={props.type ?? "button"} disabled={props.disabled} onClick={props.onClick} className={base}>
      {content}
    </button>
  );
}
