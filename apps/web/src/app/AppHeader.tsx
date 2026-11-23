export function AppHeader() {
  return (
    <header className="flex flex-wrap items-center gap-5 border-line border-b bg-surface px-8 py-3.5">
      <div className="mr-auto flex items-center gap-2.5">
        <div
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-brand bg-brand text-[22px] text-surface"
        >
          ♞︎
        </div>
        <div className="flex flex-col">
          <span className="font-semibold font-serif text-[19px] text-ink">
            Analisador de partidas
          </span>
          <span className="text-ink-muted text-xs">Entenda seus erros e treine a partir deles</span>
        </div>
      </div>
      <nav aria-label="Seções" className="flex flex-wrap gap-1 rounded-lg bg-canvas p-1">
        <a
          href="/"
          aria-current="page"
          className="rounded-md bg-surface px-3.5 py-[9px] font-semibold text-[15px] text-ink no-underline shadow-raised"
        >
          Analisar partida
        </a>
      </nav>
    </header>
  );
}
