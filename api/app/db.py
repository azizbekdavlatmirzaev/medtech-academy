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


def save_attempt(learner: str, case_id: str, component: str, correct: bool, score: int, ai_used: bool) -> None:
    now = datetime.now(ZoneInfo(config.TIMEZONE)).isoformat()
    with connect() as conn:
        conn.execute(
            "INSERT INTO attempts (learner, case_id, component, correct, score, ai_used, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (learner, case_id, component, int(correct), score, int(ai_used), now),
        )
