import type { KeyboardEvent } from "react";
import { Board } from "../../../shared/ui/Board";
import { describePieces } from "../../game";
import type { ReviewContext, ReviewEvent } from "../machines/reviewMachine";
import { boardMarks, positionCaption, positionFen, sideToMoveLabel } from "../model/review";
import { EvalBar } from "./EvalBar";

const CONTROL = "h-11 rounded-md border border-line bg-surface";

const KEYS: Record<string, ReviewEvent["type"]> = {
  ArrowLeft: "POSITION.PREVIOUS",
  ArrowRight: "POSITION.NEXT",
  Home: "POSITION.FIRST",
  End: "POSITION.LAST",
};

type BoardPanelProps = {
  context: ReviewContext;
  send: (event: ReviewEvent) => void;
};

/** Tabuleiro da tela Resultado com navegação por botões e teclado (R-04, R-05). */
export function BoardPanel({ context, send }: BoardPanelProps) {
  const { result, position, orientation, line } = context;
  const { game } = result.request;
  const playing = line !== null && line.step > 0;
  const fen = playing
    ? (line.fens[line.step - 1] ?? positionFen(game, position))
    : positionFen(game, position);
  const { marks, bestMoveSan } = playing
    ? { marks: {}, bestMoveSan: null }
    : boardMarks(result, position);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const type = KEYS[event.key];
    if (type) {
      event.preventDefault();
      send({ type } as ReviewEvent);
    }
  };

  return (
    <section
      aria-label="Tabuleiro da partida"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: o painel recebe o foco para as setas do teclado (R-05)
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-bold">
          {playing ? "Linha do motor" : positionCaption(result, position)}
        </span>
        <span className="text-ink-muted text-sm">{sideToMoveLabel(game, position)}</span>
      </div>
      <div className="flex gap-2">
        <EvalBar evaluation={result.evaluations[position] ?? null} orientation={orientation} />
        <Board
          fen={fen}
          orientation={orientation}
          marks={marks}
          coordinates
          label={`Posição: ${describePieces(fen)}`}
          className="min-w-0 flex-1"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-label="Início"
          onClick={() => send({ type: "POSITION.FIRST" })}
          className={`${CONTROL} w-12`}
        >
          ⏮︎
        </button>
        <button
          type="button"
          aria-label="Lance anterior"
          onClick={() => send({ type: "POSITION.PREVIOUS" })}
          className={`${CONTROL} w-12`}
        >
          ◀︎
        </button>
        <button
          type="button"
          aria-label="Próximo lance"
          onClick={() => send({ type: "POSITION.NEXT" })}
          className={`${CONTROL} w-12`}
        >
          ▶︎
        </button>
        <button
          type="button"
          aria-label="Fim"
          onClick={() => send({ type: "POSITION.LAST" })}
          className={`${CONTROL} w-12`}
        >
          ⏭︎
        </button>
        <button
          type="button"
          onClick={() => send({ type: "BOARD.FLIP" })}
          className={`${CONTROL} px-3 font-semibold`}
        >
          Girar
        </button>
      </div>
      <div className="flex flex-wrap gap-3.5 text-[13px] text-ink-muted">
        <span>
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-[3px] bg-board-red-dark align-[-1px]"
          />{" "}
          peça atacada
        </span>
        <span>
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-[3px] bg-board-green-dark align-[-1px]"
          />{" "}
          lance sugerido{bestMoveSan ? ` (${bestMoveSan})` : ""}
        </span>
      </div>
    </section>
  );
}
