import { Button } from "../ui/button";

/** Bandeau marine de fin de page : un titre et le bouton « Essai gratuit ». */
export function CtaBand({ title, button, href, tall = false }: { title: string; button: string; href: string; tall?: boolean }) {
  return (
    <section className="wrap">
      <div data-reveal className={`flex items-center justify-between gap-8 rounded-[16px] bg-navy px-10 max-md:flex-col max-md:items-start max-md:px-6 max-md:py-10 ${tall ? "py-[50px]" : "py-[48px]"}`}>
        <h2 className={`m-0 max-w-[600px] text-[36px] font-bold tracking-[-0.01em] text-mint max-md:text-[28px] ${tall ? "leading-[1.1]" : "leading-[1.15]"}`}>{title}</h2>
        <Button href={href} icon="arrow-box" size="lg" className="min-w-[240px] max-md:w-full">
          {button}
        </Button>
      </div>
    </section>
  );
}
