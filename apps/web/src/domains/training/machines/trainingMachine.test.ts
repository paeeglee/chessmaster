import { describe, expect, it, vi } from "vitest";
import { createActor, fromPromise, sendTo, setup } from "xstate";
import type { PositionEvaluation } from "../../evaluation";
import { referenceResult } from "../../review/fixtures/referenceResult";
import { type EvaluateInput, REFUTATION_MS, trainingMachine } from "./trainingMachine";

const result = referenceResult();

function evaluation(fen: string, pv: string[]): PositionEvaluation {
  return { fen, depth: 18, score: { kind: "cp", value: 0 }, bestMove: pv[0] ?? null, pv };
}

/** Motor falso: a variante depende do lance tentado (pela casa de destino). */
function fakeEngine(lines: Record<string, string[]>, fail = false) {
  const calls: string[] = [];
  const actor = fromPromise<PositionEvaluation, EvaluateInput>(async ({ input }) => {
    calls.push(input.fen);
    if (fail) throw new Error("motor caiu");
    const key = Object.keys(lines).find((fen) => input.fen.startsWith(fen));
    // Sem variante combinada para a posição, o teste está errado: falha alto.
    if (!key) throw new Error(`posição sem variante no teste: ${input.fen}`);
    return evaluation(input.fen, lines[key] as string[]);
  });
  return { actor, calls };
}

function start(
  lines: Record<string, string[]> = {},
  options: { fail?: boolean; ply?: number } = {},
) {
  const engine = fakeEngine(lines, options.fail);
  const machine = trainingMachine.provide({ actors: { evaluateAttempt: engine.actor } });
  const actor = createActor(machine, {
    input: { result, ply: options.ply ?? 44, engine: null },
  }).start();
  return { actor, engine };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
// Peças das posições depois de cada tentativa no momento 1.
const AFTER_TE6 = "r7/5kpp/p1p1rn2/8/1Pp1pPbP/P5N1/3B1KP1/b6R w";
const AFTER_BD4 = "r3r3/5kpp/p1p2n2/8/1PpbpPbP/P5N1/3B1KP1/7R w";
const AFTER_BB2 = "r3r3/5kpp/p1p2n2/8/1Pp1pPbP/P5N1/1b1B1KP1/7R w";
const AFTER_TA7 = "4r3/r4kpp/p1p2n2/8/1Pp1pPbP/P5N1/3B1KP1/b6R w";
const LINES = {
  [AFTER_TE6]: ["h1a1", "e6e2"],
  [AFTER_BD4]: ["f2f1", "d4b2", "d2c3", "b2c3"],
  [AFTER_BB2]: ["h1b1", "b2a3"],
  [AFTER_TA7]: ["h1a1", "a7d7"],
};

function play(actor: ReturnType<typeof start>["actor"], from: string, to: string) {
  actor.send({ type: "SQUARE.CLICK", square: from });
  actor.send({ type: "SQUARE.CLICK", square: to });
}

describe("trainingMachine", () => {
  it("abre no momento pedido com a posição anterior ao erro (TR-01)", () => {
    const { actor } = start({}, { ply: 86 });
    const { context } = actor.getSnapshot();
    expect(context.index).toBe(3);
    expect(context.moments).toEqual(result.keyMoments.map((moment) => moment.ply));
    expect(context.fen).toBe(context.exercise.ply.fenBefore);
    expect(actor.getSnapshot().value).toBe("playing");
  });

  it("começa no primeiro momento quando o meio-lance não é de um momento", () => {
    const { actor } = start({}, { ply: 3 });
    expect(actor.getSnapshot().context.index).toBe(0);
  });

  it("seleciona a peça e mostra os destinos legais; casa inválida limpa (TR-03)", () => {
    const { actor } = start();
    actor.send({ type: "SQUARE.CLICK", square: "a1" });
    expect(actor.getSnapshot().context.selected).toBe("a1");
    expect(actor.getSnapshot().context.destinations).toContain("d4");
    // Peça do adversário e casa ilegal não fazem lance.
    actor.send({ type: "SQUARE.CLICK", square: "h8" });
    expect(actor.getSnapshot().context).toMatchObject({ selected: null, destinations: [] });
    actor.send({ type: "SQUARE.CLICK", square: "d2" });
    expect(actor.getSnapshot().context.selected).toBeNull();
    expect(actor.getSnapshot().value).toBe("playing");
    // Clicar de novo na peça selecionada tira a seleção.
    actor.send({ type: "SQUARE.CLICK", square: "a1" });
    actor.send({ type: "SQUARE.CLICK", square: "a1" });
    expect(actor.getSnapshot().context.selected).toBeNull();
  });

  it("refuta 22...Te6 com 23.Txa1 e volta à posição inicial (TR-05, T-04)", async () => {
    vi.useFakeTimers();
    try {
      const { actor, engine } = start(LINES);
      play(actor, "e8", "e6");
      expect(actor.getSnapshot().value).toBe("checking");
      await vi.advanceTimersByTimeAsync(0);
      expect(engine.calls).toEqual([expect.stringMatching(new RegExp(`^${AFTER_TE6}`))]);
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("refuting");
      expect(snapshot.context.feedback).toMatchObject({
        kind: "wrong",
        attempt: 1,
        result: { label: "22...Te6", replyLabel: "23.Txa1" },
      });
      expect(snapshot.context.lastMove).toEqual({ from: "h1", to: "a1" });
      expect(snapshot.context.fen).toMatch(/^r7\/5kpp\/p1p1rn2\/8\/1Pp1pPbP\/P5N1\/3B1KP1\/R7 b/);
      // T-04: a resposta fica 1,2 s no tabuleiro.
      expect(REFUTATION_MS).toBe(1200);
      await vi.advanceTimersByTimeAsync(1199);
      expect(actor.getSnapshot().value).toBe("refuting");
      await vi.advanceTimersByTimeAsync(1);
      expect(actor.getSnapshot().value).toBe("playing");
      expect(actor.getSnapshot().context.fen).toBe(
        actor.getSnapshot().context.exercise.ply.fenBefore,
      );
      // A mensagem da tentativa continua visível.
      expect(actor.getSnapshot().context.feedback?.kind).toBe("wrong");
    } finally {
      vi.useRealTimers();
    }
  });

  it("numera as tentativas erradas (TR-05)", async () => {
    const { actor } = start(LINES);
    play(actor, "e8", "e6");
    await flush();
    actor.send({ type: "UNDO" });
    play(actor, "a8", "a7");
    await flush();
    expect(actor.getSnapshot().context.feedback).toMatchObject({ kind: "wrong", attempt: 2 });
  });

  it("Desfazer volta na hora durante a refutação (TR-09)", async () => {
    const { actor } = start(LINES);
    play(actor, "e8", "e6");
    await flush();
    expect(actor.getSnapshot().value).toBe("refuting");
    actor.send({ type: "UNDO" });
    expect(actor.getSnapshot().value).toBe("playing");
    expect(actor.getSnapshot().context).toMatchObject({ attempts: 1, lastMove: null });
  });

  it("aceita 22...Bd4+ de primeira (TR-07, TR-10)", async () => {
    const { actor } = start(LINES);
    play(actor, "a1", "d4");
    await flush();
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe("solved");
    expect(snapshot.context.feedback).toMatchObject({
      kind: "correct",
      result: { label: "22...Bd4+" },
    });
    expect(snapshot.context.outcomes).toEqual({ 44: "first-try" });
  });

  it("aceita 22...Bb2 depois de uma tentativa errada: com dica (T-03, TR-10)", async () => {
    const { actor } = start(LINES);
    play(actor, "a8", "a7");
    await flush();
    expect(actor.getSnapshot().context.feedback).toMatchObject({
      kind: "wrong",
      result: { repeatedGameMove: true },
    });
    actor.send({ type: "UNDO" });
    play(actor, "a1", "b2");
    await flush();
    expect(actor.getSnapshot().value).toBe("solved");
    expect(actor.getSnapshot().context.outcomes).toEqual({ 44: "with-hint" });
  });

  it("revela as dicas em ordem e para no nível 2 (TR-08)", async () => {
    const { actor } = start(LINES);
    actor.send({ type: "HINT.REQUEST" });
    expect(actor.getSnapshot().context.hintLevel).toBe(1);
    actor.send({ type: "HINT.REQUEST" });
    actor.send({ type: "HINT.REQUEST" });
    expect(actor.getSnapshot().context.hintLevel).toBe(2);
    play(actor, "a1", "d4");
    await flush();
    expect(actor.getSnapshot().context.outcomes).toEqual({ 44: "with-hint" });
  });

  it("mostra a solução e registra 'viu a solução' (TR-08)", () => {
    const { actor } = start();
    actor.send({ type: "SQUARE.CLICK", square: "a1" });
    actor.send({ type: "SOLUTION.SHOW" });
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe("solutionShown");
    expect(snapshot.context).toMatchObject({
      feedback: { kind: "solution" },
      selected: null,
      outcomes: { 44: "saw-solution" },
    });
  });

  it("falha do motor avisa e não conta tentativa (TR-14)", async () => {
    const { actor } = start({}, { fail: true });
    play(actor, "a1", "d4");
    await flush();
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe("playing");
    expect(snapshot.context).toMatchObject({ feedback: { kind: "error" }, attempts: 0 });
    expect(snapshot.context.fen).toBe(snapshot.context.exercise.ply.fenBefore);
  });

  it("passa por todos os momentos e termina (TR-11)", () => {
    const { actor } = start();
    for (let index = 0; index < result.keyMoments.length; index++) {
      expect(actor.getSnapshot().context.index).toBe(index);
      actor.send({ type: "SOLUTION.SHOW" });
      actor.send({ type: "MOMENT.NEXT" });
    }
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe("finished");
    expect(Object.values(snapshot.context.outcomes)).toHaveLength(result.keyMoments.length);
  });

  it("próximo momento depois de acertar zera tentativas e dicas", async () => {
    const { actor } = start(LINES);
    actor.send({ type: "HINT.REQUEST" });
    play(actor, "a1", "d4");
    await flush();
    actor.send({ type: "MOMENT.NEXT" });
    expect(actor.getSnapshot().context).toMatchObject({
      index: 1,
      attempts: 0,
      hintLevel: 0,
      feedback: null,
    });
  });

  it("acertar o último momento leva ao resumo", async () => {
    const last = result.keyMoments.at(-1)?.ply as number;
    const { actor } = start({}, { ply: last });
    actor.send({ type: "SOLUTION.SHOW" });
    actor.send({ type: "MOMENT.NEXT" });
    expect(actor.getSnapshot().value).toBe("finished");
  });

  it("Voltar ao resultado avisa a máquina raiz (TR-12)", () => {
    const received: string[] = [];
    const parent = setup({
      actors: { training: trainingMachine },
    }).createMachine({
      invoke: { id: "child", src: "training", input: { result, ply: 44, engine: null } },
      on: {
        "TRAINING.BACK": { actions: ({ event }) => received.push(event.type) },
        FORWARD: { actions: sendTo("child", { type: "TRAINING.BACK" }) },
      },
    });
    const actor = createActor(parent).start();
    actor.send({ type: "FORWARD" });
    expect(received).toEqual(["TRAINING.BACK"]);
  });

  it("o ator padrão usa o motor e falha sem ele", async () => {
    const evaluate = vi.fn(async (fen: string) => evaluation(fen, ["h1b1"]));
    const machine = createActor(trainingMachine, {
      input: { result, ply: 44, engine: { evaluate } as never },
    }).start();
    play(machine, "a1", "b2");
    await flush();
    expect(evaluate).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^${AFTER_BB2}`)));
    expect(machine.getSnapshot().value).toBe("solved");

    const without = createActor(trainingMachine, {
      input: { result, ply: 44, engine: null },
    }).start();
    play(without, "a1", "b2");
    await flush();
    expect(without.getSnapshot().context.feedback).toEqual({ kind: "error" });
  });
});
