import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowUpRight, ArrowUpRightBold, Play } from "../icons";

type Variant = "green" | "outline-light" | "violet" | "violet-soft" | "violet-grad" | "mint";
type Size = "sm" | "md" | "lg" | "nav";
type Icon = "arrow-box" | "arrow" | "play" | null;

const VARIANT: Record<Variant, string> = {
  green: "bg-green text-navy hover:bg-[#4fe8ad] active:bg-[#25c485]",
  "outline-light": "text-mint hover:bg-mint/10 active:bg-mint/20 [--bc:var(--color-mint)]",
  violet: "bg-violet text-white hover:bg-[#5a3cff] active:bg-[#2f0fd0]",
  "violet-soft": "bg-[#6a4dff] text-white hover:bg-[#5a3cff] active:bg-[#411aff]",
  "violet-grad": "bg-gradient-to-r from-violet to-[#25109f] text-white hover:brightness-110 active:brightness-90",
  mint: "bg-mint text-navy hover:bg-white active:bg-[#d3f5e6]",
};
// Demande du 27/11 : TOUS les boutons ont la même forme (coins arrondis de 10 px, coin bas-droit coupé et arrondi, comme le bouton « Envoyer » de la maquette).
// La coupe garde la proportion de la maquette (14 px pour 60 px de haut, soit ≈ 23 % de la hauteur) : 9 px (en-tête, 40 px), 10 px (42 px), 12 px (50 px), 14 px (60 px, mobile).
const SIZE: Record<Size, string> = {
  nav: "h-10 px-5 gap-3 [--cut:9px]",
  sm: "h-[42px] px-5 gap-2 [--cut:10px]",
  md: "h-[42px] px-6 gap-3 [--cut:10px]",
  lg: "h-[50px] px-8 gap-3 [--cut:12px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  icon?: Icon;
  full?: boolean;
  className?: string;
  children: ReactNode;
};
type LinkProps = CommonProps & { href: string; external?: boolean; type?: never; disabled?: never; onClick?: never };
type ButtonProps = CommonProps & { href?: undefined; external?: never; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void };

export function Button(props: LinkProps | ButtonProps) {
  const { variant = "green", size = "md", icon = null, full, className, children } = props;
  const outline = variant === "outline-light";
  // Une seule forme pour tous les boutons (pleins ou à contour) ; le contour fin du bouton « outline » suit la même forme (--rb) et mesure 0,5 px.
  const shape = "cut-br rc rounded-[10px] [--r:10px] [--rb:10px]";
  const base = cn(
    "t-button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    shape,
    outline && "lined [--lw:0.5px]",
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
