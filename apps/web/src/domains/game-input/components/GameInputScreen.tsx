import { useSelector } from "@xstate/react";
import { type ReactNode, useMemo } from "react";
import type { ActorRefFrom } from "xstate";
import { StepIndicator } from "../../../shared/ui/StepIndicator";
import type { gameInputMachine } from "../machines/gameInputMachine";
import { analyzeAvailability, type EngineState } from "../model/analyzeAvailability";
import { estimateSeconds } from "../model/estimate";
import { inspectGame } from "../model/inspectGame";
import { FindingsPanel } from "./FindingsPanel";
import { GameField } from "./GameField";
import { PlayerChoices } from "./PlayerChoices";

type GameInputScreenProps = {
  inputRef: ActorRefFrom<typeof gameInputMachine>;
  engine: EngineState;
  /** Linha de estado do motor, desenhada pelo domínio evaluation. */
  engineStatus: ReactNode;
};

/** Tela 1, "Colar a partida" (step_01). */
export function GameInputScreen({ inputRef, engine, engineStatus }: GameInputScreenProps) {
  const context = useSelector(inputRef, (snapshot) => snapshot.context);
  const inspection = useMemo(() => inspectGame(context.text), [context.text]);
  const availability = analyzeAvailability(inspection, context.playerColor, engine);
  const plies = inspection.kind === "valid" ? inspection.game.plies.length : null;

  return (
    <>
      <StepIndicator current={1} />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-semibold font-serif text-[36px] tracking-[-0.01em]">
          Analise sua partida
        </h1>
        <p className="m-0 max-w-[720px] text-[17px] text-ink-muted">
          Cole a lista de lances copiada do Chess.com. Os motores calculam cada posição; a IA
          explica o que aconteceu em português simples.
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <GameField
          text={context.text}
          inspection={inspection}
          clipboardDenied={context.clipboardDenied}
          onTextChange={(text) => inputRef.send({ type: "TEXT.CHANGED", text })}
          onPaste={() => inputRef.send({ type: "PASTE" })}
          onClear={() => inputRef.send({ type: "CLEAR" })}
        />
        <aside className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
          <FindingsPanel inspection={inspection} playerColor={context.playerColor} />
          <PlayerChoices
            playerColor={context.playerColor}
            level={context.level}
            priorities={context.priorities}
            availability={availability}
            estimateSeconds={estimateSeconds(plies)}
            engineStatus={engineStatus}
            onColor={(color) => inputRef.send({ type: "COLOR.SELECTED", color })}
            onLevel={(level) => inputRef.send({ type: "LEVEL.SELECTED", level })}
            onPriority={(priority) => inputRef.send({ type: "PRIORITY.TOGGLED", priority })}
            onAnalyze={() => inputRef.send({ type: "ANALYZE", engine })}
          />
        </aside>
      </div>
    </>
  );
}
