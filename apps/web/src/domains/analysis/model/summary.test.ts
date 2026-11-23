import { describe, expect, it } from "vitest";
import type { PositionEvaluation } from "../../evaluation";
import { parseGameText, replayGame } from "../../game";
import referenceGameHtml from "../../game/fixtures/reference-game.chesscom.html?raw";
import referenceEvaluations from "../fixtures/reference-game.evaluations.json";
import { findingsFrom } from "./findings";
import { analysisProgress } from "./progress";
import { summarizeAnalysis } from "./summary";

function referenceGame() {
  const parsed = parseGameText(referenceGameHtml);
  if (parsed.kind !== "parsed") throw new Error("partida inválida");
  const replayed = replayGame(parsed.game);
  if (replayed.kind !== "legal") throw new Error("lance ilegal");
  return replayed.game;
}

describe("summarizeAnalysis", () => {
  const summary = summarizeAnalysis(
    referenceGame(),
    referenceEvaluations as PositionEvaluation[],
    "b",
  );

  it("junta momentos-chave, erros do adversário, pontos fortes, padrões e linha do tempo", () => {
    expect(summary.keyMoments.map((moment) => moment.moveLabel)).toEqual([
      "22...Ta7",
      "27...Tb7",
      "41...Ta1",
      "43...Te6",
      "56...Ta8",
    ]);
    expect(summary.opponentMistakes.map((mistake) => mistake.moveLabel)).toContain("12.Ce2");
    expect(summary.strengths.length).toBeGreaterThan(0);
    expect(summary.strengths.length).toBeLessThanOrEqual(3);
    expect(summary.patterns.reduce((total, pattern) => total + pattern.count, 0)).toBe(5);
    expect(summary.materialTimeline).toHaveLength(145);
    expect(summary.verdicts).toHaveLength(144);
  });

  it("gera os achados com tag e texto, inclusive defensor saiu (AS-03)", () => {
    const findings = findingsFrom(summary.verdicts);
    expect(findings.find((finding) => finding.ply === 44)).toEqual({
      ply: 44,
      tag: "Erro",
      moveLabel: "22...Ta7?",
      text: "deixou o bispo em a1 ser capturado",
    });
    expect(findings.find((finding) => finding.ply === 23)).toMatchObject({
      tag: "Adversário",
      moveLabel: "12.Ce2?",
    });
    expect(findings.map((finding) => finding.ply)).toEqual(
      [...findings.map((finding) => finding.ply)].sort((a, b) => a - b),
    );
  });

  it("escreve defensor saiu como 'tirou a proteção'", () => {
    const [finding] = findingsFrom([
      {
        kind: "mistake",
        ply: 82,
        color: "b",
        moveLabel: "41...Ta1",
        loss: 3,
        bestMoveSan: null,
        mistakeType: "defender-moved",
        lostPiece: { type: "n", square: "c3" },
      },
    ]);
    expect(finding?.text).toBe("tirou a proteção do cavalo em c3");
  });

  it("sem momentos-chave, o resumo fica vazio mas completo (AS-16)", () => {
    const game = referenceGame();
    const shortGame = { ...game, plies: game.plies.slice(0, 2) };
    const quiet = summarizeAnalysis(
      shortGame,
      (referenceEvaluations as PositionEvaluation[]).slice(0, 3),
      "b",
    );
    expect(quiet.keyMoments).toEqual([]);
    expect(quiet.patterns).toEqual([]);
  });
});

describe("analysisProgress (AS-10)", () => {
  it("calcula porcentagem, lance atual e tempo restante", () => {
    // 145 posições; 89 avaliadas em 17,8 s → 0,2 s por posição, 56 faltando (11,2 s). A
    // última avaliada é a posição 88, depois de 44...Texe3+: lance 44.
    expect(analysisProgress(89, 145, 17_800)).toEqual({
      percent: 61,
      currentMove: 44,
      totalMoves: 72,
      remainingSeconds: 12,
    });
  });

  it("começa no lance 1 sem estimativa", () => {
    expect(analysisProgress(0, 145, 0)).toEqual({
      percent: 0,
      currentMove: 1,
      totalMoves: 72,
      remainingSeconds: null,
    });
  });

  it("termina em 100% no último lance", () => {
    expect(analysisProgress(145, 145, 29_000)).toMatchObject({
      percent: 100,
      currentMove: 72,
      remainingSeconds: 0,
    });
  });

  it("não divide por zero sem posições", () => {
    expect(analysisProgress(0, 0, 0).percent).toBe(0);
  });
});
