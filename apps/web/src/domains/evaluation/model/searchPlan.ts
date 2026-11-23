/** D1: cerca de 200 ms por posição, com profundidade mínima 12. */
export const MOVETIME_MS = 200;
export const MIN_DEPTH = 12;

/** Quando a busca por tempo não chega à profundidade mínima, busca de novo até ela. */
export function needsDeeperSearch(depthReached: number): boolean {
  return depthReached < MIN_DEPTH;
}
