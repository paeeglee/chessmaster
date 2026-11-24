import { describe, expect, it } from "vitest";
import type { ProbeResult } from "../../evaluation";
import { krkGame } from "../fixtures/krkGame";
import { findEndgameStart, summarizeEndgame } from "./endgame";

const probed: ProbeResult = {
  kind: "KRK",
  strongColor: "w",
  winner: "w",
  dtmPlies: 2,
  mateInMoves: 1,
};

describe("findEndgameStart (TB-04)", () => {
  it("acha a primeira posição com rei e torre contra rei", () => {
    expect(findEndgameStart(krkGame())).toEqual({
      position: 1,
      fen: "k7/8/1K6/8/8/8/8/R7 b - - 0 1",
      kind: "KRK",
      strongColor: "w",
    });
  });

  it("devolve null quando a partida não chega à tabela", () => {
    const game = krkGame();
    expect(findEndgameStart({ ...game, plies: game.plies.slice(0, 0) })).toBeNull();
  });
});

describe("summarizeEndgame (TB-05)", () => {
  it("conta os lances do lado forte até o mate e compara com o ideal", () => {
    const game = krkGame();
    const start = findEndgameStart(game);
    if (!start) throw new Error("sem final");
    expect(summarizeEndgame(game, start, probed, "w")).toEqual({
      kind: "KRK",
      position: 1,
      strongColor: "w",
      playerIsStrong: true,
      winner: "w",
      optimalMoves: 1,
      movesToMate: 1,
    });
    expect(summarizeEndgame(game, start, probed, "b").playerIsStrong).toBe(false);
  });

  it("sem mate do lado forte, não conta lances", () => {
    const game = krkGame();
    const start = findEndgameStart(game);
    if (!start) throw new Error("sem final");
    const unfinished = { ...game, plies: game.plies.slice(0, 2), termination: null };
    expect(summarizeEndgame(unfinished, start, probed, "w").movesToMate).toBeNull();
  });
});
