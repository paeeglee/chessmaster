import { toPortugueseSan } from "./notation";
import type { Ply } from "./types";

export type BoardPiece = { square: string; color: "w" | "b"; type: string };

const FILES = "abcdefgh";
const ORDER = ["k", "q", "r", "b", "n", "p"];
const NAMES: Record<string, { singular: string; plural: string; feminine: boolean }> = {
  k: { singular: "rei", plural: "reis", feminine: false },
  q: { singular: "dama", plural: "damas", feminine: true },
  r: { singular: "torre", plural: "torres", feminine: true },
  b: { singular: "bispo", plural: "bispos", feminine: false },
  n: { singular: "cavalo", plural: "cavalos", feminine: false },
  p: { singular: "peão", plural: "peões", feminine: false },
};

/** "72...Ta6#": número do lance, pontos de acordo com a cor e SAN português. */
export function formatMoveLabel(ply: Pick<Ply, "moveNumber" | "color" | "san">): string {
  return `${ply.moveNumber}${ply.color === "w" ? "." : "..."}${toPortugueseSan(ply.san)}`;
}

/** Peças de uma posição, das brancas às pretas, por valor e depois por casa. */
export function listPieces(fen: string): BoardPiece[] {
  const rows = (fen.split(" ")[0] ?? "").split("/");
  const pieces: BoardPiece[] = [];
  rows.forEach((row, index) => {
    let file = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        file += Number(char);
        continue;
      }
      pieces.push({
        square: `${FILES[file]}${8 - index}`,
        color: char === char.toUpperCase() ? "w" : "b",
        type: char.toLowerCase(),
      });
      file += 1;
    }
  });
  const rank = (piece: BoardPiece) => ORDER.indexOf(piece.type);
  return pieces.sort(
    (a, b) =>
      // Os reis vêm primeiro (branco e preto), depois as outras peças por cor.
      Number(a.type !== "k") - Number(b.type !== "k") ||
      Number(a.color === "b") - Number(b.color === "b") ||
      rank(a) - rank(b) ||
      a.square.localeCompare(b.square),
  );
}

function colorAdjective(type: string, color: "w" | "b"): string {
  const feminine = NAMES[type]?.feminine ?? false;
  if (color === "w") return feminine ? "branca" : "branco";
  return feminine ? "preta" : "preto";
}

/** Descrição para leitores de tela: "rei branco em a8, rei preto em c7, torre preta em a6". */
export function describePieces(fen: string): string {
  return listPieces(fen)
    .map(
      (piece) =>
        `${NAMES[piece.type]?.singular} ${colorAdjective(piece.type, piece.color)} em ${piece.square}`,
    )
    .join(", ");
}

function joinPortuguese(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
}

function sideSummary(pieces: BoardPiece[], color: "w" | "b"): string {
  const counts = ORDER.map((type) => ({
    type,
    count: pieces.filter((piece) => piece.color === color && piece.type === type).length,
  })).filter(({ count }) => count > 0);
  return joinPortuguese(
    counts.map(({ type, count }) => {
      const name = NAMES[type];
      return count === 1 ? `${name?.singular}` : `${count} ${name?.plural}`;
    }),
  );
}

/** Resumo do material visível na miniatura: "Brancas: rei. Pretas: rei, torre e 2 peões." */
export function summarizeMaterial(fen: string): string {
  const pieces = listPieces(fen);
  return `Brancas: ${sideSummary(pieces, "w")}. Pretas: ${sideSummary(pieces, "b")}.`;
}
