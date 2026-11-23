import type { GameResult } from "./types";

export type MoveTextTokens = {
  /** Lances como foram escritos, sem números, anotações nem o resultado. */
  moves: string[];
  result: GameResult | null;
  /** Há texto que não é lance no meio da lista (com lances depois dele). */
  interrupted: boolean;
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

// Figurinos Unicode (♘f3) viram as letras inglesas das peças.
const FIGURINES: Record<string, string> = {
  "♔": "K",
  "♚": "K",
  "♕": "Q",
  "♛": "Q",
  "♖": "R",
  "♜": "R",
  "♗": "B",
  "♝": "B",
  "♘": "N",
  "♞": "N",
};
const FIGURINE = /[♔♚♕♛♖♜♗♝♘♞]/g;
// Relógio copiado junto com os lances (0:59, 1:02:03, 12.4 não), ignorado.
const CLOCK = /^[([]?\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?[)\]]?$/;

function normalize(text: string): string {
  const withoutComments = text.replace(/\{[^}]*\}/g, " ").replace(/;[^\n]*/g, " ");
  return stripVariations(withoutComments)
    .replace(/\$\d+/g, " ")
    .replace(FIGURINE, (glyph) => FIGURINES[glyph] as string)
    .replace(/½-½/g, "1/2-1/2")
    .replace(/(?<![\d/-])0-0-0(?![\d-])/g, "O-O-O")
    .replace(/(?<![\d/-])0-0(?![\d-])/g, "O-O");
}

type Token =
  | { kind: "number"; value: number }
  | { kind: "move"; value: string }
  | { kind: "result"; value: GameResult | null }
  | { kind: "clock" }
  | { kind: "other" };

function classify(raw: string): Token[] {
  const numbered = raw.match(MOVE_NUMBER);
  if (numbered) {
    const rest = raw.slice(numbered[0].length);
    const number: Token = { kind: "number", value: Number(numbered[1]) };
    return rest ? [number, ...classify(rest)] : [number];
  }
  if (CLOCK.test(raw)) {
    return [{ kind: "clock" }];
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
 * termina no resultado ou no último lance; o texto depois disso é ignorado. Texto que
 * não é lance no meio da lista marca a leitura como interrompida, para não perder
 * lances em silêncio. Sem "1.", só aceita o texto se todos os tokens forem lances.
 */
export function tokenizeMoveText(text: string): MoveTextTokens {
  const tokens = normalize(text).split(/\s+/).filter(Boolean).flatMap(classify);
  const start = tokens.findIndex((token) => token.kind === "number" && token.value === 1);

  if (start === -1 && tokens.some((token) => token.kind === "other")) {
    return { moves: [], result: null, interrupted: false };
  }

  const moves: string[] = [];
  let result: GameResult | null = null;
  let strayText = false;
  let interrupted = false;
  for (const token of tokens.slice(Math.max(start, 0))) {
    if (token.kind === "result") {
      result = token.value;
      break;
    }
    if (token.kind === "other") {
      strayText = true;
    } else if (token.kind === "move" || token.kind === "number") {
      if (strayText) {
        interrupted = true;
        break;
      }
      if (token.kind === "move") {
        moves.push(token.value);
      }
    }
  }
  return { moves, result, interrupted };
}
