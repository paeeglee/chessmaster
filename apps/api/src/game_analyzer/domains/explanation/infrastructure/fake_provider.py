"""Provedor falso: textos por template, só com fatos do contrato (AI_PROVIDER=fake).

Serve para rodar o app e os testes sem chave de API. Lê o JSON do contrato que o
prompt de usuário carrega.
"""

import json
from typing import cast

from game_analyzer.domains.explanation.application.ports import ProviderError, ResponseT
from game_analyzer.domains.explanation.domain.contract import (
    GameContract,
    GameExplanation,
    KeyMomentText,
    MoveContract,
    MoveExplanation,
    PieceOnSquare,
    QuestionAnswer,
    StrengthText,
)

_CONTRACT_MARKER = "JSON dos motores:"

_PIECES = {
    "p": ("o", "peão", "o"),
    "n": ("o", "cavalo", "o"),
    "b": ("o", "bispo", "o"),
    "r": ("a", "torre", "a"),
    "q": ("a", "dama", "a"),
    "k": ("o", "rei", "o"),
}

_TYPE_EXPLANATION = {
    "hanging-piece": "A peça já estava atacada antes do lance e ficou no lugar.",
    "defender-moved": "O lance tirou a única peça que protegia essa peça.",
    "other": "O lance abriu caminho para o adversário ganhar material.",
}

_PATTERN_NAMES = {
    "hanging-piece": "deixar uma peça atacada no lugar",
    "defender-moved": "mover a peça que protegia outra",
    "other": "lances que entregaram material",
}

_HABITS = {
    "hanging-piece": "Antes de cada lance, confira quais das suas peças estão atacadas.",
    "defender-moved": "Antes de mover uma peça, veja se ela protege outra.",
    "other": "Antes de cada lance, pergunte o que o adversário ganha com ele.",
}


def _piece(piece: PieceOnSquare | None) -> tuple[str, str]:
    """("o bispo em a1", "o") para concordar "capturado"/"capturada"."""
    if piece is None:
        return "material", "o"
    article, name, ending = _PIECES[piece.type]
    return f"{article} {name} em {piece.square}", ending


def _read_json(user: str) -> object:
    start = user.find("{", user.find(_CONTRACT_MARKER))
    if start == -1:
        raise ProviderError("prompt sem o JSON do contrato")
    data, _ = json.JSONDecoder().raw_decode(user[start:])
    return data


def _read_contract(user: str) -> GameContract:
    return GameContract.model_validate(_read_json(user))


_QUALITY = {
    "best": "foi o lance do motor",
    "excellent": "foi excelente",
    "good": "foi um bom lance",
    "inaccuracy": "foi uma imprecisão",
    "mistake": "foi um erro",
    "blunder": "foi uma capivarada",
    "miss": "perdeu a chance de aproveitar o erro do adversário",
}


def _move_explanation(contract: MoveContract) -> MoveExplanation:
    """Texto de exemplo para um lance, só com os fatos do contrato."""
    sentences = [f"{contract.move_label} {_QUALITY[contract.quality]}."]
    left = contract.undefended or contract.still_en_prise
    if left:
        piece, ending = _piece(left[0])
        sentences.append(f"Depois dele, {piece} ficou atacad{ending} e sem defesa.")
    if contract.quality != "best" and contract.best_move_label:
        reasons = contract.best_reasons
        why = ""
        if reasons is not None and reasons.mate_in is not None:
            why = f", com mate em {reasons.mate_in}"
        elif reasons is not None and reasons.saves:
            why = f", salvando {_piece(reasons.saves[0])[0]}"
        elif reasons is not None and reasons.wins:
            why = f", ganhando {reasons.wins} pontos de material"
        elif reasons is not None and reasons.check:
            why = ", com xeque"
        sentences.append(f"O melhor era {contract.best_move_label}{why}.")
    return MoveExplanation(text=" ".join(sentences))


def _verdict(contract: GameContract) -> str:
    count = len(contract.key_moments)
    outcome = {
        "win": "Vitória",
        "loss": "Derrota",
        "draw": "Empate",
        "unknown": "Partida analisada",
    }[contract.outcome_for_player]
    if count == 0:
        return f"{outcome} sem perdas de material importantes: parabéns pela partida limpa."
    start = contract.advantage_started_at
    since = f" A vantagem começou em {start.label}." if start else ""
    return f"{outcome}.{since} Você devolveu material {count} vezes nos momentos-chave."


def _explanation(contract: GameContract) -> GameExplanation:
    patterns = contract.patterns[:2]
    patterns_sentence = (
        "Padrões: " + "; ".join(_PATTERN_NAMES[p.mistake_type] for p in patterns) + "."
        if patterns
        else "Nenhum padrão de erro se repetiu."
    )
    key_moments = []
    for moment in contract.key_moments:
        piece, ending = _piece(moment.lost_piece)
        best = f" O melhor lance era {moment.best_move}." if moment.best_move else ""
        key_moments.append(
            KeyMomentText(
                ply=moment.ply,
                summary=f"{moment.move_label} deixou {piece} ser capturad{ending}.",
                explanation=f"{_TYPE_EXPLANATION[moment.mistake_type]}{best}",
            )
        )
    strengths = [
        StrengthText(ply=item.ply, text=f"{item.move_label} ganhou {_piece(item.won_piece)[0]}.")
        for item in contract.strengths
    ]
    habit = (
        _HABITS[patterns[0].mistake_type]
        if patterns
        else "Continue conferindo as peças atacadas antes de cada lance."
    )
    return GameExplanation(
        verdict=_verdict(contract),
        patterns_sentence=patterns_sentence,
        key_moments=key_moments,
        strengths=strengths,
        next_game_habit=habit,
    )


def _answer(contract: GameContract) -> QuestionAnswer:
    if not contract.key_moments:
        return QuestionAnswer(
            answer="Os motores não encontraram perdas de material importantes nesta partida.",
            in_scope=True,
        )
    labels = ", ".join(moment.move_label for moment in contract.key_moments)
    return QuestionAnswer(
        answer=f"Pelos motores, os momentos-chave desta partida foram {labels}.", in_scope=True
    )


class FakeProvider:
    def generate(self, system: str, user: str, schema: type[ResponseT]) -> ResponseT:
        if schema is MoveExplanation:
            return cast(ResponseT, _move_explanation(MoveContract.model_validate(_read_json(user))))
        contract = _read_contract(user)
        if schema is GameExplanation:
            return cast(ResponseT, _explanation(contract))
        if schema is QuestionAnswer:
            return cast(ResponseT, _answer(contract))
        raise ProviderError(f"o provedor falso não sabe gerar {schema.__name__}")
