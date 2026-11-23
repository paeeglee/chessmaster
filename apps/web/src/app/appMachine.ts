import { assign, setup } from "xstate";
import { type AnalysisResult, analysisMachine } from "../domains/analysis";
import { type EngineClient, engineLoaderMachine } from "../domains/evaluation";
import {
  type AnalysisRequest,
  DEFAULT_PRIORITIES,
  type GameInputDraft,
  type GameInputParentEvent,
  gameInputMachine,
  initialLevel,
} from "../domains/game-input";
import { type ReviewParentEvent, reviewMachine } from "../domains/review";

export type AppContext = {
  /** O que o jogador preencheu na tela Colar; volta intacto ao cancelar a análise. */
  draft: GameInputDraft;
  request: AnalysisRequest | null;
  /** O motor pronto, guardado ao começar a análise. */
  engine: EngineClient | null;
  result: AnalysisResult | null;
  /** Meio-lance do momento-chave em treino. */
  trainingPly: number | null;
};

export type AppEvent =
  | GameInputParentEvent
  | { type: "ANALYSIS.CANCELLED" }
  | ReviewParentEvent
  | { type: "TRAINING.BACK" };

type EngineChild = { getSnapshot(): { value: unknown; context: { engine: EngineClient | null } } };

function readyEngine(engineChild: EngineChild | undefined): EngineClient | null {
  const snapshot = engineChild?.getSnapshot();
  return snapshot?.value === "ready" ? snapshot.context.engine : null;
}

// Máquina raiz do fluxo: decide a tela atual e carrega os dados entre as telas.
// O carregador do motor é invocado na raiz para começar o download assim que a
// página abre (D1) e viver a sessão inteira.
export const appMachine = setup({
  types: {
    context: {} as AppContext,
    events: {} as AppEvent,
    children: {} as {
      engine: "engineLoader";
      gameInput: "gameInput";
      analysis: "analysis";
      review: "review";
    },
  },
  actors: {
    engineLoader: engineLoaderMachine,
    gameInput: gameInputMachine,
    analysis: analysisMachine,
    review: reviewMachine,
  },
}).createMachine({
  id: "app",
  context: () => ({
    draft: { text: "", playerColor: null, level: initialLevel(), priorities: DEFAULT_PRIORITIES },
    request: null,
    engine: null,
    result: null,
    trainingPly: null,
  }),
  invoke: { id: "engine", src: "engineLoader" },
  initial: "gameInput",
  states: {
    gameInput: {
      invoke: {
        id: "gameInput",
        src: "gameInput",
        input: ({ context }) => context.draft,
      },
      on: {
        "GAME_INPUT.DRAFT_SAVED": {
          actions: assign({ draft: ({ event }) => event.draft }),
        },
        "ANALYSIS.REQUESTED": {
          target: "analyzing",
          actions: assign({
            request: ({ event }) => event.request,
            engine: ({ self }) => readyEngine(self.getSnapshot().children.engine),
          }),
        },
      },
    },
    analyzing: {
      invoke: {
        id: "analysis",
        src: "analysis",
        input: ({ context }) => ({
          request: context.request as AnalysisRequest,
          engine: context.engine as EngineClient,
        }),
        onDone: {
          target: "review",
          actions: assign({ result: ({ event }) => event.output }),
        },
      },
      on: {
        "ANALYSIS.CANCELLED": {
          target: "gameInput",
          actions: assign({ request: null }),
        },
      },
    },
    review: {
      invoke: {
        id: "review",
        src: "review",
        input: ({ context }) => context.result as AnalysisResult,
      },
      on: {
        "TRAINING.REQUESTED": {
          target: "training",
          actions: assign({ trainingPly: ({ event }) => event.ply }),
        },
        // R-13: nova análise com o campo vazio; nível e prioridades continuam.
        "REVIEW.NEW_GAME": {
          target: "gameInput",
          actions: assign({
            draft: ({ context }) => ({ ...context.draft, text: "", playerColor: null }),
            request: null,
            result: null,
          }),
        },
      },
    },
    training: {
      on: {
        "TRAINING.BACK": { target: "review", actions: assign({ trainingPly: null }) },
      },
    },
  },
});
