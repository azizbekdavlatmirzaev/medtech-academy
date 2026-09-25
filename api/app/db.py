"""SQLite storage for learner attempts (survives API restarts)."""

import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from app import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    learner TEXT NOT NULL,
    case_id TEXT NOT NULL,
    component TEXT NOT NULL,
    correct INTEGER NOT NULL,
    score INTEGER NOT NULL,
    ai_used INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS consents (
    learner TEXT PRIMARY KEY,
    region TEXT NOT NULL,
    consented_at TEXT NOT NULL
);
"""


@contextmanager
def connect(path: Path | None = None):
    conn = sqlite3.connect(path or config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        conn.executescript(SCHEMA)
        yield conn
        conn.commit()
    finally:
        conn.close()


def _now() -> str:
    return datetime.now(ZoneInfo(config.TIMEZONE)).isoformat()


def attempts_for(learner: str) -> list[sqlite3.Row]:
    with connect() as conn:
        return conn.execute("SELECT * FROM attempts WHERE learner = ? ORDER BY id", (learner,)).fetchall()


def set_consent(learner: str, region: str | None) -> None:
    """Store consent to be shown to employers; None withdraws it."""
    with connect() as conn:
        if region is None:
            conn.execute("DELETE FROM consents WHERE learner = ?", (learner,))
        else:
            conn.execute(
                "INSERT INTO consents (learner, region, consented_at) VALUES (?, ?, ?)"
                " ON CONFLICT(learner) DO UPDATE SET region = excluded.region, consented_at = excluded.consented_at",
                (learner, region, _now()),
            )


def consents() -> list[sqlite3.Row]:
    with connect() as conn:
        return conn.execute("SELECT * FROM consents ORDER BY consented_at DESC").fetchall()


def consent_for(learner: str) -> sqlite3.Row | None:
    with connect() as conn:
        return conn.execute("SELECT * FROM consents WHERE learner = ?", (learner,)).fetchone()


def save_attempt(learner: str, case_id: str, component: str, correct: bool, score: int, ai_used: bool) -> None:
    now = _now()
    with connect() as conn:
        conn.execute(
            "INSERT INTO attempts (learner, case_id, component, correct, score, ai_used, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (learner, case_id, component, int(correct), score, int(ai_used), now),
        )
