"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { type CaseSummary, getCases } from "@/lib/api";

const LEVEL = ["", "Oson", "O‘rta", "Qiyin"];

export default function CasesPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCases().then(setCases).catch(() => setError(true));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm opacity-70 hover:opacity-100">
        ← Bosh sahifa
      </Link>
      <h1 className="text-3xl font-bold">Nosozlik trenajori</h1>
      <p className="opacity-80">Har bir holatda KT tasviri va simptom beriladi. Qaysi qism buzilganini toping.</p>
      {error && <p className="text-red-600">API bilan aloqa yo‘q</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {cases.map((c) => (
          <li key={c.id}>
            <Link href={`/cases/${c.id}`} className="block h-full rounded-xl border border-current/20 p-5 hover:border-[#0E7C6B]">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{c.title_uz}</h2>
                <span className="rounded-full bg-[#E3EFEC] px-2 py-0.5 text-xs text-[#0B5E52]">{LEVEL[c.difficulty]}</span>
              </div>
              <p className="mt-2 text-sm opacity-70">{c.symptom_uz}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
