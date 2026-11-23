import { assign, fromPromise, sendParent, setup } from "xstate";
import type { PlayerColor } from "../../game";
import { analyzeAvailability, type EngineState } from "../model/analyzeAvailability";
import { browserStorage } from "../model/browserStorage";
import { inspectGame } from "../model/inspectGame";
import { saveLevel } from "../model/levelStorage";
import type { AnalysisRequest, GameInputDraft, Level, Priority } from "../model/types";

export type GameInputEvent =
  | { type: "TEXT.CHANGED"; text: string }
  | { type: "CLEAR" }
  | { type: "PASTE" }
  | { type: "COLOR.SELECTED"; color: PlayerColor }
  | { type: "LEVEL.SELECTED"; level: Level }
  | { type: "PRIORITY.TOGGLED"; priority: Priority }
  | { type: "ANALYZE"; engine: EngineState };

/** Eventos que a tela Colar envia para a máquina raiz. */
export type GameInputParentEvent =
  | { type: "GAME_INPUT.DRAFT_SAVED"; draft: GameInputDraft }
  | { type: "ANALYSIS.REQUESTED"; request: AnalysisRequest };

export type GameInputContext = GameInputDraft & { clipboardDenied: boolean };

function draftOf(context: GameInputContext): GameInputDraft {
  const { text, playerColor, level, priorities } = context;
  return { text, playerColor, level, priorities };
}

function requestOf(context: GameInputContext): AnalysisRequest | null {
  const inspection = inspectGame(context.text);
  if (inspection.kind !== "valid" || context.playerColor === null) {
    return null;
  }
  return {
    game: inspection.game,
    playerColor: context.playerColor,
    level: context.level,
    priorities: context.priorities,
  };
}

export const gameInputMachine = setup({
  types: {
    context: {} as GameInputContext,
    input: {} as GameInputDraft,
    events: {} as GameInputEvent,
  },
  actors: {
    readClipboard: fromPromise(async () => navigator.clipboard.readText()),
  },
  actions: {
    persistLevel: (_, params: { level: Level }) => saveLevel(browserStorage(), params.level),
    saveDraft: sendParent(
      ({ context }): GameInputParentEvent => ({
        type: "GAME_INPUT.DRAFT_SAVED",
        draft: draftOf(context),
      }),
    ),
    requestAnalysis: sendParent(({ context }): GameInputParentEvent => {
      const request = requestOf(context);
      // O guard `canAnalyze` garante que a requisição existe aqui.
      return { type: "ANALYSIS.REQUESTED", request: request as AnalysisRequest };
    }),
  },
  guards: {
    canAnalyze: ({ context, event }) =>
      event.type === "ANALYZE" &&
      analyzeAvailability(inspectGame(context.text), context.playerColor, event.engine).enabled,
  },
}).createMachine({
  id: "gameInput",
  context: ({ input }) => ({ ...input, clipboardDenied: false }),
  initial: "editing",
  states: {
    editing: {
      on: {
        "TEXT.CHANGED": {
          actions: [
            assign({ text: ({ event }) => event.text, clipboardDenied: false }),
            "saveDraft",
          ],
        },
        CLEAR: {
          actions: [assign({ text: "", clipboardDenied: false }), "saveDraft"],
        },
        PASTE: { target: "pasting" },
        "COLOR.SELECTED": {
          actions: [assign({ playerColor: ({ event }) => event.color }), "saveDraft"],
        },
        "LEVEL.SELECTED": {
          actions: [
            assign({ level: ({ event }) => event.level }),
            { type: "persistLevel", params: ({ event }) => ({ level: event.level }) },
            "saveDraft",
          ],
        },
        "PRIORITY.TOGGLED": {
          actions: [
            assign({
              priorities: ({ context, event }) =>
                context.priorities.includes(event.priority)
                  ? context.priorities.filter((priority) => priority !== event.priority)
                  : [...context.priorities, event.priority],
            }),
            "saveDraft",
          ],
        },
        ANALYZE: { guard: "canAnalyze", actions: "requestAnalysis" },
      },
    },
    pasting: {
      invoke: {
        src: "readClipboard",
        onDone: {
          target: "editing",
          actions: [
            assign({ text: ({ event }) => event.output, clipboardDenied: false }),
            "saveDraft",
          ],
        },
        onError: {
          target: "editing",
          actions: assign({ clipboardDenied: true }),
        },
      },
    },
  },
});
