"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { type CaseSummary, caseImageUrl, getCases } from "@/lib/api";

const LEVEL = ["", "Oson", "O‘rta", "Qiyin"];

export default function CasesPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCases().then(setCases).catch(() => setError(true));
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
    </main>
  );
}
