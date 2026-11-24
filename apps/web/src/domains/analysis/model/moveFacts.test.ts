import { describe, expect, it } from "vitest";
import type { PositionEvaluation } from "../../evaluation";
import { type Game, type Ply, parseGameText, playMove, replayGame } from "../../game";
import referenceGameHtml from "../../game/fixtures/reference-game.chesscom.html?raw";
import referenceEvaluations from "../fixtures/reference-game.evaluations.json";
import { moveFacts } from "./moveFacts";

const evaluations = referenceEvaluations as PositionEvaluation[];

function reference(): Game {
  const parsed = parseGameText(referenceGameHtml);
  if (parsed.kind !== "parsed") throw new Error("partida inválida");
  const replayed = replayGame(parsed.game);
  if (replayed.kind !== "legal") throw new Error("lance ilegal");
  return replayed.game;
}

const game = reference();
const plyAt = (index: number) => game.plies[index - 1] as Ply;
const factsAt = (index: number) =>
  moveFacts(
    plyAt(index),
    evaluations[index - 1] as PositionEvaluation,
    evaluations[index] as PositionEvaluation,
  );

function evaluation(fen: string, pv: string[], score = 0): PositionEvaluation {
  return { fen, depth: 18, score: { kind: "cp", value: score }, bestMove: pv[0] ?? null, pv };
}

/** Meio-lance artificial a partir de uma posição (para casos fora da partida). */
function plyFrom(fen: string, from: string, to: string): Ply {
  const move = playMove(fen, from, to);
  if (!move) throw new Error(`ilegal ${from}${to}`);
  const color = fen.split(" ")[1] as "w" | "b";
  return {
    index: 1,
    moveNumber: Number(fen.split(" ")[5]),
    color,
    san: move.san,
    from,
    to,
    piece: move.piece as Ply["piece"],
    captured: null,
    promotion: null,
    fenBefore: fen,
    fenAfter: move.fen,
  } as Ply;
}

describe("moveFacts na partida de referência", () => {
  it("22...Ta7: melhor era 22...Bd4+, que dá xeque e salva o bispo de a1 (MR-05, MR-08)", () => {
    const facts = factsAt(44);
    expect(facts.isBest).toBe(false);
    expect(facts.bestMoveLabel).toBe("22...Bd4+");
    expect(facts.bestLine[0]).toBe("Bd4+");
    expect(facts.bestLine.length).toBeGreaterThan(1);
    expect(facts.bestLine.length).toBeLessThanOrEqual(6);
    expect(facts.bestReasons).toMatchObject({
      check: true,
      mateIn: null,
      saves: [{ type: "b", square: "a1" }],
    });
  });

  it("22...Ta7: o bispo de a1 já estava en prise e continuou (MR-07)", () => {
    const facts = factsAt(44);
    expect(facts.stillEnPrise).toEqual([{ type: "b", square: "a1" }]);
    expect(facts.missedMaterial).toBeGreaterThanOrEqual(3);
  });

  it("o melhor lance não perde nada (MR-02)", () => {
    // 12...Bxa1 foi o lance do motor e ganha a torre.
    const facts = factsAt(24);
    expect(facts.isBest).toBe(true);
    expect(facts.missedMaterial).toBe(0);
  });
});

describe("moveFacts em posições montadas", () => {
  it("lista a peça que o lance deixou descoberta (MR-06)", () => {
    // O cavalo de c3 defende o bispo de e4; Cb5 sai e deixa o bispo atacado pela torre.
    const fen = "4r1k1/8/8/8/4B3/2N5/8/6K1 w - - 0 1";
    const ply = plyFrom(fen, "c3", "b5");
    const facts = moveFacts(ply, evaluation(fen, ["g1f2"]), evaluation(ply.fenAfter, ["e8e4"]));
    expect(facts.undefended).toEqual([{ type: "b", square: "e4" }]);
    expect(facts.stillEnPrise).toEqual([]);
    expect(facts.missedMaterial).toBe(3);
  });

  it("aponta mate em N para quem joga e ganho de material na linha (MR-08)", () => {
    // Brancas mateiam em 1 com Th8#.
    const fen = "k7/8/1K6/8/8/8/8/7R w - - 0 1";
    const ply = plyFrom(fen, "h1", "h2");
    const before: PositionEvaluation = {
      fen,
      depth: 20,
      score: { kind: "mate", value: 1 },
      bestMove: "h1h8",
      pv: ["h1h8"],
    };
    const facts = moveFacts(ply, before, evaluation(ply.fenAfter, ["a8b8"]));
    expect(facts.bestMoveLabel).toBe("1.Th8#");
    expect(facts.bestReasons).toMatchObject({ check: true, mateIn: 1, wins: 0 });
  });

  it("sem lance legal no motor, omite o melhor lance (MR-19)", () => {
    const fen = "4k3/8/8/8/8/8/8/4K2R w - - 0 1";
    const ply = plyFrom(fen, "h1", "h2");
    const facts = moveFacts(ply, evaluation(fen, []), evaluation(ply.fenAfter, []));
    expect(facts).toMatchObject({ bestMoveLabel: null, bestLine: [], bestReasons: null });
  });
});
