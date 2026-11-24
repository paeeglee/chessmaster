// Ponto de entrada público do domínio `explanation`: tipos gerados do contrato e o
// cliente da camada de IA (apps/api).
export {
  askQuestion,
  ExplanationError,
  type GameContract,
  type GameExplanation,
  type MoveContract,
  type MoveExplanation,
  type QuestionAnswer,
  type QuestionRequest,
  requestExplanation,
  requestMoveExplanation,
} from "./client/explanationClient";
