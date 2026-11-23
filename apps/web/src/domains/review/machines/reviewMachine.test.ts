import { afterEach, describe, expect, it, vi } from "vitest";
import { createActor, createMachine, fromPromise, waitFor } from "xstate";
import type { GameExplanation, QuestionAnswer } from "../../explanation";
import { referenceResult } from "../fixtures/referenceResult";
import { LINE_STEP_MS, reviewMachine } from "./reviewMachine";

const explanation: GameExplanation = {
  verdict: "Vitória.",
  patterns_sentence: "p",
  key_moments: [],
  strengths: [],
  next_game_habit: "h",
};

function start(
  options: {
    aiFailed?: boolean;
    answer?: () => Promise<QuestionAnswer>;
    explain?: () => Promise<GameExplanation>;
  } = {},
) {
  const machine = reviewMachine.provide({
    actors: {
      askQuestion: fromPromise(
        options.answer ?? (async () => ({ answer: "Sim.", in_scope: true })),
      ),
      explainGame: fromPromise(options.explain ?? (async () => explanation)),
    },
  });
  return createActor(machine, {
    input: referenceResult({ aiFailed: options.aiFailed ?? false }),
  }).start();
}

afterEach(() => {
  vi.useRealTimers();
});

describe("reviewMachine: navegação", () => {
  it("abre antes do primeiro momento, pelo lado do jogador, com ele expandido (RV-05)", () => {
    const actor = start();
    expect(actor.getSnapshot().context).toMatchObject({
      position: 43,
      orientation: "b",
      expandedPly: 44,
    });
  });

  it("anda pelos lances sem passar dos limites (RV-06)", () => {
    const actor = start();
    actor.send({ type: "POSITION.NEXT" });
    expect(actor.getSnapshot().context.position).toBe(44);
    actor.send({ type: "POSITION.PREVIOUS" });
    actor.send({ type: "POSITION.PREVIOUS" });
    expect(actor.getSnapshot().context.position).toBe(42);
    actor.send({ type: "POSITION.FIRST" });
    actor.send({ type: "POSITION.PREVIOUS" });
    expect(actor.getSnapshot().context.position).toBe(0);
    actor.send({ type: "POSITION.LAST" });
    actor.send({ type: "POSITION.NEXT" });
    expect(actor.getSnapshot().context.position).toBe(144);
    actor.send({ type: "POSITION.SELECT", position: 500 });
    expect(actor.getSnapshot().context.position).toBe(144);
  });

  it("gira o tabuleiro (RV-06)", () => {
    const actor = start();
    actor.send({ type: "BOARD.FLIP" });
    expect(actor.getSnapshot().context.orientation).toBe("w");
  });

  it("escolher um momento sincroniza posição e item expandido (RV-10)", () => {
    const actor = start();
    actor.send({ type: "MOMENT.SELECT", ply: 86 });
    expect(actor.getSnapshot().context).toMatchObject({ position: 85, expandedPly: 86 });
  });
});

describe("reviewMachine: linha do motor (RV-13)", () => {
  it("anda a linha depois do erro, até 6 meios-lances", () => {
    vi.useFakeTimers();
    const actor = start();
    actor.send({ type: "MOMENT.SHOW_LINE", ply: 44 });
    const line = actor.getSnapshot().context.line;
    expect(actor.getSnapshot().context.position).toBe(44);
    expect(line?.fens.length).toBeGreaterThan(0);
    expect(line?.fens.length).toBeLessThanOrEqual(6);
    expect(line?.step).toBe(0);
    vi.advanceTimersByTime(LINE_STEP_MS);
    expect(actor.getSnapshot().context.line?.step).toBe(1);
    vi.advanceTimersByTime(LINE_STEP_MS * 10);
    expect(actor.getSnapshot().context.line?.step).toBe(line?.fens.length);
    expect(actor.getSnapshot().matches({ board: "browsing" })).toBe(true);
  });

  it("navegar interrompe a linha", () => {
    vi.useFakeTimers();
    const actor = start();
    actor.send({ type: "MOMENT.SHOW_LINE", ply: 44 });
    actor.send({ type: "POSITION.NEXT" });
    expect(actor.getSnapshot().context.line).toBeNull();
    expect(actor.getSnapshot().matches({ board: "browsing" })).toBe(true);
  });
});

describe("reviewMachine: perguntas (RV-16, RV-17)", () => {
  it("pergunta e guarda a resposta", async () => {
    const actor = start();
    actor.send({ type: "QUESTION.ASK", question: "  Por que perdi?  " });
    expect(actor.getSnapshot().context.questions).toEqual([
      { id: 1, question: "Por que perdi?", status: "pending", answer: null, inScope: true },
    ]);
    await waitFor(actor, (snapshot) => snapshot.matches({ questions: "idle" }));
    expect(actor.getSnapshot().context.questions[0]).toMatchObject({
      status: "answered",
      answer: "Sim.",
      inScope: true,
    });
  });

  it("marca a falha", async () => {
    const actor = start({
      answer: async () => {
        throw new Error("503");
      },
    });
    actor.send({ type: "QUESTION.ASK", question: "Oi?" });
    await waitFor(actor, (snapshot) => snapshot.matches({ questions: "idle" }));
    expect(actor.getSnapshot().context.questions[0]?.status).toBe("failed");
  });

  it("ignora pergunta vazia", () => {
    const actor = start();
    actor.send({ type: "QUESTION.ASK", question: "   " });
    expect(actor.getSnapshot().context.questions).toEqual([]);
  });
});

describe("reviewMachine: IA indisponível (RV-03)", () => {
  it("tenta de novo e guarda a explicação", async () => {
    const actor = start({ aiFailed: true });
    actor.send({ type: "AI.RETRY" });
    expect(actor.getSnapshot().matches({ explanation: "retrying" })).toBe(true);
    await waitFor(actor, (snapshot) => snapshot.matches({ explanation: "idle" }));
    expect(actor.getSnapshot().context.result).toMatchObject({ explanation, aiFailed: false });
  });

  it("continua sem explicação se falhar de novo", async () => {
    const actor = start({
      aiFailed: true,
      explain: async () => {
        throw new Error("503");
      },
    });
    actor.send({ type: "AI.RETRY" });
    await waitFor(actor, (snapshot) => snapshot.matches({ explanation: "idle" }));
    expect(actor.getSnapshot().context.result.aiFailed).toBe(true);
  });

  it("não tenta de novo quando a IA respondeu", () => {
    const actor = start();
    actor.send({ type: "AI.RETRY" });
    expect(actor.getSnapshot().matches({ explanation: "idle" })).toBe(true);
  });
});

describe("reviewMachine: eventos para a máquina raiz (RV-12, RV-19)", () => {
  function startInsideParent() {
    const received: string[] = [];
    const parent = createMachine({
      invoke: { id: "review", src: reviewMachine, input: referenceResult() },
      on: {
        "*": { actions: ({ event }) => received.push(JSON.stringify(event)) },
      },
    });
    const actor = createActor(parent).start();
    const review = actor.getSnapshot().children.review as ReturnType<typeof start>;
    return { review, received };
  }

  it("pede confirmação antes de analisar outra partida", () => {
    const { review, received } = startInsideParent();
    review.send({ type: "NEW_GAME.REQUEST" });
    expect(review.getSnapshot().matches({ newGame: "confirming" })).toBe(true);
    review.send({ type: "NEW_GAME.CANCEL" });
    expect(received).toEqual([]);
    review.send({ type: "NEW_GAME.REQUEST" });
    review.send({ type: "NEW_GAME.CONFIRM" });
    expect(received).toEqual([JSON.stringify({ type: "REVIEW.NEW_GAME" })]);
  });

  it("pede o treino de um momento", () => {
    const { review, received } = startInsideParent();
    review.send({ type: "TRAINING.START", ply: 86 });
    expect(received).toEqual([JSON.stringify({ type: "TRAINING.REQUESTED", ply: 86 })]);
  });
});
