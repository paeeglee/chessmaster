// Gera o JSON de avaliações do Stockfish para uma partida de fixture, com
// profundidade fixa e uma thread (resultado reproduzível). Uso:
//   node scripts/evaluate-fixture.mjs <fens.json> <saida.json> [profundidade]
// <fens.json> é uma lista de FENs (posição inicial + uma por meio-lance).
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const [fensPath, outputPath, depthArg = "16"] = process.argv.slice(2);
const fens = JSON.parse(readFileSync(fensPath, "utf8"));
const depth = Number(depthArg);

const lines = [];
let waiter = null;
const engine = require("stockfish")("single", (line) => {
  lines.push(line);
  if (waiter?.(line)) waiter = null;
});

function send(command, until) {
  return new Promise((resolve) => {
    lines.length = 0;
    waiter = (line) => {
      if (until(line)) {
        resolve([...lines]);
        return true;
      }
      return false;
    };
    engine.processCommand(command);
  });
}

await send("uci", (line) => line === "uciok");
await send("isready", (line) => line === "readyok");

const results = [];
for (const [index, fen] of fens.entries()) {
  engine.processCommand("ucinewgame");
  engine.processCommand(`position fen ${fen}`);
  const output = await send(`go depth ${depth}`, (line) => line.startsWith("bestmove"));
  const info =
    output.filter((line) => /^info .*score (cp|mate) /.test(line) && !/bound/.test(line)).at(-1) ??
    "";
  const fields = info.split(" ");
  const scoreAt = fields.indexOf("score");
  const pvAt = fields.indexOf("pv");
  const best = output.at(-1).split(" ")[1];
  results.push({
    fen,
    depth: Number(fields[fields.indexOf("depth") + 1] ?? 0),
    // Igual ao EngineClient: pontuação sempre do ponto de vista das brancas.
    score: {
      kind: fields[scoreAt + 1] ?? "cp",
      value: (fen.split(" ")[1] === "b" ? -1 : 1) * Number(fields[scoreAt + 2] ?? 0) || 0,
    },
    bestMove: best === "(none)" ? null : best,
    pv: pvAt === -1 ? [] : fields.slice(pvAt + 1),
  });
  process.stderr.write(`\r${index + 1}/${fens.length}`);
}
engine.terminate?.();
writeFileSync(outputPath, `${JSON.stringify(results, null, 1)}\n`);
process.stderr.write("\n");
process.exit(0);
