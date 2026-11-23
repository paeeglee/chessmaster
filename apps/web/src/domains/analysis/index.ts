// Ponto de entrada público do domínio `analysis`.
export { classifyGame, classifyMove, KEY_MOMENT_THRESHOLD } from "./model/classify";
export { findingText, MISTAKE_TYPE_LABEL, pieceWithArticle } from "./model/findings";
export {
  groupPatterns,
  MAX_KEY_MOMENTS,
  MAX_STRENGTHS,
  selectKeyMoments,
  selectStrengths,
} from "./model/keyMoments";
export { materialBalance, materialTimeline, PIECE_VALUES } from "./model/material";
export type {
  MistakeType,
  MistakeVerdict,
  MoveVerdict,
  Pattern,
  PieceOnSquare,
  PieceType,
  StrengthVerdict,
} from "./model/types";
