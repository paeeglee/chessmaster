import pytest


def test_llm_tests_are_deselected_by_default(pytestconfig: pytest.Config) -> None:
    # `make test` não pode chamar provedores reais: o filtro padrão exclui `llm`.
    assert pytestconfig.option.markexpr == "not llm"


def test_llm_marker_is_registered(pytestconfig: pytest.Config) -> None:
    markers = pytestconfig.getini("markers")
    assert any(marker.startswith("llm:") for marker in markers)
