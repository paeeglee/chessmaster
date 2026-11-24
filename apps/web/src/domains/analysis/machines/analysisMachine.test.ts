import { describe, expect, it } from "vitest";
import { createActor, fromPromise, waitFor } from "xstate";
import type { EngineClient, PositionEvaluation, ProbeResult } from "../../evaluation";
import type { GameExplanation } from "../../explanation";
import { parseGameText, replayGame } from "../../game";
import referenceGameHtml from "../../game/fixtures/reference-game.chesscom.html?raw";
import type { AnalysisRequest } from "../../game-input";
import { krkGame } from "../fixtures/krkGame";
import referenceEvaluations from "../fixtures/reference-game.evaluations.json";
import type { AnalysisSummary } from "../model/summary";
import { analysisMachine, type ProbeInput, positionsOf } from "./analysisMachine";

const evaluations = referenceEvaluations as PositionEvaluation[];

function referenceRequest(): AnalysisRequest {
  const parsed = parseGameText(referenceGameHtml);
  if (parsed.kind !== "parsed") throw new Error("partida inválida");
  const replayed = replayGame(parsed.game);
  if (replayed.kind !== "legal") throw new Error("lance ilegal");
  return { game: replayed.game, playerColor: "b", level: "beginner", priorities: [] };
}

type FakeEngine = EngineClient & { calls: string[]; cancels: number };

/** Motor falso: devolve as avaliações do fixture pela ordem das posições. */
function fakeEngine(options: { failAt?: number; hangAt?: number } = {}): FakeEngine {
  const calls: string[] = [];
  let failed = false;
  const engine = {
    calls,
    cancels: 0,
    evaluate: (fen: string) => {
      const index = calls.length;
      calls.push(fen);
      if (index === options.failAt && !failed) {
        failed = true;
        return Promise.reject(new Error("motor caiu"));
      }
      if (index === options.hangAt) return new Promise<PositionEvaluation>(() => {});
      const evaluation = evaluations[index];
      return evaluation ? Promise.resolve(evaluation) : Promise.reject(new Error("sem fixture"));
    },
    cancel: () => {
      engine.cancels += 1;
    },
  };
  return engine as unknown as FakeEngine;
}

const explanation: GameExplanation = {
  verdict: "Vitória.",
  patterns_sentence: "Padrões.",
  key_moments: [],
  strengths: [],
  next_game_habit: "Hábito.",
};

function start(
  engine: FakeEngine,
  explain: () => Promise<GameExplanation> = async () => explanation,
) {
  let explainedWith: AnalysisSummary | null = null;
  const machine = analysisMachine.provide({
    actors: {
      explainGame: fromPromise<
        GameExplanation,
        { request: AnalysisRequest; summary: AnalysisSummary }
      >(async ({ input }) => {
        explainedWith = input.summary;
        return explain();
      }),
    },
  });
  const actor = createActor(machine, { input: { request: referenceRequest(), engine } }).start();
  return { actor, explainedWith: () => explainedWith };
}

describe("analysisMachine", () => {
  it("avalia todas as posições, uma por vez e em ordem (AS-01, AS-02)", async () => {
    const engine = fakeEngine();
    const { actor } = start(engine);
    expect(actor.getSnapshot().value).toBe("evaluating");
    await waitFor(actor, (snapshot) => snapshot.status === "done");
    expect(engine.calls).toEqual(positionsOf(referenceRequest()));
    expect(engine.calls).toHaveLength(145);
  });

  it("adiciona os achados assim que as duas posições do lance são avaliadas (AS-03)", async () => {
    // O 22...Ta7 (meio-lance 44) sai quando a posição depois da resposta (45) é avaliada.
    const engine = fakeEngine({ hangAt: 46 });
    const { actor } = start(engine);
    await waitFor(actor, (snapshot) => snapshot.context.evaluations.length === 46);
    const findings = actor.getSnapshot().context.findings;
    expect(findings.map((finding) => `${finding.tag} ${finding.moveLabel}`)).toEqual(
      expect.arrayContaining(["Adversário 12.Ce2?", "Erro 22...Ta7?"]),
    );
    expect(findings.every((finding) => finding.ply <= 44)).toBe(true);
    actor.stop();
  });

  it("depois de avaliar, explica com o resumo e termina com o resultado (AS-04, AS-05)", async () => {
    const { actor, explainedWith } = start(fakeEngine());
    await waitFor(actor, (snapshot) => snapshot.status === "done");
    expect(explainedWith()?.keyMoments.map((moment) => moment.moveLabel)).toEqual([
      "22...Ta7",
      "27...Tb7",
      "41...Ta1",
      "43...Te6",
      "56...Ta8",
    ]);
    const output = actor.getSnapshot().output;
    expect(output?.explanation).toEqual(explanation);
    expect(output?.aiFailed).toBe(false);
    expect(output?.keyMoments).toHaveLength(5);
    expect(output?.request.playerColor).toBe("b");
  });

  it("se a IA falha, termina mesmo assim, marcando a falha (AS-06)", async () => {
    const { actor } = start(fakeEngine(), async () => {
      throw new Error("503");
    });
    await waitFor(actor, (snapshot) => snapshot.status === "done");
    expect(actor.getSnapshot().output).toMatchObject({ explanation: null, aiFailed: true });
    expect(actor.getSnapshot().output?.keyMoments).toHaveLength(5);
  });

  it("se o motor falha, para e deixa tentar de novo do começo (AS-07)", async () => {
    const engine = fakeEngine({ failAt: 3 });
    const { actor } = start(engine);
    await waitFor(actor, (snapshot) => snapshot.value === "evaluationFailed");
    expect(actor.getSnapshot().context.evaluations).toHaveLength(3);
    engine.calls.length = 0;
    actor.send({ type: "RETRY" });
    expect(actor.getSnapshot().context.evaluations).toEqual([]);
    await waitFor(actor, (snapshot) => snapshot.status === "done");
    expect(engine.calls).toHaveLength(145);
  });

  it("parar a análise cancela a busca no motor (AS-08)", async () => {
    const engine = fakeEngine({ hangAt: 10 });
    const { actor } = start(engine);
    await waitFor(actor, (snapshot) => snapshot.context.evaluations.length === 10);
    actor.stop();
    expect(engine.cancels).toBe(1);
  });

  it("uma partida sem momentos-chave também chega ao fim (AS-16)", async () => {
    const request = referenceRequest();
    const short = { ...request, game: { ...request.game, plies: request.game.plies.slice(0, 4) } };
    const engine = fakeEngine();
    const machine = analysisMachine.provide({
      actors: { explainGame: fromPromise(async () => explanation) },
    });
    const actor = createActor(machine, { input: { request: short, engine } }).start();
    await waitFor(actor, (snapshot) => snapshot.status === "done");
    expect(engine.calls).toHaveLength(5);
    expect(actor.getSnapshot().output?.keyMoments).toEqual([]);
  });

  it("conta a captura da partida quando a variante do motor não a mostra", async () => {
    // Na posição depois de 22...Ta7, a variante do motor começa sem capturar; na
    // partida veio 23.Txa1. O erro continua sendo achado.
    const request = referenceRequest();
    const altered = evaluations.map((evaluation, index) =>
      index === 44 ? { ...evaluation, pv: ["f2e3"] } : evaluation,
    );
    const engine = fakeEngine();
    (engine as { evaluate: (fen: string) => Promise<PositionEvaluation> }).evaluate = async (
      fen: string,
    ) => {
      const index = engine.calls.length;
      engine.calls.push(fen);
      return altered[index] as PositionEvaluation;
    };
    const machine = analysisMachine.provide({
      actors: { explainGame: fromPromise(async () => explanation) },
    });
    const actor = createActor(machine, { input: { request, engine } }).start();
    await waitFor(actor, (snapshot) => snapshot.status === "done");
    expect(actor.getSnapshot().context.findings.map((finding) => finding.moveLabel)).toContain(
      "22...Ta7?",
    );
    expect(actor.getSnapshot().output?.keyMoments[0]?.moveLabel).toBe("22...Ta7");
  });

  it("o último lance da partida também vira achado no fim da avaliação (AS-03)", async () => {
    // A partida cortada termina em 22...Ta7: não há resposta, então o lance é
    // classificado quando a avaliação termina.
    const full = referenceRequest();
    const request = { ...full, game: { ...full.game, plies: full.game.plies.slice(0, 44) } };
    const engine = fakeEngine();
    const machine = analysisMachine.provide({
      actors: { explainGame: fromPromise(async () => explanation) },
    });
    const actor = createActor(machine, { input: { request, engine } }).start();
    await waitFor(actor, (snapshot) => snapshot.status === "done");
    expect(engine.calls).toHaveLength(45);
    const labels = actor.getSnapshot().context.findings.map((finding) => finding.moveLabel);
    expect(labels.at(-1)).toBe("22...Ta7?");
  });
});

describe("analysisMachine: tabela de finais (TB-04, TB-05, TB-06)", () => {
  /** Motor falso que avalia qualquer posição sem variante. */
  function plainEngine(): EngineClient {
    return {
      evaluate: async (fen: string) => ({
        fen,
        depth: 18,
        score: { kind: "cp", value: 0 },
        bestMove: null,
        pv: [],
      }),
      cancel: () => {},
    } as unknown as EngineClient;
  }

  function startWith(
    request: AnalysisRequest,
    engine: EngineClient,
    probe: (input: ProbeInput) => Promise<ProbeResult | null>,
  ) {
    const probes: string[] = [];
    const machine = analysisMachine.provide({
      actors: {
        explainGame: fromPromise(async () => explanation),
        probeEndgame: fromPromise<ProbeResult | null, ProbeInput>(async ({ input }) => {
          probes.push(input.fen);
          return probe(input);
        }),
      },
    });
    const actor = createActor(machine, { input: { request, engine } }).start();
    return { actor, probes };
  }

  const krkRequest = (): AnalysisRequest => ({
    game: krkGame(),
    playerColor: "w",
    level: "beginner",
    priorities: [],
  });

  it("sem final com tabela, a etapa não é necessária e a tabela não é consultada", async () => {
    const { actor, probes } = startWith(referenceRequest(), fakeEngine(), async () => null);
    await waitFor(actor, (snapshot) => snapshot.status === "done");
    expect(probes).toEqual([]);
    expect(actor.getSnapshot().output).toMatchObject({ endgame: null, endgameStatus: "skipped" });
  });

  it("consulta a primeira posição do final e guarda o resumo", async () => {
    let release: (result: ProbeResult) => void = () => {};
    const { actor, probes } = startWith(
      krkRequest(),
      plainEngine(),
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    await waitFor(actor, (snapshot) => snapshot.matches("endgame"));
    expect(actor.getSnapshot().context.endgameStatus).toBe("running");
    expect(probes).toEqual(["k7/8/1K6/8/8/8/8/R7 b - - 0 1"]);
    release({ kind: "KRK", strongColor: "w", winner: "w", dtmPlies: 2, mateInMoves: 1 });
    await waitFor(actor, (snapshot) => snapshot.status === "done");
    expect(actor.getSnapshot().output).toMatchObject({
      endgameStatus: "done",
      endgame: { kind: "KRK", playerIsStrong: true, optimalMoves: 1, movesToMate: 1 },
    });
  });

  it("se a tabela falhar, a análise segue sem ela", async () => {
    const { actor } = startWith(krkRequest(), plainEngine(), async () => {
      throw new Error("worker caiu");
    });
    await waitFor(actor, (snapshot) => snapshot.status === "done");
    expect(actor.getSnapshot().output).toMatchObject({
      endgame: null,
      endgameStatus: "failed",
      explanation,
    });
  });

  it("posição fora da tabela na consulta não gera resumo", async () => {
    const { actor } = startWith(krkRequest(), plainEngine(), async () => null);
    await waitFor(actor, (snapshot) => snapshot.status === "done");
    expect(actor.getSnapshot().output).toMatchObject({ endgame: null, endgameStatus: "done" });
  });
});
