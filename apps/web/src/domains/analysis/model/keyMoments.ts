import type { MistakeVerdict, MoveVerdict, Pattern, StrengthVerdict } from "./types";

/** general.md 7.1: no máximo 5 momentos-chave. */
export const MAX_KEY_MOMENTS = 5;
export const MAX_STRENGTHS = 3;

function largest<T extends { ply: number }>(items: T[], size: (item: T) => number, limit: number) {
  return [...items]
    .sort((a, b) => size(b) - size(a) || a.ply - b.ply)
    .slice(0, limit)
    .sort((a, b) => a.ply - b.ply);
}

/** Os 5 erros do jogador de maior perda, em ordem cronológica. */
export function selectKeyMoments(verdicts: readonly MoveVerdict[]): MistakeVerdict[] {
  const mistakes = verdicts.filter(
    (verdict): verdict is MistakeVerdict => verdict.kind === "mistake",
  );
  return largest(mistakes, (mistake) => mistake.loss, MAX_KEY_MOMENTS);
}

/** Até 3 lances com ganho real, os de maior ganho, em ordem cronológica. */
export function selectStrengths(verdicts: readonly MoveVerdict[]): StrengthVerdict[] {
  const strengths = verdicts.filter(
    (verdict): verdict is StrengthVerdict => verdict.kind === "strength",
  );
  return largest(strengths, (strength) => strength.gain, MAX_STRENGTHS);
}

/** Agrupa os momentos-chave por tipo de erro: mais frequente primeiro, depois o mais antigo. */
export function groupPatterns(keyMoments: readonly MistakeVerdict[]): Pattern[] {
  const groups = new Map<MistakeVerdict["mistakeType"], number[]>();
  for (const moment of keyMoments) {
    groups.set(moment.mistakeType, [...(groups.get(moment.mistakeType) ?? []), moment.ply]);
  }
  return [...groups.entries()]
    .map(([mistakeType, plies]) => ({ mistakeType, count: plies.length, plies }))
    .sort((a, b) => b.count - a.count || (a.plies[0] ?? 0) - (b.plies[0] ?? 0));
}
