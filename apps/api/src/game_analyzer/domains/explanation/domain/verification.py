"""Verificação automática: o texto da IA só pode citar o que está no contrato."""

import re
from dataclasses import dataclass

from game_analyzer.domains.explanation.domain.contract import GameContract, GameExplanation

MAX_VERDICT_WORDS = 30

# Letras de peça em inglês e em português: um lance com letra inglesa nunca está no
# contrato (que usa notação portuguesa), então vira violação.
_PIECE = "KQRBNDTC"
_CASTLING = r"[O0]-[O0](?:-[O0])?"
_PIECE_MOVE = rf"[{_PIECE}][a-h]?[1-8]?x?[a-h][1-8](?:=?[{_PIECE}])?"
_PAWN_CAPTURE = rf"[a-h]x[a-h][1-8](?:=?[{_PIECE}])?"
_PAWN_PUSH = rf"[a-h][1-8](?:=?[{_PIECE}])?"
_SAN = rf"(?:{_CASTLING}|{_PIECE_MOVE}|{_PAWN_CAPTURE}|{_PAWN_PUSH})[+#]?[!?]*"

_LABELED_MOVE = re.compile(rf"(?<![\w.])\d+\s?(?:\.\.\.|…|\.)\s?{_SAN}(?![\w])")
# Lance sem número, opcionalmente com reticências na frente ("...Dxh8", "…Dxh8").
_UNLABELED_MOVE = re.compile(
    rf"(?<![\w])(?:\.\.\.|…)?\s?(?:{_CASTLING}|{_PIECE_MOVE}|{_PAWN_CAPTURE})[+#]?(?!\w)"
)
_SQUARE = re.compile(r"[a-h][1-8]")
_STANDALONE_SQUARE = re.compile(r"(?<![\w])[a-h][1-8](?!\w)")
_DECIMAL = re.compile(r"[+-]?\d+[.,]\d+")
_INTEGER = re.compile(r"(?<![\w])\d+(?!\w)")
# Número do lance no rótulo do momento-chave ("22..." em "22...Ta7").
_MOVE_NUMBER = re.compile(r"^\d+\s?(?:\.\.\.|…|\.)")


def _normalize_move(move: str) -> str:
    """Tira espaços, sinais de xeque e anotações; reticências viram três pontos."""
    normalized = re.sub(r"\s", "", move).replace("…", "...")
    normalized = re.sub(r"0-0", "O-O", normalized)
    return re.sub(r"[+#!?]+$", "", normalized)


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
            # O melhor lance também pode vir com o número do lance errado ("22...Bd4+").
            number = _MOVE_NUMBER.match(moment.move_label)
            if number:
                labels.add(_normalize_move(number.group(0) + moment.best_move))
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
    squares = {square for move in moves | labels for square in _SQUARE.findall(move)}
    squares.update(piece.square for piece in pieces if piece is not None)
    return AllowedFacts(frozenset(labels), frozenset(moves), frozenset(squares), frozenset(numbers))


def verify_text(text: str, facts: AllowedFacts) -> list[str]:
    """Lista o que o texto cita sem respaldo no contrato."""
    violations: list[str] = []
    remaining = text
    for match in _LABELED_MOVE.finditer(text):
        if _normalize_move(match.group(0)) not in facts.labels:
            violations.append(f"lance {match.group(0)} não está no contrato")
        remaining = remaining.replace(match.group(0), " ", 1)
    for match in _UNLABELED_MOVE.finditer(remaining):
        move = re.sub(r"^(?:\.\.\.|…)\s?", "", match.group(0).strip())
        if _normalize_move(move) not in facts.moves:
            violations.append(f"lance {match.group(0).strip()} não está no contrato")
        remaining = remaining.replace(match.group(0), " ", 1)
    for square in _STANDALONE_SQUARE.findall(remaining):
        if square not in facts.squares:
            violations.append(f"casa {square} não está no contrato")
    remaining = _STANDALONE_SQUARE.sub(" ", remaining)
    for decimal in _DECIMAL.findall(remaining):
        violations.append(f"número decimal {decimal} não pode aparecer (avaliação inventada)")
    remaining = _DECIMAL.sub(" ", remaining)
    for number in _INTEGER.findall(remaining):
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
    expected_strengths = [strength.ply for strength in contract.strengths]
    if [strength.ply for strength in explanation.strengths] != expected_strengths:
        violations.append("os pontos fortes não batem com o contrato")
    texts = [explanation.verdict, explanation.patterns_sentence, explanation.next_game_habit]
    texts += [moment.summary for moment in explanation.key_moments]
    texts += [moment.explanation for moment in explanation.key_moments]
    texts += [strength.text for strength in explanation.strengths]
    for text in texts:
        violations.extend(verify_text(text, facts))
    return violations
