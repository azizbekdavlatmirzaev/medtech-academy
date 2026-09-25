"use client";

import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, RotateCcw, ShieldCheck, Siren, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { PartId } from "@/components/CtScanner";
import ScannerView from "@/components/ScannerView";
import { type Drill, type DrillResult, answerDrill, getDrill, getDrills, loadLearner } from "@/lib/api";

const STEP_SECONDS = 30;

type Answer = { option: string; result: DrillResult; seconds: number };

export default function DrillRunner({ drillId }: { drillId: string }) {
  const [drill, setDrill] = useState<Drill | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pending, setPending] = useState<Answer | null>(null);
  const [left, setLeft] = useState(STEP_SECONDS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDrill(drillId).then(setDrill).catch(() => setError(true));
    getDrills()
      .then((all) => {
        const i = all.findIndex((d) => d.id === drillId);
        setNextId(all[(i + 1) % all.length]?.id ?? null);
      })
      .catch(() => {});
  }, [drillId]);

  const step = answers.length;
  const done = drill !== null && step >= drill.steps.length && !pending;
  const running = drill !== null && !pending && !done;

  // Countdown for the current decision: adds the time pressure of a real emergency.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running, step]);

  async function choose(option: string) {
    if (!drill || pending || busy) return;
    setBusy(true);
    try {
      const result = await answerDrill(drill.id, step, option, loadLearner());
      setPending({ option, result, seconds: STEP_SECONDS - left });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (!pending) return;
    setAnswers((a) => [...a, pending]);
    setPending(null);
    setLeft(STEP_SECONDS);
  }

  function restart() {
    setAnswers([]);
    setPending(null);
    setLeft(STEP_SECONDS);
  }

  if (error) return <p className="p-8 text-coral">API bilan aloqa yo‘q</p>;
  if (!drill) return <p className="p-8 font-mono text-sm text-muted">Yuklanmoqda…</p>;

  const all = pending ? [...answers, pending] : answers;
  const correct = all.filter((a) => a.result.correct).length;
  const critical = all.filter((a) => a.result.critical).length;
  const resolved = done && correct === drill.steps.length;
  const current = drill.steps[Math.min(step, drill.steps.length - 1)];
  const optionText = (s: number, id: string) => drill.steps[s].options.find((o) => o.id === id)?.text_uz ?? id;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
      <Link href="/cases" className="flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Trenajor
      </Link>

      {/* Alarm banner */}
      <section
        className={`rise-in flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-6 py-4 ${
          resolved ? "border-teal/50 bg-teal/10" : "fault-pulse border-coral/60 bg-coral/15"
        }`}
      >
        <div className="flex items-center gap-3">
          {resolved ? <ShieldCheck className="text-teal" size={28} /> : <Siren className="animate-pulse text-coral" size={28} />}
          <div>
            <p className={`font-mono text-[11px] uppercase ${resolved ? "text-teal" : "text-coral"}`}>
              {resolved ? "Xavf bartaraf etildi" : "Favqulodda holat · mashg‘ulot"}
            </p>
            <h1 className="font-display text-2xl font-bold">{drill.title_uz}</h1>
          </div>
        </div>
        {running && (
          <span className={`flex items-center gap-2 font-mono text-2xl ${left <= 10 ? "text-coral" : "text-ink"}`}>
            <Clock size={20} /> 00:{String(left).padStart(2, "0")}
          </span>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="flex flex-col gap-4 lg:col-span-7">
          <div className="glass-strong relative h-[420px] overflow-hidden">
            <div className="absolute inset-0">
              <ScannerView
                spinning={false}
                xray={false}
                effect={resolved ? null : { kind: drill.effect, part: drill.part as PartId }}
                highlight={drill.effect === "overheat" && !resolved ? (drill.part as PartId) : null}
                showLabel={false}
              />
            </div>
          </div>
          <div className="glass p-5">
            <p className="eyebrow flex items-center gap-2">
              <AlertTriangle size={14} /> Vaziyat
            </p>
            <p className="mt-2 leading-relaxed">{drill.situation_uz}</p>
          </div>
        </section>

        <section className="flex flex-col gap-4 lg:col-span-5">
          {!done && (
            <div key={step} className="glass rise-in flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow">
                  {step + 1}-qadam / {drill.steps.length}
                </p>
                <div className="flex gap-1">
                  {drill.steps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-8 rounded-full ${
                        i < all.length ? (all[i].result.correct ? "bg-teal" : "bg-coral") : i === step ? "bg-ink/60" : "bg-surface-3"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <h2 className="font-display text-xl font-semibold">{current.prompt_uz}</h2>
              <ul className="flex flex-col gap-2">
                {current.options.map((o) => {
                  const picked = pending?.option === o.id;
                  const isAnswer = pending?.result.correct_option === o.id;
                  const state = !pending ? "idle" : isAnswer ? "correct" : picked ? "wrong" : "dim";
                  return (
                    <li key={o.id}>
                      <button
                        onClick={() => choose(o.id)}
                        disabled={!!pending || busy}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                          state === "correct"
                            ? "border-teal bg-teal/10"
                            : state === "wrong"
                              ? "shake border-coral bg-coral/10"
                              : state === "dim"
                                ? "border-line/40 opacity-50"
                                : "border-line/60 hover:-translate-y-0.5 hover:border-teal/60"
                        }`}
                      >
                        {state === "correct" ? (
                          <CheckCircle2 size={18} className="shrink-0 text-teal" />
                        ) : state === "wrong" ? (
                          <XCircle size={18} className="shrink-0 text-coral" />
                        ) : (
                          <span className="h-[18px] w-[18px] shrink-0 rounded-full border border-muted" />
                        )}
                        {o.text_uz}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {pending && (
                <div className={`${pending.result.correct ? "glass-strong" : "glass-fault"} rise-in flex flex-col gap-2 p-4`}>
                  {pending.result.critical && (
                    <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-coral">
                      <AlertTriangle size={16} /> Hayot uchun xavfli xato
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{pending.result.explanation_uz}</p>
                  <p className="font-mono text-[11px] text-muted">Javob vaqti: {pending.seconds} s</p>
                  <button onClick={next} className="btn-primary mt-1 w-fit">
                    {step + 1 < drill.steps.length ? "Keyingi qadam" : "Natija"} <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {!pending && left === 0 && <p className="font-mono text-xs text-coral">Vaqt tugadi — real vaziyatda har soniya muhim. Baribir javob bering.</p>}
            </div>
          )}

          {done && (
            <div className={`${resolved ? "glass-strong" : "glass-fault"} rise-in flex flex-col gap-4 p-6`}>
              <div className="flex items-center gap-4">
                <p className="font-mono text-4xl font-bold">
                  {correct}/{drill.steps.length}
                </p>
                <div>
                  <p className="font-display text-lg font-semibold">{resolved ? "Protokol to‘g‘ri bajarildi" : "Protokolni takrorlang"}</p>
                  <p className="font-mono text-xs text-muted">
                    Xavfli xatolar: <span className={critical ? "text-coral" : "text-teal"}>{critical}</span> · Umumiy vaqt:{" "}
                    {answers.reduce((s, a) => s + a.seconds, 0)} s
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-line/40 bg-bg/50 p-4">
                <p className="eyebrow">To‘g‘ri harakatlar tartibi</p>
                <ol className="mt-2 flex flex-col gap-2 text-sm">
                  {answers.map((a, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-mono text-teal">{i + 1}.</span> {optionText(i, a.result.correct_option)}
                    </li>
                  ))}
                </ol>
              </div>
              <p className="flex items-start gap-2 text-[11px] text-muted">
                <BookOpen size={12} className="mt-0.5 shrink-0" /> {answers[0]?.result.source}
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={restart} className="btn-ghost">
                  <RotateCcw size={16} /> Qayta mashq
                </button>
                {nextId && (
                  <Link href={`/favqulodda/${nextId}`} className="btn-primary">
                    Keyingi holat <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
