"use client";

import { ArrowRight, CloudFog, Flame, Siren, Thermometer, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { type CaseSummary, type Drill, type DrillEffect, caseImageUrl, getCases, getDrills } from "@/lib/api";

const LEVEL = ["", "Oson", "O‘rta", "Qiyin"];

const EFFECT_ICON: Record<DrillEffect, typeof Flame> = { smoke: CloudFog, fire: Flame, sparks: Zap, overheat: Thermometer };

export default function CasesPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCases().then(setCases).catch(() => setError(true));
    getDrills().then(setDrills).catch(() => setError(true));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 lg:px-8">
      <header className="rise-in">
        <p className="eyebrow">Muhandis yo‘nalishi</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Nosozlik trenajori</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Har bir holatda fizik simulyatsiya qilingan KT tasviri va uskuna simptomi beriladi. Qaysi qism buzilganini toping.
        </p>
      </header>
      {error && <p className="text-coral">API bilan aloqa yo‘q</p>}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((c, i) => (
          <li key={c.id} className="rise-in" style={{ animationDelay: `${i * 70}ms` }}>
            <Link
              href={`/cases/${c.id}`}
              className="glass group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-teal/50"
            >
              <div className="relative aspect-video overflow-hidden bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG from our API */}
                <img
                  src={caseImageUrl(c.id)}
                  alt={c.title_uz}
                  className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                />
                <span className="chip absolute left-3 top-3 bg-bg/80">{LEVEL[c.difficulty]}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 className="font-display text-lg font-semibold">{c.title_uz}</h2>
                <p className="flex-1 text-sm text-muted">{c.symptom_uz}</p>
                <span className="mt-2 flex items-center gap-1 font-mono text-xs text-teal">
                  Holatni yechish <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-4 pt-6">
        <div>
          <p className="eyebrow flex items-center gap-2 text-coral!">
            <Siren size={14} /> Xavfsizlik mashg‘ulotlari
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">Favqulodda holatlar</h2>
          <p className="mt-1 max-w-2xl text-muted">Tutun, olov, uchqun, qizib ketish — vaqt bosimi ostida to‘g‘ri harakatlar tartibini mashq qiling.</p>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {drills.map((d, i) => {
            const Icon = EFFECT_ICON[d.effect];
            return (
              <li key={d.id} className="rise-in" style={{ animationDelay: `${i * 70}ms` }}>
                <Link
                  href={`/favqulodda/${d.id}`}
                  className="glass-fault group flex h-full flex-col gap-3 p-5 transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-coral/40 bg-coral/10">
                    <Icon size={22} className="text-coral transition-transform group-hover:scale-110" />
                  </span>
                  <h3 className="font-display text-lg font-semibold">{d.title_uz}</h3>
                  <p className="flex-1 text-sm text-muted">{d.situation_uz}</p>
                  <span className="flex items-center gap-1 font-mono text-xs text-coral">
                    Mashg‘ulotni boshlash <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
