"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { API_URL } from "@/lib/api";

type Health = { status: string; llm_provider: string; time: string };

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError(true));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-4xl font-bold">MedTech Academy</h1>
      <p className="text-lg opacity-80">KT uskunasi operatorlari va tibbiy muhandislar uchun AI trenajor.</p>

      <nav className="grid gap-4 sm:grid-cols-2">
        <Link href="/lab" className="rounded-xl border border-current/20 p-5 hover:border-[#0E7C6B]">
          <h2 className="text-lg font-semibold">3D laboratoriya</h2>
          <p className="mt-1 text-sm opacity-70">KT uskunasining qismlari va vazifalari</p>
        </Link>
        <Link href="/cases" className="rounded-xl border border-current/20 p-5 hover:border-[#0E7C6B]">
          <h2 className="text-lg font-semibold">Nosozlik trenajori</h2>
          <p className="mt-1 text-sm opacity-70">Tasvirdagi artefakt orqali buzilgan qismni toping</p>
        </Link>
      </nav>

      <div className="rounded-lg border border-current/20 p-4 font-mono text-xs opacity-70">
        {error && <span>API bilan aloqa yo‘q</span>}
        {!error && !health && <span>API tekshirilmoqda…</span>}
        {health && (
          <span>
            API: {health.status} · AI: {health.llm_provider} · {health.time}
          </span>
        )}
      </div>
    </main>
  );
}
