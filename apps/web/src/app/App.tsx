import type { ComponentProps, ReactNode } from "react";
import type { ActorRefFrom } from "xstate";
import { AnalyzingScreen } from "../domains/analysis";
import { GameInputScreen, type gameInputMachine } from "../domains/game-input";
import { ReviewScreen } from "../domains/review";
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

function TrainingPlaceholder() {
  const app = AppMachineContext.useActorRef();
  // Marcador da tela Treinar momento-chave; o conteúdo chega na F8.
  return (
    <>
      <button
        type="button"
        onClick={() => app.send({ type: "TRAINING.BACK" })}
        className="min-h-11 self-start rounded-md border border-line bg-surface px-4 font-semibold text-ink"
      >
        ← Voltar ao resultado
      </button>
      <h1 className="m-0 font-semibold font-serif text-[30px]">Treinar momento-chave</h1>
    </>
  );
}

function CurrentScreen() {
  const screen = AppMachineContext.useSelector((snapshot) => snapshot.value);
  const inputRef = AppMachineContext.useSelector((snapshot) => snapshot.children.gameInput);
  const engineRef = AppMachineContext.useSelector((snapshot) => snapshot.children.engine);
  const analysisRef = AppMachineContext.useSelector((snapshot) => snapshot.children.analysis);
  const reviewRef = AppMachineContext.useSelector((snapshot) => snapshot.children.review);
  const app = AppMachineContext.useActorRef();

  if (!engineRef) {
    return null;
  }
  switch (screen) {
    case "gameInput":
      return inputRef ? <ConnectedGameInput inputRef={inputRef} engineRef={engineRef} /> : null;
    case "analyzing":
      return analysisRef ? (
        <AnalyzingScreen
          analysisRef={analysisRef}
          onCancel={() => app.send({ type: "ANALYSIS.CANCELLED" })}
        />
      ) : null;
    case "review":
      return reviewRef ? <ReviewScreen reviewRef={reviewRef} /> : null;
    case "training":
      return <TrainingPlaceholder />;
  }
}

type AppProps = {
  /** Permite aos testes trocar atores (worker, rede) com `appMachine.provide(...)`. */
  logic?: ComponentProps<typeof AppMachineContext.Provider>["logic"];
};

/**
 * Largura e espaçamento da página: a tela Resultado é mais larga (mockup step_03).
 * Nos mockups o `max-width` não inclui o padding de 32 px de cada lado; aqui inclui,
 * então a largura máxima soma 64 px (1240 → 1304, 1320 → 1384).
 */
function ScreenFrame({ children }: { children: ReactNode }) {
  const screen = AppMachineContext.useSelector((snapshot) => snapshot.value);
  const frame =
    screen === "review"
      ? "max-w-[1384px] gap-[22px] pt-7"
      : screen === "training"
        ? "max-w-[1304px] gap-[22px] pt-7"
        : "max-w-[1304px] gap-6 pt-8";
  return <main className={`mx-auto flex flex-col px-8 pb-12 ${frame}`}>{children}</main>;
}

export function App({ logic }: AppProps) {
  return (
    <AppMachineContext.Provider {...(logic ? { logic } : {})}>
      <div className="min-h-full font-sans text-ink">
        <AppHeader />
        <ScreenFrame>
          <CurrentScreen />
        </ScreenFrame>
      </div>
    </AppMachineContext.Provider>
  );
}
