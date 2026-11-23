import { describe, expect, it } from "vitest";
import type { DownloadProgress } from "../model/types";
import { EngineClient, type WorkerLike } from "./EngineClient";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
// Mate do pastor: as pretas não têm lance.
const MATED = "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4";

type Script = (command: string, reply: (line: string) => void) => void;

/** Worker falso: registra os comandos e responde segundo um roteiro. */
class FakeWorker implements WorkerLike {
  commands: string[] = [];
  progressPort: MessagePort | null = null;
  terminated = false;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  constructor(private readonly script: Script) {}

  postMessage(message: unknown): void {
    if (typeof message === "object" && message !== null && "progressPort" in message) {
      this.progressPort = (message as { progressPort: MessagePort }).progressPort;
      return;
    }
    const command = String(message);
    this.commands.push(command);
    queueMicrotask(() => this.script(command, (line) => this.onmessage?.({ data: line })));
  }

  terminate(): void {
    this.terminated = true;
  }
}

const handshake: Script = (command, reply) => {
  if (command === "uci") {
    reply("id name Stockfish 19");
    reply("uciok");
  }
  if (command === "isready") {
    reply("readyok");
  }
};

function engineWith(search: Script): { client: EngineClient; worker: FakeWorker } {
  const worker = new FakeWorker((command, reply) => {
    handshake(command, reply);
    search(command, reply);
  });
  return { client: new EngineClient(worker), worker };
}

describe("EngineClient.start", () => {
  it("faz o aperto de mão UCI e configura as threads (EVAL-07)", async () => {
    const { client, worker } = engineWith(() => {});
    await client.start({ threads: 7 });
    expect(worker.commands).toEqual(["uci", "setoption name Threads value 7", "isready"]);
  });

  it("repassa o progresso do download recebido pela porta (EVAL-06)", async () => {
    const received: DownloadProgress[] = [];
    const { client, worker } = engineWith(() => {});
    const started = client.start({ threads: 1, onProgress: (p) => received.push(p) });
    worker.progressPort?.postMessage({ percent: 0.4, loaded: 40, total: 100 });
    await started;
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(received).toEqual([{ percent: 0.4, loaded: 40, total: 100 }]);
  });

  it("falha quando o uciok não chega a tempo (EVAL-08)", async () => {
    const worker = new FakeWorker(() => {});
    const client = new EngineClient(worker);
    await expect(client.start({ threads: 1, timeoutMs: 20 })).rejects.toThrow(
      "O motor não respondeu a tempo",
    );
  });

  it("falha quando o worker dá erro (EVAL-08)", async () => {
    const worker = new FakeWorker(() => {});
    const client = new EngineClient(worker);
    const started = client.start({ threads: 1 });
    worker.onerror?.(new Event("error"));
    await expect(started).rejects.toThrow("Falha no worker do motor");
  });
});

describe("EngineClient.evaluate", () => {
  it("busca 200 ms e devolve a última info e o bestmove (EVAL-12)", async () => {
    const { client, worker } = engineWith((command, reply) => {
      if (command === "go movetime 200") {
        reply("info depth 13 seldepth 18 score cp 20 nodes 1 pv d2d4 d7d5");
        reply("info depth 14 seldepth 19 score cp 31 nodes 2 pv e2e4 e7e5 g1f3");
        reply("bestmove e2e4 ponder e7e5");
      }
    });
    await client.start({ threads: 1 });
    const evaluation = await client.evaluate(START_FEN);
    expect(worker.commands.slice(3)).toEqual([`position fen ${START_FEN}`, "go movetime 200"]);
    expect(evaluation).toEqual({
      fen: START_FEN,
      depth: 14,
      score: { kind: "cp", value: 31 },
      bestMove: "e2e4",
      pv: ["e2e4", "e7e5", "g1f3"],
    });
  });

  it("busca até a profundidade 12 quando o tempo não bastou (EVAL-13)", async () => {
    const { client, worker } = engineWith((command, reply) => {
      if (command === "go movetime 200") {
        reply("info depth 9 score cp 10 pv d2d4");
        reply("bestmove d2d4");
      }
      if (command === "go depth 12") {
        reply("info depth 12 score cp 25 pv e2e4 e7e5");
        reply("bestmove e2e4");
      }
    });
    await client.start({ threads: 1 });
    const evaluation = await client.evaluate(START_FEN);
    expect(worker.commands.slice(3)).toEqual([
      `position fen ${START_FEN}`,
      "go movetime 200",
      "go depth 12",
    ]);
    expect(evaluation).toMatchObject({
      depth: 12,
      score: { kind: "cp", value: 25 },
      bestMove: "e2e4",
    });
  });

  it("devolve a pontuação do ponto de vista das brancas (EVAL-14)", async () => {
    const { client } = engineWith((command, reply) => {
      if (command === "go movetime 200") {
        reply("info depth 15 score cp 35 pv e7e5");
        reply("bestmove e7e5");
      }
    });
    await client.start({ threads: 1 });
    expect((await client.evaluate(AFTER_E4)).score).toEqual({ kind: "cp", value: -35 });
  });

  it("devolve bestMove nulo numa posição sem lances (EVAL-15)", async () => {
    const { client, worker } = engineWith((command, reply) => {
      if (command === "go movetime 200") {
        reply("info depth 0 score mate 0");
        reply("bestmove (none)");
      }
    });
    await client.start({ threads: 1 });
    const evaluation = await client.evaluate(MATED);
    expect(evaluation).toEqual({
      fen: MATED,
      depth: 0,
      score: { kind: "mate", value: 0 },
      bestMove: null,
      pv: [],
    });
    expect(worker.commands).not.toContain("go depth 12");
  });

  it("roda as avaliações uma por vez, na ordem pedida (EVAL-16)", async () => {
    let searches = 0;
    const { client, worker } = engineWith((command, reply) => {
      if (command === "go movetime 200") {
        searches += 1;
        const current = searches;
        setTimeout(
          () => {
            reply(`info depth 20 score cp ${current} pv e2e4`);
            reply("bestmove e2e4");
          },
          current === 1 ? 20 : 0,
        );
      }
    });
    await client.start({ threads: 1 });
    const [first, second] = await Promise.all([
      client.evaluate(START_FEN),
      client.evaluate(AFTER_E4),
    ]);
    expect(first.score).toEqual({ kind: "cp", value: 1 });
    expect(second.score).toEqual({ kind: "cp", value: -2 });
    expect(worker.commands.slice(3)).toEqual([
      `position fen ${START_FEN}`,
      "go movetime 200",
      `position fen ${AFTER_E4}`,
      "go movetime 200",
    ]);
  });

  it("encerra o worker e rejeita a avaliação pendente (EVAL-17)", async () => {
    const { client, worker } = engineWith(() => {});
    await client.start({ threads: 1 });
    const pending = client.evaluate(START_FEN);
    await new Promise((resolve) => setTimeout(resolve, 0));
    client.terminate();
    await expect(pending).rejects.toThrow("Motor encerrado");
    expect(worker.terminated).toBe(true);
    await expect(client.evaluate(START_FEN)).rejects.toThrow("Motor encerrado");
  });
});
