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

/** "do cavalo em c3" / "da torre em e4". */
function ofPiece(piece: PieceOnSquare): string {
  const { name, feminine } = PIECES[piece.type];
  return `${feminine ? "da" : "do"} ${name} em ${piece.square}`;
}

export type FindingTag = "Erro" | "Adversário";

export type Finding = { ply: number; tag: FindingTag; moveLabel: string; text: string };

/** Itens de "Já encontrado": erros do jogador e do adversário, em ordem cronológica. */
export function findingsFrom(verdicts: readonly MoveVerdict[]): Finding[] {
  return verdicts.flatMap((verdict) => {
    if (verdict.kind !== "mistake" && verdict.kind !== "opponent-mistake") {
      return [];
    }
    return [
      {
        ply: verdict.ply,
        tag: verdict.kind === "mistake" ? "Erro" : "Adversário",
        moveLabel: `${verdict.moveLabel}?`,
        text: findingText(verdict) ?? "",
      },
    ];
  });
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
      if (!verdict.lostPiece) {
        return "perdeu material";
      }
      // Mockup do passo 2: "41...Ta1? tirou a proteção do cavalo em c3".
      return verdict.mistakeType === "defender-moved"
        ? `tirou a proteção ${ofPiece(verdict.lostPiece)}`
        : `deixou ${pieceWithArticle(verdict.lostPiece)} ser ${captured(verdict.lostPiece)}`;
    case "opponent-mistake":
      return verdict.lostPiece
        ? `o adversário deixou ${pieceWithArticle(verdict.lostPiece)} ser ${captured(verdict.lostPiece)}`
        : "o adversário perdeu material";
    case "strength":
      return verdict.wonPiece ? `ganhou ${pieceWithArticle(verdict.wonPiece)}` : "ganhou material";
  }
}
