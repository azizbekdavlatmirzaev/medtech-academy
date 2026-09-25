from fastapi.testclient import TestClient

from app.cases import CASES, COMPONENTS, NOT_A_DEVICE_FAULT
from app.main import app
from app.simulator import FAULTS

client = TestClient(app)


def test_cases_list_hides_answers():
    body = client.get("/cases").json()
    assert len(body) == len(CASES)
    for case in body:
        assert set(case) == {"id", "title_uz", "symptom_uz", "difficulty"}


def test_catalogue_is_consistent():
    for case in CASES:
        assert case.fault in FAULTS
        assert case.component in COMPONENTS or case.component == NOT_A_DEVICE_FAULT


def test_case_image_is_png():
    res = client.get(f"/cases/{CASES[0].id}/image.png")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
    assert res.content[:8] == b"\x89PNG\r\n\x1a\n"


def test_unknown_case_is_404():
    assert client.get("/cases/nope").status_code == 404
    assert client.get("/cases/nope/image.png").status_code == 404


def test_components_list():
    ids = {c["id"] for c in client.get("/components").json()}
    assert ids == set(COMPONENTS)
