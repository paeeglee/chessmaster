import type { EngineScore } from "../../evaluation";
import type { PlayerColor } from "../../game";

/** Classificação de um lance na escala do Chess.com (F9). */
export type MoveQuality =
  | "best"
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "miss";

export const MOVE_QUALITY_LABEL: Record<MoveQuality, string> = {
  best: "Melhor",
  excellent: "Excelente",
  good: "Bom",
  inaccuracy: "Imprecisão",
  mistake: "Erro",
  blunder: "Capivarada",
  miss: "Perdeu a chance",
};

/**
 * Faixas de perda de chance de vitória (pontos percentuais), as mesmas do Chess.com
 * em "pontos esperados": 0,02 / 0,05 / 0,10 / 0,20.
 */
export const QUALITY_BANDS = { excellent: 2, good: 5, inaccuracy: 10, mistake: 20 } as const;

/** "Perdeu a chance": o adversário errou (perda ≥ 10) e o lance devolveu ≥ 10. */
export const MISS_THRESHOLD = 10;

/**
 * Chance de vitória (0 a 100) de `color` com a avaliação do motor, que vem do ponto de
 * vista das brancas. Fórmula do Lichess: 50 + 50 × (2 / (1 + e^(−0,00368208 × cp)) − 1).
 * Mate a favor vale 100; mate contra vale 0. "Mate 0" (posição já em mate) não diz quem
 * levou o mate: é quem está na vez (`sideToMove`).
 */
export function winChance(
  score: EngineScore,
  color: PlayerColor,
  sideToMove?: PlayerColor,
): number {
  let white: number;
  if (score.kind === "mate" && score.value === 0 && sideToMove) {
    white = sideToMove === "w" ? 0 : 100;
  } else if (score.kind === "mate") {
    white = score.value > 0 ? 100 : 0;
  } else {
    white = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * score.value)) - 1);
  }
  return color === "w" ? white : 100 - white;
}

/** Lado a jogar numa posição FEN. */
export function sideToMoveOf(fen: string): PlayerColor {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}

/** Perda de chance de vitória de quem jogou: antes menos depois, nunca negativa. */
export function winChanceLoss(before: number, after: number): number {
  return Math.max(0, before - after);
}

/** MR-01..MR-04: classifica o lance pela perda de chance de vitória. */
export function classifyQuality(input: {
  loss: number;
  isBest: boolean;
  /** Perda do lance anterior (do adversário); null no primeiro lance. */
  previousLoss: number | null;
}): MoveQuality {
  const { loss, isBest, previousLoss } = input;
  // "Melhor" é só o lance do motor; outro lance sem perda é Excelente (o painel não
  // pode dizer "Melhor" e "Melhor era X" ao mesmo tempo).
  if (isBest) return "best";
  if (previousLoss !== null && previousLoss >= MISS_THRESHOLD && loss >= MISS_THRESHOLD) {
    return "miss";
  }
  if (loss < QUALITY_BANDS.excellent) return "excellent";
  if (loss < QUALITY_BANDS.good) return "good";
  if (loss < QUALITY_BANDS.inaccuracy) return "inaccuracy";
  if (loss < QUALITY_BANDS.mistake) return "mistake";
  return "blunder";
}
