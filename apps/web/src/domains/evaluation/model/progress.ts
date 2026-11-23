/** Converte a fração baixada (0–1) em porcentagem inteira de 0 a 100. */
export function toPercent(fraction: number): number {
  if (!Number.isFinite(fraction)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.floor(fraction * 100)));
}
