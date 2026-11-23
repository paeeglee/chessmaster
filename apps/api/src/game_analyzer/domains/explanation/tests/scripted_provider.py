from collections.abc import Sequence

from pydantic import BaseModel

from game_analyzer.domains.explanation.application.ports import ProviderError, ResponseT


class ScriptedProvider:
    """Provedor falso que devolve respostas prontas, em ordem, e registra as chamadas."""

    def __init__(self, responses: Sequence[BaseModel | Exception]) -> None:
        self._responses = list(responses)
        self.calls: list[tuple[str, str]] = []

    def generate(self, system: str, user: str, schema: type[ResponseT]) -> ResponseT:
        self.calls.append((system, user))
        response = self._responses.pop(0)
        if isinstance(response, Exception):
            raise response
        if not isinstance(response, schema):
            raise ProviderError("resposta com formato inesperado")
        return response
