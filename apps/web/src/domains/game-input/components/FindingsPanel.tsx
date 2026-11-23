import { Board, type BoardMark } from "../../../shared/ui/Board";
import {
  describePieces,
  formatMoveLabel,
  type Game,
  type PlayerColor,
  summarizeMaterial,
} from "../../game";
import type { Inspection } from "../model/types";
import { FindingItem } from "./FindingItem";

const FORMAT_LABEL = {
  "chesscom-html": "Lista de lances do Chess.com",
  "move-list": "Lista de lances",
} as const;

const RESULT_LABEL = { "1-0": "1-0", "0-1": "0-1", "1/2-1/2": "½-½" } as const;

function resultFinding(game: Game) {
  const last = game.plies.at(-1);
  const detail = last ? `Última jogada: ${formatMoveLabel(last)}` : undefined;
  if (game.result === null) {
    return <FindingItem tone="neutral" title="Partida sem resultado registrado" detail={detail} />;
  }
  const reason =
    game.termination === "checkmate"
      ? ", por xeque-mate"
      : game.termination === "stalemate"
        ? ", por afogamento"
        : "";
  return (
    <FindingItem
      tone="success"
      title={`Resultado ${RESULT_LABEL[game.result]}${reason}`}
      detail={detail}
    />
  );
}

function finalPositionMarks(game: Game): Partial<Record<string, BoardMark>> {
  const marks: Partial<Record<string, BoardMark>> = {};
  const last = game.plies.at(-1);
  if (last) {
    marks[last.to] = "last";
  }
  if (game.termination === "checkmate") {
    // O rei que levou mate é o do lado que deveria jogar na posição final.
    const mated = game.finalFen.split(" ")[1] === "w" ? "K" : "k";
    const rows = (game.finalFen.split(" ")[0] ?? "").split("/");
    rows.forEach((row, index) => {
      let file = 0;
      for (const char of row) {
        if (/\d/.test(char)) {
          file += Number(char);
        } else {
          if (char === mated) marks[`${"abcdefgh"[file]}${8 - index}`] = "red";
          file += 1;
        }
      }
    });
  }
  return marks;
}

function boardLabel(game: Game): string {
  const ending =
    game.termination === "checkmate"
      ? ", xeque-mate"
      : game.termination === "stalemate"
        ? ", afogamento"
        : "";
  return `Posição final: ${describePieces(game.finalFen)}${ending}`;
}

export function FindingsPanel({
  inspection,
  playerColor,
}: {
  inspection: Inspection;
  playerColor: PlayerColor | null;
}) {
  return (
    <section
      aria-labelledby="findings-title"
      className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-[22px]"
    >
      <p
        id="findings-title"
        className="m-0 font-bold text-brand text-xs uppercase tracking-[0.08em]"
      >
        O que encontramos
      </p>
      <div aria-live="polite" className="flex flex-col gap-4">
        {inspection.kind === "empty" && (
          <p className="m-0 text-[15px] text-ink-muted">Cole uma partida para começar</p>
        )}
        {inspection.kind === "unrecognized" && (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            <FindingItem
              tone="danger"
              title="Não reconhecemos este texto como uma partida"
              detail="Aceitamos o HTML da lista de lances do Chess.com ou uma lista de lances (1.d4 d5 2.Cc3 …)."
            />
          </ul>
        )}
        {inspection.kind === "too-large" && (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            <FindingItem
              tone="danger"
              title="Cole só a lista de lances: o texto passou de 500 KB."
            />
          </ul>
        )}
        {inspection.kind === "illegal" && (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            <FindingItem
              tone="danger"
              title={`O lance ${inspection.error.moveNumber} (${inspection.error.writtenMove}) não é possível nesta posição`}
              detail="Confira esse lance no texto colado. A análise fica bloqueada até a partida estar completa e correta."
            />
          </ul>
        )}
        {inspection.kind === "valid" && (
          <>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              <FindingItem
                tone="success"
                title={FORMAT_LABEL[inspection.format]}
                detail="Formato reconhecido automaticamente"
              />
              <FindingItem
                tone="success"
                title={`${inspection.game.plies.length} lances, todos legais`}
                detail={`O motor de regras reconstruiu as ${inspection.game.plies.length + 1} posições`}
              />
              {resultFinding(inspection.game)}
              {inspection.shortGame && (
                <FindingItem tone="warning" title="Partida curta: há pouco a analisar." />
              )}
            </ul>
            <div className="flex items-center gap-3.5 rounded-lg bg-canvas p-3">
              <Board
                fen={inspection.game.finalFen}
                orientation={playerColor ?? "w"}
                marks={finalPositionMarks(inspection.game)}
                label={boardLabel(inspection.game)}
                className="w-28 flex-none"
              />
              <div className="flex flex-col gap-1 text-ink-muted text-sm">
                <span className="font-bold text-ink">Posição final</span>
                <span>{summarizeMaterial(inspection.game.finalFen)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
