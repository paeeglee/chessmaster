import type { components } from "../api/schema.gen";

export type GameContract = components["schemas"]["GameContract"];
export type GameExplanation = components["schemas"]["GameExplanation"];
export type QuestionAnswer = components["schemas"]["QuestionAnswer"];
export type QuestionRequest = components["schemas"]["QuestionRequest"];
export type MoveContract = components["schemas"]["MoveContract"];
export type MoveExplanation = components["schemas"]["MoveExplanation"];

/** Erro da camada de IA, com o `detail` que o backend devolveu (ex.: "ai_unavailable"). */
export class ExplanationError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(`A camada de IA respondeu ${status}: ${detail}`);
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const detail =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : "unknown";
    throw new ExplanationError(response.status, detail);
  }
  return (await response.json()) as T;
}

/** POST /api/explanations: textos da tela Resultado a partir do contrato dos motores. */
export function requestExplanation(contract: GameContract): Promise<GameExplanation> {
  return postJson("/api/explanations", contract);
}

/** POST /api/questions: "Pergunte à IA" sobre a partida analisada. */
export function askQuestion(request: QuestionRequest): Promise<QuestionAnswer> {
  return postJson("/api/questions", request);
}

/** POST /api/move-explanations: texto do painel do treinador para um lance (F9). */
export function requestMoveExplanation(contract: MoveContract): Promise<MoveExplanation> {
  return postJson("/api/move-explanations", contract);
}
