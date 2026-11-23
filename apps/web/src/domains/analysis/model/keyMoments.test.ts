import { describe, expect, it } from "vitest";
import { findingText, pieceWithArticle } from "./findings";
import { groupPatterns, selectKeyMoments, selectStrengths } from "./keyMoments";
import type { MistakeVerdict, MoveVerdict, StrengthVerdict } from "./types";

function mistake(
  ply: number,
  loss: number,
  mistakeType: MistakeVerdict["mistakeType"] = "other",
): MistakeVerdict {
  return {
    kind: "mistake",
    ply,
    color: "b",
    moveLabel: `${ply}`,
    loss,
    bestMoveSan: null,
    mistakeType,
    lostPiece: null,
  };
}

function strength(ply: number, gain: number): StrengthVerdict {
  return { kind: "strength", ply, color: "b", moveLabel: `${ply}`, gain, wonPiece: null };
}

describe("selectKeyMoments (AN-14)", () => {
  it("fica com os 5 de maior perda, em ordem cronológica", () => {
    const verdicts: MoveVerdict[] = [
      mistake(2, 2),
      mistake(4, 9),
      { kind: "none", ply: 5, color: "w" },
      mistake(6, 3),
      mistake(8, 5),
      mistake(10, 2),
      mistake(12, 4),
      {
        kind: "opponent-mistake",
        ply: 13,
        color: "w",
        moveLabel: "x",
        loss: 9,
        bestMoveSan: null,
        mistakeType: "other",
        lostPiece: null,
      },
    ];
    expect(selectKeyMoments(verdicts).map((moment) => moment.ply)).toEqual([2, 4, 6, 8, 12]);
  });

  it("desempata pela perda mais antiga", () => {
    const verdicts = [2, 4, 6, 8, 10, 12].map((ply) => mistake(ply, 3));
    expect(selectKeyMoments(verdicts).map((moment) => moment.ply)).toEqual([2, 4, 6, 8, 10]);
  });
});

describe("selectStrengths (AN-17)", () => {
  it("fica com até 3 de maior ganho, em ordem cronológica", () => {
    const verdicts = [strength(3, 2), strength(5, 9), strength(7, 3), strength(9, 5)];
    expect(selectStrengths(verdicts).map((item) => item.ply)).toEqual([5, 7, 9]);
  });
});

describe("groupPatterns (AN-16)", () => {
  it("agrupa por tipo, mais frequente primeiro e depois o mais antigo", () => {
    const moments = [
      mistake(10, 3, "other"),
      mistake(20, 3, "hanging-piece"),
      mistake(30, 3, "defender-moved"),
      mistake(40, 3, "hanging-piece"),
      mistake(50, 3, "defender-moved"),
    ];
    expect(groupPatterns(moments)).toEqual([
      { mistakeType: "hanging-piece", count: 2, plies: [20, 40] },
      { mistakeType: "defender-moved", count: 2, plies: [30, 50] },
      { mistakeType: "other", count: 1, plies: [10] },
    ]);
  });
});

describe("findingText (AN-15)", () => {
  it("descreve o erro do jogador com a peça e a casa", () => {
    expect(
      findingText({ ...mistake(44, 3, "hanging-piece"), lostPiece: { type: "b", square: "a1" } }),
    ).toBe("deixou o bispo em a1 ser capturado");
    expect(findingText({ ...mistake(112, 5), lostPiece: { type: "r", square: "e4" } })).toBe(
      "deixou a torre em e4 ser capturada",
    );
  });

  it("descreve o erro do adversário", () => {
    expect(
      findingText({
        kind: "opponent-mistake",
        ply: 23,
        color: "w",
        moveLabel: "12.Ce2",
        loss: 5,
        bestMoveSan: "Bb2",
        mistakeType: "other",
        lostPiece: { type: "r", square: "a1" },
      }),
    ).toBe("o adversário deixou a torre em a1 ser capturada");
  });

  it("descreve o ganho", () => {
    expect(findingText({ ...strength(24, 5), wonPiece: { type: "r", square: "a1" } })).toBe(
      "ganhou a torre em a1",
    );
  });

  it("usa textos genéricos sem peça identificada", () => {
    expect(findingText(mistake(2, 3))).toBe("perdeu material");
    expect(findingText({ ...mistake(2, 3), kind: "opponent-mistake" })).toBe(
      "o adversário perdeu material",
    );
    expect(findingText(strength(2, 3))).toBe("ganhou material");
    expect(findingText({ kind: "none", ply: 1, color: "w" })).toBeNull();
  });

  it("concorda o artigo com a peça", () => {
    expect(pieceWithArticle({ type: "q", square: "d8" })).toBe("a dama em d8");
    expect(pieceWithArticle({ type: "p", square: "e5" })).toBe("o peão em e5");
  });
});
