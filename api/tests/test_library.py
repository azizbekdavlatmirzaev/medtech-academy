from fastapi.testclient import TestClient

from app.cases import CASES_BY_ID, COMPONENTS, NOT_A_DEVICE_FAULT
from app.library import PLAYBOOKS, search
from app.main import app

client = TestClient(app)


def test_playbooks_are_consistent():
    for p in PLAYBOOKS:
        assert p.case_id in CASES_BY_ID
        assert p.component == CASES_BY_ID[p.case_id].component
        assert p.component in COMPONENTS or p.component == NOT_A_DEVICE_FAULT
        assert len(p.steps) == 5


def test_search_ranks_matching_symptom_first():
    assert search("tasvirda halqalar bor")[0].id == "pb-ring"
    assert search("donador shovqin")[0].id == "pb-noise"


def test_empty_query_returns_all():
    assert len(client.get("/library").json()) == len(PLAYBOOKS)


def test_detail_has_steps_and_safety():
    body = client.get("/library/pb-ring").json()
    assert len(body["steps"]) == 5 and body["safety_uz"]
    assert client.get("/library/nope").status_code == 404
