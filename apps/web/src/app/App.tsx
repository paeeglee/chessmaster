import type { ComponentProps } from "react";
import type { ActorRefFrom } from "xstate";
import { type AnalysisResult, AnalyzingScreen, findingText } from "../domains/analysis";
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

function ResultPlaceholder({ result }: { result: AnalysisResult }) {
  const app = AppMachineContext.useActorRef();
  // Marcador da tela Resultado; o conteúdo completo chega na F7.
  return (
    <>
      <StepIndicator current={3} />
      <h1 className="m-0 font-semibold font-serif text-[30px]">Resultado da análise</h1>
      {result.explanation ? (
        <p className="m-0 text-[17px]">{result.explanation.verdict}</p>
      ) : (
        <p className="m-0 text-[17px] text-ink-muted">A explicação não pôde ser gerada.</p>
      )}
      <section aria-labelledby="key-moments" className="flex flex-col gap-2">
        <h2 id="key-moments" className="m-0 font-semibold font-serif text-[22px]">
          Momentos-chave
        </h2>
        {result.keyMoments.length === 0 ? (
          <p className="m-0">Nenhuma perda de material importante.</p>
        ) : (
          <ol className="m-0 flex flex-col gap-1 pl-5">
            {result.keyMoments.map((moment) => (
              <li key={moment.ply}>
                <strong>{moment.moveLabel}?</strong> {findingText(moment)}
              </li>
            ))}
          </ol>
        )}
      </section>
      <div>
        <button
          type="button"
          onClick={() => app.send({ type: "REVIEW.NEW_GAME" })}
          className="min-h-11 rounded-md border border-line bg-surface px-4 font-semibold text-ink"
        >
          Analisar outra partida
        </button>
      </div>
    </>
  );
}

function CurrentScreen() {
  const screen = AppMachineContext.useSelector((snapshot) => snapshot.value);
  const inputRef = AppMachineContext.useSelector((snapshot) => snapshot.children.gameInput);
  const engineRef = AppMachineContext.useSelector((snapshot) => snapshot.children.engine);
  const analysisRef = AppMachineContext.useSelector((snapshot) => snapshot.children.analysis);
  const result = AppMachineContext.useSelector((snapshot) => snapshot.context.result);
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
      return result ? <ResultPlaceholder result={result} /> : null;
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
