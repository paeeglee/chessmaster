import { Chess, type Square } from "chess.js";
import { toPortugueseSan } from "./notation";

export type PlayedMove = {
  fen: string;
  san: string;
  uci: string;
  from: string;
  to: string;
  piece: string;
};

/** Casas para onde a peça em `square` pode ir (vazio se não for a vez dela). */
export function legalDestinations(fen: string, square: string): string[] {
  return new Chess(fen).moves({ square: square as Square, verbose: true }).map((move) => move.to);
}

/** Joga o lance `from` → `to` (promoção vira dama); null se for ilegal. */
export function playMove(fen: string, from: string, to: string): PlayedMove | null {
  const chess = new Chess(fen);
  const candidate = chess
    .moves({ square: from as Square, verbose: true })
    .find((move) => move.to === to && (!move.promotion || move.promotion === "q"));
  if (!candidate) {
    return null;
  }
  const move = chess.move(candidate.san);
  return {
    fen: chess.fen(),
    san: move.san,
    uci: `${move.from}${move.to}${move.promotion ?? ""}`,
    from: move.from,
    to: move.to,
    piece: move.piece,
  };
}

/** Lances UCI de uma linha em SAN português, a partir da posição dada (até `max`). */
export function portugueseLine(fen: string, line: readonly string[], max: number): string[] {
  const chess = new Chess(fen);
  const sans: string[] = [];
  for (const uci of line.slice(0, max)) {
    try {
      const promotion = uci[4];
      const move = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        ...(promotion ? { promotion } : {}),
      });
      sans.push(toPortugueseSan(move.san));
    } catch {
      break;
    }
  }
  return sans;
}
