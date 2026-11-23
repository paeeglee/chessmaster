import { describe, expect, it } from "vitest";
import { defendersOf, isAttackedBy, playCaptureLine, uciToSan } from "./lines";

// Bispo branco em c4 atacado pelo peão d5; cavalo preto em f6 defendido por g7 e d8.
const POSITION = "rnbqkb1r/ppp2ppp/5n2/3p4/2B5/8/PPPP1PPP/RNBQK1NR w KQkq - 0 4";

describe("playCaptureLine", () => {
  it("segue a variante enquanto há capturas e registra as peças tomadas", () => {
    // 1.Bxd5 Nxd5 2.Qf3 …: depois do lance, a captura Nxd5 entra e Qf3 encerra.
    const line = playCaptureLine(POSITION, "c4d5", ["f6d5", "d1f3", "c7c6"]);
    expect(line.captures).toEqual([
      { square: "d5", piece: "p", color: "b" },
      { square: "d5", piece: "b", color: "w" },
    ]);
    expect(line.fen.split(" ")[1]).toBe("w");
  });

  it("para no primeiro lance que não é captura", () => {
    const line = playCaptureLine(POSITION, "g1f3", ["d5c4", "e1g1", "f8c5"]);
    expect(line.captures).toEqual([{ square: "c4", piece: "b", color: "w" }]);
  });

  it("sem variante, a linha é só o primeiro lance (AN-19)", () => {
    const line = playCaptureLine(POSITION, "c4d5", []);
    expect(line.captures).toEqual([{ square: "d5", piece: "p", color: "b" }]);
  });

  it("para antes de um lance ilegal da variante (AN-20)", () => {
    const line = playCaptureLine(POSITION, "c4d5", ["a1a8", "f6d5"]);
    expect(line.captures).toEqual([{ square: "d5", piece: "p", color: "b" }]);
  });

  it("devolve a posição original quando o primeiro lance é ilegal", () => {
    expect(playCaptureLine(POSITION, "c4c8", ["f6d5"])).toEqual({ fen: POSITION, captures: [] });
  });

  it("aceita linha sem primeiro lance", () => {
    expect(playCaptureLine(POSITION, null, ["c4d5", "f6d5"]).captures).toHaveLength(2);
  });

  it("respeita o limite de meios-lances", () => {
    expect(playCaptureLine(POSITION, null, ["c4d5", "f6d5"], 1).captures).toHaveLength(1);
  });

  it("registra a casa certa do peão tomado en passant", () => {
    const enPassant = "rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3";
    expect(playCaptureLine(enPassant, "e5f6", []).captures).toEqual([
      { square: "f5", piece: "p", color: "b" },
    ]);
  });
});

describe("defendersOf e isAttackedBy", () => {
  it("lista os defensores de uma casa", () => {
    expect(defendersOf(POSITION, "f6", "b").sort()).toEqual(["d8", "g7"]);
  });

  it("diz se a casa está atacada", () => {
    expect(isAttackedBy(POSITION, "c4", "b")).toBe(true);
    expect(isAttackedBy(POSITION, "h2", "b")).toBe(false);
  });
});

describe("uciToSan", () => {
  it("converte UCI em SAN", () => {
    expect(uciToSan(POSITION, "c4d5")).toBe("Bxd5");
    expect(uciToSan(POSITION, "c4c8")).toBeNull();
  });
});
