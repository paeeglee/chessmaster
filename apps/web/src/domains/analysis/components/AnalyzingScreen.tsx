import { useSelector } from "@xstate/react";
import type { ActorRefFrom } from "xstate";
import { Board } from "../../../shared/ui/Board";
import { StepIndicator } from "../../../shared/ui/StepIndicator";
import { describePieces, formatMoveLabel } from "../../game";
import type { analysisMachine } from "../machines/analysisMachine";
import { analysisProgress } from "../model/progress";
import { AnalysisStages, type Stage } from "./AnalysisStages";
import { FindingsSoFar } from "./FindingsSoFar";

type AnalyzingScreenProps = {
  analysisRef: ActorRefFrom<typeof analysisMachine>;
  onCancel: () => void;
};

/** Tela 2, "Analisando" (step_02). */
export function AnalyzingScreen({ analysisRef, onCancel }: AnalyzingScreenProps) {
  const snapshot = useSelector(analysisRef, (state) => state);
  const { request, evaluations, findings, elapsedMs } = snapshot.context;
  const { game, playerColor } = request;
  const totalPositions = game.plies.length + 1;
  const progress = analysisProgress(evaluations.length, totalPositions, elapsedMs);
  const phase = snapshot.value;

  // Posição em avaliação no tabuleiro: a última já avaliada (ou a inicial).
  const lastPly = evaluations.length > 1 ? game.plies[evaluations.length - 2] : undefined;
  const boardFen = lastPly?.fenAfter ?? game.initialFen;
  const marks = lastPly ? { [lastPly.from]: "last" as const, [lastPly.to]: "last" as const } : {};

  const evaluating = phase === "evaluating";
  const stages: Stage[] = [
    {
      title: "Leitura dos lances",
      description: `Extrai os ${game.plies.length} lances do texto colado`,
      status: "done",
    },
    {
      title: "Motor de regras",
      description: "Reconstrói e valida cada posição (xeques, roques, mate final)",
      status: "done",
    },
    {
      title: "Motor de avaliação",
      description: "Calcula a vantagem e o melhor lance em cada posição",
      status: phase === "evaluationFailed" ? "failed" : evaluating ? "running" : "done",
      ...(evaluating
        ? {
            detail: `lance ${progress.currentMove} de ${progress.totalMoves}${
              progress.remainingSeconds === null
                ? ""
                : ` · ~${progress.remainingSeconds} s restantes`
            }`,
            progress: progress.percent,
          }
        : {}),
      onRetry: () => analysisRef.send({ type: "RETRY" }),
    },
    {
      title: "Explicação da IA",
      description: "Transforma os números em momentos-chave e dicas para o seu nível",
      status: phase === "explaining" ? "running" : phase === "done" ? "done" : "waiting",
    },
  ];
  const currentStage =
    phase === "evaluationFailed"
      ? "O motor de avaliação falhou."
      : phase === "explaining"
        ? "Etapa 4 de 4: explicação da IA."
        : // A tabela de finais roda sem etapa própria na tela (decisão de 2026-11-24).
          "Etapa 3 de 4: motor de avaliação.";

  return (
    <>
      <StepIndicator current={2} />
      <p aria-live="polite" className="sr-only">
        {currentStage}
      </p>
      <div className="flex flex-wrap items-start gap-6">
        <section className="flex min-w-0 flex-[1_1_420px] flex-col items-center gap-3.5 rounded-xl border border-line bg-surface p-6">
          <p className="m-0 self-start font-bold text-brand text-xs uppercase tracking-[0.08em]">
            Repassando a partida
          </p>
          <Board
            fen={boardFen}
            orientation={playerColor}
            marks={marks}
            coordinates
            label={`Posição em análise: ${describePieces(boardFen)}`}
            className="w-full"
          />
          <div className="flex w-full justify-between text-[15px]">
            <span className="font-bold">
              Lance {lastPly ? lastPly.moveNumber : 1} de {progress.totalMoves}
            </span>
            <span className="text-ink-muted">{lastPly ? formatMoveLabel(lastPly) : ""}</span>
          </div>
        </section>
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-[26px]">
            <div className="flex flex-col gap-1">
              <h1 className="m-0 font-semibold font-serif text-[30px]">Analisando sua partida…</h1>
              <p className="m-0 text-base text-ink-muted">
                Cada etapa faz uma coisa só. A IA entra no fim e só explica o que os motores
                calcularam.
              </p>
            </div>
            <AnalysisStages stages={stages} />
          </div>
          <FindingsSoFar findings={findings} />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-11 rounded-md border border-line bg-surface px-4 py-2.5 font-semibold text-[15px] text-ink"
            >
              Cancelar análise
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
