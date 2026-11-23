"""Escolhe o adaptador de IA pela configuração (AI_PROVIDER, AI_MODEL)."""

from game_analyzer.domains.explanation.application.ports import LLMProvider
from game_analyzer.domains.explanation.infrastructure.fake_provider import FakeProvider
from game_analyzer.domains.explanation.infrastructure.openai_provider import OpenAIProvider
from game_analyzer.shared.config import Settings


class UnknownProviderError(ValueError):
    pass


def build_provider(settings: Settings) -> LLMProvider:
    match settings.ai_provider:
        case "openai":
            return OpenAIProvider(settings.ai_model, settings.openai_api_key.get_secret_value())
        case "fake":
            return FakeProvider()
        case other:
            raise UnknownProviderError(f"AI_PROVIDER desconhecido: {other}")
