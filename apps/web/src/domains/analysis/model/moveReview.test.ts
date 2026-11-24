import { describe, expect, it } from "vitest";
import type { PositionEvaluation } from "../../evaluation";
import { type Game, parseGameText, replayGame } from "../../game";
import referenceGameHtml from "../../game/fixtures/reference-game.chesscom.html?raw";
import referenceEvaluations from "../fixtures/reference-game.evaluations.json";
import { classifyGame } from "./classify";
import { applyMaterialFloor, reviewMoves } from "./moveReview";

const evaluations = referenceEvaluations as PositionEvaluation[];

function reference(): Game {
  const parsed = parseGameText(referenceGameHtml);
  if (parsed.kind !== "parsed") throw new Error("partida inválida");
  const replayed = replayGame(parsed.game);
  if (replayed.kind !== "legal") throw new Error("lance ilegal");
  return replayed.game;
}

const game = reference();
const reviews = reviewMoves(game, evaluations, classifyGame(game, evaluations, "b"));

describe("reviewMoves na partida de referência (MR-01)", () => {
  it("revisa todos os 144 meio-lances, dos dois lados, em ordem", () => {
    expect(reviews).toHaveLength(144);
    expect(reviews.map((review) => review.ply)).toEqual(game.plies.map((ply) => ply.index));
    expect(reviews[0]).toMatchObject({ ply: 1, color: "w", moveLabel: "1.d4" });
  });

  it("22...Ta7 é Erro (perdeu o bispo, piso de material), com 22...Bd4+ como melhor lance", () => {
    const review = reviews[43];
    expect(review?.moveLabel).toBe("22...Ta7");
    expect(review?.quality).toBe("mistake");
    expect(review?.facts.bestMoveLabel).toBe("22...Bd4+");
  });

  it("os cinco momentos-chave são no mínimo Erro e os de perda ≥ 5 são Capivarada (MR-20)", () => {
    const keyPlies = [44, 54, 82, 86, 112];
    for (const ply of keyPlies) {
      expect(["mistake", "blunder", "miss"]).toContain(reviews[ply - 1]?.quality);
    }
    expect(reviews[85]).toMatchObject({ moveLabel: "43...Te6", quality: "blunder" });
  });

  it("o lance do motor é Melhor e o mate final vale 100 para quem mateou (MR-02, MR-18)", () => {
    expect(reviews[23]).toMatchObject({ moveLabel: "12...Bxa1", quality: "best" });
    expect(reviews.at(-1)).toMatchObject({ moveLabel: "72...Ta6#", winAfter: 100 });
  });

  it("as chances de vitória ficam entre 0 e 100 e a perda nunca é negativa", () => {
    for (const review of reviews) {
      expect(review.winBefore).toBeGreaterThanOrEqual(0);
      expect(review.winAfter).toBeLessThanOrEqual(100);
      expect(review.loss).toBeGreaterThanOrEqual(0);
    }
  });

  it("para quando falta avaliação e afoga vale 50 (MR-18)", () => {
    expect(reviewMoves(game, evaluations.slice(0, 11))).toHaveLength(10);
    const stalemate = { ...game, termination: "stalemate" as const };
    expect(reviewMoves(stalemate, evaluations).at(-1)?.winAfter).toBe(50);
  });
});

describe("applyMaterialFloor (MR-20)", () => {
  const mistake = (loss: number) =>
    ({
      kind: "mistake",
      ply: 1,
      color: "b",
      moveLabel: "1...e5",
      loss,
      bestMoveSan: null,
      mistakeType: "other",
      lostPiece: null,
      materialBefore: 0,
      materialAfter: -loss,
    }) as const;

  it("sobe para Erro ou Capivarada conforme a perda de material", () => {
    expect(applyMaterialFloor("excellent", mistake(3))).toBe("mistake");
    expect(applyMaterialFloor("good", mistake(5))).toBe("blunder");
    expect(applyMaterialFloor("blunder", mistake(2))).toBe("blunder");
  });

  it("mantém Perdeu a chance e lances sem perda de material", () => {
    expect(applyMaterialFloor("miss", mistake(9))).toBe("miss");
    expect(applyMaterialFloor("excellent", undefined)).toBe("excellent");
    expect(applyMaterialFloor("good", { kind: "none", ply: 1, color: "w" })).toBe("good");
  });
});
