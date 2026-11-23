import referenceEvaluations from "../../analysis/fixtures/reference-game.evaluations.json";
import { type AnalysisResult, summarizeAnalysis } from "../../analysis";
import type { PositionEvaluation } from "../../evaluation";
import { parseGameText, replayGame } from "../../game";
import referenceGameHtml from "../../game/fixtures/reference-game.chesscom.html?raw";

/** Resultado da análise da partida de referência (pretas), com o fixture do motor. */
export function referenceResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  const parsed = parseGameText(referenceGameHtml);
  if (parsed.kind !== "parsed") throw new Error("partida inválida");
  const replayed = replayGame(parsed.game);
  if (replayed.kind !== "legal") throw new Error("lance ilegal");
  const request = {
    game: replayed.game,
    playerColor: "b" as const,
    level: "beginner" as const,
    priorities: [],
  };
  const summary = summarizeAnalysis(
    replayed.game,
    referenceEvaluations as PositionEvaluation[],
    "b",
  );
  return { ...summary, request, explanation: null, aiFailed: false, ...overrides };
}

