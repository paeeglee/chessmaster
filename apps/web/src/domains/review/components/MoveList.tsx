import type { ReviewContext, ReviewEvent } from "../machines/reviewMachine";
import { type MoveCell, moveRows } from "../model/review";

type MoveListProps = {
  context: ReviewContext;
  send: (event: ReviewEvent) => void;
};

function Move({
  cell,
  selected,
  onSelect,
  className,
}: {
  cell: MoveCell | null;
  selected: boolean;
  onSelect: (ply: number) => void;
  className: string;
}) {
  if (!cell) return <span className={className} />;
  return (
    <button
      type="button"
      aria-current={selected ? "true" : undefined}
      onClick={() => onSelect(cell.ply)}
      className={`${className} rounded-sm border-0 px-1 text-left ${
        selected ? "bg-brand-soft font-bold text-brand" : "bg-transparent text-ink"
      }`}
    >
      {cell.text}
    </button>
  );
}

/** Lista de lances anotada; o lance selecionado acompanha o tabuleiro (R-03). */
export function MoveList({ context, send }: MoveListProps) {
  const { result, position } = context;
  const rows = moveRows(result.request.game, result.verdicts);
  const momentPlies = new Set(result.keyMoments.map((moment) => moment.ply));
  const select = (ply: number) => {
    // Um lance que é momento-chave sincroniza o momento; os outros só movem o tabuleiro.
    if (momentPlies.has(ply)) send({ type: "MOMENT.SELECT", ply });
    else send({ type: "POSITION.SELECT", position: ply });
  };
  // Antes de um momento-chave, o destaque fica no lance errado; senão, no último jogado.
  const highlighted = momentPlies.has(position + 1) ? position + 1 : position;
  const isSelected = (cell: MoveCell | null) => cell !== null && cell.ply === highlighted;

  return (
    <section
      id="lances"
      aria-labelledby="moves-title"
      className="flex flex-col gap-2 rounded-xl border border-line bg-surface px-5 py-4"
    >
      <span id="moves-title" className="font-bold">
        Lances
      </span>
      <div className="grid max-h-[230px] grid-cols-3 gap-x-2.5 gap-y-0.5 overflow-y-auto text-sm tabular-nums">
        {rows.map((row) => (
          <div key={row.number} className="flex gap-1.5 py-0.5">
            <span className="min-w-7 text-ink-muted">{row.number}.</span>
            <Move
              cell={row.white}
              selected={isSelected(row.white)}
              onSelect={select}
              className="min-w-[54px]"
            />
            <Move
              cell={row.black}
              selected={isSelected(row.black)}
              onSelect={select}
              className=""
            />
          </div>
        ))}
      </div>
    </section>
  );
}
