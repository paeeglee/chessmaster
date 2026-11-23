import type { AnalysisResult } from "../../analysis";
import { contextLine, resultTag, statCards } from "../model/review";

const TAG_TONE = {
  win: "bg-success-soft text-success",
  loss: "bg-canvas text-ink",
  neutral: "bg-canvas text-ink",
} as const;

type SummaryBandProps = {
  result: AnalysisResult;
  retrying: boolean;
  onRetry: () => void;
};

/** Faixa escura com resultado, manchete e padrões, e os cartões de números (step_03 §3). */
export function SummaryBand({ result, retrying, onRetry }: SummaryBandProps) {
  const tag = resultTag(result.request.game, result.request.playerColor);
  const cards = statCards(result);
  return (
    <>
      <section
        aria-label="Resumo da partida"
        className="flex flex-col gap-3.5 rounded-band bg-ink px-7 py-[26px] text-surface"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`rounded-sm px-2.5 py-1 font-bold text-sm ${TAG_TONE[tag.tone]}`}>
            {tag.label}
          </span>
          <span className="text-on-ink-muted text-sm">{contextLine(result.request)}</span>
        </div>
        {result.explanation ? (
          <>
            <h1 className="m-0 max-w-[980px] font-semibold font-serif text-[30px] leading-[1.25]">
              {result.explanation.verdict}
            </h1>
            <p className="m-0 max-w-[900px] text-base text-on-ink-soft">
              {result.explanation.patterns_sentence}
            </p>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-3" aria-live="polite">
            <h1 className="m-0 font-semibold font-serif text-[24px]">
              A explicação não pôde ser gerada.
            </h1>
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="min-h-11 rounded-md border border-surface bg-transparent px-4 font-semibold text-surface"
            >
              {retrying ? "Tentando…" : "Tentar de novo"}
            </button>
          </div>
        )}
      </section>
      <div className="flex flex-wrap gap-3">
        {cards.map((card, index) => (
          <div
            key={card.label}
            className="flex flex-[1_1_150px] flex-col gap-0.5 rounded-lg border border-line bg-surface px-4 py-3.5"
          >
            <span
              className={`font-bold font-serif text-[26px] ${
                index === 0 ? "text-danger" : index === 1 ? "text-success" : "text-ink"
              }`}
            >
              {card.value}
            </span>
            <span className="text-ink-muted text-sm">{card.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
