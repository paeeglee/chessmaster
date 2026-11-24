import {
  type AnalysisResult,
  MOVE_QUALITY_LABEL,
  type MoveFacts,
  type MoveQuality,
  type MoveReview,
  pieceWithArticle,
  sideToMoveOf,
  winChance,
} from "../../analysis";
import type { PositionEvaluation } from "../../evaluation";

/** Símbolo curto de cada classificação, dentro do ícone colorido (MR-09). */
export const QUALITY_SYMBOL: Record<MoveQuality, string> = {
  best: "★",
  excellent: "!",
  good: "✓",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
  miss: "×",
};

/** Classe de cor de fundo (token do tema) de cada classificação. */
export const QUALITY_BACKGROUND: Record<MoveQuality, string> = {
  best: "bg-quality-best",
  excellent: "bg-quality-excellent",
  good: "bg-quality-good",
  inaccuracy: "bg-quality-inaccuracy",
  mistake: "bg-quality-mistake",
  blunder: "bg-quality-blunder",
  miss: "bg-quality-miss",
};

/** A revisão do meio-lance `ply` (1 = primeiro lance); null na posição inicial. */
export function reviewAt(result: AnalysisResult, ply: number): MoveReview | null {
  return ply > 0 ? (result.moveReviews[ply - 1] ?? null) : null;
}

function joinPortuguese(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} e ${parts.at(-1)}`;
}

/** MR-08: "dá xeque e salva o bispo em a1". Vazio quando o motor não deu motivo. */
export function bestMoveReasons(facts: MoveFacts): string {
  const reasons = facts.bestReasons;
  if (!reasons) return "";
  const parts: string[] = [];
  if (reasons.mateIn !== null) parts.push(`leva ao mate em ${reasons.mateIn}`);
  else if (reasons.check) parts.push("dá xeque");
  if (reasons.wins > 0) {
    parts.push(`ganha ${reasons.wins} ${reasons.wins === 1 ? "ponto" : "pontos"} de material`);
  }
  for (const piece of reasons.saves) parts.push(`salva ${pieceWithArticle(piece)}`);
  return joinPortuguese(parts);
}

/** MR-10: a frase do melhor lance ("Melhor era 22...Bd4+: dá xeque e salva…"). */
export function bestMoveSentence(review: MoveReview): string | null {
  const { facts } = review;
  if (facts.isBest) return "Este foi o lance do motor.";
  if (!facts.bestMoveLabel) return null;
  const why = bestMoveReasons(facts);
  return why ? `Melhor era ${facts.bestMoveLabel}: ${why}.` : `Melhor era ${facts.bestMoveLabel}.`;
}

/** MR-06, MR-07: o que o lance deixou descoberto e o que deixou passar. */
export function coachFindings(review: MoveReview): string[] {
  const { facts } = review;
  const items: string[] = [];
  if (facts.undefended.length > 0) {
    items.push(`Deixou descoberto: ${joinPortuguese(facts.undefended.map(pieceWithArticle))}.`);
  }
  if (facts.stillEnPrise.length > 0) {
    items.push(
      `Continuou atacado e sem defesa: ${joinPortuguese(facts.stillEnPrise.map(pieceWithArticle))}.`,
    );
  }
  if (!facts.isBest && facts.missedMaterial > 0) {
    const points = facts.missedMaterial === 1 ? "ponto" : "pontos";
    items.push(`Deixou de ganhar ${facts.missedMaterial} ${points} de material.`);
  }
  return items;
}

/** Título do painel: "22...Ta7 · Erro" e de quem é o lance. */
export function coachTitle(review: MoveReview, playerColor: "w" | "b") {
  return {
    title: `${review.moveLabel} · ${MOVE_QUALITY_LABEL[review.quality]}`,
    owner: review.color === playerColor ? "Seu lance" : "Lance do adversário",
  };
}

/**
 * MR-11: rótulo da avaliação do ponto de vista das brancas ("+1,2", "−0,4", "M3"). Na
 * posição já em mate ("mate 0"), mostra o resultado: "1-0" ou "0-1".
 */
export function evaluationLabel(evaluation: PositionEvaluation): string {
  const { score } = evaluation;
  if (score.kind === "mate" && score.value === 0) {
    return sideToMoveOf(evaluation.fen) === "w" ? "0-1" : "1-0";
  }
  if (score.kind === "mate") {
    return score.value >= 0 ? `M${score.value}` : `−M${Math.abs(score.value)}`;
  }
  const pawns = Math.min(10, Math.max(-10, score.value / 100));
  const text = Math.abs(pawns).toFixed(1).replace(".", ",");
  if (text === "0,0") return "0,0";
  return pawns > 0 ? `+${text}` : `−${text}`;
}

/** MR-11: fatia da barra que fica com as brancas (0 a 100), pela chance de vitória. */
export function whiteShare(evaluation: PositionEvaluation): number {
  return winChance(evaluation.score, "w", sideToMoveOf(evaluation.fen));
}
