import { useSelector } from "@xstate/react";
import type { ActorRefFrom } from "xstate";
import { StepIndicator } from "../../../shared/ui/StepIndicator";
import type { reviewMachine } from "../machines/reviewMachine";
import { BoardPanel } from "./BoardPanel";
import { ConfirmNewGame } from "./ConfirmNewGame";
import { KeyMomentsList } from "./KeyMomentsList";
import { MaterialChart } from "./MaterialChart";
import { MoveList } from "./MoveList";
import { AskAi, EnginesFooter, NextGameHabit, StrengthsList } from "./ReviewSidebar";
import { SummaryBand } from "./SummaryBand";

/** Tela 3, "Resultado" (step_03). */
export function ReviewScreen({ reviewRef }: { reviewRef: ActorRefFrom<typeof reviewMachine> }) {
  const snapshot = useSelector(reviewRef, (state) => state);
  const { context } = snapshot;
  const send = reviewRef.send;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StepIndicator current={3} />
        <button
          type="button"
          onClick={() => send({ type: "NEW_GAME.REQUEST" })}
          className="min-h-11 rounded-md border border-line bg-surface px-4 py-2.5 font-semibold text-[15px] text-ink"
        >
          Analisar outra partida
        </button>
      </div>
      <SummaryBand
        result={context.result}
        retrying={snapshot.matches({ explanation: "retrying" })}
        onRetry={() => send({ type: "AI.RETRY" })}
      />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-3.5">
          <BoardPanel context={context} send={send} />
          <MaterialChart context={context} send={send} />
          <MoveList context={context} send={send} />
        </div>
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <KeyMomentsList context={context} send={send} />
          <StrengthsList context={context} />
          <NextGameHabit context={context} />
          <AskAi context={context} send={send} asking={snapshot.matches({ questions: "asking" })} />
        </div>
      </div>
      <EnginesFooter context={context} />
      {snapshot.matches({ newGame: "confirming" }) && (
        <ConfirmNewGame
          onConfirm={() => send({ type: "NEW_GAME.CONFIRM" })}
          onCancel={() => send({ type: "NEW_GAME.CANCEL" })}
        />
      )}
    </>
  );
}
