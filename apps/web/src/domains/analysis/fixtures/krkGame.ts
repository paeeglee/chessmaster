import type { Game, Ply } from "../../game";

// Partida curta montada à mão (posições válidas): 1.Txa1 deixa rei e torre contra
// rei, 1...Rb8, 2.Ta8#. Usada para testar a tabela de finais (motor 4).
const FENS = [
  "k7/8/1K6/8/8/8/8/r6R w - - 0 1",
  "k7/8/1K6/8/8/8/8/R7 b - - 0 1",
  "1k6/8/1K6/8/8/8/8/R7 w - - 1 2",
  "Rk6/8/1K6/8/8/8/8/8 b - - 2 2",
];

const MOVES: Pick<Ply, "color" | "moveNumber" | "san" | "from" | "to" | "piece" | "captured">[] = [
  { color: "w", moveNumber: 1, san: "Rxa1", from: "h1", to: "a1", piece: "r", captured: "r" },
  { color: "b", moveNumber: 1, san: "Kb8", from: "a8", to: "b8", piece: "k", captured: null },
  { color: "w", moveNumber: 2, san: "Ra8#", from: "a1", to: "a8", piece: "r", captured: null },
];

export function krkGame(): Game {
  const plies = MOVES.map(
    (move, index) =>
      ({
        ...move,
        index: index + 1,
        promotion: null,
        fenBefore: FENS[index] as string,
        fenAfter: FENS[index + 1] as string,
      }) as Ply,
  );
  return {
    format: "move-list",
    notation: "en",
    plies,
    initialFen: FENS[0] as string,
    termination: "checkmate",
  } as Game;
}
