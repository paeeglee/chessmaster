"""Contrato motor → IA (general.md 7.2) e o JSON Schema fixo da resposta."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Level = Literal["beginner", "intermediate", "advanced"]
Priority = Literal["lost-pieces", "endgames", "opening", "plan"]
PlayerColor = Literal["w", "b"]
MistakeType = Literal["hanging-piece", "defender-moved", "other"]
PieceType = Literal["p", "n", "b", "r", "q", "k"]
Square = str


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class PieceOnSquare(ContractModel):
    type: PieceType
    square: Square = Field(pattern=r"^[a-h][1-8]$")


class MoveFact(ContractModel):
    ply: int = Field(ge=1)
    label: str = Field(description='Lance com número, em notação portuguesa: "22...Ta7"')
    san: str = Field(description='Lance em notação portuguesa sem número: "Ta7"')


class MoveRef(ContractModel):
    ply: int = Field(ge=1)
    label: str


class KeyMomentFact(ContractModel):
    ply: int = Field(ge=1)
    move_label: str
    mistake_type: MistakeType
    lost_piece: PieceOnSquare | None
    best_move: str | None = Field(description="Melhor lance do motor em notação portuguesa")
    loss: int = Field(ge=2, description="Pontos de material perdidos em relação ao melhor lance")


class OpponentMistakeFact(ContractModel):
    ply: int = Field(ge=1)
    move_label: str
    lost_piece: PieceOnSquare | None
    loss: int = Field(ge=2)


class StrengthFact(ContractModel):
    ply: int = Field(ge=1)
    move_label: str
    won_piece: PieceOnSquare | None
    gain: int = Field(ge=2)


class PatternFact(ContractModel):
    mistake_type: MistakeType
    count: int = Field(ge=1)
    move_labels: list[str]


class GameContract(ContractModel):
    """Tudo o que a IA pode afirmar sobre a partida."""

    level: Level
    priorities: list[Priority]
    player_color: PlayerColor
    result: Literal["1-0", "0-1", "1/2-1/2"] | None
    termination: Literal["checkmate", "stalemate"] | None
    outcome_for_player: Literal["win", "loss", "draw", "unknown"]
    total_moves: int = Field(ge=0)
    moves: list[MoveFact]
    material_timeline: list[int]
    advantage_started_at: MoveRef | None
    key_moments: list[KeyMomentFact] = Field(max_length=5)
    opponent_mistakes: list[OpponentMistakeFact]
    strengths: list[StrengthFact] = Field(max_length=3)
    patterns: list[PatternFact]


class KeyMomentText(ContractModel):
    ply: int
    summary: str = Field(description="Uma frase curta para a lista")
    explanation: str = Field(description="Até 3 frases, com casas e lances concretos")


class StrengthText(ContractModel):
    ply: int
    text: str


class GameExplanation(ContractModel):
    """Resposta da IA para a tela Resultado, sempre neste formato."""

    verdict: str = Field(description="Manchete de no máximo 30 palavras")
    patterns_sentence: str = Field(description="Cita no máximo 2 padrões")
    key_moments: list[KeyMomentText]
    strengths: list[StrengthText]
    next_game_habit: str = Field(description="Uma frase acionável ligada aos padrões")


class QuestionRequest(ContractModel):
    game: GameContract
    question: str = Field(min_length=1, max_length=500)


class QuestionAnswer(ContractModel):
    answer: str
    in_scope: bool


MoveQuality = Literal["best", "excellent", "good", "inaccuracy", "mistake", "blunder", "miss"]


class BestMoveReasonsFact(ContractModel):
    check: bool = Field(description="O melhor lance dá xeque")
    mate_in: int | None = Field(ge=1, description="Mate em N lances com o melhor lance")
    wins: int = Field(ge=0, description="Pontos de material que a linha do melhor lance ganha")
    saves: list[PieceOnSquare] = Field(description="Peças en prise que o melhor lance salva")


class MoveContract(ContractModel):
    """Tudo o que a IA pode afirmar sobre UM lance (revisão lance a lance, F9)."""

    level: Level
    player_color: PlayerColor
    mover: Literal["player", "opponent"]
    move_label: str = Field(description='Lance com número, em notação portuguesa: "22...Ta7"')
    move_san: str = Field(description='O mesmo lance sem número: "Ta7"')
    quality: MoveQuality
    best_move_label: str | None = Field(description='Melhor lance do motor com número: "22...Bd4+"')
    best_line: list[str] = Field(
        max_length=6, description="Linha do motor a partir do melhor lance"
    )
    undefended: list[PieceOnSquare] = Field(description="Peças que o lance deixou descobertas")
    still_en_prise: list[PieceOnSquare] = Field(
        description="Peças que já estavam atacadas sem defesa e continuaram"
    )
    missed_material: int = Field(ge=0, description="Material que o melhor lance ganharia a mais")
    best_reasons: BestMoveReasonsFact | None


class MoveExplanation(ContractModel):
    """Resposta da IA para o painel do treinador, sempre neste formato."""

    text: str = Field(description="De 2 a 4 frases sobre o lance")
