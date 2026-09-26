"use client";

import { useSyncExternalStore } from "react";

import { saveLearner } from "./api";

// Demo accounts for the hackathon MVP: the check runs in the browser only,
// so this is role switching for the demo, not real security.
export type Role = "talaba" | "muhandis";
export type Session = { role: Role; username: string };

const DEMO_USER = "admin";
const DEMO_PASSWORD = "admin123";
const KEY = "medtech.session";
const EVENT = "medtech.session-change";

export const ROLES: Record<Role, { title: string; learner: string; home: string }> = {
  talaba: { title: "Talaba", learner: "talaba", home: "/video" },
  muhandis: { title: "Muhandis", learner: "demo", home: "/cases" },
};

// Fault-finding and repair sections: engineers only.
export const ENGINEER_PATHS = ["/cases", "/favqulodda", "/holatlar"];

export const isEngineerPath = (path: string) => ENGINEER_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function parse(raw: string): Session | null {
  try {
    const s = JSON.parse(raw) as Session;
    return s.role in ROLES ? s : null;
  } catch {
    return null;
  }
}

// Undefined while the page hydrates (the server cannot see localStorage),
// null for a guest.
export function useSession(): Session | null | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  return raw === undefined ? undefined : parse(raw);
}

export function login(username: string, password: string, role: Role): boolean {
  if (username.trim() !== DEMO_USER || password !== DEMO_PASSWORD) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify({ role, username: DEMO_USER } satisfies Session));
  } catch {
    // Private mode: the session lasts until the page reloads.
  }
  saveLearner(ROLES[role].learner);
  window.dispatchEvent(new Event(EVENT));
  return true;
}

export function logout() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing stored.
  }
  window.dispatchEvent(new Event(EVENT));
}
