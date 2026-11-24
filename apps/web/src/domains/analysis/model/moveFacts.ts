import type { PositionEvaluation } from "../../evaluation";
import {
  enPrisePieces,
  type PlayerColor,
  type Ply,
  playCaptureLine,
  portugueseLine,
  toPortugueseSan,
  uciToSan,
} from "../../game";
import { materialBalance } from "./material";
import type { PieceOnSquare, PieceType } from "./types";

/** Até quantos meios-lances da linha do motor mostrar (MR-05). */
export const BEST_LINE_PLIES = 6;

export type BestMoveReasons = {
  /** O melhor lance dá xeque. */
  check: boolean;
  /** Mate em N lances de quem joga, com o melhor lance; null se não há mate. */
  mateIn: number | null;
  /** Pontos de material que a linha do melhor lance ganha (0 se nenhum). */
  wins: number;
  /** Peças en prise antes do lance que o melhor lance deixa seguras. */
  saves: PieceOnSquare[];
};

export type MoveFacts = {
  isBest: boolean;
  /** Melhor lance com número ("22...Bd4+"); null quando não há lance legal. */
  bestMoveLabel: string | null;
  /** Linha do motor a partir do melhor lance, em SAN português (≤ 6). */
  bestLine: string[];
  /** MR-06: peças de quem jogou que o lance deixou descobertas (novas en prise). */
  undefended: PieceOnSquare[];
  /** MR-07: peças que já estavam en prise antes do lance e continuam. */
  stillEnPrise: PieceOnSquare[];
  /** MR-07: pontos de material que a linha do melhor lance ganharia a mais. */
  missedMaterial: number;
  /** MR-08: por que o melhor lance é melhor. */
  bestReasons: BestMoveReasons | null;
};

function uciOf(ply: Ply): string {
  return `${ply.from}${ply.to}${ply.promotion ?? ""}`;
}

function toPieces(pieces: { square: string; piece: string }[]): PieceOnSquare[] {
  return pieces.map((item) => ({ type: item.piece as PieceType, square: item.square }));
}

function sameSquare(a: PieceOnSquare, b: PieceOnSquare): boolean {
  return a.square === b.square;
}

/** "22...Bd4+": lance em SAN inglês com o número do meio-lance, em português. */
function labelFor(ply: Ply, sanEn: string): string {
  return `${ply.moveNumber}${ply.color === "w" ? "." : "..."}${toPortugueseSan(sanEn)}`;
}

/**
 * MR-05..MR-08, MR-19: fatos de um lance, calculados pelo motor de regras e pela
 * variante do Stockfish. `before` é a avaliação da posição antes do lance; `after`,
 * a da posição depois dele.
 */
export function moveFacts(
  ply: Ply,
  before: PositionEvaluation,
  after: PositionEvaluation,
): MoveFacts {
  const mover: PlayerColor = ply.color;
  const played = uciOf(ply);
  const best = before.bestMove;
  const isBest = best === played;

  const enPriseBefore = toPieces(enPrisePieces(ply.fenBefore, mover));
  const enPriseAfter = toPieces(enPrisePieces(ply.fenAfter, mover));
  // A peça que se moveu não "continua" en prise: ela está numa casa nova.
  const stillEnPrise = enPriseBefore.filter(
    (piece) => piece.square !== ply.from && enPriseAfter.some((after) => sameSquare(after, piece)),
  );
  const undefended = enPriseAfter.filter(
    (piece) => !stillEnPrise.some((still) => sameSquare(still, piece)),
  );

  if (!best) {
    return {
      isBest,
      bestMoveLabel: null,
      bestLine: [],
      undefended,
      stillEnPrise,
      missedMaterial: 0,
      bestReasons: null,
    };
  }

  const bestSan = uciToSan(ply.fenBefore, best);
  const bestLine = portugueseLine(
    ply.fenBefore,
    before.pv.length > 0 ? before.pv : [best],
    BEST_LINE_PLIES,
  );
  const bestCaptures = playCaptureLine(ply.fenBefore, best, before.pv.slice(1));
  const playedCaptures = playCaptureLine(ply.fenBefore, played, after.pv);
  const materialBefore = materialBalance(ply.fenBefore, mover);
  const bestMaterial = materialBalance(bestCaptures.fen, mover);
  const missedMaterial = isBest
    ? 0
    : Math.max(0, bestMaterial - materialBalance(playedCaptures.fen, mover));

  // Posição logo depois do melhor lance, para ver quais peças ficam seguras.
  const afterBest = playCaptureLine(ply.fenBefore, best, [], 0).fen;
  const enPriseAfterBest = toPieces(enPrisePieces(afterBest, mover));
  // Uma peça en prise que o melhor lance move sai da casa e conta como salva.
  const saves = enPriseBefore.filter(
    (piece) => !enPriseAfterBest.some((still) => sameSquare(still, piece)),
  );
  const mateIn =
    before.score.kind === "mate" && before.score.value > 0 === (mover === "w")
      ? Math.abs(before.score.value)
      : null;

  return {
    isBest,
    bestMoveLabel: bestSan ? labelFor(ply, bestSan) : null,
    bestLine,
    undefended,
    stillEnPrise,
    missedMaterial,
    bestReasons: {
      check: bestSan ? /[+#]$/.test(bestSan) : false,
      mateIn,
      wins: Math.max(0, bestMaterial - materialBefore),
      saves,
    },
  };
}
