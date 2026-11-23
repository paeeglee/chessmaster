import { Chess, DEFAULT_POSITION } from "chess.js";
import { portugueseToEnglishSan } from "./notation";
import type { Game, GameResult, ParsedGame, PlayerColor, Ply, ReplayOutcome } from "./types";

type Reading = { notation: "en" | "pt"; sanMoves: string[] };

function readingsOf(parsed: ParsedGame): Reading[] {
  switch (parsed.notation) {
    case "en":
    case "pt":
      return [{ notation: parsed.notation, sanMoves: parsed.sanMoves }];
    case "undetermined":
      // Só R e B: tenta inglês (R = torre) e, se falhar, português (R = rei).
      return [
        { notation: "en", sanMoves: parsed.sanMoves },
        { notation: "pt", sanMoves: parsed.writtenMoves.map(portugueseToEnglishSan) },
      ];
  }
}

function colorOfPly(index: number): PlayerColor {
  return index % 2 === 1 ? "w" : "b";
}

function moveNumberOfPly(index: number): number {
  return Math.ceil(index / 2);
}

type Attempt =
  | { kind: "legal"; plies: Ply[]; chess: Chess }
  | { kind: "illegal"; failedAt: number; plies: Ply[] };

function replayReading(sanMoves: readonly string[]): Attempt {
  const chess = new Chess();
  const plies: Ply[] = [];
  for (const [position, san] of sanMoves.entries()) {
    const index = position + 1;
    let move: ReturnType<Chess["move"]>;
    try {
      move = chess.move(san);
    } catch {
      return { kind: "illegal", failedAt: index, plies };
    }
    plies.push({
      index,
      moveNumber: moveNumberOfPly(index),
      color: colorOfPly(index),
      san: move.san,
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: move.captured ?? null,
      promotion: move.promotion ?? null,
      fenBefore: move.before,
      fenAfter: move.after,
      isCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
    });
  }
  return { kind: "legal", plies, chess };
}

function finalState(
  chess: Chess,
  plies: readonly Ply[],
  pastedResult: GameResult | null,
): Pick<Game, "result" | "termination"> {
  // O tabuleiro decide quando a partida terminou em mate ou afogamento.
  if (chess.isCheckmate()) {
    const winner = plies.at(-1)?.color;
    return { termination: "checkmate", result: winner === "w" ? "1-0" : "0-1" };
  }
  if (chess.isStalemate()) {
    return { termination: "stalemate", result: "1/2-1/2" };
  }
  return { termination: null, result: pastedResult };
}

/**
 * Motor 2 (regras): reproduz os lances a partir da posição inicial, confere a
 * legalidade de cada um e devolve todas as posições. Para no primeiro lance ilegal.
 */
export function replayGame(parsed: ParsedGame): ReplayOutcome {
  let furthest: Extract<Attempt, { kind: "illegal" }> | null = null;

  for (const reading of readingsOf(parsed)) {
    const attempt = replayReading(reading.sanMoves);
    if (attempt.kind === "legal") {
      return {
        kind: "legal",
        game: {
          format: parsed.format,
          notation: reading.notation,
          plies: attempt.plies,
          initialFen: DEFAULT_POSITION,
          finalFen: attempt.chess.fen(),
          ...finalState(attempt.chess, attempt.plies, parsed.result),
        },
      };
    }
    if (!furthest || attempt.failedAt > furthest.failedAt) {
      furthest = attempt;
    }
  }

  // Sempre há ao menos uma leitura, então `furthest` existe aqui.
  const failure = furthest as Extract<Attempt, { kind: "illegal" }>;
  return {
    kind: "illegal-move",
    error: {
      ply: failure.failedAt,
      moveNumber: moveNumberOfPly(failure.failedAt),
      color: colorOfPly(failure.failedAt),
      writtenMove: parsed.writtenMoves[failure.failedAt - 1] ?? "",
    },
    plies: failure.plies,
  };
}
