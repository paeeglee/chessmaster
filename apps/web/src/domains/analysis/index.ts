export { AnalyzingScreen } from "./components/AnalyzingScreen";
// Ponto de entrada público do domínio `analysis`.
export {
  type AnalysisContext,
  type AnalysisInput,
  type AnalysisResult,
  analysisMachine,
  positionsOf,
} from "./machines/analysisMachine";
export {
  classifyGame,
  classifyMove,
  classifyPly,
  KEY_MOMENT_THRESHOLD,
} from "./model/classify";
export { ADVANTAGE_THRESHOLD, buildContract, buildMoveContract } from "./model/contract";
export {
  type Finding,
  type FindingTag,
  findingsFrom,
  findingText,
  MISTAKE_TYPE_LABEL,
  pieceWithArticle,
} from "./model/findings";
export {
  groupPatterns,
  MAX_KEY_MOMENTS,
  MAX_STRENGTHS,
  selectKeyMoments,
  selectStrengths,
} from "./model/keyMoments";
export { materialBalance, materialTimeline, PIECE_VALUES } from "./model/material";
export type { BestMoveReasons, MoveFacts } from "./model/moveFacts";
export {
  MOVE_QUALITY_LABEL,
  type MoveQuality,
  sideToMoveOf,
  winChance,
} from "./model/moveQuality";
export { type MoveReview, reviewMoves } from "./model/moveReview";
export { type AnalysisProgress, analysisProgress } from "./model/progress";
export { type AnalysisSummary, summarizeAnalysis } from "./model/summary";
export type {
  MistakeType,
  MistakeVerdict,
  MoveVerdict,
  Pattern,
  PieceOnSquare,
  PieceType,
  StrengthVerdict,
} from "./model/types";
