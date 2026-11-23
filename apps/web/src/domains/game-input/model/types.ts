import type { Game, GameFormat, IllegalMoveError, PlayerColor } from "../../game";

export type Level = "beginner" | "intermediate" | "advanced";
export type Priority = "lost-pieces" | "endgames" | "opening" | "plan";

export const LEVELS: { value: Level; label: string }[] = [
  { value: "beginner", label: "Iniciante — explique sem jargão" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
];

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "lost-pieces", label: "Peças perdidas" },
  { value: "endgames", label: "Finais" },
  { value: "opening", label: "Abertura" },
  { value: "plan", label: "Plano" },
];

export const DEFAULT_PRIORITIES: Priority[] = ["lost-pieces", "endgames"];

/** O que o jogador preencheu na tela Colar; sobrevive à ida e volta da análise. */
export type GameInputDraft = {
  text: string;
  playerColor: PlayerColor | null;
  level: Level;
  priorities: Priority[];
};

/** O que a tela Colar entrega para a análise. */
export type AnalysisRequest = {
  game: Game;
  playerColor: PlayerColor;
  level: Level;
  priorities: Priority[];
};

export type Inspection =
  | { kind: "empty" }
  | { kind: "too-large" }
  | { kind: "unrecognized" }
  | { kind: "illegal"; error: IllegalMoveError }
  | { kind: "valid"; game: Game; format: GameFormat; shortGame: boolean };
