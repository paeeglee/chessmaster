import { assign, fromPromise, sendParent, setup } from "xstate";
import { type AnalysisResult, buildContract } from "../../analysis";
import {
  askQuestion,
  type GameExplanation,
  type QuestionAnswer,
  requestExplanation,
} from "../../explanation";
import { positionsAlongLine } from "../../game";
import { initialPosition, positionFen } from "../model/review";

/** R-09: a linha do motor anda até 6 meios-lances, um a cada 600 ms. */
export const LINE_PLIES = 6;
export const LINE_STEP_MS = 600;

export type Question = {
  id: number;
  question: string;
  status: "pending" | "answered" | "failed";
  answer: string | null;
};

export type AskInput = { result: AnalysisResult; question: string };
export type ExplainInput = { result: AnalysisResult };

export type ReviewContext = {
  result: AnalysisResult;
  /** 0 = posição inicial; k = depois do meio-lance k. */
  position: number;
  orientation: "w" | "b";
  expandedPly: number | null;
  line: { fens: string[]; step: number } | null;
  questions: Question[];
};

export type ReviewEvent =
  | { type: "POSITION.SELECT"; position: number }
  | { type: "POSITION.FIRST" }
  | { type: "POSITION.PREVIOUS" }
  | { type: "POSITION.NEXT" }
  | { type: "POSITION.LAST" }
  | { type: "BOARD.FLIP" }
  | { type: "MOMENT.SELECT"; ply: number }
  | { type: "MOMENT.SHOW_LINE"; ply: number }
  | { type: "QUESTION.ASK"; question: string }
  | { type: "AI.RETRY" }
  | { type: "NEW_GAME.REQUEST" }
  | { type: "NEW_GAME.CANCEL" }
  | { type: "NEW_GAME.CONFIRM" }
  | { type: "TRAINING.START"; ply: number };

/** Eventos que a tela Resultado manda para a máquina raiz. */
export type ReviewParentEvent =
  | { type: "REVIEW.NEW_GAME" }
  | { type: "TRAINING.REQUESTED"; ply: number };

function lastPosition(context: ReviewContext): number {
  return context.result.request.game.plies.length;
}

function clampPosition(context: ReviewContext, position: number): number {
  return Math.min(lastPosition(context), Math.max(0, position));
}

export const reviewMachine = setup({
  types: {
    context: {} as ReviewContext,
    input: {} as AnalysisResult,
    events: {} as ReviewEvent,
  },
  actors: {
    askQuestion: fromPromise<QuestionAnswer, AskInput>(({ input }) =>
      askQuestion({
        game: buildContract(input.result.request, input.result),
        question: input.question,
      }),
    ),
    explainGame: fromPromise<GameExplanation, ExplainInput>(({ input }) =>
      requestExplanation(buildContract(input.result.request, input.result)),
    ),
  },
  actions: {
    goTo: assign((_, params: { position: number }) => ({ position: params.position, line: null })),
  },
  delays: { lineStep: LINE_STEP_MS },
}).createMachine({
  id: "review",
  context: ({ input }) => ({
    result: input,
    position: initialPosition(input),
    orientation: input.request.playerColor,
    expandedPly: input.keyMoments[0]?.ply ?? null,
    line: null,
    questions: [],
  }),
  type: "parallel",
  states: {
    board: {
      initial: "browsing",
      on: {
        "POSITION.SELECT": {
          target: ".browsing",
          actions: {
            type: "goTo",
            params: ({ context, event }) => ({ position: clampPosition(context, event.position) }),
          },
        },
        "POSITION.FIRST": {
          target: ".browsing",
          actions: { type: "goTo", params: { position: 0 } },
        },
        "POSITION.PREVIOUS": {
          target: ".browsing",
          actions: {
            type: "goTo",
            params: ({ context }) => ({ position: clampPosition(context, context.position - 1) }),
          },
        },
        "POSITION.NEXT": {
          target: ".browsing",
          actions: {
            type: "goTo",
            params: ({ context }) => ({ position: clampPosition(context, context.position + 1) }),
          },
        },
        "POSITION.LAST": {
          target: ".browsing",
          actions: { type: "goTo", params: ({ context }) => ({ position: lastPosition(context) }) },
        },
        "BOARD.FLIP": {
          actions: assign({
            orientation: ({ context }) => (context.orientation === "w" ? "b" : "w"),
          }),
        },
        // R-03: escolher um momento (lista, gráfico ou lances) leva o tabuleiro à posição
        // anterior ao erro e expande o item.
        "MOMENT.SELECT": {
          target: ".browsing",
          actions: assign(({ event }) => ({
            position: event.ply - 1,
            expandedPly: event.ply,
            line: null,
          })),
        },
      },
      states: {
        browsing: {
          on: {
            "MOMENT.SHOW_LINE": {
              target: "playingLine",
              actions: assign(({ context, event }) => {
                // A linha começa na posição depois do lance errado, com a resposta do motor.
                const after = event.ply;
                const fen = positionFen(context.result.request.game, after);
                const pv = context.result.evaluations[after]?.pv ?? [];
                return {
                  position: after,
                  expandedPly: event.ply,
                  line: { fens: positionsAlongLine(fen, pv, LINE_PLIES), step: 0 },
                };
              }),
            },
          },
        },
        playingLine: {
          after: {
            lineStep: [
              {
                guard: ({ context }) =>
                  context.line !== null && context.line.step < context.line.fens.length,
                target: "playingLine",
                reenter: true,
                actions: assign({
                  line: ({ context }) =>
                    context.line ? { ...context.line, step: context.line.step + 1 } : null,
                }),
              },
              { target: "browsing" },
            ],
          },
        },
      },
    },
    questions: {
      initial: "idle",
      states: {
        idle: {
          on: {
            "QUESTION.ASK": {
              guard: ({ event }) => event.question.trim().length > 0,
              target: "asking",
              actions: assign({
                questions: ({ context, event }) => [
                  ...context.questions,
                  {
                    id: context.questions.length + 1,
                    question: event.question.trim().slice(0, 500),
                    status: "pending",
                    answer: null,
                  },
                ],
              }),
            },
          },
        },
        asking: {
          invoke: {
            src: "askQuestion",
            input: ({ context }) => ({
              result: context.result,
              question: context.questions.at(-1)?.question ?? "",
            }),
            onDone: {
              target: "idle",
              actions: assign({
                questions: ({ context, event }) =>
                  context.questions.map((question, index) =>
                    index === context.questions.length - 1
                      ? { ...question, status: "answered" as const, answer: event.output.answer }
                      : question,
                  ),
              }),
            },
            onError: {
              target: "idle",
              actions: assign({
                questions: ({ context }) =>
                  context.questions.map((question, index) =>
                    index === context.questions.length - 1
                      ? { ...question, status: "failed" as const }
                      : question,
                  ),
              }),
            },
          },
        },
      },
    },
    explanation: {
      initial: "idle",
      states: {
        idle: {
          on: {
            "AI.RETRY": { guard: ({ context }) => context.result.aiFailed, target: "retrying" },
          },
        },
        retrying: {
          invoke: {
            src: "explainGame",
            input: ({ context }) => ({ result: context.result }),
            onDone: {
              target: "idle",
              actions: assign({
                result: ({ context, event }) => ({
                  ...context.result,
                  explanation: event.output,
                  aiFailed: false,
                }),
              }),
            },
            onError: { target: "idle" },
          },
        },
      },
    },
    newGame: {
      initial: "closed",
      states: {
        closed: { on: { "NEW_GAME.REQUEST": { target: "confirming" } } },
        confirming: {
          on: {
            "NEW_GAME.CANCEL": { target: "closed" },
            "NEW_GAME.CONFIRM": {
              target: "closed",
              actions: sendParent({ type: "REVIEW.NEW_GAME" } satisfies ReviewParentEvent),
            },
          },
        },
      },
    },
  },
  on: {
    "TRAINING.START": {
      actions: sendParent(
        ({ event }): ReviewParentEvent => ({ type: "TRAINING.REQUESTED", ply: event.ply }),
      ),
    },
  },
});
