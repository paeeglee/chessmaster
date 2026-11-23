const STEPS = ["Colar", "Analisar", "Revisar e treinar"] as const;

/** Indicador de passos do fluxo principal; `current` começa em 1. */
export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Etapas">
      <ol className="m-0 flex list-none flex-wrap items-center gap-2.5 p-0">
        {STEPS.map((label, index) => {
          const step = index + 1;
          const active = step === current;
          const done = step < current;
          return (
            <li key={label} className="flex items-center gap-2.5">
              {index > 0 && <span aria-hidden="true" className="h-px w-10 bg-line-strong" />}
              <span aria-current={active ? "step" : undefined} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`flex size-[26px] items-center justify-center rounded-full border font-bold text-[13px] ${
                    active || done
                      ? "border-brand bg-brand text-surface"
                      : "border-line-strong bg-surface text-ink-muted"
                  }`}
                >
                  {done ? "✓" : step}
                </span>
                <span
                  className={`text-sm ${active ? "font-bold text-ink" : "font-medium text-ink-muted"}`}
                >
                  {label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
