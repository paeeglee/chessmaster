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
  /**
   * A resposta que o adversário deu de fato na partida (UCI) seguida da variante do
   * motor na posição depois dela. Com várias threads, a variante do motor pode não
   * começar pela captura; se o adversário capturou na partida, a perda conta, e as
   * recapturas seguem confirmadas pelo motor.
   */
  continuation?: readonly string[];
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
  // A peça já estava atacada, ficou onde estava e o lance não a protegeu (glossário).
  const protectedByMove = defendersOf(ply.fenAfter, lostPiece.square, mover).includes(ply.to);
  if (
    lostPiece.square !== ply.to &&
    !protectedByMove &&
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
export function classifyMove({
  ply,
  before,
  after,
  playerColor,
  continuation = [],
}: ClassifyInput): MoveVerdict {
  const mover = ply.color;
  // A pior das duas linhas para quem jogou: a do motor ou a que aconteceu na partida.
  const engineLine = playCaptureLine(ply.fenBefore, uciOf(ply), after.pv);
  const gameLine = playCaptureLine(ply.fenBefore, uciOf(ply), continuation);
  const played =
    materialBalance(gameLine.fen, mover) < materialBalance(engineLine.fen, mover)
      ? gameLine
      : engineLine;
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

/**
 * Classifica o meio-lance `index` com as avaliações em volta dele. `evaluations[i]` é
 * a posição antes do meio-lance i + 1. Usado no resumo e durante a análise, para os
 * dois darem o mesmo resultado.
 */
export function classifyPly(
  game: Game,
  evaluations: readonly PositionEvaluation[],
  index: number,
  playerColor: PlayerColor,
): MoveVerdict | null {
  const ply = game.plies[index - 1];
  const before = evaluations[index - 1];
  const after = evaluations[index];
  if (!ply || !before || !after) {
    return null;
  }
  const reply = game.plies[index];
  const afterReply = evaluations[index + 1];
  const continuation = reply && afterReply ? [uciOf(reply), ...afterReply.pv] : [];
  return classifyMove({ ply, before, after, playerColor, continuation });
}

/** Classifica todos os lances da partida. */
export function classifyGame(
  game: Game,
  evaluations: readonly PositionEvaluation[],
  playerColor: PlayerColor,
): MoveVerdict[] {
  return game.plies.map(
    (ply) =>
      classifyPly(game, evaluations, ply.index, playerColor) ?? {
        kind: "none",
        ply: ply.index,
        color: ply.color,
      },
  );
}
