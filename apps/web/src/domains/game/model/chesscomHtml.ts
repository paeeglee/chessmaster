import { readMoveToken, readResultToken } from "./moveText";
import type { GameResult } from "./types";

export type ChesscomMoves = { moves: string[]; result: GameResult | null };

// Monta o texto de uma célula de lance trocando o ícone da peça (data-figurine)
// pela letra inglesa que ele representa: <span data-figurine="N"></span>c3 → Nc3.
function moveCellText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node instanceof Element && node.hasAttribute("data-figurine")) {
    return node.getAttribute("data-figurine") ?? "";
  }
  return Array.from(node.childNodes, moveCellText).join("");
}

/**
 * Lê a lista de lances do HTML do Chess.com. Devolve null quando o documento não tem
 * nenhuma célula `move-text`.
 */
export function readChesscomHtml(doc: Document): ChesscomMoves | null {
  const cells = Array.from(doc.querySelectorAll(".move-text"));
  if (cells.length === 0) {
    return null;
  }
  const moves = cells
    .map((cell) => readMoveToken(moveCellText(cell).replace(/\s+/g, "")))
    .filter((move): move is string => move !== null);
  const resultText = doc.querySelector(".game-result-node")?.textContent ?? "";
  return { moves, result: readResultToken(resultText) ?? null };
}
