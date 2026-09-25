"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "./Logo";

export const NAV = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/video", label: "Video darslar" },
  { href: "/holatlar", label: "Real holatlar" },
  { href: "/savol-javob", label: "Savol-javob" },
  { href: "/lab", label: "3D laboratoriya" },
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

  return (
    <header className="sticky top-0 z-50 border-b border-line/40 bg-surface-2/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Link href="/" aria-label="MedTech Academy — bosh sahifa">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-bg/70 p-1 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors duration-200 ${
                isActive(pathname, item.href) ? "bg-surface-3 font-semibold text-teal" : "text-muted hover:bg-surface-3 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cases" className="btn-primary hidden px-5! py-2! text-sm sm:inline-flex">
            Boshlash
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="rounded-full p-2 text-ink xl:hidden" aria-label="Menyu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line/40 px-4 py-3 xl:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 ${isActive(pathname, item.href) ? "bg-surface-3 text-teal" : "text-muted"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
