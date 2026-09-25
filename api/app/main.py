"""MedTech Academy API entry point."""

import io
import threading
from contextlib import asynccontextmanager
from datetime import datetime
from functools import lru_cache
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image
from pydantic import BaseModel, Field

from app import config, db, llm, progress, tutor
from app.cases import CASES, CASES_BY_ID, COMPONENTS, NOT_A_DEVICE_FAULT
from app.grader import Attempt, Grade, grade
from app.library import PLAYBOOKS_BY_ID
from app.library import search as search_library
from app.quiz import QUESTIONS, QUESTIONS_BY_ID
from app.simulator import simulate, to_uint8

@asynccontextmanager
async def lifespan(_: FastAPI):
    # Each slice takes ~2 s to simulate: render every case and quiz image in the
    # background at startup so the first page view is instant.
    def warm() -> None:
        for fault, seed in {("normal", 1), *((c.fault, c.seed) for c in CASES), *((q.fault, q.seed) for q in QUESTIONS if q.fault)}:
            _render_png(fault, seed)

    threading.Thread(target=warm, daemon=True).start()
    yield


app = FastAPI(title="MedTech Academy API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "llm_provider": config.LLM_PROVIDER,
        "llm_configured": llm.is_configured(),
        "time": datetime.now(ZoneInfo(config.TIMEZONE)).isoformat(),
    }


@app.get("/components")
def list_components() -> list[dict]:
    return [{"id": cid, **info} for cid, info in COMPONENTS.items()]


@app.get("/cases")
def list_cases() -> list[dict]:
    # Public fields only: the answer never leaves the server.
    return [c.public() for c in CASES]


@app.get("/cases/{case_id}")
def get_case(case_id: str) -> dict:
    return _case_or_404(case_id).public()


@lru_cache(maxsize=64)
def _render_png(fault: str, seed: int) -> bytes:
    buf = io.BytesIO()
    Image.fromarray(to_uint8(simulate(fault, seed))).save(buf, format="PNG")
    return buf.getvalue()


@app.get("/cases/{case_id}/image.png")
def case_image(case_id: str) -> Response:
    case = _case_or_404(case_id)
    return Response(_render_png(case.fault, case.seed), media_type="image/png")


@app.post("/cases/{case_id}/attempts")
def submit_attempt(case_id: str, attempt: Attempt) -> Grade:
    case = _case_or_404(case_id)
    if attempt.component not in COMPONENTS and attempt.component != NOT_A_DEVICE_FAULT:
        raise HTTPException(status_code=422, detail="unknown component")
    result = grade(case, attempt)
    db.save_attempt(attempt.learner, case.id, attempt.component, result.correct, result.score, result.ai_used)
    return result


class QuizAnswer(BaseModel):
    option: str = Field(max_length=32)
    learner: str = Field(default="demo", min_length=1, max_length=64)


@app.get("/quiz")
def list_quiz() -> list[dict]:
    return [q.public() for q in QUESTIONS]


@app.get("/quiz/{question_id}/image.png")
def quiz_image(question_id: str) -> Response:
    q = QUESTIONS_BY_ID.get(question_id)
    if q is None or q.fault is None:
        raise HTTPException(status_code=404, detail="question image not found")
    return Response(_render_png(q.fault, q.seed), media_type="image/png")


@app.post("/quiz/{question_id}/answer")
def answer_quiz(question_id: str, body: QuizAnswer) -> dict:
    q = QUESTIONS_BY_ID.get(question_id)
    if q is None:
        raise HTTPException(status_code=404, detail="question not found")
    if body.option not in {oid for oid, _ in q.options}:
        raise HTTPException(status_code=422, detail="unknown option")
    correct = body.option == q.answer
    db.save_attempt(body.learner, f"quiz:{q.id}", body.option, correct, 10 if correct else 0, ai_used=False)
    return {"correct": correct, "correct_option": q.answer, "explanation_uz": q.explanation_uz, "source": q.source}


class Consent(BaseModel):
    consent: bool
    region: str = Field(default="", max_length=64)



@app.get("/learners/{learner}/progress")
def learner_progress(learner: str = Path(min_length=1, max_length=64)) -> dict:
    return progress.summary(learner)


@app.post("/learners/{learner}/consent")
def learner_consent(body: Consent, learner: str = Path(min_length=1, max_length=64)) -> dict:
    if body.consent and not body.region.strip():
        raise HTTPException(status_code=422, detail="region is required to consent")
    db.set_consent(learner, body.region.strip() if body.consent else None)
    return {"learner": learner, "consent": body.consent}


@app.get("/recruitment")
def recruitment_list() -> list[dict]:
    return progress.recruitment()


class TutorQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=500)


@app.post("/tutor")
def ask_tutor(body: TutorQuestion) -> dict:
    return tutor.ask(body.question)


@app.get("/tutor/sources")
def tutor_sources() -> list[dict]:
    seen: dict[str, dict] = {}
    for c in tutor.CHUNKS:
        seen.setdefault(c.doc_title, {"doc": c.doc_title, "source": c.source, "sections": []})["sections"].append(c.section)
    return list(seen.values())


@app.get("/library")
def list_library(q: str = "") -> list[dict]:
    return [p.summary() for p in search_library(q[:200])]


@app.get("/library/{playbook_id}")
def get_playbook(playbook_id: str) -> dict:
    p = PLAYBOOKS_BY_ID.get(playbook_id)
    if p is None:
        raise HTTPException(status_code=404, detail="playbook not found")
    return p.detail()


@app.get("/reference/normal.png")
def normal_image() -> Response:
    # A healthy slice for side-by-side comparison.
    return Response(_render_png("normal", 1), media_type="image/png")


def _case_or_404(case_id: str):
    case = CASES_BY_ID.get(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="case not found")
    return case
