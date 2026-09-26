"use client";

import { ArrowRight, Award, BookOpen, CheckCircle2, Clock, RotateCcw, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { type QuizQuestion, type QuizResult, answerQuiz, getQuiz, loadLearner, quizImageUrl } from "@/lib/api";

const LEVEL = ["", "Oson", "O‘rta", "Qiyin"];
const LETTERS = ["A", "B", "C", "D", "E"];

type Answered = { question: QuizQuestion; option: string; result: QuizResult };

// Adaptive order: pick the unanswered question closest to the current level.
function pickNext(all: QuizQuestion[], done: Set<string>, level: number): QuizQuestion | null {
  const left = all.filter((q) => !done.has(q.id));
  if (left.length === 0) return null;
  return left.reduce((best, q) => (Math.abs(q.difficulty - level) < Math.abs(best.difficulty - level) ? q : best));
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function Ring({ value, total, size = 56 }: { value: number; total: number; size?: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true">
      <circle cx="30" cy="30" r={r} stroke="var(--surface-3)" strokeWidth="5" fill="none" />
      <circle
        cx="30"
        cy="30"
        r={r}
        stroke="var(--teal)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / Math.max(total, 1))}
        transform="rotate(-90 30 30)"
        style={{ transition: "stroke-dashoffset 500ms ease-out" }}
      />
    </svg>
  );
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [current, setCurrent] = useState<QuizQuestion | null>(null);
  const [level, setLevel] = useState(1);
  const [trend, setTrend] = useState<"up" | "down" | null>(null);
  const [pending, setPending] = useState<{ option: string; result: QuizResult } | null>(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    getQuiz()
      .then((qs) => {
        setQuestions(qs);
        setCurrent(pickNext(qs, new Set(), 1));
      })
      .catch(() => setError(true));
  }, []);

  const finished = questions.length > 0 && !current;

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [finished]);

  async function choose(option: string) {
    if (!current || pending || busy) return;
    setBusy(true);
    try {
      const result = await answerQuiz(current.id, option, loadLearner());
      setPending({ option, result });
      setAnswered((a) => [...a, { question: current, option, result }]);
      const next = Math.max(1, Math.min(3, level + (result.correct ? 1 : -1)));
      setTrend(next > level ? "up" : next < level ? "down" : null);
      setLevel(next);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function goNext() {
    const done = new Set(answered.map((a) => a.question.id));
    setPending(null);
    setCurrent(pickNext(questions, done, level));
  }

  function restart() {
    setAnswered([]);
    setPending(null);
    setLevel(1);
    setTrend(null);
    setSeconds(0);
    setCurrent(pickNext(questions, new Set(), 1));
  }

  const score = answered.filter((a) => a.result.correct).length;
  const byTopic = useMemo(() => {
    const map = new Map<string, { ok: number; total: number }>();
    for (const a of answered) {
      const t = map.get(a.question.topic) ?? { ok: 0, total: 0 };
      t.total += 1;
      if (a.result.correct) t.ok += 1;
      map.set(a.question.topic, t);
    }
    return [...map.entries()];
  }, [answered]);
  const artefacts = byTopic.find(([t]) => t === "Artefaktlar")?.[1];
  const badge = artefacts && artefacts.total > 0 && artefacts.ok / artefacts.total >= 0.8;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
      {/* Status bar */}
      <div className="glass flex flex-wrap items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Ring value={answered.length} total={questions.length} />
            <span className="absolute inset-0 grid place-items-center font-mono text-xs">{answered.length}</span>
          </div>
          <div>
            <p className="font-mono text-sm">
              {answered.length}/{questions.length || 10} savol
            </p>
            <p className="font-mono text-[11px] text-muted">{current?.topic ?? "Yakun"}</p>
          </div>
        </div>
        <span className="chip">
          Qiyinlik: {LEVEL[level]}
          {trend === "up" && <TrendingUp size={14} />}
          {trend === "down" && <TrendingDown size={14} />}
          <span className="normal-case text-muted">(moslashuvchan)</span>
        </span>
        <span className="flex items-center gap-2 font-mono text-sm">
          <Clock size={16} className="text-teal" /> {formatTime(seconds)}
        </span>
      </div>

      <header className="rise-in">
        <p className="eyebrow">Interaktiv attestatsiya</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">Savol-javob</h1>
        <p className="mt-2 text-muted">KT diagnostikasi, artefaktlar va nurlanish xavfsizligi bo‘yicha moslashuvchan test.</p>
      </header>

      {error && <p className="text-coral">API bilan aloqa yo‘q</p>}

      {current && (
        <section key={current.id} className="glass rise-in flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted">
            <span className="chip">{current.kind === "image" ? "Tasviriy tahlil" : "Nazariy savol"}</span>
            <span>{LEVEL[current.difficulty]}</span>
          </div>
          <h2 className="font-display text-2xl font-semibold leading-snug">{current.prompt_uz}</h2>

          <div className={current.image ? "grid gap-5 md:grid-cols-2" : ""}>
            {current.image && (
              <figure className="group overflow-hidden rounded-xl border border-line/60 bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG from our API */}
                <img
                  src={quizImageUrl(current.image)}
                  alt="Tahlil qilinadigan KT tasviri"
                  className="w-full transition-transform duration-500 group-hover:scale-125"
                />
                <figcaption className="px-3 py-2 font-mono text-[11px] text-muted">Kattalashtirish uchun ustiga olib boring</figcaption>
              </figure>
            )}
            <ul className={`grid gap-3 ${current.image ? "" : "md:grid-cols-2"}`}>
              {current.options.map((o, i) => {
                const picked = pending?.option === o.id;
                const isCorrect = pending?.result.correct_option === o.id;
                const state = !pending ? "idle" : isCorrect ? "correct" : picked ? "wrong" : "dim";
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => choose(o.id)}
                      disabled={!!pending || busy}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                        state === "correct"
                          ? "border-teal bg-teal/10 shadow-[0_0_14px_rgba(79,209,181,0.3)]"
                          : state === "wrong"
                            ? "shake border-coral bg-coral/10"
                            : state === "dim"
                              ? "border-line/40 opacity-50"
                              : "border-line/60 hover:-translate-y-0.5 hover:border-teal/60"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-sm ${
                          state === "correct" ? "bg-teal text-on-teal" : state === "wrong" ? "bg-coral text-ink" : "bg-surface-3"
                        }`}
                      >
                        {state === "correct" ? <CheckCircle2 size={16} /> : state === "wrong" ? <XCircle size={16} /> : LETTERS[i]}
                      </span>
                      <span className="text-sm">{o.text_uz}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {pending && (
            <div className={`${pending.result.correct ? "glass-strong" : "glass-fault"} rise-in flex flex-col gap-3 p-5 md:flex-row md:items-center`}>
              <div className="flex-1">
                <span className={pending.result.correct ? "chip" : "chip chip-fault"}>{pending.result.correct ? "To‘g‘ri" : "Noto‘g‘ri"}</span>
                <p className="mt-2 text-sm leading-relaxed">{pending.result.explanation_uz}</p>
                <p className="mt-2 flex items-center gap-1 font-mono text-[11px] text-teal">
                  <BookOpen size={12} /> Manba: {pending.result.source}
                </p>
              </div>
              <button onClick={goNext} className="btn-primary shrink-0">
                Keyingi savol <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      )}

      {finished && (
        <section className="glass-strong rise-in flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative">
              <Ring value={score} total={answered.length} size={96} />
              <span className="absolute inset-0 grid place-items-center font-mono text-lg font-bold">
                {score}/{answered.length}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold">
                Test natijasi: {Math.round((score / Math.max(answered.length, 1)) * 100)}%
              </h2>
              <p className="text-muted">Vaqt: {formatTime(seconds)}</p>
            </div>
            {badge && (
              <div className="glass rise-in flex items-center gap-3 px-4 py-3">
                <Award className="text-teal" size={28} />
                <div>
                  <p className="font-mono text-[11px] text-teal">NISHON BERILDI</p>
                  <p className="font-display font-semibold">“Artefaktlar ustasi”</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h3 className="font-display font-semibold">Mavzular bo‘yicha</h3>
              {byTopic.map(([topic, t]) => (
                <div key={topic}>
                  <div className="flex justify-between text-sm">
                    <span>{topic}</span>
                    <span className="font-mono text-teal">{Math.round((t.ok / t.total) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-teal transition-all duration-700" style={{ width: `${(t.ok / t.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-display font-semibold">Xato qilingan savollar</h3>
              {answered.filter((a) => !a.result.correct).length === 0 && <p className="text-sm text-muted">Xato yo‘q — ajoyib!</p>}
              {answered
                .filter((a) => !a.result.correct)
                .map((a) => (
                  <div key={a.question.id} className="rounded-xl border border-coral/40 bg-bg/50 p-3 text-sm">
                    <p>{a.question.prompt_uz}</p>
                    <Link href={a.question.topic === "Artefaktlar" ? "/cases" : "/video"} className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-teal">
                      Qayta o‘rganish <ArrowRight size={12} />
                    </Link>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={restart} className="btn-ghost">
              <RotateCcw size={16} /> Qayta topshirish
            </button>
            <Link href="/cases" className="btn-primary">
              Trenajorga o‘tish <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
