export type StageStatus = "waiting" | "running" | "done" | "failed" | "skipped";

export type Stage = {
  title: string;
  description: string;
  status: StageStatus;
  /** Texto à direita do título (tempo, progresso, "não necessária"). */
  detail?: string;
  /** Porcentagem para a barra de progresso (só a etapa em andamento). */
  progress?: number;
  onRetry?: () => void;
};

const STATUS_TEXT: Record<StageStatus, string> = {
  waiting: "aguardando",
  running: "em andamento",
  done: "concluída",
  failed: "falhou",
  skipped: "não necessária",
};

function StageMarker({ index, status }: { index: number; status: StageStatus }) {
  const base =
    "box-border flex size-[34px] flex-none items-center justify-center rounded-full font-bold text-sm";
  if (status === "done") {
    return <span className={`${base} bg-success text-surface`}>✓</span>;
  }
  if (status === "failed") {
    return <span className={`${base} bg-danger text-surface`}>!</span>;
  }
  if (status === "running") {
    return (
      <span className={`${base} border-[3px] border-brand bg-surface text-brand`}>{index}</span>
    );
  }
  return (
    <span className={`${base} border border-line-strong bg-canvas text-ink-muted`}>{index}</span>
  );
}

/** Lista ordenada das etapas da análise (step_02, A-02). */
export function AnalysisStages({ stages }: { stages: Stage[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
      {stages.map((stage, position) => {
        const active =
          stage.status === "running" || stage.status === "done" || stage.status === "failed";
        return (
          <li key={stage.title} className="flex items-start gap-3.5">
            <StageMarker index={position + 1} status={stage.status} />
            <div className="flex flex-1 flex-col gap-0.5 pt-[5px]">
              <div className="flex flex-wrap justify-between gap-3">
                <span className={`font-bold text-base ${active ? "text-ink" : "text-ink-muted"}`}>
                  {stage.title}
                  <span className="sr-only"> — {STATUS_TEXT[stage.status]}</span>
                </span>
                <span className="text-[13px] text-ink-muted">
                  {stage.detail ?? (stage.status === "skipped" ? "não necessária" : "")}
                </span>
              </div>
              <span className="text-ink-muted text-sm">{stage.description}</span>
              {stage.status === "running" && stage.progress !== undefined && (
                <div
                  role="progressbar"
                  aria-label={stage.title}
                  aria-valuenow={stage.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-soft"
                >
                  <div className="h-full bg-brand" style={{ width: `${stage.progress}%` }} />
                </div>
              )}
              {stage.status === "failed" && stage.onRetry && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={stage.onRetry}
                    className="min-h-11 rounded-md border border-line bg-surface px-4 font-semibold text-ink"
                  >
                    Tentar de novo
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
