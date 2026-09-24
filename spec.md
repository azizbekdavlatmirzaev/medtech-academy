# MedTech Academy — Specification (TZ)

> Single source of truth for this project. Every work session (human or AI agent)
> starts by reading this file and ends by updating the **Phases** section and committing.

## 1. Context

- **Event:** National AI Hackathon, Namangan stage, 24–27 Sept 2026.
- **Track:** Medicine (Tibbiyot). Closest listed problem: **#6 — Medical AI education module + safety standard**.
- **Checkpoints:** CP1 — 25 Sept 14:00 (40% of score), CP2 — 26 Sept 14:00 (60%, presentation + GitHub link).
- **Final:** 27 Sept — 3 min pitch, 2 min live demo, 2 min Q&A.
- **Hard rule:** project is built during the hackathon only. Git history is reviewed — commit small and often.

## 2. Problem

Public hospitals in Uzbekistan own expensive imaging equipment (CT, MRI, X-ray), but:

1. **New medical staff and students** have no way to practice on this equipment before working with real patients.
2. **Biomedical engineers are scarce.** When a device breaks it stays idle for a long time, and foreign service is expensive.
3. Existing training (e.g. the GIZ programme, 2014–2019: 95 medical technicians and 240 radiologists trained in 5 years) is offline, expensive and centralized in Tashkent.

## 3. Solution

**MedTech Academy** — a web platform that trains two audiences on CT equipment using a 3D model, a physics-based fault simulator and AI.

| | Operator track (students, staff) | Engineer track |
|---|---|---|
| Learns | How CT works, parts, patient positioning, radiation safety | How to diagnose faults from image artifacts and symptoms |
| AI | Source-grounded AI tutor (RAG, cites sources) + adaptive quizzes | AI trainer: case → learner diagnosis → AI grading + explanation |
| 3D | Explore device parts | Faulty part is highlighted after diagnosis |
| Revenue | Courses sold to students (B2C), licenses to universities (B2B) | Certified engineers placed at hospitals / service companies (recruitment fee) |

### Key technical idea
CT images are reconstructed from detector projections (sinogram). We simulate **real device faults at the physics level**: corrupt the sinogram the same way a failing component would (e.g. dead detector channel), reconstruct, and get a genuine artifact (e.g. ring artifact). Cases are generated, not hand-drawn.

## 4. MVP scope (hackathon)

In scope:
1. **3D CT viewer** — rotate/zoom a CT scanner model; click a part to see its name and function; programmatic highlight of a part.
2. **Fault simulator** — Python service producing CT slices for a normal state and each fault below.
3. **AI trainer (engineer track)** — shows a case (artifact image + symptom text), learner submits a diagnosis, AI grades it (score, correct part, explanation), 3D model highlights the part.
4. **AI tutor (operator track)** — chat answering questions only from uploaded course documents, with citations; refuses when the answer is not in the sources.
5. **Progress dashboard** — per-learner scores, readiness for certification, "ready engineers" list for recruitment.
6. **UI language:** Uzbek (Latin). Code, commits and docs: English.

Out of scope (roadmap only): video lessons, MRI/X-ray, mobile app, real certification, payments, multi-tenant auth.

### Fault catalogue (v1)

| id | Fault | Simulation in sinogram / image | Component (3D part) | Device fault? |
|---|---|---|---|---|
| `ring` | Ring artifact | One or more detector channels with wrong gain | Detector array | Yes |
| `noise` | Excessive quantum noise | Low photon count (Poisson noise) | X-ray tube / generator | Yes |
| `cupping` | Beam hardening / cupping | Non-linear attenuation, missing correction | Bowtie filter / calibration | Yes |
| `missing_views` | Missing projections / streaks | Drop a range of projection angles | Data acquisition system / slip ring | Yes |
| `motion` | Motion artifact | Object shift between projections | — (patient) | **No** — teaches "not every artifact is a broken device" |

## 5. Architecture

```
web/  Next.js (App Router, TypeScript) + Three.js (@react-three/fiber, drei)
       └── calls → api/
api/  Python FastAPI
       ├── simulator/   scikit-image radon/iradon, phantom, fault functions
       ├── ai/          LLM client (provider-agnostic), trainer grading, tutor RAG
       ├── db           SQLite (learners, attempts, documents)
       └── docs/        course documents for RAG (public/open sources only)
```

- **LLM provider** selected by env: `LLM_PROVIDER=anthropic` (default for demo) or `openai_compatible` (Groq / OpenRouter / local Ollama with an open-source model). Same interface for both.
- **Structured output:** the grader returns JSON `{score: 0-10, correct: bool, component_id, explanation_uz, next_hint_uz}`; validated server-side.
- **Timezone:** `Asia/Tashkent` wherever time is shown or stored.
- **3D asset:** "Complete CT Scanner" by HermanMyburgh, Sketchfab, **CC BY** — attribution in README and in the UI footer.

## 6. Rules for agents and humans

1. Read `spec.md` first. Do not start coding a phase that is not in the Phases list.
2. Small steps. One logical change = one commit. Commit messages in English, imperative mood.
3. **Secrets only in `.env`**, never in code or git. `.env.example` lists every variable without values.
4. **No real patient data.** All images are synthetic phantoms. No personal data in the repo.
5. AI answers on medical/technical safety must be grounded in sources and show them; otherwise say "I don't know".
6. No proprietary manufacturer service manuals in the repo — only open/public or ministry-approved material.
7. Build the demo path first; polish later.
8. After each phase: run the test checklist, update Phases, commit.

### Start ritual
Read `spec.md` → check `git log --oneline -10` → pick the first unfinished phase.

### Finish ritual
Run the phase test checklist → mark the phase in Phases → commit `spec: mark Mx done`.

## 7. Phases

| Phase | Goal | Target | Status |
|---|---|---|---|
| M0 | Repo, spec, `.gitignore`, `.env.example`, both apps boot, `/health` | 24 Sept | done |
| M1 | Fault simulator: phantom + 5 faults, `GET /cases`, `GET /cases/{id}/image` | 24–25 Sept | next |
| M2 | 3D viewer: model loads, clickable parts, highlight API | 25 Sept (CP1) | todo |
| M3 | AI trainer: case → diagnosis → grading → highlight | 25 Sept (CP1) | todo |
| M4 | AI tutor with RAG + citations | 26 Sept | todo |
| M5 | Dashboard: progress, readiness, recruitment list | 26 Sept (CP2) | todo |
| M6 | Polish, README, demo script rehearsal, deploy | 26 Sept (CP2) | todo |

## 8. Test checklist (manual, "like a user")

- Restart the API → learner progress is still there (SQLite, not memory).
- Each fault case renders a visibly different image from `normal`.
- Wrong diagnosis → low score + explanation; correct → high score + part highlighted.
- `motion` case: answer "detector" → AI says it is a patient artifact, not a device fault.
- Tutor: ask something not in the docs → it refuses instead of inventing.
- `git grep -i "api_key\|sk-"` → nothing.
- Works in Chrome on the demo laptop without internet except the LLM call (fallback: open-source provider).

## 9. Demo script (2 min)

1. Open a case: judge sees a CT slice with rings + symptom "concentric circles on all patients since morning".
2. Judge (or presenter) types a diagnosis.
3. AI grades it and explains in Uzbek; the detector array lights up on the 3D model.
4. Switch to the `motion` case — show the AI rejecting a device-fault answer.
5. Ask the tutor a radiation-safety question → answer with cited source.
6. Dashboard: learner became "ready" → appears in the recruitment list.

## 10. Data to collect (Ministry, 25 Sept)

Number of CT/MRI/X-ray units (national, Namangan) · units currently out of service · average downtime (days) · cost of one day of downtime · number of biomedical engineers · cost of foreign service calls · most frequent failures · available training materials (UZ/RU).
