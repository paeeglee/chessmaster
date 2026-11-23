// Ponto de entrada público do domínio `explanation`: tipos gerados do contrato e o
// cliente da camada de IA (apps/api).
export {
  askQuestion,
  ExplanationError,
  type GameContract,
  type GameExplanation,
  type QuestionAnswer,
  type QuestionRequest,
  requestExplanation,
} from "./client/explanationClient";
