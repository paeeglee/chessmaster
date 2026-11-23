import type { GameResult } from "./types";

export type MoveTextTokens = {
  /** Lances como foram escritos, sem números, anotações nem o resultado. */
  moves: string[];
  result: GameResult | null;
};

// Lance em SAN com letras de peça inglesas (K Q R B N) ou portuguesas (R D T B C).
const SAN =
  /^(?:O-O(?:-O)?|[KQRBNDTC][a-h]?[1-8]?x?[a-h][1-8]|[a-h](?:x[a-h])?[1-8](?:=?[QRBNDTC])?)$/;
const MOVE_NUMBER = /^(\d+)(?:\.{1,3}|…)/;
const RESULTS: Record<string, GameResult | null> = {
  "1-0": "1-0",
  "0-1": "0-1",
  "1/2-1/2": "1/2-1/2",
  "*": null,
};

function stripVariations(text: string): string {
  let current = text;
  let previous: string;
  do {
    previous = current;
    current = current.replace(/\([^()]*\)/g, " ");
  } while (current !== previous);
  return current;
}

function normalize(text: string): string {
  const withoutComments = text.replace(/\{[^}]*\}/g, " ").replace(/;[^\n]*/g, " ");
  return stripVariations(withoutComments)
    .replace(/\$\d+/g, " ")
    .replace(/½-½/g, "1/2-1/2")
    .replace(/(?<![\d/-])0-0-0(?![\d-])/g, "O-O-O")
    .replace(/(?<![\d/-])0-0(?![\d-])/g, "O-O");
}

type Token =
  | { kind: "number"; value: number }
  | { kind: "move"; value: string }
  | { kind: "result"; value: GameResult | null }
  | { kind: "other" };

function classify(raw: string): Token[] {
  const numbered = raw.match(MOVE_NUMBER);
  if (numbered) {
    const rest = raw.slice(numbered[0].length);
    const number: Token = { kind: "number", value: Number(numbered[1]) };
    return rest ? [number, ...classify(rest)] : [number];
  }
  if (raw in RESULTS) {
    return [{ kind: "result", value: RESULTS[raw] ?? null }];
  }
  const move = readMoveToken(raw);
  return move ? [{ kind: "move", value: move }] : [{ kind: "other" }];
}

/** Tira anotações de um lance (+, #, !, ?, e.p.) e devolve-o se tiver forma de SAN. */
export function readMoveToken(raw: string): string | null {
  const move = raw.replace(/e\.p\.$/, "").replace(/[+#!?]+$/, "");
  return SAN.test(move) ? move : null;
}

/** Normaliza o texto de um resultado; devolve undefined se não for um resultado. */
export function readResultToken(raw: string): GameResult | null | undefined {
  const value = raw.trim().replace("½-½", "1/2-1/2");
  return value in RESULTS ? (RESULTS[value] ?? null) : undefined;
}

/**
 * Lê os lances de um texto. Começa no primeiro "1." (o que vem antes é ignorado) e
 * para no resultado ou no primeiro texto que não é lance. Sem "1.", só aceita o
 * texto se todos os tokens forem lances.
 */
export function tokenizeMoveText(text: string): MoveTextTokens {
  const tokens = normalize(text).split(/\s+/).filter(Boolean).flatMap(classify);
  const start = tokens.findIndex((token) => token.kind === "number" && token.value === 1);

  if (start === -1 && tokens.some((token) => token.kind === "other")) {
    return { moves: [], result: null };
  }

  const moves: string[] = [];
  let result: GameResult | null = null;
  for (const token of tokens.slice(Math.max(start, 0))) {
    if (token.kind === "move") {
      moves.push(token.value);
    } else if (token.kind === "result") {
      result = token.value;
      break;
    } else if (token.kind === "other") {
      break;
    }
  }
  return { moves, result };
}
