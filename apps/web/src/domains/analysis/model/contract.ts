import type { GameContract } from "../../explanation";
import { formatMoveLabel, toPortugueseSan } from "../../game";
import type { AnalysisRequest } from "../../game-input";
import type { AnalysisSummary } from "./summary";

/** A partir de quanto o saldo de material conta como vantagem (mesmo limiar do D3). */
export const ADVANTAGE_THRESHOLD = 2;

function outcomeFor(request: AnalysisRequest): GameContract["outcome_for_player"] {
  const { result } = request.game;
  if (result === null) return "unknown";
  if (result === "1/2-1/2") return "draw";
  const whiteWon = result === "1-0";
  return whiteWon === (request.playerColor === "w") ? "win" : "loss";
}

/**
 * Monta o contrato motor → IA (general.md 7.2): só fatos calculados pelos motores, com
 * os lances em notação portuguesa.
 */
export function buildContract(request: AnalysisRequest, summary: AnalysisSummary): GameContract {
  const { game } = request;
  const label = (ply: number) => {
    const found = game.plies[ply - 1];
    return found ? formatMoveLabel(found) : "";
  };
  const advantagePly = summary.materialTimeline.findIndex(
    (balance, index) => index > 0 && balance >= ADVANTAGE_THRESHOLD,
  );
  return {
    level: request.level,
    priorities: request.priorities,
    player_color: request.playerColor,
    result: game.result,
    termination: game.termination,
    outcome_for_player: outcomeFor(request),
    total_moves: Math.ceil(game.plies.length / 2),
    moves: game.plies.map((ply) => ({
      ply: ply.index,
      label: formatMoveLabel(ply),
      san: toPortugueseSan(ply.san),
    })),
    material_timeline: summary.materialTimeline,
    advantage_started_at:
      advantagePly > 0 ? { ply: advantagePly, label: label(advantagePly) } : null,
    key_moments: summary.keyMoments.map((moment) => ({
      ply: moment.ply,
      move_label: moment.moveLabel,
      mistake_type: moment.mistakeType,
      lost_piece: moment.lostPiece,
      best_move: moment.bestMoveSan,
      loss: moment.loss,
    })),
    opponent_mistakes: summary.opponentMistakes.map((mistake) => ({
      ply: mistake.ply,
      move_label: mistake.moveLabel,
      lost_piece: mistake.lostPiece,
      loss: mistake.loss,
    })),
    strengths: summary.strengths.map((strength) => ({
      ply: strength.ply,
      move_label: strength.moveLabel,
      won_piece: strength.wonPiece,
      gain: strength.gain,
    })),
    patterns: summary.patterns.map((pattern) => ({
      mistake_type: pattern.mistakeType,
      count: pattern.count,
      move_labels: pattern.plies.map(label),
    })),
  };
}
