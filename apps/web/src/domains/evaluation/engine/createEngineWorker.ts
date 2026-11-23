import type { WorkerLike } from "./EngineClient";

/** Cria o Web Worker clássico do stockfish.js (o script carrega o .wasm ao lado dele). */
export function createEngineWorker(scriptUrl: string): WorkerLike {
  return new Worker(scriptUrl) as unknown as WorkerLike;
}
