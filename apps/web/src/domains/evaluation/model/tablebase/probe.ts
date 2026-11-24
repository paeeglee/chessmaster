import {
  DRAW,
  type EndgameKind,
  ILLEGAL,
  indexOf,
  STRONG,
  type Table,
  UNKNOWN,
  WEAK,
} from "./generate";

export type Color = "w" | "b";

export type EndgamePosition = {
  kind: EndgameKind;
  strongColor: Color;
  strongKing: number;
  piece: number;
  weakKing: number;
  side: number;
};

export type ProbeResult = {
  kind: EndgameKind;
  strongColor: Color;
  /** Quem vence com jogo perfeito; null = empate. */
  winner: Color | null;
  /** Distância até o mate em meios-lances (null no empate). */
  dtmPlies: number | null;
  /** Lances do lado forte até o mate (null no empate). */
  mateInMoves: number | null;
};

function squareOf(file: number, rank: number) {
  return rank * 8 + file;
}

/**
 * Lê o FEN e diz se é um final da tabela: só os dois reis e uma dama ou uma torre.
 * Qualquer outro material devolve null.
 */
export function endgameOf(fen: string): EndgamePosition | null {
  const [placement = "", turn = "w"] = fen.split(" ");
  const kings: Partial<Record<Color, number>> = {};
  const others: { piece: string; square: number }[] = [];
  const rows = placement.split("/");
  if (rows.length !== 8) return null;
  for (let row = 0; row < 8; row++) {
    let file = 0;
    for (const char of rows[row] as string) {
      if (/\d/.test(char)) {
        file += Number(char);
        continue;
      }
      const square = squareOf(file, 7 - row);
      if (char === "K") kings.w = square;
      else if (char === "k") kings.b = square;
      else others.push({ piece: char, square });
      file += 1;
    }
  }
  const [only] = others;
  if (others.length !== 1 || !only || kings.w === undefined || kings.b === undefined) return null;
  const lower = only.piece.toLowerCase();
  if (lower !== "q" && lower !== "r") return null;
  const strongColor: Color = only.piece === lower ? "b" : "w";
  const weakColor: Color = strongColor === "w" ? "b" : "w";
  return {
    kind: lower === "q" ? "KQK" : "KRK",
    strongColor,
    strongKing: kings[strongColor] as number,
    piece: only.square,
    weakKing: kings[weakColor] as number,
    side: turn === strongColor ? STRONG : WEAK,
  };
}

/** TB-03: resultado exato e distância até o mate de uma posição da tabela. */
export function probe(table: Table, fen: string): ProbeResult | null {
  const position = endgameOf(fen);
  if (!position || position.kind !== table.kind) return null;
  const value = table.dtm[
    indexOf(position.strongKing, position.piece, position.weakKing, position.side)
  ] as number;
  if (value === ILLEGAL || value === UNKNOWN) return null;
  const base = { kind: position.kind, strongColor: position.strongColor };
  if (value === DRAW) return { ...base, winner: null, dtmPlies: null, mateInMoves: null };
  return {
    ...base,
    winner: position.strongColor,
    dtmPlies: value,
    // Lances do lado forte: com ele a jogar, (d + 1) / 2; com o fraco a jogar, d / 2.
    mateInMoves: position.side === STRONG ? (value + 1) / 2 : value / 2,
  };
}
