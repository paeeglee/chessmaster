import type { ComponentProps } from "react";
import { AppHeader } from "./AppHeader";
import { AppMachineContext } from "./AppMachineContext";
import { EngineIndicator } from "./EngineIndicator";

function CurrentScreen() {
  const screen = AppMachineContext.useSelector((snapshot) => snapshot.value);

  switch (screen) {
    case "gameInput":
      // Marcador da tela Colar a partida; o conteúdo real chega na F3.
      return (
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 font-semibold font-serif text-[36px] tracking-[-0.01em]">
            Analise sua partida
          </h1>
          <p className="m-0 max-w-[720px] text-[17px] text-ink-muted">
            Cole a lista de lances copiada do Chess.com. Os motores calculam cada posição; a IA
            explica o que aconteceu em português simples.
          </p>
        </div>
      );
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
          <EngineIndicator />
          <CurrentScreen />
        </main>
      </div>
    </AppMachineContext.Provider>
  );
}
