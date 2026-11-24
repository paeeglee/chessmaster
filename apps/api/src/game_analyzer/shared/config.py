from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuração lida do ambiente e de apps/api/.env (ver .env.example)."""

    # Variáveis vazias no .env (ex.: OPENAI_BASE_URL=) voltam ao valor padrão.
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", env_ignore_empty=True
    )

    ai_provider: str = "openai"
    ai_model: str = "gpt-5.1"
    # Opcional na inicialização: só a camada de IA (F6) exige a chave.
    openai_api_key: SecretStr = SecretStr("")
    # URL de um servidor compatível com a API da OpenAI (LM Studio, vLLM, Ollama).
    # Vazio: a API da OpenAI.
    openai_base_url: str | None = None
    # Tempo máximo de cada chamada ao provedor; modelos locais podem precisar de mais.
    ai_timeout_seconds: float = 60


@lru_cache
def get_settings() -> Settings:
    return Settings()
