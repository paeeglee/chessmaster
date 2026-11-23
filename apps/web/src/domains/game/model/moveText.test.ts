import { describe, expect, it } from "vitest";
import { tokenizeMoveText } from "./moveText";

describe("tokenizeMoveText", () => {
  it("lê uma lista simples em notação inglesa (GAME-04)", () => {
    expect(tokenizeMoveText("1.d4 d5 2.Nc3 e6 3.Nf3")).toEqual({
      moves: ["d4", "d5", "Nc3", "e6", "Nf3"],
      result: null,
      interrupted: false,
    });
  });

  it("mantém as letras portuguesas como foram escritas", () => {
    expect(tokenizeMoveText("1.d4 d5 2.Cc3 e6 7.b4 Te8").moves).toEqual([
      "d4",
      "d5",
      "Cc3",
      "e6",
      "b4",
      "Te8",
    ]);
  });

  it("aceita números com espaço, reticências e lances das pretas numerados", () => {
    expect(tokenizeMoveText("1. e4 1... e5 2. Nf3 2…Nc6").moves).toEqual([
      "e4",
      "e5",
      "Nf3",
      "Nc6",
    ]);
  });

  it("ignora anotações, NAGs, comentários e variantes (GAME-07)", () => {
    const annotated =
      "1.e4! e5?! 2.Nf3!! {bom lance} Nc6?? 3.Bb5+ $1 (3.Bc4 Bc5) a6? 4.Bxc6#!? ;fim";
    const clean = "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6";
    expect(tokenizeMoveText(annotated).moves).toEqual(tokenizeMoveText(clean).moves);
    expect(tokenizeMoveText(annotated).moves).toEqual([
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bb5",
      "a6",
      "Bxc6",
    ]);
  });

  it("ignora variantes aninhadas", () => {
    expect(tokenizeMoveText("1.e4 (1.d4 d5 (1...Nf6 2.c4)) e5").moves).toEqual(["e4", "e5"]);
  });

  it("ignora o texto antes do primeiro 1. e depois do último lance (GAME-08)", () => {
    expect(
      tokenizeMoveText("Minha partida de ontem: 1.e4 e5 2.Nf3 Nc6 obrigado pela ajuda!").moves,
    ).toEqual(["e4", "e5", "Nf3", "Nc6"]);
  });

  it.each([
    ["1.e4 e5 1-0", "1-0"],
    ["1.e4 e5 0-1", "0-1"],
    ["1.e4 e5 1/2-1/2", "1/2-1/2"],
    ["1.e4 e5 ½-½", "1/2-1/2"],
    ["1.e4 e5 *", null],
    ["1.e4 e5", null],
  ])("lê o resultado em %s (GAME-09)", (text, result) => {
    expect(tokenizeMoveText(text)).toEqual({ moves: ["e4", "e5"], result, interrupted: false });
  });

  it("para no resultado e ignora o que vem depois", () => {
    expect(tokenizeMoveText("1.e4 e5 1-0 2.Nf3")).toEqual({
      moves: ["e4", "e5"],
      result: "1-0",
      interrupted: false,
    });
  });

  it("lê o roque escrito com zeros (GAME-10)", () => {
    expect(tokenizeMoveText("1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.0-0 d6 5.d3 0-0-0").moves).toEqual([
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
      "Bc5",
      "O-O",
      "d6",
      "d3",
      "O-O-O",
    ]);
  });

  it("não confunde o resultado 0-1 com roque", () => {
    expect(tokenizeMoveText("1.f3 e5 2.g4 Qh4# 0-1")).toEqual({
      moves: ["f3", "e5", "g4", "Qh4"],
      result: "0-1",
      interrupted: false,
    });
  });

  it("lê promoções com e sem sinal de igual e remove e.p.", () => {
    expect(tokenizeMoveText("1.e8=Q exd8=D e8Q exd6e.p.").moves).toEqual([
      "e8=Q",
      "exd8=D",
      "e8Q",
      "exd6",
    ]);
  });

  it("aceita uma lista sem números quando todos os tokens são lances", () => {
    expect(tokenizeMoveText("e4 e5 Nf3").moves).toEqual(["e4", "e5", "Nf3"]);
  });

  it("não encontra lances em texto comum", () => {
    expect(tokenizeMoveText("Olá, tudo bem? Joguei ontem e perdi.").moves).toEqual([]);
  });

  it("não aceita texto misturado sem o número do primeiro lance", () => {
    expect(tokenizeMoveText("veja e4 e5").moves).toEqual([]);
  });

  it("lê figurinos Unicode como letras de peça", () => {
    expect(tokenizeMoveText("1.e4 e5 2.♘f3 ♞c6 3.♗b5 ♛h4").moves).toEqual([
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bb5",
      "Qh4",
    ]);
  });

  it("ignora o relógio copiado junto com os lances", () => {
    expect(tokenizeMoveText("1.e4 0:59 e5 0:58 2.Nf3 [1:02:03] Nc6").moves).toEqual([
      "e4",
      "e5",
      "Nf3",
      "Nc6",
    ]);
  });

  it("marca como interrompida a lista com texto estranho no meio (GAME-08)", () => {
    expect(tokenizeMoveText("1.e4 e5 2.Xf3 Nc6 3.Bb5")).toEqual({
      moves: ["e4", "e5"],
      result: null,
      interrupted: true,
    });
  });

  it("marca como interrompida quando só um número de lance vem depois (GAME-08)", () => {
    expect(tokenizeMoveText("1.e4 e5 2.Nf3 Nc6 obrigado 3.")).toEqual({
      moves: ["e4", "e5", "Nf3", "Nc6"],
      result: null,
      interrupted: true,
    });
  });

  it("não marca como interrompida quando o texto estranho fica no fim", () => {
    expect(tokenizeMoveText("1.e4 e5 2.Nf3 gg wp").interrupted).toBe(false);
  });
});
