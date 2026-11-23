import type { Notation } from "./types";

// Letras das peças: inglês (K Q R B N) ↔ português (R D T B C).
type PieceLetterTable = { pattern: RegExp; promotion: RegExp; letters: Record<string, string> };

function letterTable(letters: Record<string, string>): PieceLetterTable {
  const set = `[${Object.keys(letters).join("")}]`;
  return {
    letters,
    // A letra da peça é a primeira do lance; a da promoção vem depois da casa final.
    pattern: new RegExp(`^${set}`),
    promotion: new RegExp(`(?<=[a-h][18]=?)${set}`),
  };
}

const englishToPortuguese = letterTable({ K: "R", Q: "D", R: "T", B: "B", N: "C" });
const portugueseToEnglish = letterTable({ R: "K", D: "Q", T: "R", B: "B", C: "N" });

const PIECE_AT_START = /^[A-Z]/;
const PROMOTION_PIECE = /(?<=[a-h][18]=?)[A-Z]/;

function mapPieceLetters(san: string, table: PieceLetterTable): string {
  if (san.startsWith("O-O")) {
    return san;
  }
  // As expressões só casam letras presentes na tabela, então a busca sempre acha.
  const swap = (letter: string) => table.letters[letter] as string;
  return san.replace(table.pattern, swap).replace(table.promotion, swap);
}

/** Converte um lance SAN inglês para a notação com letras portuguesas. */
export function toPortugueseSan(san: string): string {
  return mapPieceLetters(san, englishToPortuguese);
}

/** Converte um lance com letras portuguesas para SAN inglês. */
export function portugueseToEnglishSan(token: string): string {
  return mapPieceLetters(token, portugueseToEnglish);
}

function pieceLetters(token: string): string[] {
  if (token.startsWith("O-O")) {
    return [];
  }
  const letters: string[] = [];
  const first = token.match(PIECE_AT_START)?.[0];
  if (first) {
    letters.push(first);
  }
  const promotion = token.match(PROMOTION_PIECE)?.[0];
  if (promotion) {
    letters.push(promotion);
  }
  return letters;
}

/**
 * Descobre a notação pela partida inteira. N, Q e K só existem em inglês; C, D e T só
 * em português. R e B existem nas duas (R é torre em inglês e rei em português).
 */
export function detectNotation(tokens: readonly string[]): Notation {
  const letters = new Set(tokens.flatMap(pieceLetters));
  if (["N", "Q", "K"].some((letter) => letters.has(letter))) {
    return "en";
  }
  if (["C", "D", "T"].some((letter) => letters.has(letter))) {
    return "pt";
  }
  return "undetermined";
}
