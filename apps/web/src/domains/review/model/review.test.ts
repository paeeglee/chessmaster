import { describe, expect, it } from "vitest";
import { referenceResult } from "../fixtures/referenceResult";
import {
  annotationOf,
  boardMarks,
  chartGeometry,
  coachPly,
  contextLine,
  initialPosition,
  materialChange,
  momentTexts,
  moveRows,
  positionCaption,
  positionFen,
  resultTag,
  sideToMoveLabel,
  statCards,
  suggestionChips,
} from "./review";

const result = referenceResult();
const { game } = result.request;

describe("cabeçalho do resultado", () => {
  it("dá a tag de vitória e a linha de contexto", () => {
    expect(resultTag(game, "b")).toEqual({ label: "Vitória · 0-1", tone: "win" });
    expect(contextLine(result.request)).toBe("Você: pretas · 72 lances · xeque-mate");
  });

  it("dá tag neutra de derrota, empate e sem resultado (RV-20)", () => {
    expect(resultTag(game, "w")).toEqual({ label: "Derrota · 0-1", tone: "loss" });
    expect(resultTag({ ...game, result: "1/2-1/2" }, "w")).toEqual({
      label: "Empate · ½-½",
      tone: "neutral",
    });
    expect(resultTag({ ...game, result: null }, "w").label).toBe("Sem resultado");
  });
});

describe("statCards (RV-02)", () => {
  it("conta os momentos, o melhor lance e a maior vantagem", () => {
    const cards = statCards(result);
    expect(cards[0]).toEqual({ value: "5", label: "momentos em que você perdeu material" });
    expect(cards[1]).toEqual({ value: "12...Bxa1!", label: "seu melhor lance" });
    expect(cards[2]?.label).toBe("sua maior vantagem (pontos de material)");
    // Maior vantagem da partida de referência: +10 (depois de 32...Txe4).
    expect(cards[2]?.value).toBe("+10");
    expect(cards).toHaveLength(3);
  });

  it("o 4º cartão só aparece quando o jogador deu o mate no final da tabela (TB-07)", () => {
    const endgame = {
      kind: "KQK" as const,
      position: 10,
      strongColor: "b" as const,
      playerIsStrong: true,
      winner: "b" as const,
      optimalMoves: null,
      movesToMate: 1,
    };
    expect(statCards({ ...result, endgame })[3]).toEqual({
      value: "1 lance",
      label: "para o mate de dama no final",
    });
    expect(statCards({ ...result, endgame: { ...endgame, playerIsStrong: false } })).toHaveLength(
      3,
    );
    expect(statCards({ ...result, endgame: { ...endgame, movesToMate: null } })).toHaveLength(3);
  });
});

describe("lista de lances (RV-09)", () => {
  it("monta linhas em duas colunas com anotações", () => {
    const rows = moveRows(game, result.verdicts);
    expect(rows).toHaveLength(72);
    expect(rows[11]).toEqual({
      number: 12,
      white: { ply: 23, text: "Ce2", tone: "plain" },
      black: { ply: 24, text: "Bxa1!", tone: "good" },
    });
    expect(rows[21]?.black).toEqual({ ply: 44, text: "Ta7?", tone: "mistake" });
    expect(rows[42]?.black).toMatchObject({ text: "Te6??", tone: "mistake" });
  });

  it("anota perdas grandes com ??", () => {
    expect(annotationOf(undefined)).toBe("");
    expect(annotationOf({ kind: "none", ply: 1, color: "w" })).toBe("");
  });
});

describe("tabuleiro (RV-05, RV-07)", () => {
  it("abre antes de 22...Ta7, com as pretas a jogar", () => {
    expect(initialPosition(result)).toBe(43);
    expect(positionCaption(result, 43)).toBe("Antes de 22...Ta7?");
    expect(sideToMoveLabel(game, 43)).toBe("Pretas jogam");
    expect(positionFen(game, 43)).toBe(game.plies[42]?.fenAfter);
  });

  it("sem momentos-chave abre na posição final", () => {
    expect(initialPosition({ ...result, keyMoments: [] })).toBe(144);
  });

  it("marca a peça atacada e o lance sugerido no momento-chave", () => {
    expect(boardMarks(result, 43)).toEqual({
      marks: { a1: "red", d4: "green" },
      bestMoveSan: "Bd4+",
    });
  });

  it("fora de momentos marca o último lance", () => {
    expect(boardMarks(result, 2)).toEqual({ marks: { d7: "last", d5: "last" }, bestMoveSan: null });
    expect(boardMarks(result, 0).marks).toEqual({});
    expect(positionCaption(result, 0)).toBe("Posição inicial");
    expect(positionCaption(result, 2)).toBe("Depois de 1...d5");
  });
});

describe("gráfico (RV-08)", () => {
  it("marca os cinco momentos com círculos numerados", () => {
    const chart = chartGeometry(result);
    expect(chart.marks.map((mark) => [mark.number, mark.ply])).toEqual([
      [1, 44],
      [2, 54],
      [3, 82],
      [4, 86],
      [5, 112],
    ]);
    expect(chart.points.split(" ")).toHaveLength(145);
    expect(chart.points.startsWith("30.0,140.0")).toBe(true);
    expect(chart.ticks.map((tick) => tick.label)).toEqual(["1", "36", "72"]);
  });
});

describe("textos dos momentos (RV-11)", () => {
  const first = result.keyMoments[0];
  if (!first) throw new Error("sem momento");

  it("usa o template quando não há texto da IA", () => {
    expect(momentTexts(result, first)).toEqual({
      summary: "Deixou o bispo em a1 ser capturado.",
      explanation: "Peça atacada.",
    });
    expect(materialChange(first)).toBe("Vantagem: +9 → +6");
  });

  it("usa o texto da IA quando existe", () => {
    const withAi = referenceResult({
      explanation: {
        verdict: "v",
        patterns_sentence: "p",
        key_moments: [{ ply: 44, summary: "Resumo da IA.", explanation: "Explicação da IA." }],
        strengths: [],
        next_game_habit: "h",
      },
    });
    expect(momentTexts(withAi, first)).toEqual({
      summary: "Resumo da IA.",
      explanation: "Explicação da IA.",
    });
  });

  it("monta chips de pergunta com fatos da partida", () => {
    expect(suggestionChips(result)).toEqual([
      "Por que 12...Bxa1 foi bom?",
      "O que eu devia ter jogado em 22...Ta7?",
      "Qual padrão de erro mais se repetiu?",
    ]);
    expect(suggestionChips({ ...result, keyMoments: [], strengths: [] })).toEqual([
      "Como posso melhorar no final?",
    ]);
  });
});

describe("coachPly: só os lances do jogador são revisados", () => {
  it("depois de um lance do jogador, revisa esse lance", () => {
    // Pretas: o meio-lance 44 é 22...Ta7.
    expect(coachPly(result, 44)).toEqual({ ply: 44, upcoming: false });
  });

  it("depois de um lance do adversário, revisa o lance seguinte do jogador", () => {
    expect(coachPly(result, 43)).toEqual({ ply: 44, upcoming: true });
  });

  it("na posição inicial, as pretas ainda não jogaram: nada a revisar", () => {
    expect(coachPly(result, 0)).toBeNull();
  });

  it("jogando de brancas, a posição inicial revisa o primeiro lance", () => {
    const white = { ...result, request: { ...result.request, playerColor: "w" as const } };
    expect(coachPly(white, 0)).toEqual({ ply: 1, upcoming: true });
    // A partida termina num lance das pretas: no fim não há lance das brancas depois.
    expect(coachPly(white, 144)).toBeNull();
  });
});
