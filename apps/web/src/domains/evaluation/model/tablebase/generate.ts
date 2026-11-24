/**
 * Motor 4: tabela de finais por retroanálise (general.md). Gera, para rei e dama
 * contra rei (KQK) e rei e torre contra rei (KRK), o resultado exato e a distância até
 * o mate (DTM) de todas as posições legais, com qualquer lado a jogar.
 *
 * Casas 0..63 (a1 = 0, h8 = 63). Peças: rei forte, peça (dama ou torre) e rei fraco.
 * As cores não importam: sem peões, as regras são simétricas.
 */

export type EndgameKind = "KQK" | "KRK";

/** Lado a jogar no índice: 0 = lado forte, 1 = lado fraco. */
export const STRONG = 0;
export const WEAK = 1;

/** Valores da tabela que não são DTM. */
export const UNKNOWN = -1;
export const ILLEGAL = -2;
export const DRAW = -3;

export type Table = { kind: EndgameKind; dtm: Int16Array };

export function indexOf(strongKing: number, piece: number, weakKing: number, side: number): number {
  return ((strongKing * 64 + piece) * 64 + weakKing) * 2 + side;
}

const fileOf = (square: number) => square & 7;
const rankOf = (square: number) => square >> 3;

/** Casas vizinhas de cada casa (movimentos de rei). */
const KING_STEPS: number[][] = Array.from({ length: 64 }, (_, square) => {
  const steps: number[] = [];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const file = fileOf(square) + df;
      const rank = rankOf(square) + dr;
      if (file >= 0 && file < 8 && rank >= 0 && rank < 8) steps.push(rank * 8 + file);
    }
  }
  return steps;
});

export function adjacent(a: number, b: number): boolean {
  return a !== b && Math.abs(fileOf(a) - fileOf(b)) <= 1 && Math.abs(rankOf(a) - rankOf(b)) <= 1;
}

const ROOK_DIRECTIONS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const QUEEN_DIRECTIONS: [number, number][] = [
  ...ROOK_DIRECTIONS,
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function directionsOf(kind: EndgameKind): [number, number][] {
  return kind === "KQK" ? QUEEN_DIRECTIONS : ROOK_DIRECTIONS;
}

/** Casas que a peça alcança a partir de `from`, parando antes de `blockers`. */
function slides(kind: EndgameKind, from: number, blockers: readonly number[]): number[] {
  const squares: number[] = [];
  for (const [df, dr] of directionsOf(kind)) {
    let file = fileOf(from) + df;
    let rank = rankOf(from) + dr;
    while (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
      const square = rank * 8 + file;
      if (blockers.includes(square)) break;
      squares.push(square);
      file += df;
      rank += dr;
    }
  }
  return squares;
}

/** A peça em `from` ataca `target`, com `blockers` no caminho? */
export function pieceAttacks(
  kind: EndgameKind,
  from: number,
  target: number,
  blockers: readonly number[],
): boolean {
  if (from === target) return false;
  const df = Math.sign(fileOf(target) - fileOf(from));
  const dr = Math.sign(rankOf(target) - rankOf(from));
  const straight = fileOf(target) === fileOf(from) || rankOf(target) === rankOf(from);
  const diagonal =
    Math.abs(fileOf(target) - fileOf(from)) === Math.abs(rankOf(target) - rankOf(from));
  if (!straight && !(kind === "KQK" && diagonal)) return false;
  let square = from + dr * 8 + df;
  while (square !== target) {
    if (blockers.includes(square)) return false;
    square += dr * 8 + df;
  }
  return true;
}

/** TB-09: casas diferentes, reis não vizinhos, e o lado que não joga fora de xeque. */
export function isLegal(
  kind: EndgameKind,
  strongKing: number,
  piece: number,
  weakKing: number,
  side: number,
): boolean {
  if (strongKing === piece || strongKing === weakKing || piece === weakKing) return false;
  if (adjacent(strongKing, weakKing)) return false;
  // Com o lado forte a jogar, o rei fraco não pode estar em xeque.
  return !(side === STRONG && pieceAttacks(kind, piece, weakKing, [strongKing]));
}

export type WeakMoves = { targets: number[]; canCapture: boolean; inCheck: boolean };

/** Lances do rei fraco: casas seguras e se ele pode tomar a peça desprotegida. */
export function weakMoves(
  kind: EndgameKind,
  strongKing: number,
  piece: number,
  weakKing: number,
): WeakMoves {
  const targets: number[] = [];
  let canCapture = false;
  for (const target of KING_STEPS[weakKing] as number[]) {
    if (adjacent(target, strongKing) || target === strongKing) continue;
    if (target === piece) {
      // A peça só pode ser tomada se o rei forte não a protege.
      canCapture = true;
      continue;
    }
    if (pieceAttacks(kind, piece, target, [strongKing])) continue;
    targets.push(target);
  }
  return { targets, canCapture, inCheck: pieceAttacks(kind, piece, weakKing, [strongKing]) };
}

/** Posições (com o lado fraco a jogar) alcançadas pelos lances do lado forte. */
export function strongChildren(
  kind: EndgameKind,
  strongKing: number,
  piece: number,
  weakKing: number,
): number[] {
  const children: number[] = [];
  for (const target of KING_STEPS[strongKing] as number[]) {
    if (target === piece || target === weakKing || adjacent(target, weakKing)) continue;
    children.push(indexOf(target, piece, weakKing, WEAK));
  }
  for (const target of slides(kind, piece, [strongKing, weakKing])) {
    children.push(indexOf(strongKing, target, weakKing, WEAK));
  }
  return children;
}

/** TB-01, TB-02: gera a tabela inteira por camadas de DTM (em meios-lances). */
export function generateTable(kind: EndgameKind): Table {
  const dtm = new Int16Array(64 * 64 * 64 * 2).fill(UNKNOWN);
  for (let strongKing = 0; strongKing < 64; strongKing++) {
    for (let piece = 0; piece < 64; piece++) {
      for (let weakKing = 0; weakKing < 64; weakKing++) {
        for (const side of [STRONG, WEAK]) {
          const index = indexOf(strongKing, piece, weakKing, side);
          if (!isLegal(kind, strongKing, piece, weakKing, side)) {
            dtm[index] = ILLEGAL;
            continue;
          }
          if (side === WEAK) {
            const moves = weakMoves(kind, strongKing, piece, weakKing);
            if (moves.targets.length === 0 && !moves.canCapture) {
              dtm[index] = moves.inCheck ? 0 : DRAW;
            } else if (moves.canCapture && moves.targets.length === 0) {
              // Só resta tomar a peça: rei contra rei, empate.
              dtm[index] = DRAW;
            }
          }
        }
      }
    }
  }

  for (let depth = 1; ; depth++) {
    let changed = false;
    const side = depth % 2 === 1 ? STRONG : WEAK;
    for (let strongKing = 0; strongKing < 64; strongKing++) {
      for (let piece = 0; piece < 64; piece++) {
        for (let weakKing = 0; weakKing < 64; weakKing++) {
          const index = indexOf(strongKing, piece, weakKing, side);
          if (dtm[index] !== UNKNOWN) continue;
          if (side === STRONG) {
            // Vence em `depth` se algum lance leva a um mate em `depth - 1`.
            const wins = strongChildren(kind, strongKing, piece, weakKing).some(
              (child) => dtm[child] === depth - 1,
            );
            if (wins) {
              dtm[index] = depth;
              changed = true;
            }
          } else {
            // Perde em `depth` se nenhum lance escapa: sem captura e todos os destinos
            // já são vitórias do lado forte.
            const moves = weakMoves(kind, strongKing, piece, weakKing);
            if (moves.canCapture) continue;
            const lost = moves.targets.every((target) => {
              const value = dtm[indexOf(strongKing, piece, target, STRONG)] as number;
              return value >= 0;
            });
            if (lost) {
              dtm[index] = depth;
              changed = true;
            }
          }
        }
      }
    }
    // Duas camadas seguidas sem mudança: o resto é empate.
    if (!changed && depth > 2) {
      const previousSide = (depth - 1) % 2 === 1 ? STRONG : WEAK;
      if (!hasDepth(dtm, depth - 1, previousSide)) break;
    }
  }
  for (let index = 0; index < dtm.length; index++) {
    if (dtm[index] === UNKNOWN) dtm[index] = DRAW;
  }
  return { kind, dtm };
}

function hasDepth(dtm: Int16Array, depth: number, side: number): boolean {
  for (let index = side; index < dtm.length; index += 2) {
    if (dtm[index] === depth) return true;
  }
  return false;
}
