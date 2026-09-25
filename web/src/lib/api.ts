export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Component = { id: string; name_uz: string; description_uz: string };
export type CaseSummary = { id: string; title_uz: string; symptom_uz: string; difficulty: number };

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export const getComponents = () => getJson<Component[]>("/components");
export const getCases = () => getJson<CaseSummary[]>("/cases");
export const getCase = (id: string) => getJson<CaseSummary>(`/cases/${id}`);
export const caseImageUrl = (id: string) => `${API_URL}/cases/${id}/image.png`;
export const normalImageUrl = () => `${API_URL}/reference/normal.png`;

// Answer id for artifacts that are not caused by the device (api/app/cases.py).
export const NOT_A_DEVICE_FAULT = "none";

export type Grade = {
  score: number;
  correct: boolean;
  correct_component: string;
  is_device_fault: boolean;
  explanation_uz: string;
  next_hint_uz: string;
  ai_used: boolean;
};

export async function submitAttempt(caseId: string, component: string, reasoning: string, learner: string): Promise<Grade> {
  const res = await fetch(`${API_URL}/cases/${caseId}/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ component, reasoning, learner }),
  });
  if (!res.ok) throw new Error(`attempt: ${res.status}`);
  return res.json() as Promise<Grade>;
}

const LEARNER_KEY = "medtech.learner";

export function loadLearner(): string {
  try {
    return localStorage.getItem(LEARNER_KEY) || "demo";
  } catch {
    return "demo";
  }
}

export function saveLearner(name: string): void {
  try {
    localStorage.setItem(LEARNER_KEY, name);
  } catch {
    // storage unavailable (private mode): keep the name in memory only
  }
}
