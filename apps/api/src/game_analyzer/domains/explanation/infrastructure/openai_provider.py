"""Adaptador OpenAI (padrão GPT-5.1, D4) via LangChain, com saída estruturada."""

from collections.abc import Callable
from typing import Any, Protocol, cast

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from game_analyzer.domains.explanation.application.ports import ProviderError, ResponseT


class _StructuredChat(Protocol):
    def invoke(self, messages: list[Any]) -> Any: ...


class _Chat(Protocol):
    def with_structured_output(self, schema: Any, **kwargs: Any) -> _StructuredChat: ...


def _default_chat(model: str, api_key: str) -> _Chat:
    chat = ChatOpenAI(model=model, api_key=SecretStr(api_key), timeout=60, max_retries=2)
    # O ChatOpenAI devolve um Runnable genérico; só usamos with_structured_output/invoke.
    return cast(_Chat, chat)


class OpenAIProvider:
    def __init__(
        self,
        model: str,
        api_key: str,
        chat_factory: Callable[[str, str], _Chat] = _default_chat,
    ) -> None:
        self._model = model
        self._api_key = api_key
        self._chat_factory = chat_factory

    def generate(self, system: str, user: str, schema: type[ResponseT]) -> ResponseT:
        if not self._api_key:
            raise ProviderError("OPENAI_API_KEY não configurada")
        try:
            chat = self._chat_factory(self._model, self._api_key)
            structured = chat.with_structured_output(schema, method="json_schema", strict=True)
            result = structured.invoke([SystemMessage(system), HumanMessage(user)])
        except Exception as error:  # noqa: BLE001 - qualquer falha do provedor vira 503
            raise ProviderError(str(error)) from error
        if not isinstance(result, schema):
            raise ProviderError("o provedor devolveu um formato inesperado")
        return result
