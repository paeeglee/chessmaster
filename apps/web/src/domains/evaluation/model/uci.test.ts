import { describe, expect, it } from "vitest";
import { MIN_DEPTH, MOVETIME_MS, needsDeeperSearch } from "./searchPlan";
import { parseBestMove, parseInfoLine, sideToMoveOf, toWhitePerspective } from "./uci";

describe("parseInfoLine", () => {
  it("lê profundidade, pontuação em centipeões e variante principal", () => {
    expect(
      parseInfoLine(
        "info depth 12 seldepth 16 multipv 1 score cp 35 nodes 12345 nps 61725 hashfull 3 tbhits 0 time 200 pv e2e4 e7e5 g1f3",
      ),
    ).toEqual({ depth: 12, score: { kind: "cp", value: 35 }, pv: ["e2e4", "e7e5", "g1f3"] });
  });

  it("lê pontuação de mate, inclusive negativa", () => {
    expect(parseInfoLine("info depth 5 seldepth 5 multipv 1 score mate -2 pv d8h4")).toEqual({
      depth: 5,
      score: { kind: "mate", value: -2 },
      pv: ["d8h4"],
    });
  });

  it("lê a posição sem lances (mate 0) sem variante", () => {
    expect(parseInfoLine("info depth 0 score mate 0")).toEqual({
      depth: 0,
      score: { kind: "mate", value: 0 },
      pv: [],
    });
  });

  it.each([
    "info string NNUE evaluation using nn-1c0000000000.nnue enabled",
    "info depth 14 currmove e2e4 currmovenumber 1",
    "readyok",
    "info depth 3 score wdl 500 400 100",
  ])("ignora linhas sem pontuação exata: %s (EVAL-19)", (line) => {
    expect(parseInfoLine(line)).toBeNull();
  });

  it.each([
    "info depth 18 seldepth 22 score cp 41 lowerbound nodes 1 pv e2e4",
    "info depth 18 seldepth 22 score cp 12 upperbound nodes 1 pv e2e4",
  ])("ignora pontuações de limite (EVAL-20): %s", (line) => {
    expect(parseInfoLine(line)).toBeNull();
  });
});

describe("parseBestMove", () => {
  it("lê o melhor lance e ignora o ponder", () => {
    expect(parseBestMove("bestmove e2e4 ponder e7e5")).toEqual({ bestMove: "e2e4" });
  });

  it("devolve null quando não há lance legal (EVAL-15)", () => {
    expect(parseBestMove("bestmove (none)")).toEqual({ bestMove: null });
  });

  it("não lê outras linhas", () => {
    expect(parseBestMove("info depth 1 score cp 0")).toBeUndefined();
  });
});

describe("pontuação do ponto de vista das brancas (EVAL-14)", () => {
  const blackToMove = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
  const whiteToMove = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  it("lê o lado a jogar do FEN", () => {
    expect(sideToMoveOf(blackToMove)).toBe("b");
    expect(sideToMoveOf(whiteToMove)).toBe("w");
  });

  it("inverte o sinal com as pretas a jogar", () => {
    expect(toWhitePerspective({ kind: "cp", value: 35 }, "b")).toEqual({ kind: "cp", value: -35 });
    expect(toWhitePerspective({ kind: "mate", value: 3 }, "b")).toEqual({
      kind: "mate",
      value: -3,
    });
  });

  it("mantém o sinal com as brancas a jogar", () => {
    expect(toWhitePerspective({ kind: "cp", value: -80 }, "w")).toEqual({
      kind: "cp",
      value: -80,
    });
  });

  it("não gera -0", () => {
    expect(Object.is(toWhitePerspective({ kind: "cp", value: 0 }, "b").value, 0)).toBe(true);
  });
});

describe("plano de busca (D1)", () => {
  it("usa 500 ms por posição e profundidade mínima 12", () => {
    expect(MOVETIME_MS).toBe(500);
    expect(MIN_DEPTH).toBe(12);
  });

  it("pede busca mais funda só abaixo da profundidade 12 (EVAL-13)", () => {
    expect(needsDeeperSearch(11)).toBe(true);
    expect(needsDeeperSearch(12)).toBe(false);
    expect(needsDeeperSearch(20)).toBe(false);
  });
});
