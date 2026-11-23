import { setup } from "xstate";
import { engineLoaderMachine } from "../domains/evaluation";

// Máquina raiz do fluxo: decide a tela atual e carrega os dados entre as telas.
// O carregador do motor é invocado na raiz para começar o download assim que a
// página abre (D1) e viver a sessão inteira.
export const appMachine = setup({
  types: {
    context: {} as Record<string, never>,
    events: {} as { type: "app.noop" },
    children: {} as { engine: "engineLoader" },
  },
  actors: { engineLoader: engineLoaderMachine },
}).createMachine({
  id: "app",
  context: {},
  invoke: { id: "engine", src: "engineLoader" },
  initial: "gameInput",
  states: {
    gameInput: {},
  },
});
