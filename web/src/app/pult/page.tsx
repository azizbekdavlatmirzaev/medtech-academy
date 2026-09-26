"use client";

import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Crosshair,
  DoorClosed,
  MessageSquareWarning,
  MoveHorizontal,
  Radiation,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import ScannerView from "@/components/ScannerView";
import { type ScanProtocol, type ScanResult, type ScanWindow, scanConsole } from "@/lib/api";

// Same teaching model as api/app/console.py, for the live dose preview.
const CTDI_PER_MAS = 0.18;
const DRL = 60;
const ctdi = (kv: number, mas: number) => CTDI_PER_MAS * mas * (kv / 120) ** 2.5;

type Settings = Omit<ScanProtocol, "patient_instructed" | "door_closed">;
const REFERENCE: Settings = { kv: 120, mas: 300, thickness: 5, kernel: "soft" };
const MIN_EXPOSURE_MS = 3000; // the scan animation runs at least this long

const WINDOW_LABEL: Record<ScanWindow, string> = { brain: "Miya", soft: "Yumshoq to‘qima", bone: "Suyak" };
const QUALITY_STYLE: Record<ScanResult["quality"], string> = {
  yaxshi: "text-teal",
  qoniqarli: "text-[#e0b341]",
  past: "text-coral",
  yaroqsiz: "text-coral",
};

type Run = { protocol: Settings; result: ScanResult };

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  disabled,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: (v: T) => string;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-bg/70 p-1">
      {options.map((o) => (
        <button
          key={o}
          disabled={disabled}
          onClick={() => onChange(o)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-sm transition-colors disabled:opacity-50 ${
            value === o ? "bg-teal font-semibold text-on-teal" : "text-muted hover:text-ink"
          }`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-line/40 pb-4 last:border-0">
      <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
        <span
          className={`grid h-6 w-6 place-items-center rounded-full text-xs ${done ? "bg-teal text-on-teal" : "border border-line text-muted"}`}
        >
          {done ? "✓" : n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Toggle({ on, onClick, icon, children, disabled }: { on: boolean; onClick: () => void; icon: ReactNode; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all disabled:opacity-40 ${
        on ? "border-teal bg-teal/10 text-teal" : "border-line/60 hover:border-teal/50"
      }`}
    >
      {icon} <span className="flex-1">{children}</span> {on && <CheckCircle2 size={16} />}
    </button>
  );
}

export default function ConsolePage() {
  const [patient, setPatient] = useState(false);
  const [instructed, setInstructed] = useState(false);
  const [laser, setLaser] = useState(false);
  const [inBore, setInBore] = useState(false);
  const [door, setDoor] = useState(false);
  const [protocol, setProtocol] = useState<Settings>(REFERENCE);
  const [exposing, setExposing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [view, setView] = useState<ScanWindow>("brain");
  const [history, setHistory] = useState<Run[]>([]);
  const [error, setError] = useState(false);

  const dose = ctdi(protocol.kv, protocol.mas);
  const blockers = [
    !patient && "Bemor stolga yotqizilmagan",
    !laser && "Lazer bilan joylashtirilmagan",
    !inBore && "Stol gantryga kiritilmagan",
    !door && "Eshik yopiqligi tasdiqlanmagan",
  ].filter(Boolean) as string[];

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setProtocol((p) => ({ ...p, [key]: value }));

  const reset = () => {
    setPatient(false);
    setInstructed(false);
    setLaser(false);
    setInBore(false);
    setDoor(false);
    setResult(null);
  };

  const scan = async () => {
    setExposing(true);
    setError(false);
    const body: ScanProtocol = { ...protocol, patient_instructed: instructed, door_closed: door };
    try {
      const [res] = await Promise.all([scanConsole(body), new Promise((r) => setTimeout(r, MIN_EXPOSURE_MS))]);
      setResult(res);
      setView("brain");
      setHistory((h) => [{ protocol, result: res }, ...h].slice(0, 6));
    } catch {
      setError(true);
    } finally {
      setExposing(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8">
      <header className="rise-in">
        <p className="eyebrow">Operator yo‘nalishi</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">KT boshqaruv pulti</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Bemorni joylashtiring, skanerlash protokolini tanlang va skanerlang. Tasvir fizik simulyatsiya qilinadi: mAs, kV va kesim
          qalinligi shovqin va dozaga haqiqiy KT dagidek ta’sir qiladi.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <section className="glass-strong relative h-[55vh] min-h-[420px] flex-1 overflow-hidden lg:h-auto lg:min-h-[640px]">
          <div className="absolute inset-0">
            <ScannerView xray showLabel={false} rig={{ travel: inBore ? 1 : 0, patient, laser, exposing }} />
          </div>
          {exposing && (
            <div className="fault-pulse absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[#e0b341] bg-[#e0b341]/15 px-4 py-2 font-mono text-sm font-bold text-[#e0b341]">
              <Radiation size={18} /> X-RAY ON · skanerlanmoqda…
            </div>
          )}
          <p className="absolute bottom-4 left-4 font-mono text-[11px] text-muted">Sichqoncha bilan aylantiring · g‘ildirak bilan yaqinlashtiring</p>
        </section>

        <aside className="glass flex w-full flex-col gap-4 p-5 lg:w-[420px]">
          <Step n={1} title="Bemorni tayyorlash" done={patient && laser && inBore}>
            <div className="flex flex-col gap-2">
              <Toggle on={patient} onClick={() => setPatient((v) => !v)} icon={<BedDouble size={16} />} disabled={inBore || exposing}>
                Bemorni stolga yotqizish (chalqancha, bosh gantry tomonda)
              </Toggle>
              <Toggle on={instructed} onClick={() => setInstructed((v) => !v)} icon={<MessageSquareWarning size={16} />} disabled={!patient || exposing}>
                Bemorga ko‘rsatma: «Skanerlash paytida qimirlamang»
              </Toggle>
              <Toggle on={laser} onClick={() => setLaser((v) => !v)} icon={<Crosshair size={16} />} disabled={!patient || exposing}>
                Lazer bilan markazlash
              </Toggle>
              <Toggle on={inBore} onClick={() => setInBore((v) => !v)} icon={<MoveHorizontal size={16} />} disabled={!patient || !laser || exposing}>
                {inBore ? "Stol gantry ichida (bosing — chiqarish)" : "Stolni gantryga kiritish"}
              </Toggle>
            </div>
          </Step>

          <Step n={2} title="Skanerlash protokoli (bosh KT)" done={false}>
            <div className="flex flex-col gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="flex justify-between text-muted">Trubka kuchlanishi</span>
                <Segmented options={[80, 100, 120, 140]} value={protocol.kv} onChange={(v) => set("kv", v)} label={(v) => `${v} kV`} disabled={exposing} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="flex justify-between text-muted">
                  Trubka toki × vaqt <span className="font-mono font-semibold text-ink">{protocol.mas} mAs</span>
                </span>
                <input
                  type="range"
                  min={50}
                  max={400}
                  step={10}
                  value={protocol.mas}
                  disabled={exposing}
                  onChange={(e) => set("mas", Number(e.target.value))}
                  className="accent-teal"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-muted">Kesim qalinligi</span>
                <Segmented options={[1, 2.5, 5]} value={protocol.thickness} onChange={(v) => set("thickness", v)} label={(v) => `${v} mm`} disabled={exposing} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-muted">Rekonstruksiya kerneli</span>
                <Segmented
                  options={["soft", "sharp"] as const}
                  value={protocol.kernel}
                  onChange={(v) => set("kernel", v)}
                  label={(v) => (v === "soft" ? "Yumshoq (miya)" : "O‘tkir (suyak)")}
                  disabled={exposing}
                />
              </label>
              <div className="rounded-xl bg-bg/60 p-3">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted">Taxminiy doza (CTDIvol)</span>
                  <span className={dose > DRL ? "font-bold text-coral" : "font-bold text-teal"}>{dose.toFixed(0)} mGy</span>
                </div>
                <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
                  <div className={`h-full rounded-full transition-all ${dose > DRL ? "bg-coral" : "bg-teal"}`} style={{ width: `${Math.min(100, (dose / 120) * 100)}%` }} />
                  <div className="absolute inset-y-0 w-0.5 bg-ink/70" style={{ left: `${(DRL / 120) * 100}%` }} />
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted">Chiziq — bosh KT uchun referens daraja ({DRL} mGy)</p>
              </div>
              <button onClick={() => setProtocol(REFERENCE)} disabled={exposing} className="btn-ghost justify-center px-4! py-2! text-sm">
                <RotateCcw size={14} /> Standart protokol (120 kV · 300 mAs · 5 mm)
              </button>
            </div>
          </Step>

          <Step n={3} title="Radiatsiya xavfsizligi" done={door}>
            <Toggle on={door} onClick={() => setDoor((v) => !v)} icon={<DoorClosed size={16} />} disabled={exposing}>
              Eshik yopiq, xonada bemordan boshqa hech kim yo‘q
            </Toggle>
          </Step>

          <button
            onClick={scan}
            disabled={blockers.length > 0 || exposing}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#e0b341] px-5 py-4 font-display text-lg font-bold text-[#1a1405] transition-all hover:shadow-[0_0_24px_rgba(224,179,65,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Radiation size={20} /> {exposing ? "Skanerlanmoqda…" : "SKANERLASH"}
          </button>
          {blockers.length > 0 && !exposing && (
            <ul className="-mt-2 flex flex-col gap-1 text-xs text-muted">
              {blockers.map((b) => (
                <li key={b} className="flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-[#e0b341]" /> {b}
                </li>
              ))}
            </ul>
          )}
          {error && <p className="text-sm text-coral">API bilan aloqa yo‘q</p>}
        </aside>
      </div>

      {result && (
        <section className="rise-in grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="glass flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Olingan kesim</h2>
              <div className="flex gap-1 rounded-full bg-bg/70 p-1">
                {(Object.keys(WINDOW_LABEL) as ScanWindow[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => setView(w)}
                    className={`rounded-full px-3 py-1 text-xs ${view === w ? "bg-teal font-semibold text-on-teal" : "text-muted hover:text-ink"}`}
                  >
                    {WINDOW_LABEL[w]}
                  </button>
                ))}
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG from our API */}
            <img src={result.images[view]} alt="Skanerlangan KT kesimi" className="aspect-square w-full rounded-xl bg-black object-contain" />
            <p className="font-mono text-[11px] text-muted">Sintetik anatomik fantom · bemor ma’lumoti emas</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["CTDIvol", `${result.ctdi_vol} mGy`, result.ctdi_vol > result.drl_ctdi ? "text-coral" : "text-teal"],
                ["DLP", `${result.dlp} mGy·sm`, "text-ink"],
                ["Shovqin (SD)", result.noise_sd === null ? "—" : `${result.noise_sd} HU`, "text-ink"],
                ["Tasvir sifati", result.quality, `capitalize ${QUALITY_STYLE[result.quality]}`],
              ].map(([label, value, cls]) => (
                <div key={label} className="glass p-4">
                  <p className="eyebrow">{label}</p>
                  <p className={`mt-1 font-display text-2xl font-bold ${cls}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="glass flex flex-col gap-2 p-5">
              <h2 className="font-display text-lg font-semibold">Ustoz izohi</h2>
              {result.feedback.map((f) => (
                <p key={f.text_uz} className="flex gap-2 text-sm">
                  {f.level === "ok" ? (
                    <CheckCircle2 size={18} className="shrink-0 text-teal" />
                  ) : f.level === "warn" ? (
                    <AlertTriangle size={18} className="shrink-0 text-[#e0b341]" />
                  ) : (
                    <XCircle size={18} className="shrink-0 text-coral" />
                  )}
                  {f.text_uz}
                </p>
              ))}
              <button onClick={reset} className="btn-ghost mt-2 self-start px-4! py-2! text-sm">
                <RotateCcw size={14} /> Yangi bemor
              </button>
            </div>
            {history.length > 1 && (
              <div className="glass overflow-x-auto p-5">
                <h2 className="mb-2 font-display text-lg font-semibold">Protokollarni solishtirish</h2>
                <table className="w-full text-left text-sm">
                  <thead className="font-mono text-[11px] uppercase text-muted">
                    <tr>
                      <th className="py-1">kV</th>
                      <th>mAs</th>
                      <th>mm</th>
                      <th>Kernel</th>
                      <th>CTDIvol</th>
                      <th>SD</th>
                      <th>Sifat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(({ protocol: p, result: r }, i) => (
                      <tr key={i} className="border-t border-line/40">
                        <td className="py-1.5">{p.kv}</td>
                        <td>{p.mas}</td>
                        <td>{p.thickness}</td>
                        <td>{p.kernel === "soft" ? "yumshoq" : "o‘tkir"}</td>
                        <td className={r.ctdi_vol > r.drl_ctdi ? "text-coral" : ""}>{r.ctdi_vol}</td>
                        <td>{r.noise_sd ?? "—"}</td>
                        <td className={QUALITY_STYLE[r.quality]}>{r.quality}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
