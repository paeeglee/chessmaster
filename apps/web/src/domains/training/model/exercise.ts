import {
  type AnalysisResult,
  classifyMove,
  MISTAKE_TYPE_LABEL,
  type MistakeType,
  type MistakeVerdict,
  pieceWithArticle,
} from "../../analysis";
import type { PositionEvaluation } from "../../evaluation";
import {
  legalDestinations,
  type PlayedMove,
  type PlayerColor,
  type Ply,
  playMove,
  portugueseLine,
  toPortugueseSan,
  uciToSan,
} from "../../game";

export type TrainingOutcome = "first-try" | "with-hint" | "saw-solution";

/** T-07: até 4 meios-lances da continuação do motor depois do acerto. */
export const CONTINUATION_PLIES = 4;

export type Exercise = {
  moment: MistakeVerdict;
  ply: Ply;
  playerColor: PlayerColor;
  /** Avaliação da posição do exercício (antes do lance errado). */
  before: PositionEvaluation;
};

/** O exercício do momento-chave que acontece no meio-lance `momentPly`. */
export function exerciseFor(result: AnalysisResult, momentPly: number): Exercise {
  const moment = result.keyMoments.find((item) => item.ply === momentPly);
  const ply = result.request.game.plies[momentPly - 1];
  const before = result.evaluations[momentPly - 1];
  if (!moment || !ply || !before) {
    throw new Error(`Momento-chave ${momentPly} não encontrado`);
  }
  return { moment, ply, playerColor: result.request.playerColor, before };
}

function dots(color: PlayerColor): string {
  return color === "w" ? "." : "...";
}

/** "22...Te6": lance do jogador com o número do exercício. */
export function attemptLabel(exercise: Exercise, san: string): string {
  return `${exercise.ply.moveNumber}${dots(exercise.ply.color)}${toPortugueseSan(san)}`;
}

/** Rótulo do lance seguinte (do adversário): "23.Txa1" ou "22...Txa1". */
function replyLabel(exercise: Exercise, sanPt: string): string {
  const { moveNumber, color } = exercise.ply;
  return color === "b" ? `${moveNumber + 1}.${sanPt}` : `${moveNumber}...${sanPt}`;
}

const QUESTIONS: Record<MistakeType, string> = {
  "hanging-piece": "Uma das suas peças está em perigo. O que fazer?",
  "defender-moved": "Uma das suas peças protege outra. Qual lance mantém tudo seguro?",
  other: "Qual lance não entrega material?",
};

/** Enunciado: tipo, pergunta e contexto, sem entregar a resposta (step_04 §5). */
export function statementFor(exercise: Exercise) {
  return {
    kicker: `Encontre o lance · tipo: ${MISTAKE_TYPE_LABEL[exercise.moment.mistakeType].toLowerCase()}`,
    question: QUESTIONS[exercise.moment.mistakeType],
    context: `Posição real da sua partida, antes do lance ${exercise.ply.moveNumber}. Na partida você jogou ${exercise.moment.moveLabel}.`,
  };
}

export type AttemptResult = {
  accepted: boolean;
  label: string;
  repeatedGameMove: boolean;
  /** Resposta do adversário segundo o motor, com número ("23.Txa1"). */
  replyLabel: string | null;
  replyUci: string | null;
  lostPiece: MistakeVerdict["lostPiece"];
  /** Continuação do motor depois do lance, em SAN português. */
  continuation: string[];
};

/**
 * T-03: confere a tentativa com a mesma regra do momento-chave (D3). É aceita quando
 * não perde 2 pontos de material ou mais em relação ao melhor lance.
 */
export function checkAttempt(
  exercise: Exercise,
  attempt: PlayedMove,
  after: PositionEvaluation,
): AttemptResult {
  const attemptPly: Ply = {
    ...exercise.ply,
    san: attempt.san,
    from: attempt.from,
    to: attempt.to,
    piece: attempt.piece as Ply["piece"],
    captured: null,
    promotion: attempt.uci.length > 4 ? (attempt.uci[4] as Ply["piece"]) : null,
    fenAfter: attempt.fen,
  };
  const verdict = classifyMove({
    ply: attemptPly,
    before: exercise.before,
    after,
    playerColor: exercise.playerColor,
  });
  const replyUci = after.pv[0] ?? null;
  const replySan = replyUci ? uciToSan(attempt.fen, replyUci) : null;
  const gameUci = `${exercise.ply.from}${exercise.ply.to}${exercise.ply.promotion ?? ""}`;
  return {
    accepted: verdict.kind !== "mistake",
    label: attemptLabel(exercise, attempt.san),
    repeatedGameMove: attempt.uci === gameUci,
    replyLabel: replySan ? replyLabel(exercise, toPortugueseSan(replySan)) : null,
    replyUci,
    lostPiece: verdict.kind === "mistake" ? verdict.lostPiece : null,
    continuation: portugueseLine(attempt.fen, after.pv, CONTINUATION_PLIES),
  };
}

function pieceName(piece: NonNullable<MistakeVerdict["lostPiece"]>): string {
  // "o bispo em a1" → "o bispo"
  return pieceWithArticle(piece).replace(/ em [a-h][1-8]$/, "");
}

/** T-04: o que acontece depois de um lance errado, sem revelar a solução. */
export function wrongFeedback(result: AttemptResult): { title: string; text: string } {
  const piece = result.lostPiece ? pieceName(result.lostPiece) : null;
  const title = piece
    ? `${result.label} ainda perde ${piece}`
    : `${result.label} ainda perde material`;
  const after = result.replyLabel ? `Depois de ${result.replyLabel}, ` : "Depois da resposta, ";
  const text = piece
    ? `${after}${piece} some do tabuleiro.`
    : `${after}o adversário ganha material.`;
  return {
    title,
    text: result.repeatedGameMove ? `${text} Esse foi o lance jogado na partida.` : text,
  };
}

/** T-06: dicas em níveis, do padrão à peça. */
export function hintText(exercise: Exercise, level: 1 | 2): string {
  const piece = exercise.moment.lostPiece;
  if (level === 1) {
    if (!piece) return "Procure o lance que não entrega material.";
    if (exercise.moment.mistakeType === "defender-moved") {
      return `Que peça protegia ${pieceWithArticle(piece)}?`;
    }
    return `Olhe a casa ${piece.square}: quem ataca ${pieceName(piece)}?`;
  }
  if (!piece) return "Compare o que cada lance deixa desprotegido.";
  const name = pieceName(piece);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} pode sair dali ou ser protegid${name.startsWith("a ") ? "a" : "o"}.`;
}

/** A solução do motor com número ("22...Bd4+"). */
export function solutionLabel(exercise: Exercise): string | null {
  const best = exercise.before.bestMove;
  if (!best) return null;
  const san = uciToSan(exercise.ply.fenBefore, best);
  return san ? attemptLabel(exercise, san) : null;
}

const PRINCIPLES: Record<MistakeType, string> = {
  "hanging-piece": "Antes de cada lance, confira quais peças suas estão atacadas.",
  "defender-moved": "Antes de mover uma peça, veja se ela protege outra.",
  other: "Antes de cada lance, pergunte o que o adversário ganha.",
};

/** T-07: o princípio reforçado depois do acerto. */
export function principleFor(type: MistakeType): string {
  return PRINCIPLES[type];
}

/** T-10: como o momento foi resolvido. */
export function outcomeOf(
  attempts: number,
  hintsUsed: number,
  sawSolution: boolean,
): TrainingOutcome {
  if (sawSolution) return "saw-solution";
  return attempts === 1 && hintsUsed === 0 ? "first-try" : "with-hint";
}

/** T-12: "3 de 5 de primeira". */
export function summaryText(outcomes: readonly TrainingOutcome[]): string {
  const firstTry = outcomes.filter((outcome) => outcome === "first-try").length;
  return `${firstTry} de ${outcomes.length} de primeira`;
}

export type SquareClick =
  | { kind: "select"; square: string; destinations: string[] }
  | { kind: "move"; move: PlayedMove }
  | { kind: "clear" };

/**
 * T-02: o que um clique numa casa faz. Com uma peça selecionada, um destino legal
 * joga o lance; uma peça do lado que joga (com lances) passa a ser a selecionada;
 * qualquer outra casa limpa a seleção.
 */
export function squareClick(fen: string, selected: string | null, square: string): SquareClick {
  if (selected && selected !== square) {
    const move = playMove(fen, selected, square);
    if (move) return { kind: "move", move };
  }
  if (selected === square) return { kind: "clear" };
  const destinations = legalDestinations(fen, square);
  return destinations.length > 0 ? { kind: "select", square, destinations } : { kind: "clear" };
}

/** A posição depois da resposta do adversário (refutação), se ela for legal. */
export function refutationFen(result: AttemptResult, attemptFen: string): string | null {
  if (!result.replyUci) return null;
  return (
    playMove(attemptFen, result.replyUci.slice(0, 2), result.replyUci.slice(2, 4))?.fen ?? null
  );
}
