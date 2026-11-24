import { MOVE_QUALITY_LABEL, type MoveQuality } from "../../analysis";
import type { ReviewContext, ReviewEvent } from "../machines/reviewMachine";
import { QUALITY_BACKGROUND, QUALITY_SYMBOL } from "../model/coach";
import { type MoveCell, type MoveTone, moveRows, reviewedPly } from "../model/review";

const TONE: Record<MoveTone, string> = {
  mistake: "bg-danger-soft font-bold text-danger",
  good: "bg-success-soft font-bold text-success",
  plain: "bg-transparent text-ink",
};

type MoveListProps = {
  context: ReviewContext;
  send: (event: ReviewEvent) => void;
};

/** MR-09: ícone da classificação do lance, com o nome para leitores de tela. */
function QualityIcon({ quality }: { quality: MoveQuality | undefined }) {
  if (!quality) return <span aria-hidden="true" className="inline-block size-4 shrink-0" />;
  return (
    <span
      role="img"
      aria-label={MOVE_QUALITY_LABEL[quality]}
      title={MOVE_QUALITY_LABEL[quality]}
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-full font-bold text-[9px] text-white leading-none ${QUALITY_BACKGROUND[quality]}`}
    >
      {QUALITY_SYMBOL[quality]}
    </span>
  );
}

function Move({
  cell,
  quality,
  selected,
  onSelect,
  className,
}: {
  cell: MoveCell | null;
  quality: MoveQuality | undefined;
  selected: boolean;
  onSelect: (ply: number) => void;
  className: string;
}) {
  if (!cell) return <span className={className} />;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <QualityIcon quality={quality} />
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(cell.ply)}
        className={`rounded-sm border-0 px-1 text-left ${TONE[cell.tone]} ${
          selected ? `outline-2 outline-brand ${cell.tone === "plain" ? "font-bold" : ""}` : ""
        }`}
      >
        {cell.text}
      </button>
    </span>
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
  const highlighted = reviewedPly(result, position);
  // Só os lances do jogador são revisados: os do adversário não ganham ícone.
  const player = result.request.playerColor;
  const qualityOf = (cell: MoveCell | null) => {
    const review = cell ? result.moveReviews[cell.ply - 1] : undefined;
    return review?.color === player ? review.quality : undefined;
  };
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
              quality={qualityOf(row.white)}
              selected={isSelected(row.white)}
              onSelect={select}
              className="min-w-[76px]"
            />
            <Move
              cell={row.black}
              quality={qualityOf(row.black)}
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
