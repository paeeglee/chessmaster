import { MOVE_QUALITY_LABEL } from "../../analysis";
import type { ReviewContext, ReviewEvent } from "../machines/reviewMachine";
import {
  bestMoveSentence,
  coachFindings,
  coachTitle,
  QUALITY_BACKGROUND,
  QUALITY_SYMBOL,
  reviewAt,
} from "../model/coach";
import { reviewedPly } from "../model/review";

type CoachPanelProps = {
  context: ReviewContext;
  send: (event: ReviewEvent) => void;
};

/** Painel do treinador: revisão do lance da posição mostrada (F9, MR-10..MR-16). */
export function CoachPanel({ context, send }: CoachPanelProps) {
  const { result, position } = context;
  const ply = reviewedPly(result, position);
  const review = reviewAt(result, ply);

  return (
    <section
      aria-labelledby="coach-title"
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface px-5 py-4"
    >
      <h2 id="coach-title" className="m-0 font-semibold font-serif text-xl">
        Revisão do lance
      </h2>
      {review === null ? (
        <p className="m-0 text-[15px] text-ink-muted">
          Escolha um lance na lista ou avance o tabuleiro para ver o que o motor achou dele.
        </p>
      ) : (
        <CoachReview context={context} send={send} ply={ply} />
      )}
    </section>
  );
}

function CoachReview({ context, send, ply }: CoachPanelProps & { ply: number }) {
  const { result } = context;
  const review = reviewAt(result, ply);
  if (!review) return null;
  const { title, owner } = coachTitle(review, result.request.playerColor);
  const best = bestMoveSentence(review);
  const findings = coachFindings(review);
  const entry = context.coach[ply];

  return (
    <>
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={`flex size-7 shrink-0 items-center justify-center rounded-full font-bold text-sm text-white ${QUALITY_BACKGROUND[review.quality]}`}
        >
          {QUALITY_SYMBOL[review.quality]}
        </span>
        <div className="flex flex-col">
          <span className="font-bold text-[17px]">{title}</span>
          <span className="text-ink-muted text-xs uppercase tracking-[0.06em]">{owner}</span>
        </div>
        <span className="sr-only">Classificação: {MOVE_QUALITY_LABEL[review.quality]}</span>
      </div>
      {best && <p className="m-0 text-[15px] leading-normal">{best}</p>}
      {findings.length > 0 && (
        <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[15px] leading-normal">
          {findings.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {review.facts.bestLine.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">
            Linha do motor: <span className="text-ink">{review.facts.bestLine.join(" ")}</span>
          </span>
          <button
            type="button"
            onClick={() => send({ type: "COACH.SHOW_BEST_LINE", ply })}
            className="min-h-9 rounded-md border border-line bg-surface px-3 font-semibold text-ink text-sm"
          >
            Ver a linha do motor
          </button>
        </div>
      )}
      <div role="status" className="rounded-md bg-canvas px-3.5 py-3 text-[15px] leading-normal">
        {(entry === undefined || entry.status === "loading") && (
          <span className="text-ink-muted">Pensando…</span>
        )}
        {entry?.status === "ready" && entry.text}
        {entry?.status === "failed" && (
          <span className="flex flex-wrap items-center gap-3">
            <span>Explicação indisponível.</span>
            <button
              type="button"
              onClick={() => send({ type: "COACH.RETRY", ply })}
              className="min-h-9 rounded-md border border-line bg-surface px-3 font-semibold text-ink text-sm"
            >
              Tentar de novo
            </button>
          </span>
        )}
      </div>
    </>
  );
}
