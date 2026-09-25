import { Logo } from "./Logo";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line/40 bg-surface/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Logo />
        <p className="font-mono text-xs">Umummilliy AI Xakaton · Namangan 2026</p>
        <p className="text-xs">
          3D model va barcha KT tasvirlari sintetik — bemor ma’lumotlari ishlatilmaydi. Faqat o‘quv maqsadida.
        </p>
      </div>
    </footer>
  );
}
