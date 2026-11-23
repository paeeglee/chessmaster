import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";

export type CapturedPiece = { square: string; piece: PieceSymbol; color: "w" | "b" };

export type CaptureLine = {
  /** Posição no fim da linha. */
  fen: string;
  /** Peças capturadas ao longo da linha, em ordem. */
  captures: CapturedPiece[];
};

function playUci(chess: Chess, uci: string) {
  const promotion = uci[4];
  const move = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  return chess.move(promotion ? { ...move, promotion } : move);
}

/**
 * Joga o primeiro lance e depois segue a continuação do motor só enquanto os
 * lances forem capturas ou promoções (no máximo `maxPlies` depois do primeiro). Um
 * lance ilegal (variante desatualizada) encerra a linha.
 */
export function playCaptureLine(
  fen: string,
  firstUci: string | null,
  continuation: readonly string[],
  maxPlies = 8,
): CaptureLine {
  const chess = new Chess(fen);
  const captures: CapturedPiece[] = [];
  const record = (move: ReturnType<Chess["move"]>) => {
    if (move.captured) {
      // No en passant o peão capturado não está na casa de destino.
      const square = move.isEnPassant() ? `${move.to[0]}${move.from[1]}` : move.to;
      captures.push({ square, piece: move.captured, color: move.color === "w" ? "b" : "w" });
    }
  };

  if (firstUci) {
    try {
      record(playUci(chess, firstUci));
    } catch {
      return { fen, captures };
    }
  }
  for (const uci of continuation.slice(0, maxPlies)) {
    const probe = new Chess(chess.fen());
    let move: ReturnType<Chess["move"]>;
    try {
      move = playUci(probe, uci);
    } catch {
      break;
    }
    if (!move.captured && !move.promotion) {
      break;
    }
    record(playUci(chess, uci));
  }
  return { fen: chess.fen(), captures };
}

/** Casas das peças de `color` que defendem (atacam) `square`. */
export function defendersOf(fen: string, square: string, color: "w" | "b"): string[] {
  return new Chess(fen).attackers(square as Square, color as Color);
}

/** Se `square` está atacada por peças de `color`. */
export function isAttackedBy(fen: string, square: string, color: "w" | "b"): boolean {
  return new Chess(fen).isAttacked(square as Square, color as Color);
}

/** Converte um lance UCI (e2e4) em SAN inglês na posição dada; null se ilegal. */
export function uciToSan(fen: string, uci: string): string | null {
  try {
    return playUci(new Chess(fen), uci).san;
  } catch {
    return null;
  }
}
