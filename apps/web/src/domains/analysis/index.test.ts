import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("fronteira do domínio analysis (AN-18)", () => {
  it("o model/ não importa React, XState, workers, rede nem chess.js", () => {
    const dir = join(import.meta.dirname, "model");
    const forbidden =
      /(?:from\s+|import\s*\(?\s*)["'](react|react-dom|xstate|@xstate\/react|msw|chess\.js)["']|\bfetch\(|new Worker|XMLHttpRequest|WebSocket/;
    const offenders = readdirSync(dir)
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
      .filter((file) => forbidden.test(readFileSync(join(dir, file), "utf8")));
    expect(offenders).toEqual([]);
  });

  it("o model/ só usa outros domínios pelo index", () => {
    const dir = join(import.meta.dirname, "model");
    const deepImport = /from\s+["']\.\.\/\.\.\/[a-z-]+\/(?!index)/;
    const offenders = readdirSync(dir)
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
      .filter((file) => deepImport.test(readFileSync(join(dir, file), "utf8")));
    expect(offenders).toEqual([]);
  });
});
