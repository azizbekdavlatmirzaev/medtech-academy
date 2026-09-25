import {
  Activity,
  ArrowRight,
  Box,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  GraduationCap,
  Handshake,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";

import HeroScanner from "./HeroScanner";

const STATS = [
  {
    value: "95",
    unit: "texnik",
    label: "Mutaxassislar tanqisligi",
    text: "5 yilda respublika bo‘yicha o‘qitilgan tibbiy texniklar (GIZ va SSV dasturi).",
    icon: Users,
  },
  {
    value: "~90%",
    unit: "import",
    label: "Uskunalar",
    text: "Ro‘yxatdan o‘tgan tibbiy uskunalar asosan xorijdan — servis ham chetga bog‘liq.",
    icon: Box,
  },
  {
    value: "+10%",
    unit: "har yili",
    label: "Bozor o‘sishi",
    text: "Diagnostika uskunalari bozori 2029-yilgacha yiliga ~10% o‘sadi.",
    icon: TrendingUp,
  },
];

const STEPS = [
  { title: "Holat", sub: "Klinik simptom", text: "Nuqsonli KT tasviri va uskuna simptomi beriladi.", icon: Stethoscope },
  { title: "Tashxis", sub: "Muhandis qarori", text: "O‘quvchi buzilgan qismni tanlaydi va sababini yozadi.", icon: FileSearch },
  { title: "AI baholaydi", sub: "Server + AI", text: "Qism to‘g‘riligini server, mulohazani AI baholaydi.", icon: BrainCircuit },
  { title: "3D’da ko‘rsatiladi", sub: "Lokalizatsiya", text: "Buzilgan qism 3D modelda yonib ko‘rsatiladi.", icon: ScanLine, fault: true },
  { title: "Progress", sub: "Daraja", text: "Natijalar saqlanadi, daraja va tayyorlik oshadi.", icon: Activity },
];

const TRACKS = [
  {
    tag: "Radiologiya texniklari uchun",
    title: "Operator yo‘nalishi",
    text: "Uskunani to‘g‘ri va xavfsiz ishlatish: qismlar, bemorni joylashtirish, nurlanish xavfsizligi.",
    items: ["3D modelda KT qismlari bilan tanishuv", "Nurlanish xavfsizligi (ALARA) asoslari", "Manbaga asoslangan AI ustoz va testlar"],
    href: "/lab",
    cta: "3D laboratoriyaga",
    fault: false,
  },
  {
    tag: "Tibbiy muhandislar uchun",
    title: "Muhandis yo‘nalishi",
    text: "Nosozlikni tasvirdagi artefakt orqali topish va to‘g‘ri harakat rejasini tuzish.",
    items: ["Halqa, shovqin, cupping va boshqa artefaktlar", "Detektor, trubka, DAS va slip-ring nosozliklari", "“Uskuna emas — bemor” tuzoqli holatlar"],
    href: "/cases",
    cta: "Trenajorni boshlash",
    fault: true,
  },
];

const TRUST = [
  { title: "Manbaga asoslangan AI", text: "Javoblar ochiq xalqaro qo‘llanmalar (WHO, IAEA) va tasdiqlangan materiallarga tayanadi.", icon: ShieldCheck },
  { title: "Faqat sintetik ma’lumot", text: "KT tasvirlari fantomdan fizik simulyatsiya qilinadi — bemor ma’lumoti yo‘q.", icon: CheckCircle2 },
  { title: "Vazirlik bilan hamkorlik", text: "Kontent va statistika Sog‘liqni saqlash vazirligi bilan birga ishlab chiqiladi.", icon: Handshake },
];

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-14 lg:px-8 lg:py-20">
        <div className="spin-slow pointer-events-none absolute -right-40 -top-32 h-190 w-190 rounded-full border border-teal/10">
          <div className="absolute inset-10 rounded-full border border-teal/5" />
          <div className="absolute inset-24 rounded-full border border-dashed border-teal/15" />
          <div className="absolute inset-44 rounded-full border border-teal/5" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-12">
          <div className="rise-in flex flex-col gap-6 lg:col-span-6">
            <span className="chip w-fit">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" /> KT uskunasi uchun AI trenajor · O‘zbekiston
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight lg:text-5xl lg:leading-[1.1]">
              Uskuna bor. Endi uni{" "}
              <span className="text-teal underline decoration-teal/30 underline-offset-8">ishlata va tuzata</span> oladigan mutaxassis
              tayyorlaymiz.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted">
              3D model, fizikaga asoslangan nosozlik simulyatori va xavfsiz AI — o‘zbek tilida. Radiologiya texniklari va tibbiy
              muhandislar uchun virtual amaliyot muhiti.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/cases" className="btn-primary">
                <Zap size={18} /> Trenajorni boshlash
              </Link>
              <Link href="/lab" className="btn-ghost">
                <Box size={18} className="text-teal" /> 3D modelni ko‘rish
              </Link>
            </div>
            <dl className="grid grid-cols-3 gap-4 border-t border-line/40 pt-6">
              {[
                ["Nosozlik turi", "5", "fizik"],
                ["Holatlar", "6", "ta"],
                ["Avtomatik test", "26", "ta"],
              ].map(([label, value, unit]) => (
                <div key={label}>
                  <dt className="font-mono text-[11px] uppercase text-muted">{label}</dt>
                  <dd className="font-mono text-2xl font-bold">
                    {value} <span className="text-xs font-normal text-muted">{unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rise-in lg:col-span-6" style={{ animationDelay: "150ms" }}>
            <HeroScanner />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {STATS.map((s, i) => (
            <div key={s.label} className="glass rise-in flex flex-col gap-3 p-6" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase text-muted">{s.label}</span>
                <s.icon size={18} className="text-teal" />
              </div>
              <p className="font-mono text-4xl font-bold text-teal">
                {s.value} <span className="text-sm font-normal text-ink">{s.unit}</span>
              </p>
              <p className="text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-3 max-w-7xl font-mono text-[11px] text-muted/70">
          Manbalar: GIZ loyiha hisoboti (2014–2019); MedDeviceGuide, O‘zbekiston tibbiy uskunalar reyestri tahlili; Statista Market
          Forecast.
        </p>
      </section>

      {/* How it works */}
      <section className="px-4 pt-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">Amaliyot algoritmi</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Trenajorda ta’lim jarayoni qanday ishlaydi?</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className={`${s.fault ? "glass-fault" : "glass"} rise-in flex flex-col gap-3 p-5 transition-transform duration-300 hover:-translate-y-1`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-sm ${s.fault ? "text-coral" : "text-teal"}`}>0{i + 1}</span>
                  <s.icon size={20} className={s.fault ? "text-coral" : "text-teal"} />
                </div>
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className={`font-mono text-[11px] uppercase ${s.fault ? "text-coral" : "text-teal"}`}>{s.sub}</p>
                <p className="text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Tracks */}
      <section className="px-4 pt-20 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <p className="eyebrow">Ta’lim yo‘nalishlari</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">O‘z kasbiy yo‘nalishingizni tanlang</h2>
        </div>
        <div className="mx-auto mt-8 grid max-w-7xl gap-6 md:grid-cols-2">
          {TRACKS.map((t) => (
            <div
              key={t.title}
              className={`glass flex flex-col gap-4 border-t-4 p-8 transition-transform duration-300 hover:-translate-y-1 ${
                t.fault ? "border-t-coral!" : "border-t-teal!"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={t.fault ? "chip chip-fault" : "chip"}>{t.tag}</span>
                {t.fault ? <Wrench className="text-coral" size={22} /> : <GraduationCap className="text-teal" size={22} />}
              </div>
              <h3 className="font-display text-2xl font-bold">{t.title}</h3>
              <p className="text-muted">{t.text}</p>
              <ul className="flex flex-col gap-2">
                {t.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 size={18} className={`mt-0.5 shrink-0 ${t.fault ? "text-coral" : "text-teal"}`} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={t.href}
                className={`mt-2 w-fit ${t.fault ? "btn-primary bg-coral/90! text-ink! hover:bg-coral!" : "btn-primary"}`}
              >
                {t.cta} <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="px-4 pt-16 lg:px-8">
        <div className="glass mx-auto grid max-w-7xl gap-6 p-6 md:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-teal/30 bg-bg/60">
                <t.icon size={20} className="text-teal" />
              </span>
              <div>
                <h3 className="font-display font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo teaser */}
      <section className="px-4 pt-16 lg:px-8">
        <div className="glass-strong mx-auto max-w-7xl overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line/40 px-5 py-3 font-mono text-[11px] text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-coral" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e0b341]" />
            <span className="h-2.5 w-2.5 rounded-full bg-teal" />
            <span className="ml-2">TERMINAL · MedTech simulyatori</span>
          </div>
          <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="chip chip-fault">Simulyatsiya namunasi · halqa artefakti</p>
              <h3 className="mt-3 font-display text-2xl font-bold">Ertalabdan beri barcha tasvirlarda konsentrik halqalar</h3>
              <p className="mt-2 max-w-2xl text-muted">
                Qaysi qism buzilganini toping: AI javobingizni baholaydi va buzilgan qism 3D modelda ko‘rsatiladi.
              </p>
            </div>
            <Link href="/cases/ring-01" className="btn-ghost shrink-0">
              Ushbu keysni yechish <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
