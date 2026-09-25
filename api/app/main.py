"""MedTech Academy API entry point."""

import io
from datetime import datetime
from functools import lru_cache
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image

from app import config, db, llm
from app.cases import CASES, CASES_BY_ID, COMPONENTS, NOT_A_DEVICE_FAULT
from app.grader import Attempt, Grade, grade
from app.simulator import simulate, to_uint8

app = FastAPI(title="MedTech Academy API", version="0.1.0")

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


@app.get("/reference/normal.png")
def normal_image() -> Response:
    # A healthy slice for side-by-side comparison.
    return Response(_render_png("normal", 1), media_type="image/png")


def _case_or_404(case_id: str):
    case = CASES_BY_ID.get(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="case not found")
    return case
