import { MISTAKE_TYPE_LABEL } from "../../analysis";
import type { ReviewContext, ReviewEvent } from "../machines/reviewMachine";
import { annotationOf, materialChange, momentTexts } from "../model/review";

type KeyMomentsListProps = {
  context: ReviewContext;
  send: (event: ReviewEvent) => void;
};

/** Momentos-chave em ordem, um expandido por vez (R-02, R-07, R-08, R-09). */
export function KeyMomentsList({ context, send }: KeyMomentsListProps) {
  const { result, expandedPly } = context;
  const moments = result.keyMoments;

  return (
    <section
      aria-labelledby="key-moments-title"
      className="flex flex-col gap-3.5 rounded-xl border border-line bg-surface p-[22px]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="key-moments-title" className="m-0 font-semibold font-serif text-2xl">
          Momentos-chave
        </h2>
        <span className="text-ink-muted text-sm">em ordem na partida</span>
      </div>
      {moments.length === 0 ? (
        <p className="m-0 text-[15px]">Nenhuma perda de material importante.</p>
      ) : (
        <>
          <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
            {moments.map((moment) => {
              const expanded = moment.ply === expandedPly;
              const texts = momentTexts(result, moment);
              const severe = annotationOf(moment) === "??";
              return (
                <li
                  key={moment.ply}
                  className={`flex flex-col gap-2.5 rounded-lg border px-4 py-3.5 ${
                    expanded ? "border-brand bg-brand-wash" : "border-line bg-surface"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="min-w-[92px] font-bold text-base">
                      {moment.moveLabel}
                      {annotationOf(moment)}
                    </span>
                    <span
                      className={`rounded-[5px] px-2 py-[3px] font-bold text-xs uppercase tracking-[0.05em] ${
                        severe ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
                      }`}
                    >
                      {MISTAKE_TYPE_LABEL[moment.mistakeType]}
                    </span>
                    <span className="min-w-[180px] flex-1 text-ink-muted text-sm">
                      {texts.summary}
                    </span>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`moment-${moment.ply}`}
                      aria-label={`Ver ${moment.moveLabel}`}
                      onClick={() => send({ type: "MOMENT.SELECT", ply: moment.ply })}
                      // O item aberto não mostra o botão (mockup), mas ele segue acessível.
                      className={
                        expanded
                          ? "sr-only"
                          : "min-h-10 rounded-md border border-line bg-surface px-3 font-semibold text-brand text-sm"
                      }
                    >
                      Ver
                    </button>
                  </div>
                  {expanded && (
                    <div
                      id={`moment-${moment.ply}`}
                      className="flex flex-col gap-2.5 border-brand-divider border-t pt-3"
                    >
                      <p className="m-0 text-[15px] leading-[1.55]">{texts.explanation}</p>
                      <div className="flex flex-wrap gap-2.5">
                        {moment.bestMoveSan && (
                          <span className="rounded-sm bg-success-soft px-2.5 py-1.5 font-semibold text-sm text-success">
                            Melhor: {moment.moveLabel.replace(/[^.]+$/, "")}
                            {moment.bestMoveSan}
                          </span>
                        )}
                        <span className="rounded-sm bg-canvas px-2.5 py-1.5 text-ink-muted text-sm">
                          {materialChange(moment)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => send({ type: "TRAINING.START", ply: moment.ply })}
                          className="inline-flex min-h-11 items-center rounded-md border-0 bg-brand px-4 font-semibold text-[15px] text-surface"
                        >
                          Treinar este momento
                        </button>
                        <button
                          type="button"
                          onClick={() => send({ type: "MOMENT.SHOW_LINE", ply: moment.ply })}
                          className="min-h-11 rounded-md border border-line bg-surface px-4 py-2.5 font-semibold text-[15px] text-ink"
                        >
                          Ver a linha no tabuleiro
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            onClick={() => {
              const first = moments[0];
              if (first) send({ type: "TRAINING.START", ply: first.ply });
            }}
            className="min-h-11 self-start rounded-md border border-brand bg-surface px-4 font-semibold text-brand"
          >
            Treinar os {moments.length} momentos
          </button>
        </>
      )}
    </section>
  );
}
