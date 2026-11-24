from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from game_analyzer.domains.explanation.api.router import get_provider
from game_analyzer.domains.explanation.application.ports import ProviderError, ResponseT
from game_analyzer.domains.explanation.domain.contract import GameExplanation, QuestionAnswer
from game_analyzer.domains.explanation.infrastructure.fake_provider import FakeProvider
from game_analyzer.domains.explanation.tests.conftest import reference_contract_data
from game_analyzer.domains.explanation.tests.scripted_provider import ScriptedProvider
from game_analyzer.main import create_app
from game_analyzer.shared.config import get_settings


class FailingProvider:
    def generate(self, system: str, user: str, schema: type[ResponseT]) -> ResponseT:
        raise ProviderError("sem rede")


def client_with(provider: object) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_provider] = lambda: provider
    return TestClient(app)


@pytest.fixture(autouse=True)
def clear_settings_cache() -> Iterator[None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_explanations_returns_the_verified_explanation() -> None:
    response = client_with(FakeProvider()).post("/api/explanations", json=reference_contract_data())
    assert response.status_code == 200
    body = response.json()
    assert [moment["ply"] for moment in body["key_moments"]] == [44, 54]
    assert [strength["ply"] for strength in body["strengths"]] == [24]
    assert set(body) == {
        "verdict",
        "patterns_sentence",
        "key_moments",
        "strengths",
        "next_game_habit",
    }


def test_explanations_rejects_bodies_outside_the_contract() -> None:
    data = reference_contract_data() | {"evaluation": "+2.3"}
    assert client_with(FakeProvider()).post("/api/explanations", json=data).status_code == 422


def test_explanations_reports_an_unavailable_provider() -> None:
    response = client_with(FailingProvider()).post(
        "/api/explanations", json=reference_contract_data()
    )
    assert response.status_code == 503
    assert response.json() == {"detail": "ai_unavailable"}


def test_explanations_reports_unverified_texts(caplog: pytest.LogCaptureFixture) -> None:
    bad = GameExplanation(
        verdict="Cf3.",
        patterns_sentence="",
        key_moments=[],
        strengths=[],
        next_game_habit="",
    )
    with caplog.at_level("WARNING"):
        response = client_with(ScriptedProvider([bad, bad])).post(
            "/api/explanations", json=reference_contract_data()
        )
    assert response.status_code == 502
    assert response.json() == {"detail": "explanation_unverified"}
    # O log diz o que foi recusado, para depurar sem reproduzir a chamada.
    assert "lance Cf3 não está no contrato" in caplog.text


def test_questions_answers_about_the_game() -> None:
    response = client_with(FakeProvider()).post(
        "/api/questions", json={"game": reference_contract_data(), "question": "Resumo?"}
    )
    assert response.status_code == 200
    assert response.json()["in_scope"] is True


@pytest.mark.parametrize("question", ["", "x" * 501])
def test_questions_validates_the_question_length(question: str) -> None:
    response = client_with(FakeProvider()).post(
        "/api/questions", json={"game": reference_contract_data(), "question": question}
    )
    assert response.status_code == 422


def test_questions_reports_an_unavailable_provider() -> None:
    response = client_with(FailingProvider()).post(
        "/api/questions", json={"game": reference_contract_data(), "question": "Oi?"}
    )
    assert response.status_code == 503
    assert response.json() == {"detail": "ai_unavailable"}


def test_questions_reports_unverified_answers(caplog: pytest.LogCaptureFixture) -> None:
    bad = QuestionAnswer(answer="Cf3 era melhor.", in_scope=True)
    with caplog.at_level("WARNING"):
        response = client_with(ScriptedProvider([bad, bad])).post(
            "/api/questions", json={"game": reference_contract_data(), "question": "Oi?"}
        )
    assert "lance Cf3 não está no contrato" in caplog.text
    assert response.status_code == 502
    assert response.json() == {"detail": "explanation_unverified"}


def test_openai_without_key_is_unavailable_but_health_works(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "")
    client = TestClient(create_app())
    assert client.get("/api/health").status_code == 200
    response = client.post("/api/explanations", json=reference_contract_data())
    assert response.status_code == 503
    assert response.json() == {"detail": "ai_unavailable"}


def test_unknown_provider_is_reported_as_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PROVIDER", "outro")
    client = TestClient(create_app())
    assert client.get("/api/health").status_code == 200
    response = client.post("/api/explanations", json=reference_contract_data())
    assert response.status_code == 503
    assert response.json() == {"detail": "ai_unavailable"}


def test_fake_provider_selected_by_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PROVIDER", "fake")
    response = TestClient(create_app()).post("/api/explanations", json=reference_contract_data())
    assert response.status_code == 200
