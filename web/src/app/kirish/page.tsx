"use client";

import { ArrowRight, BookOpen, GraduationCap, LogIn, LogOut, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ROLES, type Role, login, logout, useSession } from "@/lib/auth";

const CARDS: { role: Role; icon: typeof BookOpen; lead: string; items: string[] }[] = [
  {
    role: "talaba",
    icon: GraduationCap,
    lead: "Tibbiyot talabalari va rentgenlaborantlar uchun",
    items: ["Video darslar", "3D laboratoriya", "KT boshqaruv pulti", "Savol-javob testi", "AI ustoz", "Natijalar"],
  },
  {
    role: "muhandis",
    icon: Wrench,
    lead: "Tibbiy muhandislar va servis mutaxassislari uchun",
    items: ["Talabadagi barcha o‘qitish", "Nosozlik trenajori", "Real holatlar va tuzatish", "Favqulodda mashg‘ulotlar"],
  },
];

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const [role, setRole] = useState<Role>("talaba");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState(false);

  const enter = (r: Role) => {
    if (!login(username, password, r)) {
      setError(true);
      return;
    }
    router.push(ROLES[r].home);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    enter(role);
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 lg:px-8">
      <header className="rise-in">
        <p className="eyebrow">Hisob</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Kirish</h1>
        <p className="mt-2 max-w-2xl text-muted">Yo‘nalishingizni tanlang — bir bosishda kirasiz.</p>
      </header>

      {session && (
        <div className="glass flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm">
            Hozir <span className="font-semibold text-teal">{ROLES[session.role].title}</span> hisobidasiz ({session.username}).
          </p>
          <button onClick={logout} className="btn-ghost px-4! py-2! text-sm">
            <LogOut size={16} /> Chiqish
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {CARDS.map(({ role: r, icon: Icon, lead, items }, i) => (
          <button
            key={r}
            onClick={() => enter(r)}
            className="glass group rise-in flex flex-col gap-4 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-teal/60"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-teal/40 bg-teal/10">
              <Icon size={24} className="text-teal" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold">{ROLES[r].title}</h2>
              <p className="mt-1 text-sm text-muted">{lead}</p>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm">
              {items.map((it) => (
                <li key={it} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" /> {it}
                </li>
              ))}
            </ul>
            <span className="mt-auto flex items-center gap-1 font-mono text-xs text-teal">
              {ROLES[r].title} sifatida kirish <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="glass flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Login va parol bilan</h2>
          <div className="flex gap-1 rounded-full bg-bg/70 p-1">
            {(Object.keys(ROLES) as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${role === r ? "bg-teal text-on-teal" : "text-muted hover:text-ink"}`}
              >
                {ROLES[r].title}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Login
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(false);
              }}
              autoComplete="username"
              className="rounded-xl border border-line/60 bg-bg/80 px-4 py-2.5 outline-none focus:border-teal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Parol
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              autoComplete="current-password"
              className="rounded-xl border border-line/60 bg-bg/80 px-4 py-2.5 outline-none focus:border-teal"
            />
          </label>
        </div>
        {error && <p className="text-sm text-coral">Login yoki parol noto‘g‘ri</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-muted">Demo hisob: admin / admin123</p>
          <button type="submit" className="btn-primary">
            <LogIn size={16} /> Kirish
          </button>
        </div>
      </form>
    </main>
  );
}
