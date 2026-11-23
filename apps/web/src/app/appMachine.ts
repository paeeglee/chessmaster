import { assign, setup } from "xstate";
import { engineLoaderMachine } from "../domains/evaluation";
import {
  type AnalysisRequest,
  DEFAULT_PRIORITIES,
  type GameInputDraft,
  type GameInputParentEvent,
  gameInputMachine,
  initialLevel,
} from "../domains/game-input";

export type AppContext = {
  /** O que o jogador preencheu na tela Colar; volta intacto ao cancelar a análise. */
  draft: GameInputDraft;
  request: AnalysisRequest | null;
};

export type AppEvent = GameInputParentEvent | { type: "ANALYSIS.CANCELLED" };

// Máquina raiz do fluxo: decide a tela atual e carrega os dados entre as telas.
// O carregador do motor é invocado na raiz para começar o download assim que a
// página abre (D1) e viver a sessão inteira.
export const appMachine = setup({
  types: {
    context: {} as AppContext,
    events: {} as AppEvent,
    children: {} as { engine: "engineLoader"; gameInput: "gameInput" },
  },
  actors: { engineLoader: engineLoaderMachine, gameInput: gameInputMachine },
}).createMachine({
  id: "app",
  context: () => ({
    draft: { text: "", playerColor: null, level: initialLevel(), priorities: DEFAULT_PRIORITIES },
    request: null,
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
          actions: assign({ request: ({ event }) => event.request }),
        },
      },
    },
    analyzing: {
      on: {
        "ANALYSIS.CANCELLED": {
          target: "gameInput",
          actions: assign({ request: null }),
        },
      },
    },
  },
});
