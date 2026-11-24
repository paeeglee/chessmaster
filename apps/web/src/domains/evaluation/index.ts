// Ponto de entrada público do domínio `evaluation` (motor 3).
export { EngineStatus } from "./components/EngineStatus";
export type { EngineClient } from "./engine/EngineClient";
export { probeEndgame } from "./engine/tablebaseClient";
export {
  type EngineLoaderStatus,
  engineLoaderMachine,
} from "./machines/engineLoaderMachine";
export { chooseEngineBuild, ENGINE_VERSION } from "./model/engineBuild";
export { MIN_DEPTH, MOVETIME_MS } from "./model/searchPlan";
export { type EndgameKind, generateTable } from "./model/tablebase/generate";
export {
  type EndgamePosition,
  endgameOf,
  type ProbeResult,
  probe,
} from "./model/tablebase/probe";
export type { EngineBuild, EngineScore, PositionEvaluation } from "./model/types";
