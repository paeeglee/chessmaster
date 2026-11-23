import type { PieceSymbol } from "chess.js";

export type GameFormat = "chesscom-html" | "move-list";

/** Idioma das letras das peças no texto colado. */
export type Notation = "en" | "pt" | "undetermined";

export type GameResult = "1-0" | "0-1" | "1/2-1/2";

export type PlayerColor = "w" | "b";

export type ParsedGame = {
  format: GameFormat;
  notation: Notation;
  /** Lances como o jogador escreveu, sem números e anotações. */
  writtenMoves: string[];
  /** Os mesmos lances em SAN com letras inglesas (leitura inglesa quando indeterminado). */
  sanMoves: string[];
  result: GameResult | null;
};

export type ParseOutcome =
  | { kind: "parsed"; game: ParsedGame }
  | { kind: "empty" }
  | { kind: "unrecognized" }
  | { kind: "too-large"; bytes: number };

export type Ply = {
  /** Índice do meio-lance, começando em 1. */
  index: number;
  moveNumber: number;
  color: PlayerColor;
  /** SAN com letras inglesas, como o motor de regras gera (inclui + e #). */
  san: string;
  from: string;
  to: string;
  piece: PieceSymbol;
  captured: PieceSymbol | null;
  promotion: PieceSymbol | null;
  fenBefore: string;
  fenAfter: string;
  isCheck: boolean;
  isCheckmate: boolean;
};

export type Termination = "checkmate" | "stalemate" | null;

export type Game = {
  format: GameFormat;
  notation: "en" | "pt";
  plies: Ply[];
  initialFen: string;
  finalFen: string;
  result: GameResult | null;
  termination: Termination;
};

export type IllegalMoveError = {
  ply: number;
  moveNumber: number;
  color: PlayerColor;
  /** O lance exatamente como foi colado, por exemplo "Txa1". */
  writtenMove: string;
};

export type ReplayOutcome =
  | { kind: "legal"; game: Game }
  | { kind: "illegal-move"; error: IllegalMoveError; plies: Ply[] };
