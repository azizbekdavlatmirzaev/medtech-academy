"use client";

import { ArrowRight, Eye, EyeOff, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { PartId } from "@/components/CtScanner";
import ScannerView from "@/components/ScannerView";
import { type Component, getComponents } from "@/lib/api";

export default function LabPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [xray, setXray] = useState(true);
  const [spinning, setSpinning] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getComponents().then(setComponents).catch(() => setError(true));
  }, []);

  const labels = Object.fromEntries(components.map((c) => [c.id, c.name_uz]));
  const info = components.find((c) => c.id === selected);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 lg:flex-row lg:px-8">
      <section className="glass-strong relative h-[60vh] flex-1 overflow-hidden lg:h-[calc(100vh-10rem)]">
        <ScannerView selected={selected} onSelect={setSelected} xray={xray} spinning={spinning} labels={labels} />
        <div className="absolute left-4 top-4 flex gap-2">
          <button onClick={() => setXray((v) => !v)} className="btn-ghost bg-bg/80 px-4! py-2! text-sm backdrop-blur">
            {xray ? <EyeOff size={16} /> : <Eye size={16} />} {xray ? "Korpusni ko‘rsat" : "Ichini ko‘rsat"}
          </button>
          <button onClick={() => setSpinning((v) => !v)} className="btn-ghost bg-bg/80 px-4! py-2! text-sm backdrop-blur">
            {spinning ? <Pause size={16} /> : <Play size={16} />} {spinning ? "To‘xtat" : "Aylantir"}
          </button>
        </div>
        <p className="absolute bottom-4 left-4 font-mono text-[11px] text-muted">Sichqoncha bilan aylantiring · g‘ildirak bilan yaqinlashtiring</p>
      </section>

      <aside className="glass flex w-full flex-col gap-4 p-6 lg:w-96">
        <div>
          <p className="eyebrow">Operator yo‘nalishi</p>
          <h1 className="mt-1 font-display text-2xl font-bold">3D laboratoriya</h1>
          <p className="mt-1 text-sm text-muted">Qismni modelda yoki ro‘yxatda bosing — nomi va vazifasi chiqadi.</p>
        </div>
        {error && <p className="text-sm text-coral">API bilan aloqa yo‘q</p>}
        <ul className="flex flex-col gap-2">
          {components.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelected(c.id as PartId)}
                className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-all duration-200 ${
                  selected === c.id ? "border-teal bg-teal/10 text-teal shadow-[0_0_12px_rgba(79,209,181,0.25)]" : "border-line/60 hover:border-teal/50"
                }`}
              >
                {c.name_uz}
              </button>
            </li>
          ))}
        </ul>
        {info && (
          <div className="rise-in rounded-xl border border-teal/40 bg-bg/60 p-4">
            <h2 className="font-display font-semibold text-teal">{info.name_uz}</h2>
            <p className="mt-1 text-sm text-muted">{info.description_uz}</p>
            <Link href="/cases" className="mt-3 flex items-center gap-1 font-mono text-xs text-teal">
              Shu qism bo‘yicha mashq <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </aside>
    </main>
  );
}
