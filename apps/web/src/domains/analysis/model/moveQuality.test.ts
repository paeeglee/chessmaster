import { describe, expect, it } from "vitest";
import {
  classifyQuality,
  MOVE_QUALITY_LABEL,
  sideToMoveOf,
  winChance,
  winChanceLoss,
} from "./moveQuality";

describe("winChance (MR-03)", () => {
  it("vale 50 com avaliação zero e é simétrica entre as cores", () => {
    expect(winChance({ kind: "cp", value: 0 }, "w")).toBe(50);
    const white = winChance({ kind: "cp", value: 300 }, "w");
    expect(white).toBeCloseTo(75.15, 1);
    expect(winChance({ kind: "cp", value: 300 }, "b")).toBeCloseTo(100 - white, 6);
  });

  it("mate a favor vale 100 e contra vale 0", () => {
    expect(winChance({ kind: "mate", value: 3 }, "w")).toBe(100);
    expect(winChance({ kind: "mate", value: 3 }, "b")).toBe(0);
    expect(winChance({ kind: "mate", value: -2 }, "w")).toBe(0);
    expect(winChance({ kind: "mate", value: -2 }, "b")).toBe(100);
  });

  it("mate 0: quem está na vez levou o mate", () => {
    expect(winChance({ kind: "mate", value: 0 }, "w", "b")).toBe(100);
    expect(winChance({ kind: "mate", value: 0 }, "b", "b")).toBe(0);
    expect(winChance({ kind: "mate", value: 0 }, "w", "w")).toBe(0);
    expect(winChance({ kind: "mate", value: 0 }, "b", "w")).toBe(100);
  });

  it("lê o lado a jogar do FEN", () => {
    expect(sideToMoveOf("8/8/8/8/8/8/8/K6k b - - 0 1")).toBe("b");
    expect(sideToMoveOf("8/8/8/8/8/8/8/K6k w - - 0 1")).toBe("w");
  });

  it("a perda nunca é negativa", () => {
    expect(winChanceLoss(40, 55)).toBe(0);
    expect(winChanceLoss(70, 52)).toBe(18);
  });
});

describe("classifyQuality (MR-01, MR-02, MR-04)", () => {
  const quality = (loss: number, isBest = false, previousLoss: number | null = 0) =>
    classifyQuality({ loss, isBest, previousLoss });

  it("o melhor lance do motor é Melhor, mesmo com ruído na avaliação", () => {
    expect(quality(3, true)).toBe("best");
  });

  it("outro lance sem perda é Excelente, nunca Melhor (MR-02)", () => {
    expect(quality(0)).toBe("excellent");
  });

  it("usa as faixas 2 / 5 / 10 / 20 nos limites exatos", () => {
    expect(quality(1.99)).toBe("excellent");
    expect(quality(2)).toBe("good");
    expect(quality(4.99)).toBe("good");
    expect(quality(5)).toBe("inaccuracy");
    expect(quality(9.99)).toBe("inaccuracy");
    expect(quality(10)).toBe("mistake");
    expect(quality(19.99)).toBe("mistake");
    expect(quality(20)).toBe("blunder");
  });

  it("depois de um erro do adversário, devolver 10 ou mais é Perdeu a chance", () => {
    expect(quality(10, false, 10)).toBe("miss");
    expect(quality(25, false, 30)).toBe("miss");
    expect(quality(9.99, false, 30)).toBe("inaccuracy");
    expect(quality(15, false, 9.99)).toBe("mistake");
    expect(quality(15, false, null)).toBe("mistake");
    expect(quality(15, true, 30)).toBe("best");
  });

  it("tem rótulo em português para cada classificação", () => {
    expect(Object.values(MOVE_QUALITY_LABEL)).toEqual([
      "Melhor",
      "Excelente",
      "Bom",
      "Imprecisão",
      "Erro",
      "Capivarada",
      "Perdeu a chance",
    ]);
  });
});
