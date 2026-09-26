"use client";

import { BookOpen, BrainCircuit, SendHorizontal, ShieldAlert, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { type TutorAnswer, type TutorSource, askTutor, getTutorSources } from "@/lib/api";

type Message = { role: "user"; text: string } | { role: "ai"; answer: TutorAnswer };

const SUGGESTIONS = ["Halqa artefakti nima?", "ALARA tamoyili", "Bemorni to‘g‘ri joylashtirish", "mAs oshirsam nima bo‘ladi?", "Kundalik sifat nazorati"];

// Turn "[1]" markers in the answer into small citation chips.
function withCitations(text: string) {
  return text.split(/(\[\d+\])/g).map((part, i) =>
    /^\[\d+\]$/.test(part) ? (
      <sup key={i} className="mx-0.5 rounded bg-teal/20 px-1 font-mono text-[10px] text-teal">
        {part.slice(1, -1)}
      </sup>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<TutorSource[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTutorSources().then(setSources).catch(() => setError(true));
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const answer = await askTutor(q);
      setMessages((m) => [...m, { role: "ai", answer }]);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const lastCitations = [...messages].reverse().find((m): m is { role: "ai"; answer: TutorAnswer } => m.role === "ai")?.answer.citations ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
      <header className="rise-in">
        <p className="eyebrow">Manbaga asoslangan yordamchi</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">AI ustoz</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Faqat o‘quv manbalaridan javob beradi va har bir fikrga manba ko‘rsatadi. Manbada javob bo‘lmasa — taxmin qilmaydi.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Chat */}
        <section className="glass flex min-h-[560px] flex-col lg:col-span-8">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="m-auto flex max-w-md flex-col items-center gap-3 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-teal/40 bg-teal/10">
                  <BrainCircuit className="text-teal" />
                </span>
                <p className="font-display text-lg font-semibold">Savolingizni yozing</p>
                <p className="text-sm text-muted">KT tuzilishi, artefaktlar, nurlanish xavfsizligi va sifat nazorati bo‘yicha.</p>
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="rise-in flex justify-end gap-2">
                  <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-teal px-4 py-2 text-sm text-on-teal">{m.text}</p>
                  <UserRound size={20} className="mt-1 shrink-0 text-muted" />
                </div>
              ) : (
                <div key={i} className="rise-in flex gap-2">
                  <BrainCircuit size={20} className="mt-1 shrink-0 text-teal" />
                  <div className={`max-w-[85%] rounded-2xl rounded-bl-sm border p-4 ${m.answer.grounded ? "border-teal/30 bg-bg/60" : "border-coral/40 bg-coral/5"}`}>
                    {!m.answer.grounded && (
                      <p className="mb-2 flex items-center gap-1 font-mono text-[11px] uppercase text-coral">
                        <ShieldAlert size={14} /> Manbada javob yo‘q
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{withCitations(m.answer.answer_uz)}</p>
                    {m.answer.citations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.answer.citations.map((c) => (
                          <span key={c.n} className="chip normal-case">
                            [{c.n}] {c.doc} · {c.section}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.answer.grounded && !m.answer.smalltalk && (
                      <p className="mt-2 font-mono text-[10px] text-muted">
                        {m.answer.ai_used ? "AI javobi · manbalar bilan tekshirilgan" : "Manbadan iqtibos (AI ulanmagan)"}
                      </p>
                    )}
                  </div>
                </div>
              ),
            )}
            {busy && <p className="animate-pulse font-mono text-xs text-teal">AI ustoz manbalarni ko‘rib chiqmoqda…</p>}
            <div ref={bottom} />
          </div>

          <div className="flex flex-col gap-3 border-t border-line/40 p-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="chip normal-case transition-colors hover:bg-teal/25" disabled={busy}>
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                placeholder="Masalan: halqa artefaktini qanday bartaraf etaman?"
                className="flex-1 rounded-full border border-line/60 bg-bg/80 px-5 py-3 text-sm outline-none focus:border-teal focus:shadow-[0_0_8px_rgba(79,209,181,0.3)]"
                aria-label="Savol"
              />
              <button type="submit" disabled={!input.trim() || busy} className="btn-primary px-4!" aria-label="Yuborish">
                <SendHorizontal size={18} />
              </button>
            </form>
            {error && <p className="text-sm text-coral">API bilan aloqa yo‘q</p>}
          </div>
        </section>

        {/* Sources */}
        <aside className="flex flex-col gap-4 lg:col-span-4">
          {lastCitations.length > 0 && (
            <div className="glass-strong rise-in flex flex-col gap-3 p-5">
              <p className="eyebrow">Oxirgi javob manbalari</p>
              {lastCitations.map((c) => (
                <div key={c.n} className="rounded-xl border border-line/40 bg-bg/50 p-3">
                  <p className="font-mono text-[11px] text-teal">
                    [{c.n}] {c.section}
                  </p>
                  <p className="mt-1 text-xs text-muted">{c.snippet}…</p>
                  <p className="mt-2 text-[11px] text-muted/80">{c.source}</p>
                </div>
              ))}
            </div>
          )}
          <div className="glass flex flex-col gap-3 p-5">
            <p className="eyebrow flex items-center gap-2">
              <BookOpen size={14} /> Manbalar
            </p>
            {sources.map((s) => (
              <div key={s.doc}>
                <p className="font-display text-sm font-semibold">{s.doc}</p>
                <p className="text-[11px] text-muted">{s.sections.length} bo‘lim</p>
              </div>
            ))}
            <p className="text-[11px] text-muted/80">Vazirlik materiallari qo‘shilganda ular ham shu ro‘yxatga kiradi.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
