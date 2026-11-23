import type { ReviewContext, ReviewEvent } from "../machines/reviewMachine";
import { CHART, chartGeometry, formatAdvantage } from "../model/review";

/** step_03: partidas com menos de 15 lances não mostram o gráfico. */
export const MIN_MOVES_FOR_CHART = 15;

type MaterialChartProps = {
  context: ReviewContext;
  send: (event: ReviewEvent) => void;
};

/** Gráfico "Vantagem de material" com os momentos-chave clicáveis (R-06, R-03). */
export function MaterialChart({ context, send }: MaterialChartProps) {
  const { result } = context;
  const { game, playerColor } = result.request;
  if (Math.ceil(game.plies.length / 2) < MIN_MOVES_FOR_CHART) {
    return null;
  }
  const chart = chartGeometry(result);
  const side = playerColor === "w" ? "brancas" : "pretas";
  const values = result.materialTimeline;
  const description = `Gráfico da vantagem de material das ${side} ao longo dos ${Math.ceil(
    game.plies.length / 2,
  )} lances: máximo de ${formatAdvantage(Math.max(...values))} e final em ${formatAdvantage(
    values.at(-1) ?? 0,
  )}`;

  return (
    <section
      aria-labelledby="chart-title"
      className="flex flex-col gap-2 rounded-xl border border-line bg-surface px-5 py-[18px]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2.5">
        <span id="chart-title" className="font-bold">
          Vantagem de material ({side})
        </span>
        <span className="text-[13px] text-ink-muted">
          pontos: peão 1, cavalo e bispo 3, torre 5, dama 9
        </span>
      </div>
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          role="img"
          aria-label={description}
          className="block h-auto w-full"
        >
          <line
            x1={CHART.left}
            y1={chart.zeroY}
            x2={CHART.right}
            y2={chart.zeroY}
            className="stroke-line-strong"
            strokeWidth="1"
          />
          <line
            x1={CHART.left}
            y1={chart.topY}
            x2={CHART.right}
            y2={chart.topY}
            className="stroke-line-soft"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x="4" y={chart.zeroY + 4} fontSize="12" className="fill-ink-muted">
            0
          </text>
          <text x="0" y={chart.topY + 4} fontSize="12" className="fill-ink-muted">
            {chart.maxLabel}
          </text>
          {chart.ticks.map((tick) => (
            <text key={tick.label} x={tick.x} y="162" fontSize="12" className="fill-ink-muted">
              {tick.label}
            </text>
          ))}
          <polygon points={chart.area} className="fill-brand/12" />
          <polyline
            points={chart.points}
            fill="none"
            className="stroke-brand"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
        {chart.marks.map((mark) => {
          const moment = result.keyMoments[mark.number - 1];
          const moveNumber = Math.ceil(mark.ply / 2);
          return (
            <button
              key={mark.ply}
              type="button"
              aria-label={`Momento ${mark.number}: ${moment?.moveLabel ?? ""}`}
              onClick={() => send({ type: "MOMENT.SELECT", ply: mark.ply })}
              className="absolute -mt-[11px] -ml-[11px] flex size-[22px] items-center justify-center rounded-full border-2 border-surface bg-danger font-bold text-[10px] text-surface"
              style={{
                left: `${(mark.x / CHART.width) * 100}%`,
                top: `${(mark.y / CHART.height) * 100}%`,
              }}
            >
              {moveNumber}
            </button>
          );
        })}
      </div>
      <span className="text-[13px] text-ink-muted">
        Círculos vermelhos: os {result.keyMoments.length} momentos-chave. Clique para ir ao lance.
      </span>
    </section>
  );
}
