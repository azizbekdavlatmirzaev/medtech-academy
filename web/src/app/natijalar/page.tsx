"use client";

import { ArrowRight, BadgeCheck, Briefcase, CheckCircle2, ShieldCheck, UserRound, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { type Candidate, type Progress, getProgress, getRecruitment, loadLearner, saveLearner, setConsent } from "@/lib/api";

const REGIONS = ["Namangan", "Toshkent", "Andijon", "Farg‘ona", "Samarqand", "Buxoro", "Xorazm", "Boshqa"];

function TrendChart({ values }: { values: number[] }) {
  const w = 320;
  const h = 120;
  if (values.length < 2) return <p className="grid h-[120px] place-items-center text-sm text-muted">Kamida 2 ta urinish kerak</p>;
  const x = (i: number) => (i / (values.length - 1)) * (w - 20) + 10;
  const y = (v: number) => h - 10 - (v / 10) * (h - 20);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[120px] w-full" aria-label="Oxirgi urinishlar bali">
      {[0, 5, 10].map((g) => (
        <line key={g} x1="10" x2={w - 10} y1={y(g)} y2={y(g)} stroke="var(--surface-3)" strokeDasharray="3 4" />
      ))}
      <path d={`${d} L${x(values.length - 1)},${h - 10} L10,${h - 10} Z`} fill="rgba(79,209,181,0.12)" />
      <path d={d} fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinejoin="round" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill={v >= 6 ? "var(--teal)" : "var(--coral)"} />
      ))}
    </svg>
  );
}

function SkillsRadar({ skills }: { skills: Record<string, number | null> }) {
  const entries = Object.entries(skills);
  const c = 110;
  const r = 80;
  const point = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / entries.length - Math.PI / 2;
    return [c + Math.cos(a) * r * (v / 100), c + Math.sin(a) * r * (v / 100)];
  };
  const poly = entries.map(([, v], i) => point(i, v ?? 0).join(",")).join(" ");
  return (
    <div className="relative">
      <svg viewBox="0 0 220 220" className="mx-auto h-56 w-56" aria-label="Ko‘nikmalar radari">
        {[25, 50, 75, 100].map((lvl) => (
          <polygon key={lvl} points={entries.map((_, i) => point(i, lvl).join(",")).join(" ")} fill="none" stroke="var(--surface-3)" />
        ))}
        {entries.map((_, i) => {
          const [px, py] = point(i, 100);
          return <line key={i} x1={c} y1={c} x2={px} y2={py} stroke="var(--surface-3)" />;
        })}
        <polygon points={poly} fill="rgba(79,209,181,0.2)" stroke="var(--teal)" strokeWidth="2" style={{ transition: "all 600ms ease-out" }} />
      </svg>
      {entries.map(([name, v], i) => {
        const [px, py] = point(i, 128);
        return (
          <span
            key={name}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] text-muted"
            style={{ left: `calc(50% + ${px - c}px)`, top: `${(py / 220) * 100}%` }}
          >
            {name} {v === null ? "—" : `${v}%`}
          </span>
        );
      })}
    </div>
  );
}

export default function ResultsPage() {
  const [tab, setTab] = useState<"me" | "employer">("me");
  const [learner, setLearner] = useState(loadLearner);
  const [draft, setDraft] = useState(learner);
  const [data, setData] = useState<Progress | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [error, setError] = useState(false);

  const reload = useCallback(() => {
    getProgress(learner).then(setData).catch(() => setError(true));
    getRecruitment().then(setCandidates).catch(() => setError(true));
  }, [learner]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function toggleConsent(on: boolean) {
    await setConsent(learner, on, region);
    reload();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
      <header className="rise-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Progress va ishga joylashtirish</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">Natijalar</h1>
        </div>
        <div className="glass flex gap-1 p-1">
          {(
            [
              ["me", "Mening natijalarim"],
              ["employer", "Ish beruvchilar uchun"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-xl px-4 py-2 text-sm transition-colors ${tab === id ? "bg-teal text-on-teal" : "text-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      {error && <p className="text-coral">API bilan aloqa yo‘q</p>}

      {tab === "me" && data && (
        <>
          <section className="grid gap-6 lg:grid-cols-12">
            <div className="glass rise-in flex flex-col gap-4 p-6 lg:col-span-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-teal font-display text-lg font-bold text-on-teal" suppressHydrationWarning>
                  {learner.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-display text-lg font-semibold" suppressHydrationWarning>
                    {learner}
                  </p>
                  <p className="font-mono text-[11px] text-muted">Muhandis yo‘nalishi · Daraja {data.level}</p>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = draft.trim() || "demo";
                  saveLearner(name);
                  setLearner(name);
                }}
                className="flex gap-2"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={64}
                  suppressHydrationWarning
                  className="flex-1 rounded-full border border-line/60 bg-bg/80 px-4 py-2 text-sm outline-none focus:border-teal"
                  aria-label="O‘quvchi ismi"
                />
                <button className="btn-ghost px-4! py-2! text-sm">Ko‘rish</button>
              </form>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Sertifikatga tayyorlik</span>
                  <span className="font-mono text-teal">{data.readiness}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-teal transition-all duration-700" style={{ width: `${data.readiness}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  Holatlar: {data.cases_done}/{data.cases_total} · Test: {data.quiz_pct}% · 70% dan “tayyor”
                </p>
              </div>
              {data.ready ? (
                <span className="chip w-fit">
                  <BadgeCheck size={14} /> Sertifikatga tayyor
                </span>
              ) : (
                <Link href="/cases" className="flex items-center gap-1 font-mono text-xs text-teal">
                  Tayyorlikni oshirish <ArrowRight size={12} />
                </Link>
              )}
            </div>

            <div className="glass rise-in flex flex-col gap-2 p-6 lg:col-span-4">
              <p className="eyebrow">Ball dinamikasi (oxirgi 10)</p>
              <TrendChart values={data.trend} />
            </div>

            <div className="glass rise-in p-6 lg:col-span-4">
              <p className="eyebrow">Ko‘nikmalar</p>
              <SkillsRadar skills={data.skills} />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-12">
            <div className="glass overflow-x-auto p-6 lg:col-span-8">
              <p className="eyebrow">Oxirgi urinishlar</p>
              {data.recent.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Hali urinish yo‘q.{" "}
                  <Link href="/cases" className="text-teal">
                    Trenajorni boshlang →
                  </Link>
                </p>
              ) : (
                <table className="mt-3 w-full text-left text-sm">
                  <thead className="font-mono text-[11px] uppercase text-muted">
                    <tr>
                      <th className="py-2">Holat</th>
                      <th>Javob</th>
                      <th>Natija</th>
                      <th className="text-right">Ball</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((r, i) => (
                      <tr key={i} className="border-t border-line/40">
                        <td className="py-2">{r.title_uz}</td>
                        <td className="text-muted">{r.kind === "quiz" ? `Variant ${r.answer_uz.toUpperCase()}` : r.answer_uz}</td>
                        <td>
                          <span className={r.correct ? "chip" : "chip chip-fault"}>
                            {r.correct ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {r.correct ? "To‘g‘ri" : "Noto‘g‘ri"}
                          </span>
                        </td>
                        <td className="text-right font-mono">{r.kind === "quiz" ? (r.correct ? "✓" : "—") : `${r.score}/10`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="glass flex flex-col gap-3 p-6 lg:col-span-4">
              <p className="eyebrow flex items-center gap-2">
                <ShieldCheck size={14} /> Ish beruvchilarga ko‘rinish
              </p>
              <p className="text-sm text-muted">
                Profilingiz faqat roziligingiz bilan ish beruvchilarga ko‘rsatiladi. Istalgan vaqtda o‘chirib qo‘yishingiz mumkin.
              </p>
              {data.consent_region ? (
                <>
                  <span className="chip w-fit">Rozi · {data.consent_region}</span>
                  <button onClick={() => toggleConsent(false)} className="btn-ghost w-fit px-4! py-2! text-sm">
                    Roziligni qaytarib olish
                  </button>
                </>
              ) : (
                <>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="rounded-full border border-line/60 bg-bg/80 px-4 py-2 text-sm outline-none focus:border-teal"
                    aria-label="Hudud"
                  >
                    {REGIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                  <button onClick={() => toggleConsent(true)} className="btn-primary w-fit px-4! py-2! text-sm">
                    Profilni ko‘rsatishga roziman
                  </button>
                </>
              )}
            </div>
          </section>
        </>
      )}

      {tab === "employer" && (
        <section className="glass rise-in overflow-x-auto p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <Briefcase size={14} /> Tayyor muhandislar
              </p>
              <p className="mt-1 text-sm text-muted">Faqat profilini ko‘rsatishga rozi bo‘lgan o‘quvchilar.</p>
            </div>
            <span className="chip">{candidates.filter((c) => c.ready).length} ta tayyor</span>
          </div>
          {candidates.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Hozircha rozilik bergan o‘quvchi yo‘q.</p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead className="font-mono text-[11px] uppercase text-muted">
                <tr>
                  <th className="py-2">O‘quvchi</th>
                  <th>Hudud</th>
                  <th>Holatlar</th>
                  <th>Tayyorlik</th>
                  <th>Holat</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.learner} className="border-t border-line/40">
                    <td className="flex items-center gap-2 py-3">
                      <UserRound size={16} className="text-teal" /> {c.learner}
                      <span className="chip normal-case">Rozi</span>
                    </td>
                    <td>{c.region}</td>
                    <td className="font-mono">{c.cases_done}</td>
                    <td className="w-40">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-surface-3">
                          <div className="h-full rounded-full bg-teal" style={{ width: `${c.readiness}%` }} />
                        </div>
                        <span className="font-mono text-xs">{c.readiness}%</span>
                      </div>
                    </td>
                    <td>{c.ready ? <span className="chip">Tayyor</span> : <span className="text-xs text-muted">O‘qimoqda</span>}</td>
                    <td className="text-right">
                      <button className="btn-ghost px-3! py-1! text-xs" disabled={!c.ready} title="Pilot bosqichida ishga tushadi">
                        Bog‘lanish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </main>
  );
}
