"""Runtime settings loaded from the repo-root .env file."""

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

def _env(name: str, default: str = "") -> str:
    # Pasted keys often carry a stray space or newline; strip it.
    return os.getenv(name, default).strip()


LLM_PROVIDER = _env("LLM_PROVIDER", "anthropic")
ANTHROPIC_API_KEY = _env("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = _env("ANTHROPIC_MODEL", "claude-sonnet-5")
OPENAI_COMPAT_BASE_URL = _env("OPENAI_COMPAT_BASE_URL")
OPENAI_COMPAT_API_KEY = _env("OPENAI_COMPAT_API_KEY")
OPENAI_COMPAT_MODEL = _env("OPENAI_COMPAT_MODEL")

DATABASE_PATH = ROOT_DIR / os.getenv("DATABASE_PATH", "api/medtech.db")
TIMEZONE = os.getenv("TZ", "Asia/Tashkent")
