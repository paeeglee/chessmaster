import { beforeAll, describe, expect, it } from "vitest";
import { DRAW, generateTable, indexOf, STRONG, type Table } from "./generate";
import { endgameOf, probe } from "./probe";

let krk: Table;
let kqk: Table;

beforeAll(() => {
  krk = generateTable("KRK");
  kqk = generateTable("KQK");
}, 60_000);

function longestMate(table: Table): number {
  let longest = 0;
  for (let index = STRONG; index < table.dtm.length; index += 2) {
    const value = table.dtm[index] as number;
    if (value >= 0) longest = Math.max(longest, (value + 1) / 2);
  }
  return longest;
}

describe("generateTable (TB-01)", () => {
  it("o mate mais longo bate com os valores publicados: KQK 10, KRK 16", () => {
    expect(longestMate(kqk)).toBe(10);
    expect(longestMate(krk)).toBe(16);
  });

  it("todas as posições têm valor final", () => {
    expect(krk.dtm.includes(-1)).toBe(false);
  });
});

describe("probe (TB-02, TB-03)", () => {
  it("mate em 1 com a torre", () => {
    expect(probe(krk, "k7/8/1K6/8/8/8/8/7R w - - 0 1")).toEqual({
      kind: "KRK",
      strongColor: "w",
      winner: "w",
      dtmPlies: 1,
      mateInMoves: 1,
    });
  });

  it("rei já em xeque-mate tem DTM 0", () => {
    expect(probe(kqk, "k7/1Q6/1K6/8/8/8/8/8 b - - 0 1")).toMatchObject({
      winner: "w",
      dtmPlies: 0,
      mateInMoves: 0,
    });
  });

  it("afogamento é empate", () => {
    expect(probe(kqk, "k7/2Q5/1K6/8/8/8/8/8 b - - 0 1")).toMatchObject({
      winner: null,
      dtmPlies: null,
    });
  });

  it("rei que toma a torre desprotegida empata", () => {
    expect(probe(krk, "k7/1R6/8/8/8/8/8/K7 b - - 0 1")).toMatchObject({ winner: null });
  });

  it("com o rei fraco a jogar e sem escapatória, conta os lances do lado forte", () => {
    // Pretas a jogar; Ka8 só tem b8? Torre em h7 corta a 7ª e Kb6 cobre a7/b7.
    const result = probe(krk, "k7/7R/1K6/8/8/8/8/8 b - - 0 1");
    expect(result).toMatchObject({ winner: "w", dtmPlies: 2, mateInMoves: 1 });
  });

  it("funciona com as pretas como lado forte", () => {
    expect(probe(krk, "K7/8/1k6/8/8/8/8/7r b - - 0 1")).toMatchObject({
      strongColor: "b",
      winner: "b",
      mateInMoves: 1,
    });
  });

  it("devolve null para outro material, outra tabela ou posição ilegal (TB-09)", () => {
    expect(probe(krk, "k7/8/1K6/8/8/8/8/6RR w - - 0 1")).toBeNull();
    expect(probe(krk, "k7/8/1K6/8/8/8/P7/7R w - - 0 1")).toBeNull();
    expect(probe(krk, "k7/1Q6/1K6/8/8/8/8/8 b - - 0 1")).toBeNull();
    expect(probe(krk, "k6R/8/8/8/8/8/8/K7 w - - 0 1")).toBeNull();
    expect(probe(krk, "8/8/8/8 w")).toBeNull();
  });
});

describe("endgameOf", () => {
  it("reconhece o material e a vez", () => {
    expect(endgameOf("8/8/8/8/8/8/1k6/K6q w - - 0 1")).toEqual({
      kind: "KQK",
      strongColor: "b",
      strongKing: 9,
      piece: 7,
      weakKing: 0,
      side: 1,
    });
    expect(endgameOf("8/8/8/8/8/8/8/K6q w - - 0 1")).toBeNull();
  });

  it("índice e empate marcados de forma consistente", () => {
    const index = indexOf(9, 7, 0, 1);
    expect(kqk.dtm[index]).not.toBe(DRAW);
  });
});
