"""Adaptador OpenAI (padrão GPT-5.1, D4) via LangChain, com saída estruturada."""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Protocol, cast

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from game_analyzer.domains.explanation.application.ports import ProviderError, ResponseT


class _StructuredChat(Protocol):
    def invoke(self, messages: list[Any]) -> Any: ...


class _Chat(Protocol):
    def with_structured_output(self, schema: Any, **kwargs: Any) -> _StructuredChat: ...


@dataclass(frozen=True)
class ChatConfig:
    """Como falar com o modelo: a API da OpenAI ou um servidor compatível."""

    model: str
    api_key: str
    # None: a API da OpenAI; senão, um servidor compatível (LM Studio, vLLM, Ollama).
    base_url: str | None = None
    timeout_seconds: float = 60


def _default_chat(config: ChatConfig) -> _Chat:
    chat = ChatOpenAI(
        model=config.model,
        api_key=SecretStr(config.api_key),
        base_url=config.base_url,
        timeout=config.timeout_seconds,
        max_retries=2,
    )
    # O ChatOpenAI devolve um Runnable genérico; só usamos with_structured_output/invoke.
    return cast(_Chat, chat)


class OpenAIProvider:
    def __init__(
        self,
        config: ChatConfig,
        chat_factory: Callable[[ChatConfig], _Chat] = _default_chat,
    ) -> None:
        self._config = config
        self._chat_factory = chat_factory

    def generate(self, system: str, user: str, schema: type[ResponseT]) -> ResponseT:
        if not self._config.api_key:
            raise ProviderError("OPENAI_API_KEY não configurada")
        try:
            chat = self._chat_factory(self._config)
            structured = chat.with_structured_output(schema, method="json_schema", strict=True)
            result = structured.invoke([SystemMessage(system), HumanMessage(user)])
        except Exception as error:  # noqa: BLE001 - qualquer falha do provedor vira 503
            raise ProviderError(str(error)) from error
        if not isinstance(result, schema):
            raise ProviderError("o provedor devolveu um formato inesperado")
        return result
