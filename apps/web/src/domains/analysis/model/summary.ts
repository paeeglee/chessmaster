import type { PositionEvaluation } from "../../evaluation";
import type { Game, PlayerColor } from "../../game";
import { classifyGame } from "./classify";
import { groupPatterns, selectKeyMoments, selectStrengths } from "./keyMoments";
import { materialTimeline } from "./material";
import type { MistakeVerdict, MoveVerdict, Pattern, StrengthVerdict } from "./types";

/** Tudo o que os motores concluíram sobre a partida (sem os textos da IA). */
export type AnalysisSummary = {
  evaluations: PositionEvaluation[];
  verdicts: MoveVerdict[];
  keyMoments: MistakeVerdict[];
  opponentMistakes: MistakeVerdict[];
  strengths: StrengthVerdict[];
  patterns: Pattern[];
  materialTimeline: number[];
};

export function summarizeAnalysis(
  game: Game,
  evaluations: PositionEvaluation[],
  playerColor: PlayerColor,
): AnalysisSummary {
  const verdicts = classifyGame(game, evaluations, playerColor);
  const keyMoments = selectKeyMoments(verdicts);
  return {
    evaluations,
    verdicts,
    keyMoments,
    opponentMistakes: verdicts.filter(
      (verdict): verdict is MistakeVerdict => verdict.kind === "opponent-mistake",
    ),
    strengths: selectStrengths(verdicts),
    patterns: groupPatterns(keyMoments),
    materialTimeline: materialTimeline(game, playerColor),
  };
}
