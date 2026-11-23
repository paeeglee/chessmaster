import type { EngineScore } from "./types";

export type InfoLine = { depth: number; score: EngineScore; pv: string[] };

/**
 * Lê uma linha `info` do Stockfish. Devolve null para linhas sem pontuação exata
 * (`info string`, `info currmove`, ou com `lowerbound`/`upperbound`).
 */
export function parseInfoLine(line: string): InfoLine | null {
  const fields = line.trim().split(/\s+/);
  if (fields[0] !== "info") {
    return null;
  }
  const depthAt = fields.indexOf("depth");
  const scoreAt = fields.indexOf("score");
  if (depthAt === -1 || scoreAt === -1) {
    return null;
  }
  if (fields.includes("lowerbound") || fields.includes("upperbound")) {
    return null;
  }
  const kind = fields[scoreAt + 1];
  const value = Number(fields[scoreAt + 2]);
  if ((kind !== "cp" && kind !== "mate") || !Number.isFinite(value)) {
    return null;
  }
  const pvAt = fields.indexOf("pv");
  return {
    depth: Number(fields[depthAt + 1]),
    score: { kind, value },
    pv: pvAt === -1 ? [] : fields.slice(pvAt + 1),
  };
}

/** Lê `bestmove <lance>`; devolve undefined se a linha não for bestmove. */
export function parseBestMove(line: string): { bestMove: string | null } | undefined {
  const fields = line.trim().split(/\s+/);
  if (fields[0] !== "bestmove") {
    return undefined;
  }
  const move = fields[1];
  return { bestMove: !move || move === "(none)" ? null : move };
}

/** Lado a jogar segundo o FEN ("w" ou "b"). */
export function sideToMoveOf(fen: string): "w" | "b" {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}

/**
 * O UCI dá a pontuação do ponto de vista de quem joga. Guardamos sempre do ponto de
 * vista das brancas: com as pretas a jogar, o sinal inverte.
 */
export function toWhitePerspective(score: EngineScore, sideToMove: "w" | "b"): EngineScore {
  if (sideToMove === "w") {
    return score;
  }
  // `0 - x` evita o -0 quando a pontuação é zero.
  return { kind: score.kind, value: 0 - score.value };
}
