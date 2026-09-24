"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
      <p className="text-lg opacity-80">
        KT uskunasi operatorlari va tibbiy muhandislar uchun AI trenajor.
      </p>
      <div className="rounded-lg border border-current/20 p-4 font-mono text-sm">
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
