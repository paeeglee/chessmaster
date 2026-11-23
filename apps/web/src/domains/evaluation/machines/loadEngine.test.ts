import { afterEach, describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";
import * as workerFactory from "../engine/createEngineWorker";
import type { WorkerLike } from "../engine/EngineClient";
import { engineLoaderMachine } from "./engineLoaderMachine";

class ScriptedWorker implements WorkerLike {
  terminated = false;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  progressPort: MessagePort | null = null;

  constructor(private readonly answers: boolean) {}

  postMessage(message: unknown): void {
    if (typeof message === "object" && message !== null && "progressPort" in message) {
      this.progressPort = (message as { progressPort: MessagePort }).progressPort;
      return;
    }
    if (!this.answers) return;
    queueMicrotask(() => {
      if (message === "uci") this.onmessage?.({ data: "uciok" });
      if (message === "isready") this.onmessage?.({ data: "readyok" });
    });
  }

  terminate(): void {
    this.terminated = true;
  }
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 10));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadEngine com o EngineClient de verdade", () => {
  it("chega a pronto depois do aperto de mão e repassa o progresso", async () => {
    const worker = new ScriptedWorker(true);
    vi.spyOn(workerFactory, "createEngineWorker").mockReturnValue(worker);
    const actor = createActor(engineLoaderMachine).start();
    worker.progressPort?.postMessage({ percent: 0.42, loaded: 42, total: 100 });
    await settle();
    expect(actor.getSnapshot().value).toBe("ready");
    expect(actor.getSnapshot().context.engine).not.toBeNull();
    expect(worker.terminated).toBe(false);
  });

  it("falha e encerra o worker quando não consegue criá-lo", async () => {
    vi.spyOn(workerFactory, "createEngineWorker").mockImplementation(() => {
      throw new Error("Worker indisponível");
    });
    const actor = createActor(engineLoaderMachine).start();
    await settle();
    expect(actor.getSnapshot().value).toBe("failed");
  });

  it("falha e encerra o worker quando ele dá erro", async () => {
    const worker = new ScriptedWorker(false);
    vi.spyOn(workerFactory, "createEngineWorker").mockReturnValue(worker);
    const actor = createActor(engineLoaderMachine).start();
    worker.onerror?.(new Event("error"));
    await settle();
    expect(actor.getSnapshot().value).toBe("failed");
    expect(worker.terminated).toBe(true);
  });

  it("encerra o worker ainda carregando quando o carregador para", () => {
    const worker = new ScriptedWorker(false);
    vi.spyOn(workerFactory, "createEngineWorker").mockReturnValue(worker);
    const actor = createActor(engineLoaderMachine).start();
    actor.stop();
    expect(worker.terminated).toBe(true);
  });
});
