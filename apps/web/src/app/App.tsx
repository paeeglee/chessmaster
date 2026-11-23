import type { ComponentProps } from "react";
import type { ActorRefFrom } from "xstate";
import { GameInputScreen, type gameInputMachine } from "../domains/game-input";
import { StepIndicator } from "../shared/ui/StepIndicator";
import { AppHeader } from "./AppHeader";
import { AppMachineContext } from "./AppMachineContext";
import { EngineIndicator, type EngineLoaderRef, useEngineState } from "./EngineIndicator";

function ConnectedGameInput({
  inputRef,
  engineRef,
}: {
  inputRef: ActorRefFrom<typeof gameInputMachine>;
  engineRef: EngineLoaderRef;
}) {
  const engine = useEngineState(engineRef);
  return (
    <GameInputScreen
      inputRef={inputRef}
      engine={engine}
      engineStatus={<EngineIndicator engineRef={engineRef} />}
    />
  );
}

function AnalyzingPlaceholder() {
  const app = AppMachineContext.useActorRef();
  // Marcador da tela Analisando; o conteúdo real chega na F4.
  return (
    <>
      <StepIndicator current={2} />
      <h1 className="m-0 font-semibold font-serif text-[36px] tracking-[-0.01em]">
        Analisando sua partida
      </h1>
      <div>
        <button
          type="button"
          onClick={() => app.send({ type: "ANALYSIS.CANCELLED" })}
          className="min-h-11 rounded-md border border-line bg-surface px-4 font-semibold text-ink"
        >
          Cancelar análise
        </button>
      </div>
    </>
  );
}

function CurrentScreen() {
  const screen = AppMachineContext.useSelector((snapshot) => snapshot.value);
  const inputRef = AppMachineContext.useSelector((snapshot) => snapshot.children.gameInput);
  const engineRef = AppMachineContext.useSelector((snapshot) => snapshot.children.engine);

  if (!engineRef) {
    return null;
  }
  switch (screen) {
    case "gameInput":
      return inputRef ? <ConnectedGameInput inputRef={inputRef} engineRef={engineRef} /> : null;
    case "analyzing":
      return <AnalyzingPlaceholder />;
  }
}

type AppProps = {
  /** Permite aos testes trocar atores (worker, rede) com `appMachine.provide(...)`. */
  logic?: ComponentProps<typeof AppMachineContext.Provider>["logic"];
};

export function App({ logic }: AppProps) {
  return (
    <AppMachineContext.Provider {...(logic ? { logic } : {})}>
      <div className="min-h-full font-sans text-ink">
        <AppHeader />
        <main className="mx-auto flex max-w-[1240px] flex-col gap-6 px-8 pt-8 pb-12">
          <CurrentScreen />
        </main>
      </div>
    </AppMachineContext.Provider>
  );
}
