import type { PlayerColor } from "../../game";

export type MistakeType = "hanging-piece" | "defender-moved" | "other";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export type PieceOnSquare = { type: PieceType; square: string };

export type MistakeVerdict = {
  kind: "mistake" | "opponent-mistake";
  ply: number;
  color: PlayerColor;
  /** Lance em notação portuguesa, ex.: "22...Ta7". */
  moveLabel: string;
  /** Pontos de material perdidos em relação ao melhor lance. */
  loss: number;
  /** Melhor lance do motor em SAN português, ex.: "Bd4+". */
  bestMoveSan: string | null;
  mistakeType: MistakeType;
  lostPiece: PieceOnSquare | null;
  /** Saldo de material do jogador antes do lance e no fim da linha de capturas. */
  materialBefore: number;
  materialAfter: number;
};

export type StrengthVerdict = {
  kind: "strength";
  ply: number;
  color: PlayerColor;
  moveLabel: string;
  gain: number;
  wonPiece: PieceOnSquare | null;
};

export type MoveVerdict =
  | { kind: "none"; ply: number; color: PlayerColor }
  | MistakeVerdict
  | StrengthVerdict;

export type Pattern = { mistakeType: MistakeType; count: number; plies: number[] };
