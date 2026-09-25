"use client";

import {
  ArrowLeft,
  ArrowRight,
  BedSingle,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  Filter,
  Grid3x3,
  Lightbulb,
  RefreshCw,
  RotateCcw,
  Stethoscope,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { type ComponentType, useEffect, useState } from "react";

import type { PartId } from "@/components/CtScanner";
import ScannerView from "@/components/ScannerView";
import {
  type CaseSummary,
  type Component,
  type Grade,
  NOT_A_DEVICE_FAULT,
  caseImageUrl,
  getCase,
  getCases,
  getComponents,
  loadLearner,
  normalImageUrl,
  saveLearner,
  submitAttempt,
} from "@/lib/api";

const ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  detector: Grid3x3,
  xray_tube: Zap,
  bowtie_filter: Filter,
  das_slip_ring: RefreshCw,
  gantry: CircleDot,
  table: BedSingle,
  [NOT_A_DEVICE_FAULT]: UserRound,
};

const LEVEL = ["", "Oson", "O‘rta", "Qiyin"];

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pass = score >= 6;
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24 shrink-0" aria-label={`Ball: ${score}/10`}>
      <circle cx="40" cy="40" r={r} stroke="#1f2a3d" strokeWidth="6" fill="none" />
      <circle
        cx="40"
        cy="40"
        r={r}
        stroke={pass ? "#4FD1B5" : "#E0523D"}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - score / 10)}
        transform="rotate(-90 40 40)"
        style={{ transition: "stroke-dashoffset 700ms ease-out" }}
      />
      <text x="40" y="46" textAnchor="middle" fill="#EEF3F2" fontSize="20" fontWeight="700" fontFamily="monospace">
        {score}
        <tspan fontSize="11" fill="#A9BBC4">
          /10
        </tspan>
      </text>
    </svg>
  );
}

export default function Trainer({ caseId }: { caseId: string }) {
  const [info, setInfo] = useState<CaseSummary | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [choice, setChoice] = useState<string>("");
  const [reasoning, setReasoning] = useState("");
  const [learner, setLearner] = useState(loadLearner);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compare, setCompare] = useState(50);

  useEffect(() => {
    getCase(caseId).then(setInfo).catch(() => setError("Holat topilmadi"));
    getComponents().then(setComponents).catch(() => setError("API bilan aloqa yo‘q"));
    getCases()
      .then((all) => {
        const i = all.findIndex((c) => c.id === caseId);
        setNextId(all[(i + 1) % all.length]?.id ?? null);
      })
      .catch(() => {});
  }, [caseId]);

  const labels = Object.fromEntries(components.map((c) => [c.id, c.name_uz]));
  const options = [...components, { id: NOT_A_DEVICE_FAULT, name_uz: "Uskuna nosoz emas (bemor harakati)", description_uz: "" }];
  const highlight = grade?.is_device_fault ? (grade.correct_component as PartId) : null;
  const correctName = options.find((o) => o.id === grade?.correct_component)?.name_uz;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!choice) return;
    setBusy(true);
    setError(null);
    saveLearner(learner);
    try {
      setGrade(await submitAttempt(caseId, choice, reasoning, learner || "demo"));
    } catch {
      setError("Javobni yuborib bo‘lmadi");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setGrade(null);
    setChoice("");
    setReasoning("");
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/cases" className="flex items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft size={16} /> Barcha holatlar
        </Link>
        <span className="chip">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Rejim: nosozlik simulyatori
        </span>
      </div>

      <section className="glass rise-in flex flex-col gap-2 p-6">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted">
          {info && <span className="chip">{LEVEL[info.difficulty]}</span>}
          <span>HOLAT #{caseId.toUpperCase()}</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{info?.title_uz ?? "…"}</h1>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: evidence */}
        <section className="flex flex-col gap-6 lg:col-span-7">
          <div className="glass rise-in p-6">
            <p className="eyebrow flex items-center gap-2">
              <Stethoscope size={14} /> Uskuna simptomlari
            </p>
            <p className="mt-3 leading-relaxed">{info?.symptom_uz}</p>
          </div>

          <div className="glass rise-in flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Aksial kesim solishtiruvi</h2>
              <span className="chip">Miya oynasi · WL 40 / WW 80</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <figure className="overflow-hidden rounded-xl border border-coral/40 bg-bg">
                <p className="bg-coral/80 px-3 py-1 font-mono text-[11px] uppercase">Nuqsonli tasvir</p>
                {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG from our API */}
                <img src={caseImageUrl(caseId)} alt="Nosoz uskunadagi KT tasviri" className="w-full" />
              </figure>
              <figure className="overflow-hidden rounded-xl border border-teal/40 bg-bg">
                <p className="bg-teal/80 px-3 py-1 font-mono text-[11px] uppercase text-bg">Etalon (soz uskuna)</p>
                {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG from our API */}
                <img src={normalImageUrl()} alt="Soz uskunadagi KT tasviri" className="w-full" />
              </figure>
            </div>

            <p className="font-mono text-[11px] text-muted">
              Bosh miya, lateral qorinchalar sathi · sintetik anatomik fantom (bemor ma’lumoti emas) · 320×320
            </p>

            {/* Overlay compare: drag to blend the faulty slice over the reference. */}
            <div className="flex flex-col gap-2 rounded-xl border border-line/40 bg-bg/50 p-4">
              <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                <span>Solishtirish simulyatori</span>
                <span className="text-teal">{compare}% nuqson</span>
              </div>
              <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG from our API */}
                <img src={normalImageUrl()} alt="" className="absolute inset-0 h-full w-full" />
                {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG from our API */}
                <img src={caseImageUrl(caseId)} alt="" className="absolute inset-0 h-full w-full" style={{ opacity: compare / 100 }} />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={compare}
                onChange={(e) => setCompare(Number(e.target.value))}
                className="accent-teal"
                aria-label="Nuqsonli va etalon tasvirni aralashtirish"
              />
            </div>
          </div>
        </section>

        {/* Right: 3D + decision */}
        <section className="flex flex-col gap-6 lg:col-span-5">
          <div className="glass rise-in overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="font-display font-semibold">3D gantry vizualizatori</h2>
              <span className="font-mono text-[11px] text-muted">Aylantiring · qismni bosing</span>
            </div>
            <div className={`h-72 ${highlight ? "fault-pulse" : ""}`}>
              <ScannerView
                highlight={highlight}
                selected={!grade && choice && choice !== NOT_A_DEVICE_FAULT ? (choice as PartId) : null}
                onSelect={(id) => !grade && setChoice(id)}
                spinning={!grade}
                labels={labels}
              />
            </div>
          </div>

          {!grade ? (
            <form onSubmit={onSubmit} className="glass rise-in flex flex-col gap-4 p-6">
              <div>
                <p className="eyebrow">Muhandislik qarori</p>
                <h2 className="mt-1 font-display text-xl font-semibold">Qaysi qism buzilgan?</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((o) => {
                  const Icon = ICONS[o.id] ?? CircleDot;
                  const active = choice === o.id;
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
                        active ? "border-teal bg-teal/10 text-teal shadow-[0_0_12px_rgba(79,209,181,0.25)]" : "border-line/60 hover:border-teal/50"
                      }`}
                    >
                      <input type="radio" name="component" value={o.id} checked={active} onChange={() => setChoice(o.id)} className="sr-only" />
                      <Icon size={18} className="shrink-0" />
                      {o.name_uz}
                    </label>
                  );
                })}
              </div>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Nega shunday deb o‘ylaysiz va nimani tekshirasiz?"
                className="rounded-xl border border-line/60 bg-bg/80 p-3 text-sm outline-none transition focus:border-teal focus:shadow-[0_0_8px_rgba(79,209,181,0.3)]"
              />
              <div className="flex items-center gap-3">
                <input
                  value={learner}
                  onChange={(e) => setLearner(e.target.value)}
                  maxLength={64}
                  placeholder="Ismingiz"
                  suppressHydrationWarning
                  className="w-36 rounded-full border border-line/60 bg-bg/80 px-4 py-2 text-sm outline-none focus:border-teal"
                />
                <button type="submit" disabled={!choice || busy} className="btn-primary flex-1 justify-center">
                  <BrainCircuit size={18} /> {busy ? "AI baholamoqda…" : "Javobni baholash"}
                </button>
              </div>
            </form>
          ) : (
            <div className={`${grade.correct ? "glass-strong" : "glass-fault"} rise-in flex flex-col gap-4 p-6`}>
              <div className="flex items-center gap-4">
                <ScoreRing score={grade.score} />
                <div className="flex flex-col gap-2">
                  <span className={grade.correct ? "chip" : "chip chip-fault"}>
                    {grade.correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {grade.correct ? "To‘g‘ri tashxis" : "Noto‘g‘ri tashxis"}
                  </span>
                  <p className="font-display text-lg font-semibold">{correctName}</p>
                  <span className="font-mono text-[11px] text-muted">{grade.ai_used ? "AI baholadi" : "Ekspert izohi (AI ulanmagan)"}</span>
                </div>
              </div>
              <div className="rounded-xl border border-line/40 bg-bg/50 p-4">
                <p className="eyebrow">Fizik tahlil va izoh</p>
                <p className="mt-2 text-sm leading-relaxed">{grade.explanation_uz}</p>
              </div>
              {grade.next_hint_uz && (
                <div className="rounded-xl border border-line/40 bg-bg/50 p-4">
                  <p className="eyebrow flex items-center gap-2">
                    <Lightbulb size={14} /> Maslahat
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{grade.next_hint_uz}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={reset} className="btn-ghost">
                  <RotateCcw size={16} /> Qayta urinish
                </button>
                {nextId && (
                  <Link href={`/cases/${nextId}`} className="btn-primary">
                    Keyingi holat <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-coral">{error}</p>}
        </section>
      </div>
    </main>
  );
}
