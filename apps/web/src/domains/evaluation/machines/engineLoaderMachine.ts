import { assign, fromCallback, setup } from "xstate";
import { createEngineWorker } from "../engine/createEngineWorker";
import { EngineClient } from "../engine/EngineClient";
import { chooseEngineBuild } from "../model/engineBuild";
import { toPercent } from "../model/progress";
import type { EngineBuild } from "../model/types";

export type EngineLoaderEvent =
  | { type: "ENGINE.PROGRESS"; percent: number }
  | { type: "ENGINE.READY"; engine: EngineClient }
  | { type: "ENGINE.FAILED" }
  | { type: "RETRY" };

export type EngineLoaderContext = {
  percent: number;
  engine: EngineClient | null;
  build: EngineBuild;
};

function currentBuild(): EngineBuild {
  return chooseEngineBuild({
    crossOriginIsolated: globalThis.crossOriginIsolated === true,
    hardwareConcurrency: globalThis.navigator?.hardwareConcurrency ?? 1,
  });
}

/**
 * Baixa e inicia o Stockfish. Termina com um EngineClient pronto ou em falha; se o
 * ator for parado antes de ficar pronto (ex.: "Tentar de novo"), encerra o worker.
 */
export const loadEngine = fromCallback<EngineLoaderEvent, { build: EngineBuild }>(
  ({ sendBack, input }) => {
    let client: EngineClient | null = null;
    let ready = false;
    try {
      client = new EngineClient(createEngineWorker(input.build.scriptUrl));
    } catch {
      sendBack({ type: "ENGINE.FAILED" });
      return;
    }
    const engine = client;
    engine
      .start({
        threads: input.build.threads,
        onProgress: (progress) =>
          sendBack({ type: "ENGINE.PROGRESS", percent: toPercent(progress.percent) }),
      })
      .then(() => {
        ready = true;
        sendBack({ type: "ENGINE.READY", engine });
      })
      .catch(() => {
        engine.terminate();
        sendBack({ type: "ENGINE.FAILED" });
      });
    return () => {
      if (!ready) {
        engine.terminate();
      }
    };
  },
);

export const engineLoaderMachine = setup({
  types: {
    context: {} as EngineLoaderContext,
    events: {} as EngineLoaderEvent,
  },
  actors: { loadEngine },
}).createMachine({
  id: "engineLoader",
  context: () => ({ percent: 0, engine: null, build: currentBuild() }),
  initial: "loading",
  states: {
    loading: {
      entry: assign({ percent: 0, engine: null }),
      invoke: {
        src: "loadEngine",
        input: ({ context }) => ({ build: context.build }),
      },
      on: {
        "ENGINE.PROGRESS": {
          actions: assign({ percent: ({ event }) => event.percent }),
        },
        "ENGINE.READY": {
          target: "ready",
          actions: assign({ engine: ({ event }) => event.engine, percent: 100 }),
        },
        "ENGINE.FAILED": { target: "failed" },
      },
    },
    ready: {},
    failed: {
      on: { RETRY: { target: "loading" } },
    },
  },
});

export type EngineLoaderStatus = "loading" | "ready" | "failed";
