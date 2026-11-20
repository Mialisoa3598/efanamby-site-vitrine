"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string };

/** Liens de navigation : la page courante est soulignée et en gras (aria-current). */
export function NavLinks({ items, label, className, listClassName, itemClassName, trailing, onNavigate }: { items: NavItem[]; label: string; className?: string; listClassName?: string; itemClassName?: string; trailing?: ReactNode; onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label={label} className={className}>
      <ul className={cn("flex items-center gap-[34px] max-lg:flex-col max-lg:items-stretch max-lg:gap-0 lg:max-xl:gap-5", listClassName)}>
        {items.map((item) => {
          const active = pathname === item.href || pathname === `${item.href}/`;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn("text-[14px] text-mint transition-opacity hover:opacity-80", active ? "font-bold underline underline-offset-4" : "font-normal", itemClassName)}
              >
                {item.label}
                {trailing}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
