"""Revisão lance a lance (F9): contrato do lance, verificação, caso de uso e rota."""

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from game_analyzer.domains.explanation.api.router import get_provider
from game_analyzer.domains.explanation.application.explain_game import (
    ExplanationUnverifiedError,
)
from game_analyzer.domains.explanation.application.explain_move import ExplainMove
from game_analyzer.domains.explanation.application.ports import ProviderError, ResponseT
from game_analyzer.domains.explanation.domain.contract import MoveContract, MoveExplanation
from game_analyzer.domains.explanation.domain.verification import verify_move_explanation
from game_analyzer.domains.explanation.infrastructure.fake_provider import FakeProvider
from game_analyzer.domains.explanation.tests.scripted_provider import ScriptedProvider
from game_analyzer.main import create_app
from game_analyzer.shared.config import get_settings


def move_contract_data(**overrides: Any) -> dict[str, Any]:
    """22...Ta7 da partida de referência, do ponto de vista das pretas."""
    data: dict[str, Any] = {
        "level": "beginner",
        "player_color": "b",
        "mover": "player",
        "move_label": "22...Ta7",
        "move_san": "Ta7",
        "quality": "mistake",
        "best_move_label": "22...Bd4+",
        "best_line": ["Bd4+", "Re3", "Bxe3", "Bxe3"],
        "undefended": [],
        "still_en_prise": [{"type": "b", "square": "a1"}],
        "missed_material": 3,
        "best_reasons": {
            "check": True,
            "mate_in": None,
            "wins": 0,
            "saves": [{"type": "b", "square": "a1"}],
        },
    }
    data.update(overrides)
    return data


def contract(**overrides: Any) -> MoveContract:
    return MoveContract.model_validate(move_contract_data(**overrides))


def text(value: str) -> MoveExplanation:
    return MoveExplanation(text=value)


def test_accepts_text_with_contract_facts() -> None:
    explanation = text(
        "22...Ta7 foi um erro: o bispo em a1 continuou atacado e você perdeu 3 pontos. "
        "O melhor era 22...Bd4+, com xeque, e depois 23.Re3 Bxe3."
    )
    assert verify_move_explanation(explanation, contract()) == []


def test_rejects_moves_squares_and_numbers_outside_the_contract() -> None:
    explanation = text("22...Ta7 foi um erro; 22...Tb7 era melhor, a casa h5 caiu e você perdeu 7.")
    assert verify_move_explanation(explanation, contract()) == [
        "lance 22...Tb7 não está no contrato",
        "casa h5 não está no contrato",
        "número 7 não está no contrato",
    ]


def test_line_numbers_must_follow_the_move_order() -> None:
    # 23...Re3 não existe: Re3 é lance das brancas no lance 23.
    assert verify_move_explanation(text("Depois vem 23...Re3."), contract()) == [
        "lance 23...Re3 não está no contrato"
    ]


def test_allows_mate_in_n_and_material_won() -> None:
    mate = contract(
        best_reasons={"check": True, "mate_in": 4, "wins": 5, "saves": []},
        still_en_prise=[],
        missed_material=0,
    )
    assert verify_move_explanation(text("O melhor dava mate em 4 e ganhava 5."), mate) == []


def test_white_move_labels_in_the_line() -> None:
    white = contract(
        player_color="w",
        move_label="12.Ce2",
        move_san="Ce2",
        best_move_label="12.Bd2",
        best_line=["Bd2", "Bxa1", "Dxa1"],
        still_en_prise=[],
        best_reasons=None,
    )
    assert verify_move_explanation(text("Melhor era 12.Bd2 Bxa1 13.Dxa1."), white) == []


def test_use_case_retries_with_the_violations_then_gives_up() -> None:
    bad = text("22...Tb7 era melhor.")
    good = text("22...Ta7 foi um erro. O melhor era 22...Bd4+.")
    provider = ScriptedProvider([bad, good])
    assert ExplainMove(provider)(contract()) == good
    assert "lance 22...Tb7 não está no contrato" in provider.calls[1][1]
    with pytest.raises(ExplanationUnverifiedError):
        ExplainMove(ScriptedProvider([bad, bad]))(contract())


@pytest.mark.parametrize(
    "overrides",
    [
        {},
        {"quality": "best", "best_move_label": "22...Ta7", "missed_material": 0},
        {"best_reasons": {"check": False, "mate_in": 2, "wins": 0, "saves": []}},
        {"best_reasons": {"check": False, "mate_in": None, "wins": 3, "saves": []}},
        {"best_reasons": {"check": True, "mate_in": None, "wins": 0, "saves": []}},
        {"best_reasons": None, "still_en_prise": [], "undefended": [{"type": "q", "square": "d4"}]},
        {"best_move_label": None, "best_line": [], "best_reasons": None},
    ],
)
def test_fake_provider_writes_verified_move_texts(overrides: dict[str, Any]) -> None:
    explanation = ExplainMove(FakeProvider())(contract(**overrides))
    assert explanation.text.startswith("22...Ta7 ")


def test_fake_provider_text_for_the_reference_move() -> None:
    explanation = ExplainMove(FakeProvider())(contract())
    assert explanation.text == (
        "22...Ta7 foi um erro. Depois dele, o bispo em a1 ficou atacado e sem defesa. "
        "O melhor era 22...Bd4+, salvando o bispo em a1."
    )


class FailingProvider:
    def generate(self, system: str, user: str, schema: type[ResponseT]) -> ResponseT:
        raise ProviderError("sem rede")


@pytest.fixture(autouse=True)
def clear_settings_cache() -> Iterator[None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def client_with(provider: object) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_provider] = lambda: provider
    return TestClient(app)


def test_route_returns_the_verified_text() -> None:
    response = client_with(FakeProvider()).post("/api/move-explanations", json=move_contract_data())
    assert response.status_code == 200
    assert response.json()["text"].startswith("22...Ta7 foi um erro.")


def test_route_rejects_bodies_outside_the_contract() -> None:
    response = client_with(FakeProvider()).post(
        "/api/move-explanations", json=move_contract_data(quality="brilliant")
    )
    assert response.status_code == 422
    too_long = move_contract_data(best_line=["a3"] * 7)
    response = client_with(FakeProvider()).post("/api/move-explanations", json=too_long)
    assert response.status_code == 422


def test_route_reports_unavailable_and_unverified(caplog: pytest.LogCaptureFixture) -> None:
    unavailable = client_with(FailingProvider()).post(
        "/api/move-explanations", json=move_contract_data()
    )
    assert unavailable.status_code == 503
    assert unavailable.json() == {"detail": "ai_unavailable"}
    bad = text("22...Tb7 era melhor.")
    with caplog.at_level("WARNING"):
        unverified = client_with(ScriptedProvider([bad, bad])).post(
            "/api/move-explanations", json=move_contract_data()
        )
    assert unverified.status_code == 502
    assert unverified.json() == {"detail": "explanation_unverified"}
    assert "lance 22...Tb7 não está no contrato" in caplog.text
