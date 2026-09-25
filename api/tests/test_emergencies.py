import pytest
from fastapi.testclient import TestClient

from app import config
from app.cases import COMPONENTS
from app.emergencies import DRILLS
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def temp_db(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DATABASE_PATH", tmp_path / "test.db")


def test_drills_are_consistent():
    for d in DRILLS:
        assert d.effect in {"smoke", "fire", "sparks", "overheat"}
        assert d.part in COMPONENTS
        for s in d.steps:
            ids = [o.id for o in s.options]
            assert s.answer in ids and len(ids) == len(set(ids))
            assert not next(o for o in s.options if o.id == s.answer).critical


def test_public_payload_hides_answers():
    body = client.get("/emergencies").json()
    assert len(body) == len(DRILLS)
    text = str(body)
    assert "critical" not in text and "explanation_uz" not in text and "answer" not in text


def test_water_on_electrical_fire_is_critical():
    fire = next(d for d in DRILLS if d.effect == "fire")
    res = client.post(f"/emergencies/{fire.id}/answer", json={"step": 2, "option": "water"}).json()
    assert res["correct"] is False and res["critical"] is True and res["correct_option"] == "co2"


def test_correct_answer():
    d = DRILLS[0]
    res = client.post(f"/emergencies/{d.id}/answer", json={"step": 0, "option": d.steps[0].answer}).json()
    assert res["correct"] and not res["critical"]


def test_bad_requests():
    d = DRILLS[0]
    assert client.post(f"/emergencies/{d.id}/answer", json={"step": 9, "option": "stop"}).status_code == 404
    assert client.post(f"/emergencies/{d.id}/answer", json={"step": 0, "option": "zzz"}).status_code == 422
    assert client.get("/emergencies/nope").status_code == 404
