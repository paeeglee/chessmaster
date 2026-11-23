import { MIN_DEPTH, MOVETIME_MS, needsDeeperSearch } from "../model/searchPlan";
import type { DownloadProgress, EngineScore, PositionEvaluation } from "../model/types";
import {
  type InfoLine,
  parseBestMove,
  parseInfoLine,
  sideToMoveOf,
  toWhitePerspective,
} from "../model/uci";

/** O mínimo de um Worker que o cliente usa; os testes passam um falso. */
export type WorkerLike = {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
};

export type StartOptions = {
  threads: number;
  onProgress?: (progress: DownloadProgress) => void;
  /** Tempo máximo até o `uciok` (inclui o download do .wasm). */
  timeoutMs?: number;
};

export const DEFAULT_START_TIMEOUT_MS = 120_000;
/** Quanto esperar o `bestmove` da busca cancelada antes de seguir sem ele. */
export const STALE_BESTMOVE_TIMEOUT_MS = 2000;

type LineConsumer = {
  /** Recebe cada linha; devolve true quando terminou de consumir. */
  onLine(line: string): boolean;
  reject(error: Error): void;
};

type SearchResult = { info: InfoLine | null; bestMove: string | null };

/**
 * Motor 3: conversa com o Stockfish num Web Worker só por mensagens UCI. As buscas
 * rodam uma por vez, na ordem em que foram pedidas.
 */
export class EngineClient {
  private consumer: LineConsumer | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private terminated = false;
  /** Muda a cada cancelamento; buscas de uma geração antiga não chegam a rodar. */
  private generation = 0;
  /** Há um `go` em andamento, cujo `bestmove` ainda vai chegar. */
  private searching = false;

  constructor(private readonly worker: WorkerLike) {
    worker.onmessage = (event) => {
      if (typeof event.data === "string") {
        this.handleLine(event.data);
      }
    };
    worker.onerror = () => {
      this.fail(new Error("Falha no worker do motor"));
    };
  }

  /** Faz o aperto de mão UCI, configura as threads e espera o motor ficar pronto. */
  async start({ threads, onProgress, timeoutMs = DEFAULT_START_TIMEOUT_MS }: StartOptions) {
    if (onProgress) {
      // O stockfish.js publica o progresso do download do .wasm nesta porta.
      const channel = new MessageChannel();
      channel.port1.onmessage = (event: MessageEvent<DownloadProgress>) => onProgress(event.data);
      this.worker.postMessage({ progressPort: channel.port2 }, [channel.port2]);
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("O motor não respondeu a tempo")), timeoutMs);
    });
    try {
      await Promise.race([this.send("uci", (line) => line === "uciok"), timeout]);
      this.worker.postMessage(`setoption name Threads value ${threads}`);
      await Promise.race([this.send("isready", (line) => line === "readyok"), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Avalia uma posição: ~200 ms e, se não chegar à profundidade 12, busca até ela. */
  evaluate(fen: string): Promise<PositionEvaluation> {
    const generation = this.generation;
    const run = this.queue.then(() => {
      if (generation !== this.generation) {
        throw new Error("Análise cancelada");
      }
      return this.evaluateNow(fen);
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  /**
   * Cancela a análise em andamento: manda `stop` ao motor, rejeita a busca atual e as
   * que estavam na fila. O motor continua pronto para novas buscas.
   */
  cancel(): void {
    if (this.terminated) {
      return;
    }
    this.generation += 1;
    const wasSearching = this.searching;
    this.worker.postMessage("stop");
    this.fail(new Error("Análise cancelada"));
    // O `bestmove` da busca interrompida ainda vai chegar, e o motor pode responder ao
    // `isready` antes dele. Por isso a próxima busca espera primeiro esse `bestmove`
    // (com limite de tempo, caso ele não venha) e depois o `readyok`.
    const stale = wasSearching
      ? Promise.race([
          this.waitFor((line) => line.startsWith("bestmove")),
          new Promise<void>((resolve) => setTimeout(resolve, STALE_BESTMOVE_TIMEOUT_MS)),
        ])
      : Promise.resolve();
    this.queue = stale
      .then(() => {
        this.consumer = null;
        return this.send("isready", (line) => line === "readyok");
      })
      .catch(() => undefined);
  }

  terminate(): void {
    if (this.terminated) {
      return;
    }
    this.terminated = true;
    this.worker.terminate();
    this.fail(new Error("Motor encerrado"));
  }

  private async evaluateNow(fen: string): Promise<PositionEvaluation> {
    this.worker.postMessage(`position fen ${fen}`);
    let result = await this.search(`go movetime ${MOVETIME_MS}`);
    if (result.bestMove !== null && needsDeeperSearch(result.info?.depth ?? 0)) {
      result = await this.search(`go depth ${MIN_DEPTH}`);
    }
    const score: EngineScore = result.info?.score ?? { kind: "cp", value: 0 };
    return {
      fen,
      depth: result.info?.depth ?? 0,
      score: toWhitePerspective(score, sideToMoveOf(fen)),
      bestMove: result.bestMove,
      pv: result.info?.pv ?? [],
    };
  }

  private search(command: string): Promise<SearchResult> {
    let info: InfoLine | null = null;
    let bestMove: string | null = null;
    this.searching = true;
    return this.send(command, (line) => {
      info = parseInfoLine(line) ?? info;
      const best = parseBestMove(line);
      if (best) {
        bestMove = best.bestMove;
        return true;
      }
      return false;
    })
      .then(() => ({ info, bestMove }))
      .finally(() => {
        this.searching = false;
      });
  }

  private send(command: string, isDone: (line: string) => boolean): Promise<void> {
    const done = this.waitFor(isDone);
    if (!this.terminated) {
      this.worker.postMessage(command);
    }
    return done;
  }

  /** Espera uma linha do motor sem mandar comando. */
  private waitFor(isDone: (line: string) => boolean): Promise<void> {
    if (this.terminated) {
      return Promise.reject(new Error("Motor encerrado"));
    }
    return new Promise<void>((resolve, reject) => {
      this.consumer = {
        onLine: (line) => {
          if (!isDone(line)) {
            return false;
          }
          resolve();
          return true;
        },
        reject,
      };
    });
  }

  private handleLine(line: string): void {
    if (this.consumer?.onLine(line)) {
      this.consumer = null;
    }
  }

  private fail(error: Error): void {
    const consumer = this.consumer;
    this.consumer = null;
    consumer?.reject(error);
  }
}
