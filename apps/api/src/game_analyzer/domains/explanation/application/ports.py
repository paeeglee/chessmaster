"""Portas da camada de IA: o provedor é trocável por configuração (D4)."""

from typing import Protocol, TypeVar

from pydantic import BaseModel

ResponseT = TypeVar("ResponseT", bound=BaseModel)


class ProviderError(Exception):
    """O provedor de IA não respondeu (rede, chave, cota, formato)."""


class LLMProvider(Protocol):
    def generate(self, system: str, user: str, schema: type[ResponseT]) -> ResponseT:
        """Devolve uma instância de `schema` gerada a partir das mensagens."""
        ...
