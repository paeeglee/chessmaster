import type { EngineLoaderStatus } from "../machines/engineLoaderMachine";

type EngineStatusProps = {
  status: EngineLoaderStatus;
  percent: number;
  onRetry: () => void;
};

/** Indicador discreto do motor de análise; nunca bloqueia o resto da tela (C-14). */
export function EngineStatus({ status, percent, onRetry }: EngineStatusProps) {
  return (
    <div aria-live="polite" className="flex items-center gap-3 text-ink-muted text-sm">
      {status === "loading" && <span>Carregando o motor de análise… {percent}%</span>}
      {status === "ready" && <span className="font-semibold text-success">Motor pronto</span>}
      {status === "failed" && (
        <>
          <span className="font-semibold text-danger">Não foi possível carregar o motor</span>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-md border border-line bg-surface px-4 font-semibold text-ink"
          >
            Tentar de novo
          </button>
        </>
      )}
    </div>
  );
}
