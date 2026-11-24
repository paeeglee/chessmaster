import { MOVETIME_MS } from "../../evaluation";

/** Partida típica de 72 lances (145 posições) a 500 ms por posição. */
export const DEFAULT_ESTIMATE_SECONDS = 75;

/** Estimativa do tempo de análise: ~500 ms por posição, arredondada a 5 s. */
export function estimateSeconds(plies: number | null): number {
  if (plies === null) {
    return DEFAULT_ESTIMATE_SECONDS;
  }
  const seconds = ((plies + 1) * MOVETIME_MS) / 1000;
  return Math.max(5, Math.round(seconds / 5) * 5);
}
