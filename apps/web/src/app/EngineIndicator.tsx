import { useSelector } from "@xstate/react";
import type { ActorRefFrom } from "xstate";
import {
  type EngineLoaderStatus,
  EngineStatus,
  type engineLoaderMachine,
} from "../domains/evaluation";
import { AppMachineContext } from "./AppMachineContext";

type EngineLoaderRef = ActorRefFrom<typeof engineLoaderMachine>;

function ConnectedEngineStatus({ engineRef }: { engineRef: EngineLoaderRef }) {
  const status = useSelector(engineRef, (snapshot) => snapshot.value as EngineLoaderStatus);
  const percent = useSelector(engineRef, (snapshot) => snapshot.context.percent);
  return (
    <EngineStatus
      status={status}
      percent={percent}
      onRetry={() => engineRef.send({ type: "RETRY" })}
    />
  );
}

/** Mostra o estado do motor invocado pela máquina raiz. */
export function EngineIndicator() {
  const engineRef = AppMachineContext.useSelector((snapshot) => snapshot.children.engine);
  return engineRef ? <ConnectedEngineStatus engineRef={engineRef} /> : null;
}
