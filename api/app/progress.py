"""Learner progress, certification readiness and the consent-based recruitment list."""

from app import db
from app.cases import CASES, CASES_BY_ID, COMPONENTS, NOT_A_DEVICE_FAULT
from app.emergencies import DRILLS_BY_ID

READY_THRESHOLD = 70  # readiness % from which an engineer is listed as ready

# Skill axis per answer component (the radar chart on the dashboard).
SKILLS = {
    "detector": "Detektor",
    "xray_tube": "Trubka",
    "bowtie_filter": "Kalibrovka",
    "das_slip_ring": "DAS",
    NOT_A_DEVICE_FAULT: "Bemor artefaktlari",
}


def _kind(case_id: str) -> str:
    if case_id in CASES_BY_ID:
        return "trainer"
    return "emergency" if case_id.startswith("emg:") else "quiz"


def _title(case_id: str) -> str:
    if case_id in CASES_BY_ID:
        return CASES_BY_ID[case_id].title_uz
    if case_id.startswith("emg:"):
        drill = DRILLS_BY_ID.get(case_id.split(":")[1])
        return f"Favqulodda: {drill.title_uz}" if drill else "Favqulodda holat"
    return f"Test savoli {case_id[5:]}"


def summary(learner: str) -> dict:
    rows = db.attempts_for(learner)
    trainer = [r for r in rows if r["case_id"] in CASES_BY_ID]
    quiz = [r for r in rows if r["case_id"].startswith("quiz:")]

    # Latest attempt per case counts, so retrying improves the result.
    latest: dict[str, dict] = {}
    for r in trainer:
        latest[r["case_id"]] = dict(r)

    skills = {}
    for comp, name in SKILLS.items():
        cases = [c.id for c in CASES if c.component == comp]
        tried = [latest[cid] for cid in cases if cid in latest]
        skills[name] = round(100 * sum(t["correct"] for t in tried) / len(tried)) if tried else None

    trainer_pct = sum(t["score"] for t in latest.values()) * 10 / len(CASES)  # untried cases count as 0
    quiz_pct = 100 * sum(r["correct"] for r in quiz) / len(quiz) if quiz else 0
    readiness = round(0.7 * trainer_pct + 0.3 * quiz_pct)

    recent = [
        {
            "case_id": r["case_id"],
            "title_uz": _title(r["case_id"]),
            "kind": _kind(r["case_id"]),
            "answer_uz": COMPONENTS.get(r["component"], {}).get("name_uz", r["component"]),
            "correct": bool(r["correct"]),
            "score": r["score"],
            "created_at": r["created_at"],
        }
        for r in reversed(rows[-10:])
    ]

    consent = db.consent_for(learner)
    return {
        "learner": learner,
        "attempts": len(rows),
        "cases_done": len(latest),
        "cases_total": len(CASES),
        "readiness": readiness,
        "level": min(4, 1 + readiness // 25),
        "ready": readiness >= READY_THRESHOLD,
        "trend": [r["score"] for r in trainer[-10:]],
        "skills": skills,
        "quiz_pct": round(quiz_pct),
        "recent": recent,
        "consent_region": consent["region"] if consent else None,
    }


def recruitment() -> list[dict]:
    """Only learners who consented are ever shown to employers."""
    out = []
    for c in db.consents():
        s = summary(c["learner"])
        out.append(
            {
                "learner": c["learner"],
                "region": c["region"],
                "readiness": s["readiness"],
                "ready": s["ready"],
                "cases_done": s["cases_done"],
                "skills": s["skills"],
            }
        )
    return sorted(out, key=lambda x: x["readiness"], reverse=True)
