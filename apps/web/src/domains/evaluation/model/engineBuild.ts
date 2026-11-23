import type { EngineBuild } from "./types";

/** Versão do pacote npm `stockfish`; os arquivos em public/engine/ levam esse número. */
export const ENGINE_VERSION = "19.0.1";

export type BrowserCapabilities = {
  crossOriginIsolated: boolean;
  hardwareConcurrency: number;
};

/**
 * D1: com isolamento de origem, usa o build multi-thread com um núcleo livre para a
 * interface; sem isolamento, o build de uma thread (mesmo resultado, mais lento).
 */
export function chooseEngineBuild(capabilities: BrowserCapabilities): EngineBuild {
  if (capabilities.crossOriginIsolated) {
    return {
      variant: "multi-thread",
      scriptUrl: `/engine/stockfish-${ENGINE_VERSION}-mt.js`,
      threads: Math.max(1, capabilities.hardwareConcurrency - 1),
    };
  }
  return {
    variant: "single-thread",
    scriptUrl: `/engine/stockfish-${ENGINE_VERSION}-st.js`,
    threads: 1,
  };
}
