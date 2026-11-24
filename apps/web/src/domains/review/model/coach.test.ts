import { describe, expect, it } from "vitest";
import type { MoveReview } from "../../analysis";
import { referenceResult } from "../fixtures/referenceResult";
import {
  bestMoveReasons,
  bestMoveSentence,
  coachFindings,
  coachTitle,
  evaluationLabel,
  QUALITY_SYMBOL,
  reviewAt,
  whiteShare,
} from "./coach";

const result = referenceResult();
const ta7 = reviewAt(result, 44) as MoveReview;

function withFacts(facts: Partial<MoveReview["facts"]>): MoveReview {
  return { ...ta7, facts: { ...ta7.facts, ...facts } };
}

describe("textos do painel do treinador (MR-06..MR-10)", () => {
  it("22...Ta7: título, dono, melhor lance com motivo e o que continuou atacado", () => {
    expect(coachTitle(ta7, false)).toEqual({ title: "22...Ta7 · Erro", owner: "Seu lance" });
    expect(coachTitle(ta7, true).owner).toBe("Seu lance a seguir");
    expect(bestMoveSentence(ta7)).toBe("Melhor era 22...Bd4+: dá xeque e salva o bispo em a1.");
    expect(coachFindings(ta7)).toEqual([
      "Continuou atacado e sem defesa: o bispo em a1.",
      `Deixou de ganhar ${ta7.facts.missedMaterial} pontos de material.`,
    ]);
  });

  it("o lance do motor não tem melhor lance nem material perdido", () => {
    const best = reviewAt(result, 24) as MoveReview;
    expect(bestMoveSentence(best)).toBe("Este foi o lance do motor.");
    expect(coachFindings(best).some((item) => item.startsWith("Deixou de ganhar"))).toBe(false);
  });

  it("combina os motivos: mate, material e peças salvas", () => {
    const facts = (bestReasons: MoveReview["facts"]["bestReasons"]) => withFacts({ bestReasons });
    expect(bestMoveReasons(facts({ check: true, mateIn: 3, wins: 0, saves: [] }).facts)).toBe(
      "leva ao mate em 3",
    );
    expect(
      bestMoveReasons(
        facts({ check: false, mateIn: null, wins: 1, saves: [{ type: "q", square: "d4" }] }).facts,
      ),
    ).toBe("ganha 1 ponto de material e salva a dama em d4");
    expect(bestMoveReasons(facts({ check: false, mateIn: null, wins: 0, saves: [] }).facts)).toBe(
      "",
    );
    expect(bestMoveSentence(facts({ check: false, mateIn: null, wins: 0, saves: [] }))).toBe(
      "Melhor era 22...Bd4+.",
    );
    expect(bestMoveReasons(withFacts({ bestReasons: null }).facts)).toBe("");
    expect(bestMoveSentence(withFacts({ bestMoveLabel: null }))).toBeNull();
  });

  it("lista peças descobertas e o singular de 1 ponto", () => {
    const review = withFacts({
      undefended: [
        { type: "n", square: "c3" },
        { type: "r", square: "e4" },
        { type: "p", square: "f2" },
      ],
      stillEnPrise: [],
      missedMaterial: 1,
    });
    expect(coachFindings(review)).toEqual([
      "Deixou descoberto: o cavalo em c3, a torre em e4 e o peão em f2.",
      "Deixou de ganhar 1 ponto de material.",
    ]);
  });

  it("não há revisão na posição inicial (MR-12)", () => {
    expect(reviewAt(result, 0)).toBeNull();
  });
});

const at = (score: { kind: "cp" | "mate"; value: number }, side: "w" | "b" = "w") => ({
  fen: `4k3/8/8/8/8/8/8/4K3 ${side} - - 0 1`,
  depth: 18,
  score,
  bestMove: null,
  pv: [],
});

describe("barra de avaliação (MR-11)", () => {
  it("mostra a avaliação das brancas com vírgula, sinal e limite de 10", () => {
    expect(evaluationLabel(at({ kind: "cp", value: 120 }))).toBe("+1,2");
    expect(evaluationLabel(at({ kind: "cp", value: -40 }))).toBe("−0,4");
    expect(evaluationLabel(at({ kind: "cp", value: 3 }))).toBe("0,0");
    expect(evaluationLabel(at({ kind: "cp", value: 2500 }))).toBe("+10,0");
    expect(evaluationLabel(at({ kind: "mate", value: 3 }))).toBe("M3");
    expect(evaluationLabel(at({ kind: "mate", value: -2 }))).toBe("−M2");
  });

  it("na posição já em mate, quem está na vez perdeu: barra cheia e 1-0 ou 0-1", () => {
    // Stockfish manda "mate 0" sem dizer quem levou o mate.
    expect(whiteShare(at({ kind: "mate", value: 0 }, "b"))).toBe(100);
    expect(evaluationLabel(at({ kind: "mate", value: 0 }, "b"))).toBe("1-0");
    expect(whiteShare(at({ kind: "mate", value: 0 }, "w"))).toBe(0);
    expect(evaluationLabel(at({ kind: "mate", value: 0 }, "w"))).toBe("0-1");
  });

  it("a fatia das brancas segue a chance de vitória", () => {
    expect(whiteShare(at({ kind: "cp", value: 0 }))).toBe(50);
    expect(whiteShare(at({ kind: "mate", value: 1 }))).toBe(100);
    expect(whiteShare(at({ kind: "mate", value: -1 }))).toBe(0);
  });

  it("tem um símbolo para cada classificação", () => {
    expect(Object.keys(QUALITY_SYMBOL)).toHaveLength(7);
  });
});
