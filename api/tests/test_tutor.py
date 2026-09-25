import pytest
from fastapi.testclient import TestClient

from app import llm, tutor
from app.main import app

client = TestClient(app)


@pytest.fixture
def no_llm(monkeypatch):
    monkeypatch.setattr(llm, "is_configured", lambda: False)


def test_docs_are_loaded():
    assert len(tutor.CHUNKS) >= 15


@pytest.mark.parametrize(
    "question,section",
    [
        ("Halqa artefakti nima?", "Halqa artefakti"),
        ("ALARA tamoyili", "ALARA tamoyili"),
        ("Tasvir donador, shovqin ko‘p", "Kvant shovqini"),
        ("Slip-ring nima vazifani bajaradi?", "Slip-ring va DAS"),
    ],
)
def test_retrieval_finds_the_right_section(question, section):
    assert tutor.retrieve(question)[0][0].section == section


def test_off_topic_question_is_refused(no_llm):
    res = tutor.ask("Futbol bo‘yicha jahon chempionati qachon o‘tadi?")
    assert res["grounded"] is False and res["citations"] == []


def test_fallback_quotes_source_with_citation(no_llm):
    res = tutor.ask("Halqa artefakti nima?")
    assert res["grounded"] and not res["ai_used"]
    assert res["answer_uz"].endswith("[1]") and res["citations"][0]["section"] == "Halqa artefakti"


def test_llm_citations_are_validated(monkeypatch):
    monkeypatch.setattr(
        llm, "complete_json", lambda *a, **k: {"answerable": True, "answer_uz": "Javob [1] [9]", "used_sources": [1, 9]}
    )
    res = tutor.ask("Halqa artefakti nima?")
    assert [c["n"] for c in res["citations"]] == [1]


def test_llm_can_refuse(monkeypatch):
    monkeypatch.setattr(llm, "complete_json", lambda *a, **k: {"answerable": False, "answer_uz": "", "used_sources": []})
    assert tutor.ask("Halqa artefakti nima?")["grounded"] is False


def test_endpoint_and_sources(no_llm):
    assert client.post("/tutor", json={"question": "Bowtie filtri nima?"}).json()["grounded"]
    assert client.post("/tutor", json={"question": ""}).status_code == 422
    assert len(client.get("/tutor/sources").json()) == 4
