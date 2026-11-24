export type BoardMark = "red" | "green" | "last" | "selected";

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
  /**
   * Torna o tabuleiro jogável: cada casa vira um botão (clique ou Tab + Enter) e o
   * clique é repassado. Sem isso, o tabuleiro é só uma imagem.
   */
  onSquareClick?: (square: string) => void;
  /** Destinos legais da peça selecionada (um ponto em cada casa). */
  destinations?: readonly string[];
  /** Bloqueia os cliques (por exemplo, enquanto o lance é conferido). */
  disabled?: boolean;
};

const PIECE_NAMES: Record<string, string> = {
  k: "rei",
  q: "dama",
  r: "torre",
  b: "bispo",
  n: "cavalo",
  p: "peão",
};

/** Nome acessível da casa: "a1, bispo preto" ou "e4, vazia". */
export function squareLabel(name: string, piece: string): string {
  if (!piece) return `${name}, vazia`;
  const isWhite = piece === piece.toUpperCase();
  const pieceName = PIECE_NAMES[piece.toLowerCase()] ?? "";
  const color =
    pieceName === "dama" || pieceName === "torre"
      ? isWhite
        ? "branca"
        : "preta"
      : isWhite
        ? "branco"
        : "preto";
  return `${name}, ${pieceName} ${color}`;
}

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
  // A peça selecionada usa a cor do último lance (o mockup não define outra).
  selected: { light: "bg-board-last-light", dark: "bg-board-last-dark" },
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
  onSquareClick,
  destinations = [],
  disabled = false,
}: BoardProps) {
  const interactive = onSquareClick !== undefined;
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
    const isDestination = destinations.includes(name);
    const squareClass = `relative flex items-center justify-center leading-none ${light ? palette.light : palette.dark}`;
    const content = (
      <>
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
        {isDestination && (
          <span
            aria-hidden="true"
            className="absolute size-[28%] rounded-full bg-[rgba(31,35,40,0.28)]"
          />
        )}
      </>
    );
    if (interactive) {
      return (
        <button
          key={name}
          type="button"
          data-square={name}
          data-mark={marks[name]}
          aria-label={`${squareLabel(name, piece)}${isDestination ? ", destino possível" : ""}`}
          aria-pressed={marks[name] === "selected" ? true : undefined}
          disabled={disabled}
          onClick={() => onSquareClick(name)}
          className={`${squareClass} m-0 cursor-pointer border-0 p-0 focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-brand focus-visible:-outline-offset-3 disabled:cursor-wait`}
        >
          {content}
        </button>
      );
    }
    return (
      <div key={name} data-square={name} data-mark={marks[name]} className={squareClass}>
        {content}
      </div>
    );
  });

  const gridClass = `grid aspect-square grid-cols-8 grid-rows-8 overflow-hidden rounded-sm shadow-overlay [container-type:inline-size] ${className}`;
  return interactive ? (
    <fieldset aria-label={label} className={`m-0 min-w-0 border-0 p-0 ${gridClass}`}>
      {squares}
    </fieldset>
  ) : (
    <div role="img" aria-label={label} className={gridClass}>
      {squares}
    </div>
  );
}
