import { describe, expect, it } from "vitest";
import type { PositionEvaluation } from "../../evaluation";
import { defendersOf, type Game, type Ply, parseGameText, replayGame } from "../../game";
import referenceGameHtml from "../../game/fixtures/reference-game.chesscom.html?raw";
import referenceEvaluations from "../fixtures/reference-game.evaluations.json";
import { classifyGame, classifyMove } from "./classify";
import { materialBalance, materialTimeline } from "./material";
import type { MistakeVerdict } from "./types";

function replay(text: string): Game {
  const parsed = parseGameText(text);
  if (parsed.kind !== "parsed") throw new Error("partida inválida");
  const replayed = replayGame(parsed.game);
  if (replayed.kind !== "legal") throw new Error("lance ilegal");
  return replayed.game;
}

const evaluations = referenceEvaluations as PositionEvaluation[];
const reference = replay(referenceGameHtml);

function evaluation(fen: string, bestMove: string | null, pv: string[]): PositionEvaluation {
  return { fen, depth: 18, score: { kind: "cp", value: 0 }, bestMove, pv };
}

function plyOf(game: Game, index: number): Ply {
  const ply = game.plies[index - 1];
  if (!ply) throw new Error("meio-lance inexistente");
  return ply;
}

describe("materialBalance (AN-01)", () => {
  it("soma P1 C3 B3 T5 D9 do ponto de vista da cor", () => {
    const fen = "4k3/8/8/8/8/8/1P6/RN1QK3 w - - 0 1";
    expect(materialBalance(fen, "w")).toBe(1 + 5 + 3 + 9);
    expect(materialBalance(fen, "b")).toBe(-18);
    expect(materialBalance("r1b1k3/8/8/8/8/8/8/4K3 w - - 0 1", "b")).toBe(8);
  });
});

describe("materialTimeline (AN-02)", () => {
  it("começa em 0 e tem um valor por posição", () => {
    const timeline = materialTimeline(reference, "b");
    expect(timeline).toHaveLength(145);
    expect(timeline[0]).toBe(0);
    // 12...Bxa1 (meio-lance 24) ganha a torre: +5 para as pretas.
    expect((timeline[24] ?? 0) - (timeline[23] ?? 0)).toBe(5);
  });
});

describe("classifyGame com a partida de referência (pretas)", () => {
  const verdicts = classifyGame(reference, evaluations, "b");
  const mistakes = verdicts.filter(
    (verdict): verdict is MistakeVerdict => verdict.kind === "mistake",
  );

  it("acha exatamente os cinco erros do jogador (AN-11)", () => {
    expect(mistakes.map((mistake) => mistake.moveLabel)).toEqual([
      "22...Ta7",
      "27...Tb7",
      "41...Ta1",
      "43...Te6",
      "56...Ta8",
    ]);
  });

  it("classifica 22...Ta7 como peça atacada, com o bispo em a1 e o melhor lance Bd4+ (AN-12)", () => {
    expect(mistakes[0]).toEqual({
      kind: "mistake",
      ply: 44,
      color: "b",
      moveLabel: "22...Ta7",
      loss: 3,
      bestMoveSan: "Bd4+",
      mistakeType: "hanging-piece",
      lostPiece: { type: "b", square: "a1" },
    });
  });

  it("marca 12.Ce2 como erro do adversário que entregou a torre de a1 (AN-13)", () => {
    const opponent = verdicts.find((verdict) => verdict.ply === 23);
    expect(opponent).toMatchObject({
      kind: "opponent-mistake",
      color: "w",
      moveLabel: "12.Ce2",
      lostPiece: { type: "r", square: "a1" },
    });
  });

  it("marca 12...Bxa1 como ponto forte que ganhou a torre (AN-05)", () => {
    expect(verdicts.find((verdict) => verdict.ply === 24)).toEqual({
      kind: "strength",
      ply: 24,
      color: "b",
      moveLabel: "12...Bxa1",
      gain: 5,
      wonPiece: { type: "r", square: "a1" },
    });
  });
});

describe("classifyMove com posições feitas à mão", () => {
  function whitePly(fenBefore: string, from: string, to: string, fenAfter: string): Ply {
    return {
      index: 1,
      moveNumber: 1,
      color: "w",
      san: `${from}${to}`,
      from,
      to,
      piece: "b",
      captured: null,
      promotion: null,
      fenBefore,
      fenAfter,
      isCheck: false,
      isCheckmate: false,
    };
  }

  // Cavalo branco em e4 defendido só pelo bispo de g2; a torre preta de e8 ataca e4.
  const defenderFen = "4r1k1/8/8/8/4N3/8/6B1/6K1 w - - 0 1";

  it("aponta peça atacada quando a peça já atacada fica no lugar (AN-09)", () => {
    // O cavalo de e4, sem defensor, já está atacado pela torre de e8; o rei se move.
    const hangingFen = "4r1k1/8/8/8/4N3/8/8/6K1 w - - 0 1";
    const verdict = classifyMove({
      ply: whitePly(hangingFen, "g1", "h2", "4r1k1/8/8/8/4N3/8/7K/8 b - - 1 1"),
      before: evaluation(hangingFen, "e4f2", ["e4f2", "g8f8"]),
      after: evaluation("4r1k1/8/8/8/4N3/8/7K/8 b - - 1 1", "e8e4", ["e8e4", "h2g3"]),
      playerColor: "w",
    });
    expect(verdict).toMatchObject({
      kind: "mistake",
      mistakeType: "hanging-piece",
      lostPiece: { type: "n", square: "e4" },
    });
  });

  it("aponta defensor saiu quando o lance tira o único defensor (AN-08)", () => {
    const verdict = classifyMove({
      ply: whitePly(defenderFen, "g2", "h3", "4r1k1/8/8/8/4N3/7B/8/6K1 b - - 1 1"),
      before: evaluation(defenderFen, "g1f2", ["g1f2", "g8f8"]),
      after: evaluation("4r1k1/8/8/8/4N3/7B/8/6K1 b - - 1 1", "e8e4", ["e8e4", "h3g2"]),
      playerColor: "w",
    });
    expect(verdict).toMatchObject({
      kind: "mistake",
      mistakeType: "defender-moved",
      lostPiece: { type: "n", square: "e4" },
      loss: 3,
      bestMoveSan: "Rf2",
    });
  });

  it("aponta outro quando a peça perdida não estava atacada nem foi o defensor (AN-10)", () => {
    // A torre vai para a2, onde o cavalo de c3 a captura: a peça perdida é a que se
    // moveu, então não é "peça atacada" nem "defensor saiu".
    const fen = "4k3/8/8/8/8/2n5/8/R3K3 w - - 0 1";
    const ply: Ply = {
      index: 1,
      moveNumber: 1,
      color: "w",
      san: "Ra2",
      from: "a1",
      to: "a2",
      piece: "r",
      captured: null,
      promotion: null,
      fenBefore: fen,
      fenAfter: "4k3/8/8/8/8/2n5/R7/4K3 b - - 1 1",
      isCheck: false,
      isCheckmate: false,
    };
    const verdict = classifyMove({
      ply,
      before: evaluation(fen, "a1a8", ["a1a8", "e8e7"]),
      after: evaluation(ply.fenAfter, "c3a2", ["c3a2", "e1d2"]),
      playerColor: "w",
    });
    expect(verdict).toMatchObject({
      kind: "mistake",
      mistakeType: "other",
      lostPiece: { type: "r", square: "a2" },
    });
  });

  it("nunca marca o melhor lance como erro (AN-06)", () => {
    const fen = "4k3/8/8/8/8/2n5/8/R3K3 w - - 0 1";
    const ply: Ply = {
      index: 1,
      moveNumber: 1,
      color: "w",
      san: "Ra2",
      from: "a1",
      to: "a2",
      piece: "r",
      captured: null,
      promotion: null,
      fenBefore: fen,
      fenAfter: "4k3/8/8/8/8/2n5/R7/4K3 b - - 1 1",
      isCheck: false,
      isCheckmate: false,
    };
    const verdict = classifyMove({
      ply,
      before: evaluation(fen, "a1a2", ["a1a2", "c3a2"]),
      after: evaluation(ply.fenAfter, "c3a2", ["c3a2", "e1d2"]),
      playerColor: "w",
    });
    expect(verdict.kind).toBe("none");
  });

  it("sem perda nem ganho o lance é neutro", () => {
    const ply = plyOf(reference, 1);
    expect(
      classifyMove({
        ply,
        before: evaluations[0] as PositionEvaluation,
        after: evaluations[1] as PositionEvaluation,
        playerColor: "w",
      }),
    ).toEqual({ kind: "none", ply: 1, color: "w" });
  });

  it("sem avaliações suficientes o lance fica neutro", () => {
    expect(classifyGame(reference, evaluations.slice(0, 10), "b").slice(-1)[0]).toEqual({
      kind: "none",
      ply: 144,
      color: "b",
    });
  });

  function pieceMove(
    fenBefore: string,
    from: string,
    to: string,
    fenAfter: string,
    piece: Ply["piece"],
  ): Ply {
    return { ...whitePly(fenBefore, from, to, fenAfter), piece };
  }

  // Bispo preto de b6 ataca d4; o peão de e3 defende d4. Td4?? perde a torre (5) e
  // recupera o bispo (3): perda de exatamente 2.
  const exchangeFen = "6k1/8/1b6/8/8/4P3/P7/3R2K1 w - - 0 1";

  it("marca como erro uma perda de exatamente 2 pontos (AN-03, limite)", () => {
    const after = "6k1/8/1b6/8/3R4/4P3/P7/6K1 b - - 1 1";
    const verdict = classifyMove({
      ply: pieceMove(exchangeFen, "d1", "d4", after, "r"),
      before: evaluation(exchangeFen, "g1f2", ["g1f2", "g8f8"]),
      after: evaluation(after, "b6d4", ["b6d4", "e3d4", "g8f8"]),
      playerColor: "w",
    });
    expect(verdict).toMatchObject({ kind: "mistake", loss: 2 });
  });

  it("não marca como erro uma perda de 1 ponto (AN-03, abaixo do limite)", () => {
    // O peão de e3 fica sem defesa diante do bispo de b6.
    const after = "6k1/8/1b6/8/8/P3P3/8/3R2K1 b - - 0 1";
    const verdict = classifyMove({
      ply: pieceMove(exchangeFen, "a2", "a3", after, "p"),
      before: evaluation(exchangeFen, "g1f2", ["g1f2", "g8f8"]),
      after: evaluation(after, "b6e3", ["b6e3", "g1f1"]),
      playerColor: "w",
    });
    expect(verdict.kind).toBe("none");
  });

  it("não marca como erro uma perda forçada, que o melhor lance também sofre (AN-03)", () => {
    const fen = "4k3/8/8/8/8/2n5/8/R3K3 w - - 0 1";
    const after = "4k3/8/8/8/8/2n5/R7/4K3 b - - 1 1";
    const verdict = classifyMove({
      ply: pieceMove(fen, "a1", "a2", after, "r"),
      before: evaluation(fen, "a1b1", ["a1b1", "c3b1"]),
      after: evaluation(after, "c3a2", ["c3a2", "e1d2"]),
      playerColor: "w",
    });
    expect(verdict.kind).toBe("none");
  });

  it("não marca o melhor lance como erro mesmo quando a linha jogada perde (AN-06)", () => {
    const fen = "4k3/8/8/8/8/2n5/8/R3K3 w - - 0 1";
    const after = "4k3/8/8/8/8/2n5/R7/4K3 b - - 1 1";
    const verdict = classifyMove({
      ply: pieceMove(fen, "a1", "a2", after, "r"),
      before: evaluation(fen, "a1a2", ["a1a2", "e8e7"]),
      after: evaluation(after, "c3a2", ["c3a2", "e1d2"]),
      playerColor: "w",
    });
    expect(verdict.kind).toBe("none");
  });

  it("não aponta defensor saiu quando a peça tinha dois defensores (AN-08)", () => {
    // Cavalo de e4 atacado pelo peão de d5, defendido pelo bispo de g2 e pelo peão d3.
    const fen = "6k1/8/8/3p4/4N3/3P4/6B1/6K1 w - - 0 1";
    const after = "6k1/8/8/3p4/4N3/3P3B/8/6K1 b - - 1 1";
    const verdict = classifyMove({
      ply: pieceMove(fen, "g2", "h3", after, "b"),
      before: evaluation(fen, "e4c3", ["e4c3", "g8f8"]),
      after: evaluation(after, "d5e4", ["d5e4", "d3e4", "g8f8"]),
      playerColor: "w",
    });
    expect(defendersOf(fen, "e4", "w").sort()).toEqual(["d3", "g2"]);
    expect(verdict).toMatchObject({
      kind: "mistake",
      loss: 2,
      mistakeType: "hanging-piece",
      lostPiece: { type: "n", square: "e4" },
    });
  });

  it("não aponta defensor saiu ao mover o primeiro de dois defensores (AN-08)", () => {
    // Mesmo cavalo de e4, agora sai o peão de d3, que vem primeiro na lista do motor.
    const fen = "6k1/8/8/3p4/4N3/3P4/6B1/6K1 w - - 0 1";
    const after = "6k1/8/8/3p4/3PN3/8/6B1/6K1 b - - 0 1";
    const verdict = classifyMove({
      ply: pieceMove(fen, "d3", "d4", after, "p"),
      before: evaluation(fen, "e4c3", ["e4c3", "g8f8"]),
      after: evaluation(after, "d5e4", ["d5e4", "g2e4", "g8f8"]),
      playerColor: "w",
    });
    expect(defendersOf(fen, "e4", "w")[0]).toBe("d3");
    expect(verdict).toMatchObject({
      kind: "mistake",
      loss: 2,
      mistakeType: "hanging-piece",
      lostPiece: { type: "n", square: "e4" },
    });
  });

  it("não aponta peça atacada quando o lance protegeu a peça (glossário)", () => {
    // O bispo vai para g2 e passa a defender o cavalo de e4, que cai mesmo assim.
    const fen = "6k1/8/8/3p4/4N3/8/8/5BK1 w - - 0 1";
    const after = "6k1/8/8/3p4/4N3/8/6B1/6K1 b - - 1 1";
    const verdict = classifyMove({
      ply: pieceMove(fen, "f1", "g2", after, "b"),
      before: evaluation(fen, "e4c3", ["e4c3", "g8f8"]),
      after: evaluation(after, "d5e4", ["d5e4", "g2e4", "g8f8"]),
      playerColor: "w",
    });
    expect(verdict).toMatchObject({ kind: "mistake", loss: 2, mistakeType: "other" });
  });

  it("aponta outro, sem peça perdida, quando o adversário promove (AN-10)", () => {
    const fen = "6k1/8/8/8/8/8/1p6/2R4K w - - 0 1";
    const after = "6k1/8/8/8/8/8/1pR5/7K b - - 1 1";
    const verdict = classifyMove({
      ply: pieceMove(fen, "c1", "c2", after, "r"),
      before: evaluation(fen, "c1b1", ["c1b1", "g8f7"]),
      after: evaluation(after, "b2b1q", ["b2b1q", "h1h2"]),
      playerColor: "w",
    });
    expect(verdict).toMatchObject({ kind: "mistake", mistakeType: "other", lostPiece: null });
  });

  it("marca como ponto forte um ganho de exatamente 2 pontos (AN-05, limite)", () => {
    // Bxd4 toma a torre (5) e o peão de e5 retoma o bispo (3).
    const fen = "6k1/8/8/4p3/3r4/8/1B6/6K1 w - - 0 1";
    const after = "6k1/8/8/4p3/3B4/8/8/6K1 b - - 0 1";
    const verdict = classifyMove({
      ply: pieceMove(fen, "b2", "d4", after, "b"),
      before: evaluation(fen, "b2d4", ["b2d4", "e5d4"]),
      after: evaluation(after, "e5d4", ["e5d4", "g1f2"]),
      playerColor: "w",
    });
    expect(verdict).toMatchObject({
      kind: "strength",
      gain: 2,
      wonPiece: { type: "r", square: "d4" },
    });
  });

  it("conta a captura que aconteceu na partida quando a variante do motor não a mostra", () => {
    // O cavalo de e4, sem defensor, está atacado pela torre de e8. O rei se move; a
    // variante do motor sugere outro lance, mas na partida a torre tomou o cavalo.
    const fen = "4r1k1/8/8/8/4N3/8/8/6K1 w - - 0 1";
    const after = "4r1k1/8/8/8/4N3/8/7K/8 b - - 1 1";
    const input = {
      ply: pieceMove(fen, "g1", "h2", after, "k"),
      before: evaluation(fen, "e4f2", ["e4f2", "g8f8"]),
      after: evaluation(after, "g8f8", ["g8f8", "e4f2"]),
      playerColor: "w" as const,
    };
    expect(classifyMove(input).kind).toBe("none");
    expect(classifyMove({ ...input, continuation: ["e8e4", "h2g3"] })).toMatchObject({
      kind: "mistake",
      loss: 3,
      lostPiece: { type: "n", square: "e4" },
    });
  });
});
