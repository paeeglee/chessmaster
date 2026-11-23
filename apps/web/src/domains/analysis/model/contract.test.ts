import { describe, expect, it } from "vitest";
import type { PositionEvaluation } from "../../evaluation";
import { parseGameText, replayGame } from "../../game";
import referenceGameHtml from "../../game/fixtures/reference-game.chesscom.html?raw";
import type { AnalysisRequest } from "../../game-input";
import referenceEvaluations from "../fixtures/reference-game.evaluations.json";
import { buildContract } from "./contract";
import { summarizeAnalysis } from "./summary";

function referenceRequest(playerColor: "w" | "b" = "b"): AnalysisRequest {
  const parsed = parseGameText(referenceGameHtml);
  if (parsed.kind !== "parsed") throw new Error("partida inválida");
  const replayed = replayGame(parsed.game);
  if (replayed.kind !== "legal") throw new Error("lance ilegal");
  return { game: replayed.game, playerColor, level: "beginner", priorities: ["lost-pieces"] };
}

function contractFor(request: AnalysisRequest) {
  const summary = summarizeAnalysis(
    request.game,
    referenceEvaluations as PositionEvaluation[],
    request.playerColor,
  );
  return buildContract(request, summary);
}

describe("buildContract (AS-14, AS-15)", () => {
  const contract = contractFor(referenceRequest());

  it("traz cor, resultado, fim e escolhas do jogador", () => {
    expect(contract).toMatchObject({
      level: "beginner",
      priorities: ["lost-pieces"],
      player_color: "b",
      result: "0-1",
      termination: "checkmate",
      outcome_for_player: "win",
      total_moves: 72,
    });
  });

  it("traz os lances em notação portuguesa", () => {
    expect(contract.moves).toHaveLength(144);
    expect(contract.moves[43]).toEqual({ ply: 44, label: "22...Ta7", san: "Ta7" });
    expect(contract.moves[143]).toEqual({ ply: 144, label: "72...Ta6#", san: "Ta6#" });
  });

  it("traz os cinco momentos-chave com tipo, peça perdida e melhor lance", () => {
    expect(contract.key_moments.map((moment) => moment.move_label)).toEqual([
      "22...Ta7",
      "27...Tb7",
      "41...Ta1",
      "43...Te6",
      "56...Ta8",
    ]);
    expect(contract.key_moments[0]).toEqual({
      ply: 44,
      move_label: "22...Ta7",
      mistake_type: "hanging-piece",
      lost_piece: { type: "b", square: "a1" },
      best_move: "Bd4+",
      loss: 3,
    });
  });

  it("marca onde a vantagem começou: 12...Bxa1", () => {
    expect(contract.advantage_started_at).toEqual({ ply: 24, label: "12...Bxa1" });
  });

  it("traz erros do adversário, pontos fortes, padrões e linha do tempo", () => {
    expect(contract.opponent_mistakes.find((item) => item.ply === 23)).toEqual({
      ply: 23,
      move_label: "12.Ce2",
      lost_piece: { type: "r", square: "a1" },
      loss: 5,
    });
    expect(contract.strengths.length).toBeGreaterThan(0);
    expect(contract.patterns.flatMap((pattern) => pattern.move_labels).sort()).toEqual(
      ["22...Ta7", "27...Tb7", "41...Ta1", "43...Te6", "56...Ta8"].sort(),
    );
    expect(contract.material_timeline).toHaveLength(145);
  });

  it("calcula o resultado para cada lado", () => {
    expect(contractFor(referenceRequest("w")).outcome_for_player).toBe("loss");
    const request = referenceRequest();
    const draw = { ...request, game: { ...request.game, result: "1/2-1/2" as const } };
    expect(contractFor(draw).outcome_for_player).toBe("draw");
    const unknown = { ...request, game: { ...request.game, result: null } };
    expect(contractFor(unknown).outcome_for_player).toBe("unknown");
  });

  it("sem vantagem de 2 pontos, advantage_started_at é nulo", () => {
    const request = referenceRequest();
    const short = { ...request, game: { ...request.game, plies: request.game.plies.slice(0, 4) } };
    const summary = summarizeAnalysis(
      short.game,
      (referenceEvaluations as PositionEvaluation[]).slice(0, 5),
      "b",
    );
    expect(buildContract(short, summary).advantage_started_at).toBeNull();
  });
});
