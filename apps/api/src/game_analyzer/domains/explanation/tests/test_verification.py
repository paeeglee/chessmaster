import pytest

from game_analyzer.domains.explanation.domain.contract import (
    GameContract,
    GameExplanation,
    KeyMomentText,
    StrengthText,
)
from game_analyzer.domains.explanation.domain.verification import (
    allowed_facts,
    verify_explanation,
    verify_text,
)


def explanation(**overrides: object) -> GameExplanation:
    data: dict[str, object] = {
        "verdict": "Você venceu: a vantagem começou em 12...Bxa1 e o material voltou 2 vezes.",
        "patterns_sentence": "Duas vezes você deixou uma peça atacada no lugar.",
        "key_moments": [
            KeyMomentText(
                ply=44,
                summary="22...Ta7 deixou o bispo em a1 sem proteção.",
                explanation="O bispo em a1 já estava atacado. Bd4+ salvava a peça.",
            ),
            KeyMomentText(
                ply=54, summary="27...Tb7 deixou o bispo em g4.", explanation="Be2 salvava."
            ),
        ],
        "strengths": [StrengthText(ply=24, text="12...Bxa1 ganhou a torre em a1.")],
        "next_game_habit": "Antes de mover, confira quais peças suas estão atacadas.",
    }
    data.update(overrides)
    return GameExplanation.model_validate(data)


def test_accepts_text_that_only_cites_the_contract(contract: GameContract) -> None:
    assert verify_explanation(explanation(), contract) == []


def test_reports_a_move_label_not_in_the_contract(contract: GameContract) -> None:
    facts = allowed_facts(contract)
    assert verify_text("Em 30...Txa2 você errou.", facts) == [
        "lance 30...Txa2 não está no contrato"
    ]


def test_reports_a_piece_move_not_in_the_contract(contract: GameContract) -> None:
    facts = allowed_facts(contract)
    assert verify_text("Cf3 era melhor.", facts) == ["lance Cf3 não está no contrato"]


def test_accepts_best_moves_and_ignores_check_signs(contract: GameContract) -> None:
    facts = allowed_facts(contract)
    assert verify_text("Bd4 e Bd4+ salvavam; 72...Ta6 deu mate.", facts) == []


def test_reports_a_square_not_in_the_contract(contract: GameContract) -> None:
    facts = allowed_facts(contract)
    assert verify_text("O cavalo em h3 ficou solto.", facts) == ["casa h3 não está no contrato"]


def test_reports_a_number_not_in_the_contract(contract: GameContract) -> None:
    facts = allowed_facts(contract)
    assert verify_text("Você perdeu 7 pontos.", facts) == ["número 7 não está no contrato"]
    assert verify_text("Foram 72 lances e você perdeu 3 pontos.", facts) == []


@pytest.mark.parametrize(
    ("text", "violation"),
    [
        ("Nf3 era melhor.", "lance Nf3 não está no contrato"),
        ("Qxh7# encerrava.", "lance Qxh7# não está no contrato"),
        ("Kg1 salvava.", "lance Kg1 não está no contrato"),
        ("Bastava exd5.", "lance exd5 não está no contrato"),
        ("E gxh3 abria a coluna.", "lance gxh3 não está no contrato"),
        ("Faltou O-O-O.", "lance O-O-O não está no contrato"),
        ("Faltou 0-0.", "lance 0-0 não está no contrato"),
        ("Depois de 12…Txa2 tudo mudou.", "lance 12…Txa2 não está no contrato"),
        ("Depois de 30. e4 tudo mudou.", "lance 30. e4 não está no contrato"),
        ("Com Bd4 em h8 não dá.", "casa h8 não está no contrato"),
        ("Depois veio ...Dxh8.", "lance ...Dxh8 não está no contrato"),
        ("Depois veio …Dxh8.", "lance …Dxh8 não está no contrato"),
    ],
)
def test_reports_every_kind_of_invented_move(
    contract: GameContract, text: str, violation: str
) -> None:
    assert verify_text(text, allowed_facts(contract)) == [violation]


def test_accepts_contract_moves_written_with_spaces_and_signs(contract: GameContract) -> None:
    facts = allowed_facts(contract)
    assert verify_text("Em 22... Ta7+ e em 22…Ta7! o bispo caiu.", facts) == []
    assert verify_text("Com ...Ta7 e …Ta7 o bispo caiu.", facts) == []


def test_accepts_castling_written_with_zeros(contract: GameContract) -> None:
    data = contract.model_dump()
    data["moves"].append({"ply": 12, "label": "6...O-O", "san": "O-O"})
    castled = GameContract.model_validate(data)
    assert verify_text("O roque 0-0 e 6...0-0 foram bons.", allowed_facts(castled)) == []


@pytest.mark.parametrize("decimal", ["+2,3", "2.3", "-0,5"])
def test_reports_decimal_numbers_as_invented_evaluations(
    contract: GameContract, decimal: str
) -> None:
    assert verify_text(f"A avaliação foi {decimal}.", allowed_facts(contract)) == [
        f"número decimal {decimal} não pode aparecer (avaliação inventada)"
    ]


def test_reports_strengths_that_do_not_match(contract: GameContract) -> None:
    assert verify_explanation(explanation(strengths=[]), contract) == [
        "os pontos fortes não batem com o contrato"
    ]


def test_reports_a_long_verdict(contract: GameContract) -> None:
    long_verdict = " ".join(["palavra"] * 31)
    assert verify_explanation(explanation(verdict=long_verdict), contract) == [
        "a manchete passou de 30 palavras"
    ]


def test_reports_key_moments_that_do_not_match(contract: GameContract) -> None:
    only_first = explanation(
        key_moments=[KeyMomentText(ply=44, summary="22...Ta7.", explanation="Bd4+.")]
    )
    assert verify_explanation(only_first, contract) == [
        "os momentos-chave não batem com o contrato"
    ]


def test_checks_every_text_field(contract: GameContract) -> None:
    bad_habit = explanation(next_game_habit="Jogue Cf3 sempre.")
    assert verify_explanation(bad_habit, contract) == ["lance Cf3 não está no contrato"]


def test_accepts_a_game_without_key_moments(contract: GameContract) -> None:
    clean = contract.model_copy(update={"key_moments": [], "patterns": []})
    positive = explanation(
        verdict="Partida limpa: nenhuma perda de material importante.",
        patterns_sentence="Nenhum padrão de erro se repetiu.",
        key_moments=[],
    )
    assert verify_explanation(positive, clean) == []


@pytest.mark.parametrize("square", ["a1", "g4"])
def test_allows_squares_of_lost_pieces(contract: GameContract, square: str) -> None:
    assert square in allowed_facts(contract).squares
