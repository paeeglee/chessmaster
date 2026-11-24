import type { PositionEvaluation } from "../../evaluation";
import { formatMoveLabel, type Game, type Ply } from "../../game";
import { type MoveFacts, moveFacts } from "./moveFacts";
import {
  classifyQuality,
  type MoveQuality,
  sideToMoveOf,
  winChance,
  winChanceLoss,
} from "./moveQuality";
import type { MoveVerdict } from "./types";

/** Piso de material (D3): perder 5 pontos ou mais é Capivarada. */
export const BLUNDER_MATERIAL = 5;

const SEVERITY: Record<MoveQuality, number> = {
  best: 0,
  excellent: 1,
  good: 2,
  inaccuracy: 3,
  mistake: 4,
  blunder: 5,
  miss: 4,
};

/**
 * MR-20: com vantagem grande, perder uma peça quase não muda a chance de vitória, e a
 * escala sozinha chamaria o lance de "Excelente". Um lance que perde 2 pontos de
 * material ou mais pela regra do momento-chave (D3) é no mínimo Erro, e 5 ou mais é
 * Capivarada. "Perdeu a chance" é mantido.
 */
export function applyMaterialFloor(
  quality: MoveQuality,
  verdict: MoveVerdict | undefined,
): MoveQuality {
  if (!verdict || (verdict.kind !== "mistake" && verdict.kind !== "opponent-mistake")) {
    return quality;
  }
  if (quality === "miss") return quality;
  const floor: MoveQuality = verdict.loss >= BLUNDER_MATERIAL ? "blunder" : "mistake";
  return SEVERITY[quality] >= SEVERITY[floor] ? quality : floor;
}

/** Revisão de um meio-lance (F9): classificação, chances de vitória e fatos. */
export type MoveReview = {
  ply: number;
  color: Ply["color"];
  /** "22...Ta7" (SAN português com número). */
  moveLabel: string;
  quality: MoveQuality;
  /** Chance de vitória de quem jogou antes e depois do lance (0 a 100). */
  winBefore: number;
  winAfter: number;
  loss: number;
  facts: MoveFacts;
};

/** MR-18: depois do lance final, o resultado da partida vale mais que a avaliação. */
function winAfterMove(game: Game, ply: Ply, after: PositionEvaluation): number {
  const isLast = ply.index === game.plies.length;
  if (isLast && game.termination === "checkmate") return 100;
  if (isLast && game.termination === "stalemate") return 50;
  return winChance(after.score, ply.color, sideToMoveOf(after.fen));
}

/** MR-01..MR-08: revisa todos os meio-lances que têm as duas avaliações em volta. */
export function reviewMoves(
  game: Game,
  evaluations: readonly PositionEvaluation[],
  verdicts: readonly MoveVerdict[] = [],
): MoveReview[] {
  const byPly = new Map(verdicts.map((verdict) => [verdict.ply, verdict]));
  const reviews: MoveReview[] = [];
  let previousLoss: number | null = null;
  for (const ply of game.plies) {
    const before = evaluations[ply.index - 1];
    const after = evaluations[ply.index];
    if (!before || !after) break;
    const facts = moveFacts(ply, before, after);
    const winBefore = winChance(before.score, ply.color, sideToMoveOf(before.fen));
    const winAfter = winAfterMove(game, ply, after);
    const loss = winChanceLoss(winBefore, winAfter);
    reviews.push({
      ply: ply.index,
      color: ply.color,
      moveLabel: formatMoveLabel(ply),
      quality: applyMaterialFloor(
        classifyQuality({ loss, isBest: facts.isBest, previousLoss }),
        byPly.get(ply.index),
      ),
      winBefore,
      winAfter,
      loss,
      facts,
    });
    previousLoss = loss;
  }
  return reviews;
}
