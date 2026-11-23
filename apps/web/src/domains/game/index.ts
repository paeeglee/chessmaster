// Ponto de entrada público do domínio `game` (motores 1 e 2). Outros domínios
// importam só daqui; o chess.js fica escondido atrás deste arquivo.
export {
  type BoardPiece,
  describePieces,
  formatMoveLabel,
  listPieces,
  summarizeMaterial,
} from "./model/describe";
export { toPortugueseSan } from "./model/notation";
export { MAX_PASTE_BYTES, parseGameText } from "./model/parseGameText";
export { replayGame } from "./model/replay";
export type {
  Game,
  GameFormat,
  GameResult,
  IllegalMoveError,
  Notation,
  ParsedGame,
  ParseOutcome,
  PlayerColor,
  Ply,
  ReplayOutcome,
  Termination,
} from "./model/types";
