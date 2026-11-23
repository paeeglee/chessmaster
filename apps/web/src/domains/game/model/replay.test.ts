import { DEFAULT_POSITION } from "chess.js";
import { describe, expect, it } from "vitest";
import referenceGameHtml from "../fixtures/reference-game.chesscom.html?raw";
import { parseGameText } from "./parseGameText";
import { replayGame } from "./replay";
import type { Game, ReplayOutcome } from "./types";

function replayText(text: string): ReplayOutcome {
  const outcome = parseGameText(text);
  if (outcome.kind !== "parsed") {
    throw new Error(`esperava uma partida lida, veio ${outcome.kind}`);
  }
  return replayGame(outcome.game);
}

function legalGame(text: string): Game {
  const outcome = replayText(text);
  if (outcome.kind !== "legal") {
    throw new Error(`lance ilegal: ${JSON.stringify(outcome.error)}`);
  }
  return outcome.game;
}

const FOOLS_MATE = "1.f3 e5 2.g4 Qh4#";
// Afogamento mais curto conhecido (Sam Loyd): as pretas não têm lance e não estão em xeque.
const STALEMATE =
  "1.e3 a5 2.Qh5 Ra6 3.Qxa5 h5 4.h4 Rah6 5.Qxc7 f6 6.Qxd7+ Kf7 7.Qxb7 Qd3 8.Qxb8 Qh7 9.Qxc8 Kg6 10.Qe6";

describe("replayGame com a partida de referência", () => {
  const game = legalGame(referenceGameHtml);

  it("devolve os 144 meios-lances com posições e marcações (GAME-15)", () => {
    expect(game.plies).toHaveLength(144);
    expect(game.initialFen).toBe(DEFAULT_POSITION);
    expect(game.plies[0]).toEqual({
      index: 1,
      moveNumber: 1,
      color: "w",
      san: "d4",
      from: "d2",
      to: "d4",
      piece: "p",
      captured: null,
      promotion: null,
      fenBefore: DEFAULT_POSITION,
      fenAfter: "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1",
      isCheck: false,
      isCheckmate: false,
    });
    for (const [position, ply] of game.plies.entries()) {
      expect(ply.index).toBe(position + 1);
      if (position > 0) {
        expect(ply.fenBefore).toBe(game.plies[position - 1]?.fenAfter);
      }
    }
    expect(game.finalFen).toBe(game.plies.at(-1)?.fenAfter);
  });

  it("marca 12...Bxa1, 22...Ra7 e o mate 72...Ra6# (GAME-16)", () => {
    expect(game.plies[23]).toMatchObject({
      index: 24,
      moveNumber: 12,
      color: "b",
      san: "Bxa1",
      piece: "b",
      captured: "r",
      to: "a1",
    });
    expect(game.plies[43]).toMatchObject({ index: 44, moveNumber: 22, color: "b", san: "Ra7" });
    expect(game.plies[143]).toMatchObject({
      index: 144,
      moveNumber: 72,
      color: "b",
      san: "Ra6#",
      isCheck: true,
      isCheckmate: true,
    });
    expect(game.plies[28]).toMatchObject({ san: "Bxf7+", isCheck: true, isCheckmate: false });
  });

  it("termina em xeque-mate com vitória das pretas (GAME-17)", () => {
    expect(game.termination).toBe("checkmate");
    expect(game.result).toBe("0-1");
  });
});

describe("replayGame decide o fim da partida pelo tabuleiro", () => {
  it("o mate vence o resultado colado (GAME-17)", () => {
    const wrongResult = referenceGameHtml.replace(">0-1<", ">1-0<");
    expect(legalGame(wrongResult)).toMatchObject({ termination: "checkmate", result: "0-1" });
    expect(legalGame(`${FOOLS_MATE} 1-0`)).toMatchObject({
      termination: "checkmate",
      result: "0-1",
    });
  });

  it("dá 1-0 quando as brancas dão mate", () => {
    expect(legalGame("1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#")).toMatchObject({
      termination: "checkmate",
      result: "1-0",
    });
  });

  it("afogamento termina empatado (GAME-18)", () => {
    expect(legalGame(STALEMATE)).toMatchObject({ termination: "stalemate", result: "1/2-1/2" });
  });

  it("sem mate nem afogamento, usa o resultado colado (GAME-19)", () => {
    expect(legalGame("1.e4 e5 1/2-1/2")).toMatchObject({
      termination: null,
      result: "1/2-1/2",
    });
    expect(legalGame("1.e4 e5")).toMatchObject({ termination: null, result: null });
  });
});

describe("replayGame e a notação", () => {
  it("lê R como rei quando só a leitura portuguesa é legal (GAME-06)", () => {
    const game = legalGame("1.e4 e5 2.Re2");
    expect(game.notation).toBe("pt");
    expect(game.plies[2]).toMatchObject({ san: "Ke2", piece: "k" });
  });

  it("prefere a leitura inglesa quando as duas são legais", () => {
    const game = legalGame("1.e4 e5 2.Bc4 Bc5");
    expect(game.notation).toBe("en");
  });

  it("reproduz a lista em português com as mesmas posições da inglesa", () => {
    const portuguese = legalGame("1.d4 d5 2.Cc3 e6 3.Cf3 Cc6 4.e3 Cf6 5.Bd3 Bd6 6.a3 O-O 7.b4 Te8");
    const english = legalGame("1.d4 d5 2.Nc3 e6 3.Nf3 Nc6 4.e3 Nf6 5.Bd3 Bd6 6.a3 O-O 7.b4 Re8");
    expect(portuguese.plies.map((ply) => ply.fenAfter)).toEqual(
      english.plies.map((ply) => ply.fenAfter),
    );
  });

  it.each([
    ["1.e4 d5 2.exd5 c6 3.dxc6 Qb6 4.cxb7 Qa5 5.bxa8=Q"],
    ["1.e4 d5 2.exd5 c6 3.dxc6 Qb6 4.cxb7 Qa5 5.bxa8Q"],
    ["1.e4 d5 2.exd5 c6 3.dxc6 Db6 4.cxb7 Da5 5.bxa8=D"],
  ])("promove a dama em %s (GAME-25)", (text) => {
    const promotion = legalGame(text).plies[8];
    expect(promotion).toMatchObject({ san: "bxa8=Q", promotion: "q", captured: "r" });
  });
});

describe("replayGame com lance ilegal", () => {
  it("para no lance ilegal e devolve-o como foi escrito (GAME-20)", () => {
    const outcome = replayText("1.d4 d5 2.Cc3 e6 3.Txa1 Cf6");
    expect(outcome.kind).toBe("illegal-move");
    if (outcome.kind !== "illegal-move") return;
    expect(outcome.error).toEqual({ ply: 5, moveNumber: 3, color: "w", writtenMove: "Txa1" });
    expect(outcome.plies.map((ply) => ply.san)).toEqual(["d4", "d5", "Nc3", "e6"]);
  });

  it("indica lance ilegal das pretas", () => {
    const outcome = replayText("1.e4 Ke7");
    expect(outcome).toMatchObject({
      kind: "illegal-move",
      error: { ply: 2, moveNumber: 1, color: "b", writtenMove: "Ke7" },
    });
  });

  it("uma colagem que começa no meio da partida falha no primeiro meio-lance", () => {
    const outcome = replayText("1...e5 2.Nf3 Nc6");
    expect(outcome).toMatchObject({
      kind: "illegal-move",
      error: { ply: 1, moveNumber: 1, color: "w", writtenMove: "e5" },
    });
  });

  it("com notação indeterminada, informa a leitura que foi mais longe", () => {
    // Inglês falha no 3º meio-lance (Re2); português falha no 4º (Bb4 sem caminho).
    const outcome = replayText("1.e4 e5 2.Re2 Bb3");
    expect(outcome).toMatchObject({
      kind: "illegal-move",
      error: { ply: 4, moveNumber: 2, color: "b", writtenMove: "Bb3" },
    });
  });
});

describe("desempenho", () => {
  it("lê e reproduz 150 lances (300 meios-lances) em menos de 1 s (GAME-21)", () => {
    const shuffle = Array.from({ length: 75 }, (_, round) => {
      const first = round * 2 + 1;
      return `${first}.Nf3 Nf6 ${first + 1}.Ng1 Ng8`;
    }).join(" ");
    const started = performance.now();
    const game = legalGame(shuffle);
    const elapsed = performance.now() - started;
    expect(game.plies).toHaveLength(300);
    expect(elapsed).toBeLessThan(1000);
  });
});
