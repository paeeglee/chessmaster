import { parseGameText, replayGame } from "../../game";
import type { Inspection } from "./types";

/** Menos de 6 lances (12 meios-lances) é "partida curta" (step_01, regras). */
export const SHORT_GAME_PLIES = 12;

/** Motores 1 e 2 sobre o texto colado, resumidos no que a tela precisa mostrar. */
export function inspectGame(text: string): Inspection {
  const parsed = parseGameText(text);
  if (parsed.kind !== "parsed") {
    return { kind: parsed.kind };
  }
  const replay = replayGame(parsed.game);
  if (replay.kind === "illegal-move") {
    return { kind: "illegal", error: replay.error };
  }
  return {
    kind: "valid",
    game: replay.game,
    format: parsed.game.format,
    shortGame: replay.game.plies.length < SHORT_GAME_PLIES,
  };
}
