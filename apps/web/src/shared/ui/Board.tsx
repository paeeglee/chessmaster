export type BoardMark = "red" | "green" | "last";

type BoardProps = {
  /** Posição em FEN (só a parte das peças é usada). */
  fen: string;
  /** Lado que fica embaixo. */
  orientation: "w" | "b";
  marks?: Partial<Record<string, BoardMark>>;
  coordinates?: boolean;
  /** Descrição textual da posição para leitores de tela. */
  label: string;
  className?: string;
};

const FILES = "abcdefgh";
const GLYPHS: Record<string, string> = {
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

const SQUARE_COLOR: Record<BoardMark | "plain", { light: string; dark: string }> = {
  plain: { light: "bg-board-light", dark: "bg-board-dark" },
  red: { light: "bg-board-red-light", dark: "bg-board-red-dark" },
  green: { light: "bg-board-green-light", dark: "bg-board-green-dark" },
  last: { light: "bg-board-last-light", dark: "bg-board-last-dark" },
};

/** Lê a parte das peças do FEN como 8 fileiras (8 → 1) de 8 casas (a → h). */
export function readPlacement(fen: string): string[][] {
  const rows = (fen.split(" ")[0] ?? "").split("/");
  return Array.from({ length: 8 }, (_, index) => {
    const squares: string[] = [];
    for (const char of rows[index] ?? "") {
      if (/\d/.test(char)) {
        squares.push(...Array<string>(Number(char)).fill(""));
      } else {
        squares.push(char);
      }
    }
    return squares.slice(0, 8).concat(Array<string>(Math.max(0, 8 - squares.length)).fill(""));
  });
}

/** Tabuleiro desenhado com glifos Unicode, nas cores do tema. */
export function Board({
  fen,
  orientation,
  marks = {},
  coordinates = false,
  label,
  className = "",
}: BoardProps) {
  const placement = readPlacement(fen);
  const squares = Array.from({ length: 64 }, (_, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    const rank = orientation === "w" ? 7 - row : row;
    const file = orientation === "w" ? col : 7 - col;
    const piece = placement[7 - rank]?.[file] ?? "";
    const name = `${FILES[file]}${rank + 1}`;
    const light = (rank + file) % 2 === 1;
    const palette = SQUARE_COLOR[marks[name] ?? "plain"];
    const isWhite = piece !== "" && piece === piece.toUpperCase();
    return (
      <div
        key={name}
        data-square={name}
        className={`relative flex items-center justify-center leading-none ${light ? palette.light : palette.dark}`}
      >
        {piece && (
          <span
            className={`font-chess text-[10.5cqi] ${isWhite ? "text-piece-white text-shadow-piece" : "text-piece-black"}`}
          >
            {`${GLYPHS[piece.toLowerCase()] ?? ""}︎`}
          </span>
        )}
        {coordinates && col === 0 && (
          <span
            className={`absolute top-[3%] left-[4%] font-bold text-[11px] ${light ? "text-coord-on-light" : "text-coord-on-dark"}`}
          >
            {rank + 1}
          </span>
        )}
        {coordinates && row === 7 && (
          <span
            className={`absolute right-[5%] bottom-[3%] font-bold text-[11px] ${light ? "text-coord-on-light" : "text-coord-on-dark"}`}
          >
            {FILES[file]}
          </span>
        )}
      </div>
    );
  });

  return (
    <div
      role="img"
      aria-label={label}
      className={`grid aspect-square grid-cols-8 grid-rows-8 overflow-hidden rounded-sm shadow-overlay [container-type:inline-size] ${className}`}
    >
      {squares}
    </div>
  );
}
