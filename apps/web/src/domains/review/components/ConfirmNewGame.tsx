type ConfirmNewGameProps = { onConfirm: () => void; onCancel: () => void };

/** Confirmação antes de descartar a análise (R-13; não há salvamento, D2). */
export function ConfirmNewGame({ onConfirm, onCancel }: ConfirmNewGameProps) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-text"
      className="fixed inset-0 z-10 flex items-center justify-center bg-ink/40 p-4"
    >
      <div className="flex max-w-md flex-col gap-4 rounded-xl bg-surface p-6 shadow-overlay">
        <h2 id="confirm-title" className="m-0 font-semibold font-serif text-[22px]">
          Analisar outra partida?
        </h2>
        <p id="confirm-text" className="m-0 text-ink-muted">
          Esta análise não fica salva. Ao continuar, ela será descartada.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-md border border-line bg-surface px-4 font-semibold"
          >
            Continuar aqui
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 rounded-md border-0 bg-brand px-4 font-semibold text-surface"
          >
            Descartar e analisar outra
          </button>
        </div>
      </div>
    </div>
  );
}
