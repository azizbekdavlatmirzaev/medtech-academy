"use client";

import { AlertTriangle, ArrowRight, Box, CheckCircle2, Search, Stethoscope, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { PartId } from "@/components/CtScanner";
import ScannerView from "@/components/ScannerView";
import { type Component, NOT_A_DEVICE_FAULT, type Playbook, type PlaybookSummary, caseImageUrl, getComponents, getPlaybook, searchLibrary } from "@/lib/api";

const STEP_COLORS = ["text-teal", "text-teal", "text-coral", "text-teal", "text-teal"];

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PlaybookSummary[]>([]);
  const [open, setOpen] = useState<Playbook | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    getComponents().then(setComponents).catch(() => setError(true));
  }, []);

  // Debounced search as the user types a symptom or tag.
  useEffect(() => {
    const t = setTimeout(() => {
      searchLibrary(query)
        .then((list) => {
          setItems(list);
          if (list[0]) getPlaybook(list[0].id).then(setOpen);
        })
        .catch(() => setError(true));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const labels = Object.fromEntries(components.map((c) => [c.id, c.name_uz]));
  const partName = (id: string) => (id === NOT_A_DEVICE_FAULT ? "Uskuna emas — bemor" : (labels[id] ?? id));
  const highlight = open && open.component !== NOT_A_DEVICE_FAULT ? (open.component as PartId) : null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
      <header className="rise-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Muhandislik bilimlar bazasi</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">Real holatlar</h1>
          <p className="mt-2 max-w-2xl text-muted">Nosozliklarni topish va tuzatish bo‘yicha qadamma-qadam yo‘riqnomalar.</p>
        </div>
        <p className="glass max-w-sm px-4 py-3 text-xs text-muted">
          Hozirgi holatlar ilmiy adabiyot asosida tuzilgan namunalar. Shifoxonalardagi haqiqiy holatlar Sog‘liqni saqlash vazirligi
          ma’lumotlari bilan qo‘shiladi.
        </p>
      </header>

      <div className="glass flex items-center gap-3 px-4 py-2">
        <Search size={18} className="text-teal" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Simptomni yozing: masalan, “halqalar”, “donador”, “chiziqlar”…"
          className="flex-1 bg-transparent py-2 outline-none placeholder:text-muted"
          aria-label="Simptom bo‘yicha qidirish"
        />
        {query && <span className="font-mono text-[11px] text-teal">{items.length} ta o‘xshash holat</span>}
      </div>
      {error && <p className="text-coral">API bilan aloqa yo‘q</p>}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* List */}
        <ul className="flex flex-col gap-3 lg:col-span-4">
          {items.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => getPlaybook(p.id).then(setOpen)}
                className={`glass flex w-full gap-3 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  open?.id === p.id ? "border-teal! shadow-[0_0_14px_rgba(79,209,181,0.25)]" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG from our API */}
                <img src={caseImageUrl(p.case_id)} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover opacity-80" />
                <span className="flex flex-col gap-1">
                  <span className="flex flex-wrap gap-1">
                    <span className="chip">{p.device}</span>
                    <span className={p.component === NOT_A_DEVICE_FAULT ? "chip" : "chip chip-fault"}>{partName(p.component)}</span>
                  </span>
                  <span className="font-display text-sm font-semibold">{p.title_uz}</span>
                </span>
              </button>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-muted">Mos holat topilmadi — boshqa so‘z bilan urinib ko‘ring.</li>}
        </ul>

        {/* Detail */}
        {open && (
          <section className="glass-strong rise-in flex flex-col gap-6 p-6 lg:col-span-8">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="chip">{open.device}</span>
                {open.tags.map((t) => (
                  <span key={t} className="chip border-line! bg-surface-3! text-muted!">
                    {t}
                  </span>
                ))}
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold">{open.title_uz}</h2>
              <p className="mt-1 flex items-start gap-2 text-muted">
                <Stethoscope size={16} className="mt-1 shrink-0 text-teal" /> {open.symptom_uz}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <div className={`h-64 overflow-hidden rounded-xl border ${highlight ? "fault-pulse border-coral/40" : "border-teal/30"}`}>
                  <ScannerView highlight={highlight} labels={labels} spinning={false} />
                </div>
                <p className="flex items-center gap-2 font-mono text-[11px] text-muted">
                  <Box size={14} className={highlight ? "text-coral" : "text-teal"} /> Nosoz qism: {partName(open.component)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/cases/${open.case_id}`} className="btn-primary px-4! py-2! text-sm">
                    <Wrench size={16} /> Trenajorda mashq qilish
                  </Link>
                  <Link href="/lab" className="btn-ghost px-4! py-2! text-sm">
                    3D laboratoriya
                  </Link>
                </div>
              </div>

              <ol key={open.id} className="relative flex flex-col gap-4 border-l border-teal/30 pl-6">
                {open.steps.map((s, i) => (
                  <li key={s.title_uz} className="rise-in relative" style={{ animationDelay: `${i * 90}ms` }}>
                    <span
                      className={`absolute -left-[37px] grid h-7 w-7 place-items-center rounded-full border bg-bg font-mono text-xs ${
                        i === 2 ? "border-coral text-coral" : "border-teal text-teal"
                      }`}
                    >
                      {i === 4 ? <CheckCircle2 size={14} /> : i + 1}
                    </span>
                    <p className={`font-mono text-[11px] uppercase ${STEP_COLORS[i]}`}>
                      {i + 1}-bosqich · {s.title_uz}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{s.text_uz}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="glass-fault flex items-start gap-3 p-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-coral" />
              <div>
                <p className="font-mono text-[11px] uppercase text-coral">Xavfsizlik talabi</p>
                <p className="mt-1 text-sm">{open.safety_uz}</p>
              </div>
            </div>

            <Link href={`/cases/${open.case_id}`} className="flex items-center gap-1 font-mono text-xs text-teal">
              Shu holatni o‘zingiz yechib ko‘ring <ArrowRight size={14} />
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
