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
 * Células de lance nos dois layouts do Chess.com:
 * - lista horizontal da aba de aberturas (`<wc-horizontal-move-list>`): `.move-text`;
 * - lista ao lado do tabuleiro (`<wc-move-list>`): `.node-highlight-content` dentro dos
 *   nós da linha principal (`.main-line-ply`), sem variantes, tempos nem ícones.
 */
function moveCells(doc: Document): Element[] {
  const horizontal = doc.querySelectorAll(".move-text");
  if (horizontal.length > 0) {
    return Array.from(horizontal);
  }
  return Array.from(doc.querySelectorAll(".main-line-ply .node-highlight-content"));
}

/**
 * Lê a lista de lances do HTML do Chess.com. Devolve null quando o documento não tem
 * nenhuma célula de lance reconhecida.
 */
export function readChesscomHtml(doc: Document): ChesscomMoves | null {
  const cells = moveCells(doc);
  if (cells.length === 0) {
    return null;
  }
  const moves = cells
    .map((cell) => readMoveToken(moveCellText(cell).replace(/\s+/g, "")))
    .filter((move): move is string => move !== null);
  const resultText =
    doc.querySelector(".game-result-node, .game-result")?.textContent?.trim() ?? "";
  return { moves, result: readResultToken(resultText) ?? null };
}
