import { describe, expect, it } from "vitest";
import type { ProbeResult } from "../../evaluation";
import { generateTable, probe } from "../../evaluation";
import { parseGameText, replayGame } from "../../game";
import krkMate from "../fixtures/krk-mate.txt?raw";
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

describe("partida real que chega a KRK (TB-05, TB-07)", () => {
  it("as pretas dão mate em 10 lances, o mesmo que o ideal da tabela", () => {
    const parsed = parseGameText(krkMate);
    if (parsed.kind !== "parsed") throw new Error("partida inválida");
    const replayed = replayGame(parsed.game);
    if (replayed.kind !== "legal") throw new Error("lance ilegal");
    const game = replayed.game;
    const start = findEndgameStart(game);
    expect(start).toMatchObject({ position: 88, kind: "KRK", strongColor: "b" });
    if (!start) throw new Error("sem final");
    const probed = probe(generateTable("KRK"), start.fen);
    if (!probed) throw new Error("fora da tabela");
    expect(summarizeEndgame(game, start, probed, "b")).toMatchObject({
      playerIsStrong: true,
      winner: "b",
      optimalMoves: 10,
      movesToMate: 10,
    });
  }, 30_000);
});
