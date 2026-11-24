import { describe, expect, it } from "vitest";
import {
  defendersOf,
  enPrisePieces,
  isAttackedBy,
  playCaptureLine,
  positionsAlongLine,
  uciToSan,
} from "./lines";

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

describe("positionsAlongLine", () => {
  it("devolve a posição depois de cada lance, até o limite", () => {
    const positions = positionsAlongLine(POSITION, ["c4d5", "f6d5", "d1f3"], 2);
    expect(positions).toHaveLength(2);
    expect(positions[1]?.split(" ")[1]).toBe("w");
  });

  it("para no primeiro lance ilegal", () => {
    expect(positionsAlongLine(POSITION, ["c4d5", "a1a8"], 6)).toHaveLength(1);
  });
});

describe("enPrisePieces", () => {
  it("lista peça atacada sem defesa", () => {
    // Bispo preto em a1 atacado pela torre de h1, sem defensor (22...Ta7 da referência).
    const fen = "r3r3/5kpp/p1p2n2/8/1Pp1pPbP/P5N1/3B1KP1/b6R b - - 3 22";
    expect(enPrisePieces(fen, "b")).toEqual([{ square: "a1", piece: "b" }]);
  });

  it("lista peça defendida atacada por peça mais barata", () => {
    // Dama branca em d4 defendida pelo cavalo de f3, atacada pelo peão de e5.
    const fen = "4k3/8/8/4p3/3Q4/5N2/8/4K3 w - - 0 1";
    expect(enPrisePieces(fen, "w")).toEqual([{ square: "d4", piece: "q" }]);
  });

  it("não lista peça defendida atacada por peça igual ou mais cara, nem só pelo rei", () => {
    // Torre em d4 defendida por c3, atacada pela torre de d8: troca igual.
    expect(enPrisePieces("3rk3/8/8/8/3R4/2P5/8/4K3 w - - 0 1", "w")).toEqual([]);
    // Cavalo em e2 defendido pelo rei, atacado só pelo rei preto? Rei não ataca peça defendida.
    expect(enPrisePieces("8/8/8/8/8/3k4/4N3/4K3 w - - 0 1", "w")).toEqual([]);
    // Sem defesa, o rei pode tomar.
    expect(enPrisePieces("8/8/8/8/8/3k4/4N3/7K w - - 0 1", "w")).toEqual([
      { square: "e2", piece: "n" },
    ]);
  });
});
