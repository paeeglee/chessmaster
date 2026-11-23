// Ponto de entrada público do domínio `evaluation` (motor 3).
export { EngineStatus } from "./components/EngineStatus";
export type { EngineClient } from "./engine/EngineClient";
export {
  type EngineLoaderStatus,
  engineLoaderMachine,
} from "./machines/engineLoaderMachine";
export { chooseEngineBuild, ENGINE_VERSION } from "./model/engineBuild";
export { MIN_DEPTH, MOVETIME_MS } from "./model/searchPlan";
export type { EngineBuild, EngineScore, PositionEvaluation } from "./model/types";
