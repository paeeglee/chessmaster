import { describe, expect, it } from "vitest";
import { legalDestinations, playMove, portugueseLine } from "./moves";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("legalDestinations", () => {
  it("lista os destinos legais da peça", () => {
    expect(legalDestinations(START, "g1").sort()).toEqual(["f3", "h3"]);
    expect(legalDestinations(START, "e7")).toEqual([]);
    expect(legalDestinations(START, "e4")).toEqual([]);
  });
});

describe("playMove", () => {
  it("joga o lance e devolve SAN, UCI e a nova posição", () => {
    expect(playMove(START, "g1", "f3")).toMatchObject({
      san: "Nf3",
      uci: "g1f3",
      piece: "n",
      to: "f3",
    });
  });

  it("recusa lance ilegal", () => {
    expect(playMove(START, "g1", "g3")).toBeNull();
  });

  it("promove a dama", () => {
    const fen = "8/4P3/8/8/8/8/k7/4K3 w - - 0 1";
    expect(playMove(fen, "e7", "e8")).toMatchObject({ san: "e8=Q", uci: "e7e8q" });
  });
});

describe("portugueseLine", () => {
  it("converte a linha para SAN português e para no lance ilegal", () => {
    expect(portugueseLine(START, ["g1f3", "g8f6", "a1a8"], 4)).toEqual(["Cf3", "Cf6"]);
    expect(portugueseLine(START, ["e2e4", "e7e5", "g1f3"], 2)).toEqual(["e4", "e5"]);
  });
});
