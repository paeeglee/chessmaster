export { ReviewScreen } from "./components/ReviewScreen";
// Ponto de entrada público do domínio `review` (tela Resultado).
export {
  type ReviewContext,
  type ReviewEvent,
  type ReviewParentEvent,
  reviewMachine,
} from "./machines/reviewMachine";
