import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import * as game from "./index";

const SRC = join(import.meta.dirname, "..", "..");
const GAME_DIR = import.meta.dirname;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
  });
}

describe("fronteira do domínio game", () => {
  it("expõe os motores 1 e 2 pelo index.ts (GAME-23)", () => {
    expect(Object.keys(game).sort()).toEqual([
      "MAX_PASTE_BYTES",
      "defendersOf",
      "describePieces",
      "formatMoveLabel",
      "isAttackedBy",
      "legalDestinations",
      "listPieces",
      "parseGameText",
      "playCaptureLine",
      "playMove",
      "portugueseLine",
      "positionsAlongLine",
      "replayGame",
      "summarizeMaterial",
      "toPortugueseSan",
      "uciToSan",
    ]);
  });

  it("só o domínio game importa chess.js (GAME-23)", () => {
    const offenders = sourceFiles(SRC)
      .filter((file) => !file.startsWith(GAME_DIR))
      .filter((file) =>
        /(?:from\s+|import\s*\(?\s*)["']chess\.js["']/.test(readFileSync(file, "utf8")),
      )
      .map((file) => relative(SRC, file));
    expect(offenders).toEqual([]);
  });

  it("o model/ não importa React, XState nem rede (GAME-24)", () => {
    const forbidden =
      /(?:from\s+|import\s*\(?\s*)["'](react|react-dom|xstate|@xstate\/react|msw)["']|\bfetch\(|XMLHttpRequest|WebSocket|EventSource/;
    const offenders = sourceFiles(join(GAME_DIR, "model"))
      .filter((file) => forbidden.test(readFileSync(file, "utf8")))
      .map((file) => relative(SRC, file));
    expect(offenders).toEqual([]);
  });
});
