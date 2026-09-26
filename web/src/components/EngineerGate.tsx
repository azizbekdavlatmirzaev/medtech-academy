"use client";

import { LockKeyhole, Wrench } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { useSession } from "@/lib/auth";

// Fault-finding and repair sections open only for the engineer account.
export default function EngineerGate({ children }: { children: ReactNode }) {
  const session = useSession();
  if (session === undefined) return null; // hydrating: avoid flashing the lock screen
  if (session?.role === "muhandis") return children;

  const student = session?.role === "talaba";
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-teal/40 bg-teal/10">
        {student ? <LockKeyhole size={26} className="text-teal" /> : <Wrench size={26} className="text-teal" />}
      </span>
      <h1 className="font-display text-2xl font-bold">Bu bo‘lim muhandislar uchun</h1>
      <p className="text-muted">
        {student
          ? "Talaba hisobida o‘qitish bo‘limlari ochiq. Nosozlik trenajori, real holatlar va favqulodda mashg‘ulotlar muhandis hisobida."
          : "Nosozliklarni topish va tuzatish bo‘limiga kirish uchun muhandis hisobi bilan kiring."}
      </p>
      <Link href="/kirish" className="btn-primary">
        {student ? "Muhandis hisobiga o‘tish" : "Kirish"}
      </Link>
    </main>
  );
}
