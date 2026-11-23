import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { chooseEngineBuild, ENGINE_VERSION } from "./engineBuild";

describe("chooseEngineBuild", () => {
  it("usa o build multi-thread com um núcleo livre quando isolado (EVAL-03)", () => {
    expect(chooseEngineBuild({ crossOriginIsolated: true, hardwareConcurrency: 8 })).toEqual({
      variant: "multi-thread",
      scriptUrl: "/engine/stockfish-19.0.1-mt.js",
      threads: 7,
    });
  });

  it("nunca usa menos de uma thread", () => {
    expect(chooseEngineBuild({ crossOriginIsolated: true, hardwareConcurrency: 1 }).threads).toBe(
      1,
    );
  });

  it("usa o build de uma thread sem isolamento (EVAL-04)", () => {
    expect(chooseEngineBuild({ crossOriginIsolated: false, hardwareConcurrency: 8 })).toEqual({
      variant: "single-thread",
      scriptUrl: "/engine/stockfish-19.0.1-st.js",
      threads: 1,
    });
  });

  it("acompanha a versão do pacote stockfish instalado", () => {
    const manifest = join(import.meta.dirname, "../../../../node_modules/stockfish/package.json");
    expect(JSON.parse(readFileSync(manifest, "utf8")).version).toBe(ENGINE_VERSION);
  });
});
