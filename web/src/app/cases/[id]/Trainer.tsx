"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  const options = [...components, { id: NOT_A_DEVICE_FAULT, name_uz: "Uskuna nosoz emas", description_uz: "" }];
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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/cases" className="text-sm opacity-70 hover:opacity-100">
        ← Barcha holatlar
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">{info?.title_uz ?? "…"}</h1>
          <p className="rounded-lg border border-current/20 p-4">{info?.symptom_uz}</p>
          <div className="grid grid-cols-2 gap-3">
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG from our API */}
              <img src={caseImageUrl(caseId)} alt="Nosoz uskunadagi KT tasviri" className="w-full rounded-lg" />
              <figcaption className="mt-1 text-center text-xs opacity-70">Shu uskuna</figcaption>
            </figure>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG from our API */}
              <img src={normalImageUrl()} alt="Soz uskunadagi KT tasviri" className="w-full rounded-lg opacity-90" />
              <figcaption className="mt-1 text-center text-xs opacity-70">Soz uskuna (namuna)</figcaption>
            </figure>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="h-80 overflow-hidden rounded-xl">
            <ScannerView
              highlight={highlight}
              selected={!grade && choice && choice !== NOT_A_DEVICE_FAULT ? (choice as PartId) : null}
              onSelect={(id) => !grade && setChoice(id)}
              spinning={!grade}
              labels={labels}
            />
          </div>

          {!grade ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <p className="text-sm font-semibold">Qaysi qism buzilgan? (modelda ham bosishingiz mumkin)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((o) => (
                  <label
                    key={o.id}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                      choice === o.id ? "border-[#0E7C6B] bg-[#E3EFEC] text-[#0B5E52]" : "border-current/20"
                    }`}
                  >
                    <input type="radio" name="component" value={o.id} checked={choice === o.id} onChange={() => setChoice(o.id)} className="sr-only" />
                    {o.name_uz}
                  </label>
                ))}
              </div>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Nega shunday deb o‘ylaysiz va nimani tekshirasiz?"
                className="rounded-lg border border-current/20 bg-transparent p-3 text-sm"
              />
              <div className="flex items-center gap-3">
                <input
                  value={learner}
                  onChange={(e) => setLearner(e.target.value)}
                  maxLength={64}
                  placeholder="Ismingiz"
                  suppressHydrationWarning
                  className="w-40 rounded-lg border border-current/20 bg-transparent px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={!choice || busy}
                  className="flex-1 rounded-lg bg-[#0E7C6B] px-4 py-2 font-semibold text-white disabled:opacity-40"
                >
                  {busy ? "AI baholamoqda…" : "Javobni yuborish"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-current/20 p-5">
              <div className="flex items-baseline justify-between">
                <p className={`text-lg font-semibold ${grade.correct ? "text-[#0E9C86]" : "text-[#E0523D]"}`}>
                  {grade.correct ? "To‘g‘ri" : "Noto‘g‘ri"} — {correctName}
                </p>
                <p className="text-3xl font-bold">{grade.score}/10</p>
              </div>
              <p className="text-sm leading-relaxed">{grade.explanation_uz}</p>
              {grade.next_hint_uz && <p className="text-sm opacity-80"><b>Maslahat:</b> {grade.next_hint_uz}</p>}
              <p className="text-xs opacity-60">{grade.ai_used ? "AI baholadi" : "Ekspert izohi (AI ulanmagan)"}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setGrade(null);
                    setChoice("");
                    setReasoning("");
                  }}
                  className="rounded-lg border border-current/20 px-4 py-2 text-sm"
                >
                  Qayta urinish
                </button>
                {nextId && (
                  <Link href={`/cases/${nextId}`} className="rounded-lg bg-[#0E7C6B] px-4 py-2 text-sm font-semibold text-white">
                    Keyingi holat →
                  </Link>
                )}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </section>
      </div>
    </main>
  );
}
