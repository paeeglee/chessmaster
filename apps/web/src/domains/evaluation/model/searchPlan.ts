/**
 * D1: cerca de 500 ms por posição, com profundidade mínima 12. Era 200 ms; subiu em
 * 2026-11-24 para a revisão lance a lance ter classificações mais estáveis (F9).
 */
export const MOVETIME_MS = 500;
export const MIN_DEPTH = 12;

/** Quando a busca por tempo não chega à profundidade mínima, busca de novo até ela. */
export function needsDeeperSearch(depthReached: number): boolean {
  return depthReached < MIN_DEPTH;
}
