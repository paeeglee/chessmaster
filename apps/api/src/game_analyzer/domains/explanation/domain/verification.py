"""Verificação automática: o texto da IA só pode citar o que está no contrato."""

import re
from dataclasses import dataclass

from game_analyzer.domains.explanation.domain.contract import GameContract, GameExplanation

MAX_VERDICT_WORDS = 30

_SAN = (
    r"(?:O-O(?:-O)?|[RDTBC][a-h]?[1-8]?x?[a-h][1-8](?:=[DTBC])?"
    r"|[a-h](?:x[a-h])?[1-8](?:=[DTBC])?)[+#]?"
)
_LABELED_MOVE = re.compile(rf"\b(\d+)\s?\.(?:\.\.|…)?\s?({_SAN})")
_PIECE_MOVE = re.compile(r"(?<![\w.…])([RDTBC][a-h]?[1-8]?x?[a-h][1-8](?:=[DTBC])?[+#]?)(?!\w)")
_SQUARE = re.compile(r"(?<![\w])([a-h][1-8])(?!\w)")
_INTEGER = re.compile(r"(?<![\w.,])(\d+)(?![\w.,]\d)")


def _normalize_move(move: str) -> str:
    return move.replace(" ", "").replace("…", "...").rstrip("+#")


@dataclass(frozen=True)
class AllowedFacts:
    labels: frozenset[str]
    moves: frozenset[str]
    squares: frozenset[str]
    numbers: frozenset[int]


def allowed_facts(contract: GameContract) -> AllowedFacts:
    """Lances, casas e números que aparecem no contrato (ou derivam dele de forma trivial)."""
    labels = {_normalize_move(move.label) for move in contract.moves}
    moves = {_normalize_move(move.san) for move in contract.moves}
    numbers: set[int] = {1, 2, contract.total_moves, len(contract.moves)}
    pieces = []
    for moment in contract.key_moments:
        if moment.best_move:
            moves.add(_normalize_move(moment.best_move))
        pieces.append(moment.lost_piece)
        numbers.add(moment.loss)
    for mistake in contract.opponent_mistakes:
        pieces.append(mistake.lost_piece)
        numbers.add(mistake.loss)
    for strength in contract.strengths:
        pieces.append(strength.won_piece)
        numbers.add(strength.gain)
    for pattern in contract.patterns:
        numbers.add(pattern.count)
    numbers.update({len(contract.key_moments), len(contract.strengths)})
    numbers.update({len(contract.opponent_mistakes)})
    numbers.update(abs(value) for value in contract.material_timeline)
    for move in contract.moves:
        numbers.update({move.ply, (move.ply + 1) // 2})
    squares = {square for move in moves for square in _SQUARE.findall(move)}
    squares.update(piece.square for piece in pieces if piece is not None)
    return AllowedFacts(frozenset(labels), frozenset(moves), frozenset(squares), frozenset(numbers))


def verify_text(text: str, facts: AllowedFacts) -> list[str]:
    """Lista o que o texto cita sem respaldo no contrato."""
    violations: list[str] = []
    remaining = text
    for match in _LABELED_MOVE.finditer(text):
        label = _normalize_move(match.group(0))
        if label not in facts.labels:
            violations.append(f"lance {match.group(0)} não está no contrato")
        remaining = remaining.replace(match.group(0), " ")
    for match in _PIECE_MOVE.finditer(remaining):
        if _normalize_move(match.group(1)) not in facts.moves:
            violations.append(f"lance {match.group(1)} não está no contrato")
        remaining = remaining.replace(match.group(1), " ")
    for square in _SQUARE.findall(remaining):
        if square not in facts.squares:
            violations.append(f"casa {square} não está no contrato")
    without_squares = _SQUARE.sub(" ", remaining)
    for number in _INTEGER.findall(without_squares):
        if int(number) not in facts.numbers:
            violations.append(f"número {number} não está no contrato")
    return violations


def verify_explanation(explanation: GameExplanation, contract: GameContract) -> list[str]:
    facts = allowed_facts(contract)
    violations: list[str] = []
    if len(explanation.verdict.split()) > MAX_VERDICT_WORDS:
        violations.append(f"a manchete passou de {MAX_VERDICT_WORDS} palavras")
    expected_plies = [moment.ply for moment in contract.key_moments]
    if [moment.ply for moment in explanation.key_moments] != expected_plies:
        violations.append("os momentos-chave não batem com o contrato")
    texts = [explanation.verdict, explanation.patterns_sentence, explanation.next_game_habit]
    texts += [moment.summary for moment in explanation.key_moments]
    texts += [moment.explanation for moment in explanation.key_moments]
    texts += [strength.text for strength in explanation.strengths]
    for text in texts:
        violations.extend(verify_text(text, facts))
    return violations
