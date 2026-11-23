/** Pontuação do motor, sempre do ponto de vista das brancas. */
export type EngineScore = { kind: "cp"; value: number } | { kind: "mate"; value: number };

export type PositionEvaluation = {
  fen: string;
  depth: number;
  score: EngineScore;
  /** Melhor lance em notação UCI (ex.: "e2e4"); null quando não há lance legal. */
  bestMove: string | null;
  /** Variante principal em notação UCI. */
  pv: string[];
};

export type EngineBuildVariant = "multi-thread" | "single-thread";

export type EngineBuild = {
  variant: EngineBuildVariant;
  scriptUrl: string;
  threads: number;
};

export type DownloadProgress = { percent: number; loaded: number; total: number };
