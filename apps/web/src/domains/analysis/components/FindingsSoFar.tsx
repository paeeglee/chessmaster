import type { Finding } from "../model/findings";

export const MAX_VISIBLE_FINDINGS = 6;

const TAG_STYLE = {
  Erro: { row: "bg-danger-soft", tag: "text-danger" },
  Adversário: { row: "bg-warning-soft", tag: "text-warning" },
} as const;

/** "Já encontrado": achados confirmados pelo motor, em ordem cronológica (A-05). */
export function FindingsSoFar({ findings }: { findings: Finding[] }) {
  const visible = findings.slice(0, MAX_VISIBLE_FINDINGS);
  return (
    <section
      aria-labelledby="findings-so-far"
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-[22px]"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p
          id="findings-so-far"
          className="m-0 font-bold text-brand text-xs uppercase tracking-[0.08em]"
        >
          Já encontrado
        </p>
        <span className="text-[13px] text-ink-muted">aparece enquanto o motor avança</span>
      </div>
      {visible.length === 0 ? (
        <p className="m-0 text-ink-muted text-sm">Nada por enquanto.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {visible.map((finding) => (
            <li
              key={finding.ply}
              className={`flex items-baseline gap-2.5 rounded-md px-3 py-2.5 ${TAG_STYLE[finding.tag].row}`}
            >
              <span
                className={`rounded-[5px] bg-surface px-[7px] py-0.5 font-bold text-[11px] uppercase tracking-[0.06em] ${TAG_STYLE[finding.tag].tag}`}
              >
                {finding.tag}
              </span>
              <span className="text-ink text-sm">
                <strong>{finding.moveLabel}</strong> {finding.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
