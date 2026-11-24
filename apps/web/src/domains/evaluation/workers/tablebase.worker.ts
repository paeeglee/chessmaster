/// <reference lib="webworker" />
// Motor 4 num Web Worker: gera a tabela na primeira consulta de cada tipo e guarda
// para as próximas, para não travar a interface (cerca de 1 s por tabela).
import { type EndgameKind, generateTable, type Table } from "../model/tablebase/generate";
import { endgameOf, probe } from "../model/tablebase/probe";

const tables = new Map<EndgameKind, Table>();

self.onmessage = (event: MessageEvent<{ id: number; fen: string }>) => {
  const { id, fen } = event.data;
  try {
    const position = endgameOf(fen);
    if (!position) {
      self.postMessage({ id, result: null });
      return;
    }
    let table = tables.get(position.kind);
    if (!table) {
      table = generateTable(position.kind);
      tables.set(position.kind, table);
    }
    self.postMessage({ id, result: probe(table, fen) });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : "falha" });
  }
};
