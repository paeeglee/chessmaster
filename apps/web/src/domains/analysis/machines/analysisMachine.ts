import { assign, fromCallback, fromPromise, setup } from "xstate";
import {
  type EngineClient,
  type PositionEvaluation,
  type ProbeResult,
  probeEndgame,
} from "../../evaluation";
import { type GameExplanation, requestExplanation } from "../../explanation";
import type { AnalysisRequest } from "../../game-input";
import { classifyPly } from "../model/classify";
import { buildContract } from "../model/contract";
import { type EndgameSummary, findEndgameStart, summarizeEndgame } from "../model/endgame";
import { type Finding, findingsFrom } from "../model/findings";
import { type AnalysisSummary, summarizeAnalysis } from "../model/summary";

/** O que a análise entrega para a tela Resultado. */
export type AnalysisResult = AnalysisSummary & {
  request: AnalysisRequest;
  explanation: GameExplanation | null;
  aiFailed: boolean;
  /** Motor 4: o final com tabela que a partida alcançou (null se não houve ou falhou). */
  endgame: EndgameSummary | null;
  endgameStatus: EndgameStatus;
};

/** Etapa 4: ainda não chegou, rodando, concluída, não necessária ou com falha. */
export type EndgameStatus = "waiting" | "running" | "done" | "skipped" | "failed";

export type AnalysisInput = { request: AnalysisRequest; engine: EngineClient };

type AnalysisEvent =
  | { type: "POSITION.EVALUATED"; evaluation: PositionEvaluation }
  | { type: "EVALUATION.DONE" }
  | { type: "EVALUATION.FAILED" }
  | { type: "RETRY" };

export type AnalysisContext = AnalysisInput & {
  evaluations: PositionEvaluation[];
  findings: Finding[];
  startedAt: number;
  elapsedMs: number;
  summary: AnalysisSummary | null;
  explanation: GameExplanation | null;
  aiFailed: boolean;
  endgame: EndgameSummary | null;
  endgameStatus: EndgameStatus;
};

export type ProbeInput = { fen: string };

/** Todas as posições da partida: a inicial e a posição depois de cada meio-lance. */
export function positionsOf(request: AnalysisRequest): string[] {
  return [request.game.initialFen, ...request.game.plies.map((ply) => ply.fenAfter)];
}

export const analysisMachine = setup({
  types: {
    context: {} as AnalysisContext,
    input: {} as AnalysisInput,
    events: {} as AnalysisEvent,
    output: {} as AnalysisResult,
  },
  actions: {
    summarize: assign(({ context }) => {
      const last = classifyPly(
        context.request.game,
        context.evaluations,
        context.request.game.plies.length,
        context.request.playerColor,
      );
      return {
        findings: last ? [...context.findings, ...findingsFrom([last])] : context.findings,
        summary: summarizeAnalysis(
          context.request.game,
          context.evaluations,
          context.request.playerColor,
        ),
      };
    }),
  },
  actors: {
    probeEndgame: fromPromise<ProbeResult | null, ProbeInput>(({ input }) =>
      probeEndgame(input.fen),
    ),
    evaluatePositions: fromCallback<AnalysisEvent, AnalysisInput>(({ sendBack, input }) => {
      let cancelled = false;
      void (async () => {
        try {
          for (const fen of positionsOf(input.request)) {
            if (cancelled) return;
            const evaluation = await input.engine.evaluate(fen);
            if (cancelled) return;
            sendBack({ type: "POSITION.EVALUATED", evaluation });
          }
          sendBack({ type: "EVALUATION.DONE" });
        } catch {
          if (!cancelled) sendBack({ type: "EVALUATION.FAILED" });
        }
      })();
      // Cancelar a análise (ou sair do estado) para a busca em andamento no motor.
      return () => {
        cancelled = true;
        input.engine.cancel();
      };
    }),
    explainGame: fromPromise<
      GameExplanation,
      { request: AnalysisRequest; summary: AnalysisSummary }
    >(({ input }) => requestExplanation(buildContract(input.request, input.summary))),
  },
}).createMachine({
  id: "analysis",
  context: ({ input }) => ({
    ...input,
    evaluations: [],
    findings: [],
    startedAt: Date.now(),
    elapsedMs: 0,
    summary: null,
    explanation: null,
    aiFailed: false,
    endgame: null,
    endgameStatus: "waiting",
  }),
  initial: "evaluating",
  states: {
    evaluating: {
      entry: assign({ evaluations: [], findings: [], startedAt: () => Date.now(), elapsedMs: 0 }),
      invoke: {
        src: "evaluatePositions",
        input: ({ context }) => ({ request: context.request, engine: context.engine }),
      },
      on: {
        "POSITION.EVALUATED": {
          actions: assign(({ context, event }) => {
            const evaluations = [...context.evaluations, event.evaluation];
            // O meio-lance k é classificado quando a posição depois da resposta do
            // adversário (k + 1) já foi avaliada; o último sai no fim da avaliação.
            const verdict = classifyPly(
              context.request.game,
              evaluations,
              evaluations.length - 2,
              context.request.playerColor,
            );
            const findings = verdict
              ? [...context.findings, ...findingsFrom([verdict])]
              : context.findings;
            return { evaluations, findings, elapsedMs: Date.now() - context.startedAt };
          }),
        },
        "EVALUATION.DONE": [
          {
            // TB-04: sem final com tabela, a etapa 4 não é necessária.
            guard: ({ context }) => findEndgameStart(context.request.game) !== null,
            target: "endgame",
            actions: "summarize",
          },
          {
            target: "explaining",
            actions: ["summarize", assign({ endgameStatus: "skipped" })],
          },
        ],
        "EVALUATION.FAILED": { target: "evaluationFailed" },
      },
    },
    evaluationFailed: {
      on: { RETRY: { target: "evaluating" } },
    },
    endgame: {
      entry: assign({ endgameStatus: "running" }),
      invoke: {
        src: "probeEndgame",
        input: ({ context }) => ({ fen: findEndgameStart(context.request.game)?.fen ?? "" }),
        onDone: {
          target: "explaining",
          actions: assign(({ context, event }) => {
            const start = findEndgameStart(context.request.game);
            return {
              endgameStatus: "done" as const,
              endgame:
                start && event.output
                  ? summarizeEndgame(
                      context.request.game,
                      start,
                      event.output,
                      context.request.playerColor,
                    )
                  : null,
            };
          }),
        },
        // TB-06: a análise segue sem a tabela.
        onError: { target: "explaining", actions: assign({ endgameStatus: "failed" }) },
      },
    },
    explaining: {
      invoke: {
        src: "explainGame",
        input: ({ context }) => ({
          request: context.request,
          summary: context.summary as AnalysisSummary,
        }),
        onDone: {
          target: "done",
          actions: assign({ explanation: ({ event }) => event.output }),
        },
        onError: {
          target: "done",
          actions: assign({ aiFailed: true }),
        },
      },
    },
    done: { type: "final" },
  },
  output: ({ context }) => ({
    ...(context.summary as AnalysisSummary),
    request: context.request,
    explanation: context.explanation,
    aiFailed: context.aiFailed,
    endgame: context.endgame,
    endgameStatus: context.endgameStatus,
  }),
});
