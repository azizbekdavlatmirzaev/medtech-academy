import pytest
from fastapi.testclient import TestClient

from app import config, llm
from app.cases import CASES
from app.main import app
from app.quiz import QUESTIONS

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DATABASE_PATH", tmp_path / "test.db")
    monkeypatch.setattr(llm, "is_configured", lambda: False)


def solve_all(learner):
    for c in CASES:
        client.post(f"/cases/{c.id}/attempts", json={"component": c.component, "learner": learner})


def test_new_learner_is_empty():
    body = client.get("/learners/ali/progress").json()
    assert body["attempts"] == 0 and body["readiness"] == 0 and body["level"] == 1


def test_progress_counts_latest_attempt_per_case():
    client.post("/cases/ring-01/attempts", json={"component": "table", "learner": "ali"})
    client.post("/cases/ring-01/attempts", json={"component": "detector", "learner": "ali"})
    body = client.get("/learners/ali/progress").json()
    assert body["cases_done"] == 1 and body["skills"]["Detektor"] == 100
    assert body["trend"] == [0, 6]


def test_trainer_and_quiz_together_make_a_learner_ready():
    solve_all("ali")
    # Without AI every correct case scores 6/10: 0.7 * 60% = 42% readiness.
    assert client.get("/learners/ali/progress").json()["readiness"] == 42
    for q in QUESTIONS:
        client.post(f"/quiz/{q.id}/answer", json={"option": q.answer, "learner": "ali"})
    body = client.get("/learners/ali/progress").json()
    assert body["readiness"] == 72 and body["ready"] and body["quiz_pct"] == 100


def test_recruitment_shows_only_consenting_learners():
    solve_all("ali")
    solve_all("vali")
    assert client.get("/recruitment").json() == []
    client.post("/learners/ali/consent", json={"consent": True, "region": "Namangan"})
    listed = client.get("/recruitment").json()
    assert [x["learner"] for x in listed] == ["ali"] and listed[0]["region"] == "Namangan"


def test_consent_can_be_withdrawn():
    client.post("/learners/ali/consent", json={"consent": True, "region": "Namangan"})
    client.post("/learners/ali/consent", json={"consent": False})
    assert client.get("/recruitment").json() == []


def test_consent_requires_region():
    assert client.post("/learners/ali/consent", json={"consent": True, "region": " "}).status_code == 422
