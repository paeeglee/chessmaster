import type { EndgameKind, ProbeResult } from "../../evaluation";
import { endgameOf } from "../../evaluation";
import type { Game, PlayerColor } from "../../game";

/** O final com tabela (KQK ou KRK) que a partida alcançou. */
export type EndgameStart = {
  position: number;
  fen: string;
  kind: EndgameKind;
  strongColor: PlayerColor;
};

export type EndgameSummary = {
  kind: EndgameKind;
  /** Posição (0 = inicial, k = depois do meio-lance k) em que o final começou. */
  position: number;
  strongColor: PlayerColor;
  playerIsStrong: boolean;
  /** Quem vence com jogo perfeito; null = empate. */
  winner: PlayerColor | null;
  /** Lances do lado forte até o mate com jogo perfeito. */
  optimalMoves: number | null;
  /** Lances que o lado forte levou até o mate na partida (null se não houve mate). */
  movesToMate: number | null;
};

/** TB-04: a primeira posição da partida com só reis e uma dama ou uma torre. */
export function findEndgameStart(game: Game): EndgameStart | null {
  const fens = [game.initialFen, ...game.plies.map((ply) => ply.fenAfter)];
  for (let position = 0; position < fens.length; position++) {
    const fen = fens[position] as string;
    const endgame = endgameOf(fen);
    if (endgame) {
      return { position, fen, kind: endgame.kind, strongColor: endgame.strongColor };
    }
  }
  return null;
}

/** TB-05: junta a consulta da tabela com o que aconteceu na partida. */
export function summarizeEndgame(
  game: Game,
  start: EndgameStart,
  probed: ProbeResult,
  playerColor: PlayerColor,
): EndgameSummary {
  const after = game.plies.slice(start.position);
  const last = game.plies.at(-1);
  const strongMated = game.termination === "checkmate" && last?.color === start.strongColor;
  return {
    kind: start.kind,
    position: start.position,
    strongColor: start.strongColor,
    playerIsStrong: start.strongColor === playerColor,
    winner: probed.winner,
    optimalMoves: probed.mateInMoves,
    movesToMate: strongMated ? after.filter((ply) => ply.color === start.strongColor).length : null,
  };
}
