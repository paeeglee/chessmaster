from typing import Any

import pytest

from game_analyzer.domains.explanation.application.answer_question import AnswerQuestion
from game_analyzer.domains.explanation.application.explain_game import ExplainGame
from game_analyzer.domains.explanation.application.ports import ProviderError
from game_analyzer.domains.explanation.application.prompts import render_prompt
from game_analyzer.domains.explanation.domain.contract import (
    GameContract,
    GameExplanation,
    KeyMomentText,
    QuestionAnswer,
    QuestionRequest,
)
from game_analyzer.domains.explanation.infrastructure.fake_provider import FakeProvider
from game_analyzer.domains.explanation.infrastructure.openai_provider import OpenAIProvider
from game_analyzer.domains.explanation.infrastructure.provider_factory import (
    UnknownProviderError,
    build_provider,
)
from game_analyzer.shared.config import Settings


class FakeStructured:
    def __init__(self, result: Any) -> None:
        self.result = result
        self.messages: list[Any] = []

    def invoke(self, messages: list[Any]) -> Any:
        self.messages = messages
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


class FakeChat:
    def __init__(self, result: Any) -> None:
        self.structured = FakeStructured(result)
        self.kwargs: dict[str, Any] = {}

    def with_structured_output(self, schema: Any, **kwargs: Any) -> FakeStructured:
        self.kwargs = {"schema": schema, **kwargs}
        return self.structured


def test_openai_provider_asks_for_strict_json_schema_output() -> None:
    answer = QuestionAnswer(answer="ok", in_scope=True)
    chat = FakeChat(answer)
    created: list[tuple[str, str]] = []

    def factory(model: str, key: str) -> FakeChat:
        created.append((model, key))
        return chat

    provider = OpenAIProvider("gpt-5.1", "sk-test", chat_factory=factory)
    assert provider.generate("sistema", "usuário", QuestionAnswer) == answer
    assert created == [("gpt-5.1", "sk-test")]
    assert chat.kwargs == {"schema": QuestionAnswer, "method": "json_schema", "strict": True}
    assert [message.content for message in chat.structured.messages] == ["sistema", "usuário"]


def test_openai_provider_without_key_is_unavailable() -> None:
    provider = OpenAIProvider("gpt-5.1", "", chat_factory=lambda model, key: FakeChat(None))
    with pytest.raises(ProviderError, match="OPENAI_API_KEY"):
        provider.generate("s", "u", QuestionAnswer)


def test_openai_provider_wraps_errors_and_bad_formats() -> None:
    failing = OpenAIProvider("m", "k", chat_factory=lambda m, k: FakeChat(RuntimeError("429")))
    with pytest.raises(ProviderError, match="429"):
        failing.generate("s", "u", QuestionAnswer)
    wrong = OpenAIProvider("m", "k", chat_factory=lambda m, k: FakeChat({"answer": "x"}))
    with pytest.raises(ProviderError, match="formato"):
        wrong.generate("s", "u", QuestionAnswer)


def test_fake_provider_writes_verified_explanations(contract: GameContract) -> None:
    explanation = ExplainGame(FakeProvider())(contract)
    assert explanation.key_moments[0] == KeyMomentText(
        ply=44,
        summary="22...Ta7 deixou o bispo em a1 ser capturado.",
        explanation=(
            "A peça já estava atacada antes do lance e ficou no lugar. O melhor lance era Bd4+."
        ),
    )
    assert explanation.verdict == (
        "Vitória. A vantagem começou em 12...Bxa1. "
        "Você devolveu material 2 vezes nos momentos-chave."
    )
    assert explanation.strengths[0].text == "12...Bxa1 ganhou a torre em a1."


def test_fake_provider_handles_a_clean_game(contract: GameContract) -> None:
    clean = contract.model_copy(update={"key_moments": [], "patterns": [], "strengths": []})
    explanation = ExplainGame(FakeProvider())(clean)
    assert explanation.key_moments == []
    assert explanation.patterns_sentence == "Nenhum padrão de erro se repetiu."
    answer = AnswerQuestion(FakeProvider())(QuestionRequest(game=clean, question="E aí?"))
    assert answer.in_scope is True


def test_fake_provider_answers_questions(contract: GameContract) -> None:
    answer = AnswerQuestion(FakeProvider())(QuestionRequest(game=contract, question="Resumo?"))
    assert answer == QuestionAnswer(
        answer="Pelos motores, os momentos-chave desta partida foram 22...Ta7, 27...Tb7.",
        in_scope=True,
    )


def test_fake_provider_needs_the_contract_in_the_prompt() -> None:
    with pytest.raises(ProviderError):
        FakeProvider().generate("s", "sem contrato", GameExplanation)


def test_fake_provider_rejects_unknown_schemas(contract: GameContract) -> None:
    prompt = render_prompt("explain_game", contract)
    with pytest.raises(ProviderError):
        FakeProvider().generate(prompt.system, prompt.user, GameContract)


@pytest.mark.parametrize(
    ("provider", "expected"), [("openai", OpenAIProvider), ("fake", FakeProvider)]
)
def test_factory_builds_the_configured_provider(provider: str, expected: type) -> None:
    assert isinstance(build_provider(Settings(ai_provider=provider)), expected)


def test_factory_passes_model_and_key_to_the_openai_adapter() -> None:
    settings = Settings(ai_provider="openai", ai_model="gpt-x", openai_api_key="sk-abc")
    provider = build_provider(settings)
    assert isinstance(provider, OpenAIProvider)
    chat = FakeChat(QuestionAnswer(answer="ok", in_scope=True))
    created: list[tuple[str, str]] = []

    def factory(model: str, key: str) -> FakeChat:
        created.append((model, key))
        return chat

    provider._chat_factory = factory  # noqa: SLF001 - troca a fábrica só neste teste
    provider.generate("s", "u", QuestionAnswer)
    assert created == [("gpt-x", "sk-abc")]


def test_fake_verdict_for_a_clean_game(contract: GameContract) -> None:
    clean = contract.model_copy(update={"key_moments": [], "patterns": []})
    explanation = ExplainGame(FakeProvider())(clean)
    assert explanation.verdict == (
        "Vitória sem perdas de material importantes: parabéns pela partida limpa."
    )


def test_factory_rejects_unknown_providers() -> None:
    with pytest.raises(UnknownProviderError, match="AI_PROVIDER desconhecido: outro"):
        build_provider(Settings(ai_provider="outro"))
