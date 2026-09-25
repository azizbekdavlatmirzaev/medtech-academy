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
