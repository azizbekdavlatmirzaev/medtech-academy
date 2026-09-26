import pytest
from fastapi.testclient import TestClient

from app import console
from app.main import app

client = TestClient(app)


def metrics(**kw):
    return console.scan(console.Protocol(**kw))[1]


def test_reference_protocol_is_good_and_within_drl():
    m = metrics()
    assert m["quality"] == "yaxshi" and m["ctdi_vol"] < console.DRL_HEAD_CTDI
    assert [f["level"] for f in m["feedback"]] == ["ok"]


def test_lower_mas_means_less_dose_and_more_noise():
    ref, low = metrics(), metrics(mas=50)
    assert low["ctdi_vol"] < ref["ctdi_vol"] and low["noise_sd"] > ref["noise_sd"]
    assert low["quality"] == "past"


def test_high_dose_warns_about_alara():
    m = metrics(kv=140, mas=400)
    assert m["ctdi_vol"] > console.DRL_HEAD_CTDI
    assert any("ALARA" in f["text_uz"] for f in m["feedback"])


def test_uninstructed_patient_moves():
    m = metrics(patient_instructed=False)
    assert m["quality"] == "yaroqsiz" and m["feedback"][0]["level"] == "error"


def test_thin_slices_and_sharp_kernel_are_noisier():
    ref = metrics()["noise_sd"]
    assert metrics(thickness=1.0)["noise_sd"] > ref and metrics(kernel="sharp")["noise_sd"] > ref


def test_endpoint_returns_three_windows():
    res = client.post("/console/scan", json={"mas": 200}).json()
    assert set(res["images"]) == {"brain", "soft", "bone"}
    assert res["images"]["brain"].startswith("data:image/png;base64,")


@pytest.mark.parametrize("body,status", [({"door_closed": False}, 409), ({"kv": 90}, 422), ({"mas": 5}, 422)])
def test_endpoint_rejects_unsafe_or_invalid(body, status):
    assert client.post("/console/scan", json=body).status_code == status
