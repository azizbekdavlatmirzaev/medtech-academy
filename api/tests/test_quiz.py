import pytest
from fastapi.testclient import TestClient

from app import config
from app.main import app
from app.quiz import QUESTIONS
from app.simulator import FAULTS

client = TestClient(app)


@pytest.fixture(autouse=True)
def temp_db(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DATABASE_PATH", tmp_path / "test.db")


def test_quiz_list_hides_answers():
    body = client.get("/quiz").json()
    assert len(body) == len(QUESTIONS)
    for q in body:
        assert "answer" not in q and "explanation_uz" not in q


def test_catalogue_is_consistent():
    for q in QUESTIONS:
        assert q.answer in {oid for oid, _ in q.options}
        if q.kind == "image":
            assert q.fault in FAULTS and q.fault == q.answer


def test_image_question_png():
    image_q = next(q for q in QUESTIONS if q.kind == "image")
    res = client.get(f"/quiz/{image_q.id}/image.png")
    assert res.status_code == 200 and res.content[:4] == b"\x89PNG"


def test_answer_correct_and_wrong():
    q = QUESTIONS[0]
    wrong = next(oid for oid, _ in q.options if oid != q.answer)
    assert client.post(f"/quiz/{q.id}/answer", json={"option": q.answer}).json()["correct"] is True
    res = client.post(f"/quiz/{q.id}/answer", json={"option": wrong}).json()
    assert res["correct"] is False and res["correct_option"] == q.answer


def test_answer_rejects_unknown_option():
    assert client.post(f"/quiz/{QUESTIONS[0].id}/answer", json={"option": "zzz"}).status_code == 422
    assert client.post("/quiz/nope/answer", json={"option": "a"}).status_code == 404
