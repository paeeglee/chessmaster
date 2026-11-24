from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from game_analyzer.main import create_app
from game_analyzer.shared.config import Settings

AI_VARIABLES = (
    "AI_PROVIDER",
    "AI_MODEL",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "AI_TIMEOUT_SECONDS",
)


@pytest.fixture
def clean_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    for name in AI_VARIABLES:
        monkeypatch.delenv(name, raising=False)
    # Roda num diretório sem .env, para não ler o .env real do desenvolvedor.
    monkeypatch.chdir(tmp_path)
    return tmp_path


def test_defaults_match_env_example(clean_env: Path) -> None:
    settings = Settings()

    assert settings.ai_provider == "openai"
    assert settings.ai_model == "gpt-5.1"
    assert settings.openai_api_key.get_secret_value() == ""
    assert settings.openai_base_url is None
    assert settings.ai_timeout_seconds == 60


def test_reads_values_from_environment(clean_env: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PROVIDER", "anthropic")
    monkeypatch.setenv("AI_MODEL", "some-model")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")

    settings = Settings()

    assert settings.ai_provider == "anthropic"
    assert settings.ai_model == "some-model"
    assert settings.openai_api_key.get_secret_value() == "sk-test"


def test_reads_values_from_dotenv_file(clean_env: Path) -> None:
    (clean_env / ".env").write_text("AI_MODEL=model-from-file\n", encoding="utf-8")

    assert Settings().ai_model == "model-from-file"


def test_reads_base_url_and_timeout_from_dotenv_file(clean_env: Path) -> None:
    (clean_env / ".env").write_text(
        "OPENAI_BASE_URL=http://localhost:1234/v1\nAI_TIMEOUT_SECONDS=180\n", encoding="utf-8"
    )

    settings = Settings()

    assert settings.openai_base_url == "http://localhost:1234/v1"
    assert settings.ai_timeout_seconds == 180


def test_empty_base_url_falls_back_to_the_openai_api(clean_env: Path) -> None:
    (clean_env / ".env").write_text("OPENAI_BASE_URL=\n", encoding="utf-8")

    assert Settings().openai_base_url is None


def test_app_starts_without_openai_key(clean_env: Path) -> None:
    client = TestClient(create_app())

    assert client.get("/api/health").json() == {"status": "ok"}
