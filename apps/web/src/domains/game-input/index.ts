// Ponto de entrada público do domínio `game-input` (tela Colar a partida).
export {
  type GameInputEvent,
  type GameInputParentEvent,
  gameInputMachine,
} from "./machines/gameInputMachine";
export { initialLevel } from "./model/initialLevel";
export {
  type AnalysisRequest,
  DEFAULT_PRIORITIES,
  type GameInputDraft,
  type Level,
  type Priority,
} from "./model/types";
