import type { Inspection } from "../model/types";

type GameFieldProps = {
  text: string;
  inspection: Inspection;
  clipboardDenied: boolean;
  onTextChange: (text: string) => void;
  onPaste: () => void;
  onClear: () => void;
};

const SECONDARY_BUTTON =
  "min-h-11 rounded-md border border-line bg-surface px-4 py-2.5 font-semibold text-[15px] text-ink";

export function GameField({
  text,
  inspection,
  clipboardDenied,
  onTextChange,
  onPaste,
  onClear,
}: GameFieldProps) {
  return (
    <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5 rounded-xl border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="partida" className="font-bold text-base">
          Partida
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onPaste} className={SECONDARY_BUTTON}>
            Colar da área de transferência
          </button>
          <button type="button" onClick={onClear} className={SECONDARY_BUTTON}>
            Limpar
          </button>
        </div>
      </div>
      <textarea
        id="partida"
        rows={14}
        value={text}
        spellCheck={false}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder={
          "Cole aqui a lista de lances do Chess.com…\n\nOu uma lista simples: 1.d4 d5 2.Cc3 e6 3.Cf3 Cc6 …"
        }
        className="box-border w-full resize-y rounded-md border border-line-strong bg-field p-3.5 font-mono text-[13px] text-ink-muted leading-[1.55]"
      />
      {clipboardDenied && (
        <p role="status" className="m-0 text-sm text-warning">
          Não conseguimos ler a área de transferência. Clique no campo e use Ctrl+V (Cmd+V no Mac).
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-ink-muted text-sm">
        <span>Aceita:</span>
        <span className="rounded-sm bg-canvas px-2.5 py-1 font-semibold">HTML do Chess.com</span>
        <span className="rounded-sm bg-canvas px-2.5 py-1 font-semibold">
          Lista de lances (1.d4 d5 …)
        </span>
      </div>
      <details
        // A ajuda abre sozinha quando o texto não foi reconhecido (step_01, estados).
        key={inspection.kind === "unrecognized" ? "help-open" : "help"}
        open={inspection.kind === "unrecognized"}
        className="border-line-soft border-t pt-3 text-ink-muted text-sm"
      >
        <summary className="cursor-pointer font-semibold text-brand">
          Onde copio isso no Chess.com?
        </summary>
        <p className="mt-2 mb-0">
          Abra a partida no Chess.com, clique com o botão direito na lista de lances ao lado do
          tabuleiro, escolha "Inspecionar" e, no elemento da lista, use "Copiar → Copiar elemento".
          Também funciona colar a lista de lances (1.d4 d5 2.Cc3 …).
        </p>
      </details>
    </section>
  );
}
