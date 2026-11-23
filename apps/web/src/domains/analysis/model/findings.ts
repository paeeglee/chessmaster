import type { MoveVerdict, PieceOnSquare, PieceType } from "./types";

const PIECES: Record<PieceType, { name: string; feminine: boolean }> = {
  p: { name: "peão", feminine: false },
  n: { name: "cavalo", feminine: false },
  b: { name: "bispo", feminine: false },
  r: { name: "torre", feminine: true },
  q: { name: "dama", feminine: true },
  k: { name: "rei", feminine: false },
};

export const MISTAKE_TYPE_LABEL = {
  "hanging-piece": "Peça atacada",
  "defender-moved": "Defensor saiu",
  other: "Outro",
} as const;

/** "o bispo em a1" / "a torre em e4". */
export function pieceWithArticle(piece: PieceOnSquare): string {
  const { name, feminine } = PIECES[piece.type];
  return `${feminine ? "a" : "o"} ${name} em ${piece.square}`;
}

function captured(piece: PieceOnSquare): string {
  return PIECES[piece.type].feminine ? "capturada" : "capturado";
}

/** Texto de "Já encontrado", feito por template a partir do motor (sem IA). */
export function findingText(verdict: MoveVerdict): string | null {
  switch (verdict.kind) {
    case "none":
      return null;
    case "mistake":
      return verdict.lostPiece
        ? `deixou ${pieceWithArticle(verdict.lostPiece)} ser ${captured(verdict.lostPiece)}`
        : "perdeu material";
    case "opponent-mistake":
      return verdict.lostPiece
        ? `o adversário deixou ${pieceWithArticle(verdict.lostPiece)} ser ${captured(verdict.lostPiece)}`
        : "o adversário perdeu material";
    case "strength":
      return verdict.wonPiece ? `ganhou ${pieceWithArticle(verdict.wonPiece)}` : "ganhou material";
  }
}
