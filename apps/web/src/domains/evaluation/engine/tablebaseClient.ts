import type { ProbeResult } from "../model/tablebase/probe";

type Reply = { id: number; result?: ProbeResult | null; error?: string };

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<
  number,
  { resolve: (r: ProbeResult | null) => void; reject: (e: Error) => void }
>();

function tablebaseWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../workers/tablebase.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<Reply>) => {
      const request = pending.get(event.data.id);
      if (!request) return;
      pending.delete(event.data.id);
      if (event.data.error) request.reject(new Error(event.data.error));
      else request.resolve(event.data.result ?? null);
    };
    worker.onerror = () => {
      for (const request of pending.values())
        request.reject(new Error("Falha na tabela de finais"));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  }
  return worker;
}

/** Motor 4: resultado exato e distância até o mate da posição (null fora da tabela). */
export function probeEndgame(fen: string): Promise<ProbeResult | null> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    tablebaseWorker().postMessage({ id, fen });
  });
}
