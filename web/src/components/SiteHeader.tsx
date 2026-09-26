"use client";

import { LogIn, LogOut, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ROLES, isEngineerPath, logout, useSession } from "@/lib/auth";

import { Logo } from "./Logo";
import ThemeToggle from "./ThemeToggle";

export const NAV = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/video", label: "Video darslar" },
  { href: "/holatlar", label: "Real holatlar" },
  { href: "/savol-javob", label: "Savol-javob" },
  { href: "/lab", label: "3D laboratoriya" },
  { href: "/pult", label: "KT pulti" },
  { href: "/cases", label: "Trenajor" },
  { href: "/ustoz", label: "AI ustoz" },
  { href: "/natijalar", label: "Natijalar" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const session = useSession();
  // Students see only the learning sections; guests and engineers see all.
  const nav = session?.role === "talaba" ? NAV.filter((item) => !isEngineerPath(item.href)) : NAV;

  return (
    <header className="sticky top-0 z-50 border-b border-line/40 bg-surface-2/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Link href="/" aria-label="MedTech Academy — bosh sahifa">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-bg/70 p-1 xl:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
                isActive(pathname, item.href) ? "bg-surface-3 font-semibold text-teal" : "text-muted hover:bg-surface-3 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <>
              <Link
                href="/kirish"
                className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-teal/40 bg-teal/10 px-3 py-1.5 text-sm font-semibold text-teal sm:inline-flex"
                title="Hisob"
              >
                <UserRound size={16} /> {ROLES[session.role].title}
              </Link>
              <button
                onClick={logout}
                className="grid h-9 w-9 place-items-center rounded-full border border-line/60 text-muted transition-colors hover:border-coral hover:text-coral"
                aria-label="Chiqish"
                title="Chiqish"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/kirish" className="btn-primary hidden px-5! py-2! text-sm sm:inline-flex">
              <LogIn size={16} /> Kirish
            </Link>
          )}
          <button onClick={() => setOpen((v) => !v)} className="rounded-full p-2 text-ink xl:hidden" aria-label="Menyu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line/40 px-4 py-3 xl:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 ${isActive(pathname, item.href) ? "bg-surface-3 text-teal" : "text-muted"}`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/kirish" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-teal sm:hidden">
            {session ? `Hisob: ${ROLES[session.role].title}` : "Kirish"}
          </Link>
        </nav>
      )}
    </header>
  );
}
