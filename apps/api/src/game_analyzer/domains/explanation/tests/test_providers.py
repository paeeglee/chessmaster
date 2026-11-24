from typing import Any, cast

import pytest
from langchain_openai import ChatOpenAI

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
from game_analyzer.domains.explanation.infrastructure.openai_provider import (
    ChatConfig,
    OpenAIProvider,
    _default_chat,
)
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
    created: list[ChatConfig] = []

    def factory(config: ChatConfig) -> FakeChat:
        created.append(config)
        return chat

    config = ChatConfig(model="gpt-5.1", api_key="sk-test")
    provider = OpenAIProvider(config, chat_factory=factory)
    assert provider.generate("sistema", "usuário", QuestionAnswer) == answer
    assert created == [config]
    assert chat.kwargs == {"schema": QuestionAnswer, "method": "json_schema", "strict": True}
    assert [message.content for message in chat.structured.messages] == ["sistema", "usuário"]


def test_openai_provider_without_key_is_unavailable() -> None:
    provider = OpenAIProvider(
        ChatConfig(model="gpt-5.1", api_key=""), chat_factory=lambda config: FakeChat(None)
    )
    with pytest.raises(ProviderError, match="OPENAI_API_KEY"):
        provider.generate("s", "u", QuestionAnswer)


def test_openai_provider_wraps_errors_and_bad_formats() -> None:
    config = ChatConfig(model="m", api_key="k")
    failing = OpenAIProvider(config, chat_factory=lambda c: FakeChat(RuntimeError("429")))
    with pytest.raises(ProviderError, match="429"):
        failing.generate("s", "u", QuestionAnswer)
    wrong = OpenAIProvider(config, chat_factory=lambda c: FakeChat({"answer": "x"}))
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


def _configured_chat(settings: Settings) -> ChatConfig:
    provider = build_provider(settings)
    assert isinstance(provider, OpenAIProvider)
    chat = FakeChat(QuestionAnswer(answer="ok", in_scope=True))
    created: list[ChatConfig] = []

    def factory(config: ChatConfig) -> FakeChat:
        created.append(config)
        return chat

    provider._chat_factory = factory  # noqa: SLF001 - troca a fábrica só neste teste
    provider.generate("s", "u", QuestionAnswer)
    return created[0]


def test_factory_passes_model_and_key_to_the_openai_adapter() -> None:
    settings = Settings(ai_provider="openai", ai_model="gpt-x", openai_api_key="sk-abc")
    assert _configured_chat(settings) == ChatConfig(
        model="gpt-x", api_key="sk-abc", base_url=None, timeout_seconds=60
    )


def test_factory_passes_base_url_and_timeout_for_local_servers() -> None:
    # LM Studio, vLLM ou Ollama: servidor compatível com a API da OpenAI.
    settings = Settings(
        ai_provider="openai",
        ai_model="qwen2.5-7b-instruct",
        openai_api_key="lm-studio",
        openai_base_url="http://localhost:1234/v1",
        ai_timeout_seconds=180,
    )
    assert _configured_chat(settings) == ChatConfig(
        model="qwen2.5-7b-instruct",
        api_key="lm-studio",
        base_url="http://localhost:1234/v1",
        timeout_seconds=180,
    )


def test_default_chat_sends_base_url_and_timeout_to_chat_openai() -> None:
    chat = cast(
        ChatOpenAI,
        _default_chat(
            ChatConfig(
                model="local-model",
                api_key="lm-studio",
                base_url="http://localhost:1234/v1",
                timeout_seconds=180,
            )
        ),
    )
    assert chat.openai_api_base == "http://localhost:1234/v1"
    assert chat.request_timeout == 180
    assert chat.model_name == "local-model"


def test_fake_verdict_for_a_clean_game(contract: GameContract) -> None:
    clean = contract.model_copy(update={"key_moments": [], "patterns": []})
    explanation = ExplainGame(FakeProvider())(clean)
    assert explanation.verdict == (
        "Vitória sem perdas de material importantes: parabéns pela partida limpa."
    )


def test_factory_rejects_unknown_providers() -> None:
    with pytest.raises(UnknownProviderError, match="AI_PROVIDER desconhecido: outro"):
        build_provider(Settings(ai_provider="outro"))
