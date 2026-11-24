import { describe, expect, it } from "vitest";
import moveListHtml from "../fixtures/move-list.chesscom.html?raw";
import referenceGameHtml from "../fixtures/reference-game.chesscom.html?raw";
import { MAX_PASTE_BYTES, parseGameText } from "./parseGameText";
import { replayGame } from "./replay";
import type { ParsedGame } from "./types";

function parsed(text: string): ParsedGame {
  const outcome = parseGameText(text);
  if (outcome.kind !== "parsed") {
    throw new Error(`esperava uma partida lida, veio ${outcome.kind}`);
  }
  return outcome.game;
}

describe("parseGameText com a lista de lances nova do Chess.com (<wc-move-list>)", () => {
  it("lê os lances, as figurinhas, o roque e o resultado", () => {
    const game = parsed(moveListHtml);
    expect(game.format).toBe("chesscom-html");
    expect(game.notation).toBe("en");
    expect(game.sanMoves).toHaveLength(62);
    expect(game.sanMoves.slice(0, 4)).toEqual(["e4", "e5", "Nf3", "Nf6"]);
    expect(game.sanMoves.slice(10, 12)).toEqual(["Nxe5", "Qxd1"]);
    expect(game.sanMoves[23]).toBe("O-O-O");
    expect(game.sanMoves.at(-1)).toBe("Nxb4");
    expect(game.result).toBe("0-1");
  });

  it("ignora tempos, ícones de classificação e variantes fora da linha principal", () => {
    const withVariation = moveListHtml.replace(
      '<div class="main-line-row move-list-row result-row">',
      '<div class="node white-move"><span class="node-highlight-content">Qh5</span></div>' +
        '<div class="main-line-row move-list-row result-row">',
    );
    const game = parsed(withVariation);
    expect(game.sanMoves).toHaveLength(62);
    expect(game.sanMoves).not.toContain("Qh5");
    expect(game.sanMoves.join(" ")).not.toMatch(/\d+\.\ds/);
  });

  it("a partida inteira é legal no motor de regras", () => {
    const replayed = replayGame(parsed(moveListHtml));
    expect(replayed.kind).toBe("legal");
  });
});

describe("parseGameText com o HTML do Chess.com", () => {
  it("lê a partida de referência (GAME-01)", () => {
    const game = parsed(referenceGameHtml);
    expect(game.format).toBe("chesscom-html");
    expect(game.notation).toBe("en");
    expect(game.sanMoves).toHaveLength(144);
    expect(game.sanMoves.slice(0, 4)).toEqual(["d4", "d5", "Nc3", "e6"]);
    expect(game.sanMoves.at(-1)).toBe("Ra6");
    expect(game.sanMoves[23]).toBe("Bxa1");
    expect(game.sanMoves[43]).toBe("Ra7");
    expect(game.result).toBe("0-1");
  });

  it("devolve resultado nulo sem o nó de resultado (GAME-02)", () => {
    const withoutResult = referenceGameHtml.replace(
      '<span class="game-result-node">0-1</span>',
      "",
    );
    const game = parsed(withoutResult);
    expect(game.sanMoves).toHaveLength(144);
    expect(game.result).toBeNull();
  });

  it("lê os lances completos de um trecho cortado no meio de uma tag (GAME-03)", () => {
    const start = referenceGameHtml.indexOf('move-node-0-2"') + 5;
    const end = referenceGameHtml.indexOf('data-figurine="B"></span>d6') + 10;
    expect(parsed(referenceGameHtml.slice(start, end)).sanMoves).toEqual([
      "Nc3",
      "e6",
      "Nf3",
      "Nc6",
      "e3",
      "Nf6",
      "Bd3",
    ]);
  });

  it("lê os lances completos de um trecho do HTML com lixo em volta (GAME-03)", () => {
    const start = referenceGameHtml.indexOf('<span data-id="move-node-0-2"');
    const end = referenceGameHtml.indexOf('<span data-id="move-node-0-10"');
    const fragment = `texto da página ${referenceGameHtml.slice(start, end)} <div>mais lixo`;
    expect(parsed(fragment).sanMoves).toEqual([
      "Nc3",
      "e6",
      "Nf3",
      "Nc6",
      "e3",
      "Nf6",
      "Bd3",
      "Bd6",
    ]);
  });
});

describe("parseGameText com lista simples", () => {
  it("lê a notação inglesa (GAME-04)", () => {
    const game = parsed("1.d4 d5 2.Nc3 e6 3.Nf3");
    expect(game.format).toBe("move-list");
    expect(game.notation).toBe("en");
    expect(game.sanMoves).toEqual(["d4", "d5", "Nc3", "e6", "Nf3"]);
  });

  it("traduz a notação portuguesa para SAN inglês (GAME-05)", () => {
    const portuguese = parsed("1.d4 d5 2.Cc3 e6 3.Cf3 Cc6 4.e3 Cf6 5.Bd3 Bd6 6.a3 O-O 7.b4 Te8");
    const english = parsed("1.d4 d5 2.Nc3 e6 3.Nf3 Nc6 4.e3 Nf6 5.Bd3 Bd6 6.a3 O-O 7.b4 Re8");
    expect(portuguese.notation).toBe("pt");
    expect(portuguese.sanMoves).toEqual(english.sanMoves);
    expect(portuguese.writtenMoves).toContain("Te8");
  });

  it("deixa a notação indeterminada só com R e B", () => {
    expect(parsed("1.e4 e5 2.Bc4 Bc5").notation).toBe("undetermined");
  });

  it("lê uma lista dentro de tags HTML sem colar os blocos (GAME-08)", () => {
    const game = parsed("<div><p>1.e4 e5</p><p>2.Nf3&nbsp;Nc6</p><p>1-0</p></div>");
    expect(game.sanMoves).toEqual(["e4", "e5", "Nf3", "Nc6"]);
    expect(game.result).toBe("1-0");
  });
});

describe("parseGameText rejeita o que não é partida", () => {
  it.each(["", "   \n\t "])("texto vazio → empty (GAME-11)", (text) => {
    expect(parseGameText(text)).toEqual({ kind: "empty" });
  });

  it.each([
    "Olá! Pode analisar minha partida?",
    "<div class='board'><span>sem lances aqui</span></div>",
  ])("texto sem lances → unrecognized (GAME-12)", (text) => {
    expect(parseGameText(text)).toEqual({ kind: "unrecognized" });
  });

  it("lista com texto estranho no meio → unrecognized (GAME-08)", () => {
    expect(parseGameText("1.e4 e5 2.Xf3 Nc6 3.Bb5")).toEqual({ kind: "unrecognized" });
    expect(parseGameText("1.e4 e5 2.Nf3 Nc6 obrigado 3.")).toEqual({ kind: "unrecognized" });
  });

  it("PGN com cabeçalhos → unrecognized, mesmo com lances (GAME-13)", () => {
    const pgn = '[Event "Live Chess"]\n[Site "Chess.com"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 1-0';
    expect(parseGameText(pgn)).toEqual({ kind: "unrecognized" });
  });

  it("colagem acima de 512 000 bytes → too-large (GAME-14)", () => {
    const huge = `1.e4 e5 ${"x".repeat(MAX_PASTE_BYTES)}`;
    expect(parseGameText(huge)).toEqual({ kind: "too-large", bytes: MAX_PASTE_BYTES + 8 });
  });

  it("aceita exatamente 512 000 bytes", () => {
    const text = `1.e4 e5 ${" ".repeat(MAX_PASTE_BYTES - 8)}`;
    expect(parseGameText(text).kind).toBe("parsed");
  });

  it("conta bytes em UTF-8, não caracteres", () => {
    const text = `1.e4 e5 ${"é".repeat(MAX_PASTE_BYTES / 2)}`;
    expect(parseGameText(text).kind).toBe("too-large");
  });
});
