import type { Game, PlayerColor } from "../../game";

/** D3: valores em pontos de material. */
export const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Saldo de material de `color` (suas peças menos as do adversário). */
export function materialBalance(fen: string, color: PlayerColor): number {
  let white = 0;
  for (const char of fen.split(" ")[0] ?? "") {
    const value = PIECE_VALUES[char.toLowerCase()];
    if (value === undefined) continue;
    white += char === char.toUpperCase() ? value : -value;
  }
  return color === "w" ? white : 0 - white;
}

/** Saldo do jogador na posição inicial e depois de cada meio-lance (gráfico, R-06). */
export function materialTimeline(game: Game, playerColor: PlayerColor): number[] {
  return [
    materialBalance(game.initialFen, playerColor),
    ...game.plies.map((ply) => materialBalance(ply.fenAfter, playerColor)),
  ];
}
