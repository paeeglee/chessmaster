export type AnalysisProgress = {
  /** Porcentagem inteira de posições avaliadas. */
  percent: number;
  /** Número do lance da posição em avaliação ("Lance N de M"). */
  currentMove: number;
  totalMoves: number;
  /** Segundos restantes estimados pela média até aqui; null antes da primeira posição. */
  remainingSeconds: number | null;
};

/**
 * A-03: progresso real (posições avaliadas ÷ total) e tempo restante pela média do
 * tempo gasto por posição.
 */
export function analysisProgress(
  evaluated: number,
  totalPositions: number,
  elapsedMs: number,
): AnalysisProgress {
  const plies = Math.max(0, totalPositions - 1);
  const totalMoves = Math.ceil(plies / 2);
  // A posição k (0 = inicial) vem depois do meio-lance k, do lance ceil(k / 2).
  const currentPosition = Math.min(evaluated, plies);
  const currentMove = Math.max(1, Math.ceil(currentPosition / 2));
  const percent = totalPositions === 0 ? 0 : Math.floor((evaluated / totalPositions) * 100);
  const remainingSeconds =
    evaluated === 0
      ? null
      : Math.ceil(((elapsedMs / evaluated) * (totalPositions - evaluated)) / 1000);
  return { percent, currentMove, totalMoves, remainingSeconds };
}
