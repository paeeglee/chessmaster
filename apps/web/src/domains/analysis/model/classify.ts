import type { PositionEvaluation } from "../../evaluation";
import {
  defendersOf,
  formatMoveLabel,
  type Game,
  isAttackedBy,
  type PlayerColor,
  type Ply,
  playCaptureLine,
  toPortugueseSan,
  uciToSan,
} from "../../game";
import { materialBalance } from "./material";
import type { MistakeType, MoveVerdict, PieceOnSquare, PieceType } from "./types";

/** D3: perder 2 pontos de material ou mais. */
export const KEY_MOMENT_THRESHOLD = 2;

type ClassifyInput = {
  ply: Ply;
  /** Avaliação da posição antes do lance. */
  before: PositionEvaluation;
  /** Avaliação da posição depois do lance. */
  after: PositionEvaluation;
  playerColor: PlayerColor;
};

function opposite(color: PlayerColor): PlayerColor {
  return color === "w" ? "b" : "w";
}

function uciOf(ply: Ply): string {
  return `${ply.from}${ply.to}${ply.promotion ?? ""}`;
}

function mistakeTypeOf(ply: Ply, lostPiece: PieceOnSquare | null): MistakeType {
  if (!lostPiece) {
    return "other";
  }
  const mover = ply.color;
  const defenders = defendersOf(ply.fenBefore, lostPiece.square, mover);
  // O lance tirou o único defensor da peça que depois foi perdida.
  if (defenders.length === 1 && defenders[0] === ply.from && lostPiece.square !== ply.to) {
    return "defender-moved";
  }
  // A peça já estava atacada e ficou onde estava.
  if (
    lostPiece.square !== ply.to &&
    isAttackedBy(ply.fenBefore, lostPiece.square, opposite(mover))
  ) {
    return "hanging-piece";
  }
  return "other";
}

/**
 * Classifica um lance com as regras determinísticas (general.md 7.1, D3): compara o
 * material depois da sequência de capturas calculada pelo motor para o lance jogado
 * e para o melhor lance.
 */
export function classifyMove({ ply, before, after, playerColor }: ClassifyInput): MoveVerdict {
  const mover = ply.color;
  const played = playCaptureLine(ply.fenBefore, uciOf(ply), after.pv);
  const best = playCaptureLine(ply.fenBefore, before.bestMove, before.pv.slice(1));
  const materialBefore = materialBalance(ply.fenBefore, mover);
  const playedMaterial = materialBalance(played.fen, mover);
  const bestMaterial = materialBalance(best.fen, mover);
  const moveLabel = formatMoveLabel(ply);

  const isBestMove = before.bestMove === uciOf(ply);
  const drop = materialBefore - playedMaterial;
  const loss = bestMaterial - playedMaterial;
  if (!isBestMove && drop >= KEY_MOMENT_THRESHOLD && loss >= KEY_MOMENT_THRESHOLD) {
    const captured = played.captures.find((capture) => capture.color === mover);
    const lostPiece = captured
      ? { type: captured.piece as PieceType, square: captured.square }
      : null;
    const bestSan = before.bestMove ? uciToSan(ply.fenBefore, before.bestMove) : null;
    return {
      kind: mover === playerColor ? "mistake" : "opponent-mistake",
      ply: ply.index,
      color: mover,
      moveLabel,
      loss,
      bestMoveSan: bestSan ? toPortugueseSan(bestSan) : null,
      mistakeType: mistakeTypeOf(ply, lostPiece),
      lostPiece,
    };
  }

  const gain = playedMaterial - materialBefore;
  if (mover === playerColor && gain >= KEY_MOMENT_THRESHOLD) {
    const captured = played.captures.find((capture) => capture.color !== mover);
    return {
      kind: "strength",
      ply: ply.index,
      color: mover,
      moveLabel,
      gain,
      wonPiece: captured ? { type: captured.piece as PieceType, square: captured.square } : null,
    };
  }
  return { kind: "none", ply: ply.index, color: mover };
}

/** Classifica todos os lances; `evaluations[i]` é a posição antes do meio-lance i + 1. */
export function classifyGame(
  game: Game,
  evaluations: readonly PositionEvaluation[],
  playerColor: PlayerColor,
): MoveVerdict[] {
  return game.plies.map((ply) => {
    const before = evaluations[ply.index - 1];
    const after = evaluations[ply.index];
    if (!before || !after) {
      return { kind: "none", ply: ply.index, color: ply.color };
    }
    return classifyMove({ ply, before, after, playerColor });
  });
}
