"use client";

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
    <main className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
      <section className="relative h-[60vh] flex-1 overflow-hidden rounded-xl lg:h-[calc(100vh-2rem)]">
        <ScannerView selected={selected} onSelect={setSelected} xray={xray} spinning={spinning} labels={labels} />
        <div className="absolute left-3 top-3 flex gap-2">
          <button onClick={() => setXray((v) => !v)} className="rounded-md bg-white/90 px-3 py-1 text-sm text-[#15202E]">
            {xray ? "Korpusni ko‘rsat" : "Ichini ko‘rsat"}
          </button>
          <button onClick={() => setSpinning((v) => !v)} className="rounded-md bg-white/90 px-3 py-1 text-sm text-[#15202E]">
            {spinning ? "To‘xtat" : "Aylantir"}
          </button>
        </div>
      </section>

      <aside className="flex w-full flex-col gap-4 lg:w-96">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">
          ← Bosh sahifa
        </Link>
        <h1 className="text-2xl font-bold">KT uskunasi: 3D laboratoriya</h1>
        <p className="text-sm opacity-80">Qismni modelda yoki ro‘yxatda bosing — nomi va vazifasi chiqadi.</p>
        {error && <p className="text-sm text-red-600">API bilan aloqa yo‘q</p>}
        <ul className="flex flex-col gap-2">
          {components.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelected(c.id as PartId)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selected === c.id ? "border-[#0E7C6B] bg-[#E3EFEC] text-[#0B5E52]" : "border-current/20"
                }`}
              >
                {c.name_uz}
              </button>
            </li>
          ))}
        </ul>
        {info && (
          <div className="rounded-lg border border-[#0E7C6B] p-4">
            <h2 className="font-semibold">{info.name_uz}</h2>
            <p className="mt-1 text-sm opacity-80">{info.description_uz}</p>
          </div>
        )}
      </aside>
    </main>
  );
}
