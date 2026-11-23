import { useSelector } from "@xstate/react";
import type { ActorRefFrom } from "xstate";
import {
  type EngineLoaderStatus,
  EngineStatus,
  type engineLoaderMachine,
} from "../domains/evaluation";
import type { EngineState } from "../domains/game-input";

export type EngineLoaderRef = ActorRefFrom<typeof engineLoaderMachine>;

/** Estado do motor (carregando com %, pronto, falhou) para as telas. */
export function useEngineState(engineRef: EngineLoaderRef): EngineState {
  const status = useSelector(engineRef, (snapshot) => snapshot.value as EngineLoaderStatus);
  const percent = useSelector(engineRef, (snapshot) => snapshot.context.percent);
  return { status, percent };
}

/** Linha de estado do motor invocado pela máquina raiz. */
export function EngineIndicator({ engineRef }: { engineRef: EngineLoaderRef }) {
  const { status, percent } = useEngineState(engineRef);
  return (
    <EngineStatus
      status={status}
      percent={percent}
      onRetry={() => engineRef.send({ type: "RETRY" })}
    />
  );
}
