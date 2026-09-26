"use client";

import { useSyncExternalStore } from "react";

import { THEME_KEY } from "./theme-script";

export type Theme = "dark" | "light";

function read(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "dark");
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode: the choice just lasts for this page view.
  }
}
