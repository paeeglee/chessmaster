import { setup } from "xstate";

// Máquina raiz do fluxo: decide a tela atual e carrega os dados entre as telas.
// Na F0 só existe a tela inicial; as outras chegam com as features de cada tela.
export const appMachine = setup({
  types: {
    context: {} as Record<string, never>,
    events: {} as { type: "app.noop" },
  },
}).createMachine({
  id: "app",
  context: {},
  initial: "gameInput",
  states: {
    gameInput: {},
  },
});
