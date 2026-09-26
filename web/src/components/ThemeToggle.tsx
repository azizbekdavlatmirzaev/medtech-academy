"use client";

import { Moon, Sun } from "lucide-react";

import { setTheme, useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const theme = useTheme();
  const light = theme === "light";
  return (
    <button
      onClick={() => setTheme(light ? "dark" : "light")}
      className="grid h-9 w-9 place-items-center rounded-full border border-line/60 text-muted transition-colors hover:border-teal hover:text-teal"
      aria-label={light ? "Qorong‘i rejim" : "Yorug‘ rejim"}
      title={light ? "Qorong‘i rejim" : "Yorug‘ rejim"}
    >
      {light ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
