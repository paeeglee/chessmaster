import { assign, fromPromise, sendParent, setup } from "xstate";
import type { AnalysisResult } from "../../analysis";
import type { EngineClient, PositionEvaluation } from "../../evaluation";
import type { PlayedMove } from "../../game";
import {
  type AttemptResult,
  checkAttempt,
  type Exercise,
  exerciseFor,
  outcomeOf,
  refutationFen,
  squareClick,
  type TrainingOutcome,
} from "../model/exercise";

/** T-04: a resposta do adversário fica no tabuleiro por 1,2 s antes de voltar. */
export const REFUTATION_MS = 1200;

export type TrainingInput = { result: AnalysisResult; ply: number; engine: EngineClient | null };
export type EvaluateInput = { engine: EngineClient | null; fen: string };

export type Feedback =
  | { kind: "wrong"; attempt: number; result: AttemptResult }
  | { kind: "correct"; result: AttemptResult }
  | { kind: "solution" }
  | { kind: "error" };

export type TrainingContext = {
  result: AnalysisResult;
  engine: EngineClient | null;
  /** Meios-lances dos momentos-chave, em ordem. */
  moments: number[];
  index: number;
  exercise: Exercise;
  /** Posição no tabuleiro agora. */
  fen: string;
  selected: string | null;
  destinations: string[];
  /** Lance em conferência ou o último jogado (para marcar no tabuleiro). */
  lastMove: { from: string; to: string } | null;
  pending: PlayedMove | null;
  attempts: number;
  hintLevel: 0 | 1 | 2;
  feedback: Feedback | null;
  outcomes: Record<number, TrainingOutcome>;
};

export type TrainingEvent =
  | { type: "SQUARE.CLICK"; square: string }
  | { type: "HINT.REQUEST" }
  | { type: "SOLUTION.SHOW" }
  | { type: "UNDO" }
  | { type: "MOMENT.NEXT" }
  | { type: "TRAINING.BACK" };

function exerciseState(result: AnalysisResult, moments: number[], index: number) {
  const exercise = exerciseFor(result, moments[index] as number);
  return {
    index,
    exercise,
    fen: exercise.ply.fenBefore,
    selected: null,
    destinations: [],
    lastMove: null,
    pending: null,
    attempts: 0,
    hintLevel: 0 as const,
    feedback: null,
  };
}

function resetBoard(context: TrainingContext) {
  return {
    fen: context.exercise.ply.fenBefore,
    selected: null,
    destinations: [],
    lastMove: null,
    pending: null,
  };
}

export const trainingMachine = setup({
  types: {
    context: {} as TrainingContext,
    input: {} as TrainingInput,
    events: {} as TrainingEvent,
  },
  actors: {
    evaluateAttempt: fromPromise<PositionEvaluation, EvaluateInput>(({ input }) => {
      if (!input.engine) throw new Error("Motor indisponível");
      return input.engine.evaluate(input.fen);
    }),
  },
  guards: {
    isMove: ({ context, event }) =>
      event.type === "SQUARE.CLICK" &&
      squareClick(context.fen, context.selected, event.square).kind === "move",
    accepted: ({ context }) => context.feedback?.kind === "correct",
    hasNextMoment: ({ context }) => context.index < context.moments.length - 1,
    hintsLeft: ({ context }) => context.hintLevel < 2,
  },
  actions: {
    backToResult: sendParent({ type: "TRAINING.BACK" }),
  },
}).createMachine({
  id: "training",
  context: ({ input }) => {
    const moments = input.result.keyMoments.map((moment) => moment.ply);
    const index = Math.max(0, moments.indexOf(input.ply));
    return {
      result: input.result,
      engine: input.engine,
      moments,
      outcomes: {},
      ...exerciseState(input.result, moments, index),
    };
  },
  on: {
    "TRAINING.BACK": { actions: "backToResult" },
  },
  initial: "playing",
  states: {
    playing: {
      on: {
        "SQUARE.CLICK": [
          {
            guard: "isMove",
            target: "checking",
            actions: assign(({ context, event }) => {
              const click = squareClick(context.fen, context.selected, event.square);
              const move = click.kind === "move" ? click.move : null;
              return {
                pending: move,
                fen: move?.fen ?? context.fen,
                lastMove: move ? { from: move.from, to: move.to } : null,
                selected: null,
                destinations: [],
              };
            }),
          },
          {
            actions: assign(({ context, event }) => {
              const click = squareClick(context.fen, context.selected, event.square);
              return click.kind === "select"
                ? { selected: click.square, destinations: click.destinations }
                : { selected: null, destinations: [] };
            }),
          },
        ],
        "HINT.REQUEST": {
          guard: "hintsLeft",
          actions: assign({ hintLevel: ({ context }) => (context.hintLevel + 1) as 1 | 2 }),
        },
        "SOLUTION.SHOW": {
          target: "solutionShown",
          actions: assign(({ context }) => ({
            ...resetBoard(context),
            feedback: { kind: "solution" as const },
            outcomes: {
              ...context.outcomes,
              [context.exercise.moment.ply]: "saw-solution" as const,
            },
          })),
        },
        UNDO: { actions: assign(({ context }) => resetBoard(context)) },
      },
    },
    checking: {
      invoke: {
        src: "evaluateAttempt",
        input: ({ context }) => ({ engine: context.engine, fen: context.fen }),
        onDone: [
          {
            actions: assign(({ context, event }) => {
              const move = context.pending as PlayedMove;
              const result = checkAttempt(context.exercise, move, event.output);
              const attempts = context.attempts + 1;
              if (result.accepted) {
                return {
                  attempts,
                  feedback: { kind: "correct" as const, result },
                  outcomes: {
                    ...context.outcomes,
                    [context.exercise.moment.ply]: outcomeOf(attempts, context.hintLevel, false),
                  },
                };
              }
              const reply = refutationFen(result, move.fen);
              const replyMove = result.replyUci
                ? { from: result.replyUci.slice(0, 2), to: result.replyUci.slice(2, 4) }
                : context.lastMove;
              return {
                attempts,
                feedback: { kind: "wrong" as const, attempt: attempts, result },
                fen: reply ?? context.fen,
                lastMove: reply ? replyMove : context.lastMove,
              };
            }),
            target: "decided",
          },
        ],
        // TR-14: o lance não pôde ser conferido; não conta como tentativa.
        onError: {
          target: "playing",
          actions: assign(({ context }) => ({
            ...resetBoard(context),
            feedback: { kind: "error" as const },
          })),
        },
      },
    },
    decided: {
      always: [{ guard: "accepted", target: "solved" }, { target: "refuting" }],
    },
    refuting: {
      after: {
        [REFUTATION_MS]: {
          target: "playing",
          actions: assign(({ context }) => resetBoard(context)),
        },
      },
      on: {
        UNDO: { target: "playing", actions: assign(({ context }) => resetBoard(context)) },
      },
    },
    solved: {
      on: {
        "MOMENT.NEXT": [
          {
            guard: "hasNextMoment",
            target: "playing",
            actions: assign(({ context }) =>
              exerciseState(context.result, context.moments, context.index + 1),
            ),
          },
          { target: "finished" },
        ],
      },
    },
    solutionShown: {
      on: {
        "MOMENT.NEXT": [
          {
            guard: "hasNextMoment",
            target: "playing",
            actions: assign(({ context }) =>
              exerciseState(context.result, context.moments, context.index + 1),
            ),
          },
          { target: "finished" },
        ],
      },
    },
    finished: {},
  },
});
