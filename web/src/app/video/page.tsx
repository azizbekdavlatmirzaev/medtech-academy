"use client";

import { ArrowRight, BrainCircuit, CheckCircle2, Lock, Pause, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import ScannerView from "@/components/ScannerView";

import { LESSONS, type Lesson, MODULES } from "./lessons";

// Watched lessons live in localStorage (a per-viewer convenience). Reading it
// through useSyncExternalStore keeps server and client markup in sync.
const DONE_KEY = "medtech.lessons.done";
const DONE_EVENT = "medtech-lessons";

function readDone(): string {
  try {
    return localStorage.getItem(DONE_KEY) || "[]";
  } catch {
    return "[]";
  }
}

function subscribeDone(onChange: () => void) {
  window.addEventListener(DONE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DONE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function markDone(id: string) {
  const ids: string[] = JSON.parse(readDone());
  if (ids.includes(id)) return;
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...ids, id]));
  } catch {
    return; // storage unavailable: nothing to remember
  }
  window.dispatchEvent(new Event(DONE_EVENT));
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s) % 60).padStart(2, "0")}`;

export default function VideoPage() {
  const [lesson, setLesson] = useState<Lesson>(LESSONS[0]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const doneRaw = useSyncExternalStore(subscribeDone, readDone, () => "[]");
  const done: string[] = useMemo(() => JSON.parse(doneRaw), [doneRaw]);

  const finished = time >= lesson.duration;
  const active = playing && !finished;

  // Playback clock: advances while playing, clamped to the lesson length.
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setTime((s) => Math.min(s + 0.25, lesson.duration)), 250);
    return () => clearInterval(t);
  }, [active, lesson.duration]);

  useEffect(() => {
    if (finished) markDone(lesson.id);
  }, [finished, lesson.id]);

  const chapterIndex = lesson.chapters.reduce((idx, c, i) => (time >= c.at ? i : idx), 0);
  const chapter = lesson.chapters[chapterIndex];
  const completedModules = new Set(LESSONS.filter((l) => done.includes(l.id)).map((l) => l.module));

  function open(l: Lesson) {
    setLesson(l);
    setTime(0);
    setPlaying(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 lg:px-8">
      <header className="rise-in">
        <p className="eyebrow">Klinik va texnik mikrodarslar</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">Video darslar</h1>
        <p className="mt-2 text-muted">Interaktiv 3D darslar — har biridan keyin test. Studiya video yozuvlari vazirlik bilan tayyorlanadi.</p>
      </header>

      {/* Learning path */}
      <section className="glass rise-in p-6">
        <p className="eyebrow">Ta’lim yo‘li</p>
        <ol className="mt-5 grid grid-cols-5 gap-2">
          {MODULES.map((m) => {
            const isDone = completedModules.has(m.n);
            const isCurrent = lesson.module === m.n;
            const hasLesson = LESSONS.some((l) => l.module === m.n);
            return (
              <li key={m.n} className="relative flex flex-col items-center gap-2 text-center">
                {m.n < MODULES.length && <span className="absolute left-1/2 top-5 h-px w-full bg-teal/30" />}
                <span
                  className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border transition-all ${
                    isCurrent
                      ? "border-teal bg-teal text-bg shadow-[0_0_16px_rgba(79,209,181,0.5)]"
                      : isDone
                        ? "border-teal bg-bg text-teal"
                        : hasLesson
                          ? "border-line bg-bg text-muted"
                          : "border-line/50 bg-bg text-muted/50"
                  }`}
                >
                  {isDone && !isCurrent ? <CheckCircle2 size={18} /> : hasLesson ? m.n : <Lock size={14} />}
                </span>
                <span className="font-mono text-[10px] uppercase text-muted">Modul {m.n}</span>
                <span className={`text-xs ${isCurrent ? "text-teal" : hasLesson ? "" : "text-muted/60"}`}>{m.title}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Player */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="glass-strong overflow-hidden">
            <div className="relative aspect-video">
              <ScannerView highlight={chapter.part} xray={chapter.xray} spinning={active} tone="info" showLabel={false} />
              <div className="pointer-events-none absolute left-4 top-4 flex gap-2">
                <span className="chip bg-bg/80">{lesson.track}</span>
                <span className="chip bg-bg/80">O‘zbek tilida</span>
              </div>
              <div key={chapterIndex} className="rise-in pointer-events-none absolute inset-x-4 bottom-4 rounded-xl bg-bg/80 p-4 backdrop-blur">
                <p className="font-mono text-[11px] uppercase text-teal">{chapter.title}</p>
                <p className="mt-1 text-sm">{chapter.text}</p>
              </div>
              {!active && !finished && (
                <button
                  onClick={() => setPlaying(true)}
                  className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-teal text-bg shadow-[0_0_24px_rgba(79,209,181,0.5)] transition-transform hover:scale-110"
                  aria-label="Darsni boshlash"
                >
                  <Play size={28} />
                </button>
              )}
            </div>
            {/* Timeline with chapter markers */}
            <div className="flex flex-col gap-2 px-4 py-3">
              <div className="relative h-1.5 rounded-full bg-surface-3">
                <div className="h-full rounded-full bg-teal" style={{ width: `${(time / lesson.duration) * 100}%` }} />
                {lesson.chapters.map((c, i) => (
                  <button
                    key={c.at}
                    onClick={() => setTime(c.at)}
                    className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                      i <= chapterIndex ? "border-teal bg-teal" : "border-muted bg-bg"
                    }`}
                    style={{ left: `${(c.at / lesson.duration) * 100}%` }}
                    aria-label={c.title}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => (finished ? (setTime(0), setPlaying(true)) : setPlaying((p) => !p))} className="flex items-center gap-2 text-sm">
                  {finished ? <RotateCcw size={18} /> : active ? <Pause size={18} /> : <Play size={18} />}
                  <span className="font-mono text-xs text-muted">
                    {fmt(time)} / {fmt(lesson.duration)}
                  </span>
                </button>
                <span className="font-mono text-[11px] text-muted">
                  {chapterIndex + 1}/{lesson.chapters.length} · {chapter.title}
                </span>
              </div>
            </div>
          </div>
          <div className="glass flex flex-col gap-3 p-5">
            <h2 className="font-display text-xl font-semibold">{lesson.title}</h2>
            <p className="text-sm text-muted">
              Modul {lesson.module} · {lesson.moduleTitle} · {lesson.level}
            </p>
            <Link href="/lab" className="btn-ghost w-fit px-4! py-2! text-sm">
              3D laboratoriyada ochish
            </Link>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <div className={`${finished ? "glass-strong" : "glass"} flex flex-col gap-3 p-5`}>
            <span className="chip w-fit">AI sinov</span>
            <h3 className="font-display text-lg font-semibold">Darsdan keyin: test</h3>
            <p className="text-sm text-muted">Mavzuni o‘zlashtirganingizni moslashuvchan test bilan tekshiring.</p>
            <Link href="/savol-javob" className="btn-primary justify-center">
              <BrainCircuit size={18} /> Testni boshlash
            </Link>
          </div>
          <div className="glass p-5">
            <p className="eyebrow">Mavzu terminologiyasi</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {lesson.terms.map((t) => (
                <span key={t} className="chip border-line! bg-surface-3! text-ink!">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="glass p-5">
            <p className="eyebrow">Transkript</p>
            <ol className="mt-3 flex flex-col gap-2">
              {lesson.chapters.map((c, i) => (
                <li key={c.at}>
                  <button
                    onClick={() => setTime(c.at)}
                    className={`w-full rounded-lg p-3 text-left text-sm transition-colors ${
                      i === chapterIndex ? "border border-teal/40 bg-teal/10" : "hover:bg-surface-3"
                    }`}
                  >
                    <span className="font-mono text-[11px] text-teal">{fmt(c.at)}</span>
                    <p className={i === chapterIndex ? "" : "text-muted"}>{c.text}</p>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </section>

      {/* Other lessons */}
      <section>
        <p className="eyebrow">Keyingi bosqichlar</p>
        <h2 className="mt-1 font-display text-2xl font-bold">Barcha darslar</h2>
        <ul className="mt-5 grid gap-6 md:grid-cols-3">
          {LESSONS.map((l) => (
            <li key={l.id}>
              <button onClick={() => open(l)} className="glass group flex w-full flex-col overflow-hidden text-left transition-all duration-300 hover:-translate-y-1">
                <div className="relative grid aspect-video place-items-center bg-[radial-gradient(circle,rgba(79,209,181,0.15),transparent_70%)]">
                  <span className="spin-slow absolute h-24 w-24 rounded-full border border-dashed border-teal/40" />
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-teal/90 text-bg transition-transform group-hover:scale-110">
                    <Play size={22} />
                  </span>
                  <span className="chip absolute bottom-3 right-3 bg-bg/80">{fmt(l.duration)}</span>
                  {done.includes(l.id) && <span className="chip absolute left-3 top-3 bg-bg/80">Ko‘rildi ✓</span>}
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <p className="font-mono text-[11px] text-muted">
                    {l.track} · Modul {l.module}
                  </p>
                  <h3 className="font-display font-semibold">{l.title}</h3>
                  <span className="mt-2 flex items-center gap-1 font-mono text-xs text-teal">
                    Darsni ochish <ArrowRight size={12} />
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
