import { describe, expect, it } from "vitest";
import { describePieces, formatMoveLabel, listPieces, summarizeMaterial } from "./describe";

const FINAL = "K7/2k5/r7/1p6/1p6/8/8/8 w - - 0 73";

describe("formatMoveLabel", () => {
  it("usa reticências para as pretas e notação portuguesa", () => {
    expect(formatMoveLabel({ moveNumber: 72, color: "b", san: "Ra6#" })).toBe("72...Ta6#");
    expect(formatMoveLabel({ moveNumber: 12, color: "w", san: "Ne2" })).toBe("12.Ce2");
  });
});

describe("listPieces", () => {
  it("lê casas e cores do FEN, com os reis primeiro", () => {
    expect(listPieces(FINAL)).toEqual([
      { square: "a8", color: "w", type: "k" },
      { square: "c7", color: "b", type: "k" },
      { square: "a6", color: "b", type: "r" },
      { square: "b4", color: "b", type: "p" },
      { square: "b5", color: "b", type: "p" },
    ]);
  });
});

describe("describePieces", () => {
  it("descreve cada peça com cor e casa, concordando o gênero", () => {
    expect(describePieces(FINAL)).toBe(
      "rei branco em a8, rei preto em c7, torre preta em a6, peão preto em b4, peão preto em b5",
    );
    expect(describePieces("4k3/8/8/8/8/8/8/3QK3 w - - 0 1")).toBe(
      "rei branco em e1, rei preto em e8, dama branca em d1",
    );
  });
});

describe("summarizeMaterial", () => {
  it("resume o material de cada lado", () => {
    expect(summarizeMaterial(FINAL)).toBe("Brancas: rei. Pretas: rei, torre e 2 peões.");
    expect(summarizeMaterial("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBe(
      "Brancas: rei, dama, 2 torres, 2 bispos, 2 cavalos e 8 peões. Pretas: rei, dama, 2 torres, 2 bispos, 2 cavalos e 8 peões.",
    );
  });
});
