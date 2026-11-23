import { readChesscomHtml } from "./chesscomHtml";
import { tokenizeMoveText } from "./moveText";
import { detectNotation, portugueseToEnglishSan } from "./notation";
import type { GameFormat, GameResult, ParseOutcome } from "./types";

/** Colagens acima de 500 KB não são lidas (tela Colar: "Colagem muito grande"). */
export const MAX_PASTE_BYTES = 512_000;

const PGN_TAG_PAIR = /^\s*\[[A-Za-z0-9_]+\s+"[^"]*"\]\s*$/m;
const LOOKS_LIKE_HTML = /<[a-z!/][^>]*>/i;

// Junta os textos do documento separados por espaço, para que blocos vizinhos
// (<p>1.e4</p><p>e5</p>) não grudem.
function documentText(doc: Document): string {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    parts.push(node.textContent ?? "");
  }
  return parts.join(" ");
}

function readMoves(text: string): {
  format: GameFormat;
  moves: string[];
  result: GameResult | null;
} {
  if (LOOKS_LIKE_HTML.test(text)) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    const chesscom = readChesscomHtml(doc);
    if (chesscom && chesscom.moves.length > 0) {
      return { format: "chesscom-html", ...chesscom };
    }
    return { format: "move-list", ...tokenizeMoveText(documentText(doc)) };
  }
  return { format: "move-list", ...tokenizeMoveText(text) };
}

/**
 * Motor 1 (leitor): reconhece o formato do texto colado e extrai os lances e o
 * resultado. Não valida a legalidade; isso é o motor de regras (`replayGame`).
 */
export function parseGameText(text: string): ParseOutcome {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > MAX_PASTE_BYTES) {
    return { kind: "too-large", bytes };
  }
  if (text.trim() === "") {
    return { kind: "empty" };
  }
  if (PGN_TAG_PAIR.test(text)) {
    return { kind: "unrecognized" };
  }

  const { format, moves, result } = readMoves(text);
  if (moves.length === 0) {
    return { kind: "unrecognized" };
  }

  const notation = format === "chesscom-html" ? "en" : detectNotation(moves);
  const sanMoves = notation === "pt" ? moves.map(portugueseToEnglishSan) : moves;
  return {
    kind: "parsed",
    game: { format, notation, writtenMoves: moves, sanMoves, result },
  };
}
