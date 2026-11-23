import { describe, expect, it } from "vitest";
import referenceGameHtml from "../../game/fixtures/reference-game.chesscom.html?raw";
import { analyzeAvailability, type EngineState } from "./analyzeAvailability";
import { estimateSeconds } from "./estimate";
import { inspectGame } from "./inspectGame";
import { LEVEL_STORAGE_KEY, loadLevel, saveLevel } from "./levelStorage";
import type { Inspection } from "./types";

const READY: EngineState = { status: "ready", percent: 100 };

describe("inspectGame", () => {
  it("valida a partida de referência", () => {
    const inspection = inspectGame(referenceGameHtml);
    expect(inspection.kind).toBe("valid");
    if (inspection.kind !== "valid") return;
    expect(inspection.format).toBe("chesscom-html");
    expect(inspection.game.plies).toHaveLength(144);
    expect(inspection.shortGame).toBe(false);
  });

  it.each([
    ["", "empty"],
    ["oi", "unrecognized"],
    [`1.e4 ${"x".repeat(600_000)}`, "too-large"],
  ])("classifica %#", (text, kind) => {
    expect(inspectGame(text).kind).toBe(kind);
  });

  it("aponta o lance ilegal como foi escrito (IN-05)", () => {
    expect(inspectGame("1.d4 d5 2.Cc3 e6 3.Txa1")).toEqual({
      kind: "illegal",
      error: { ply: 5, moveNumber: 3, color: "w", writtenMove: "Txa1" },
    });
  });

  it("marca partida curta abaixo de 6 lances (IN-08)", () => {
    const short = inspectGame("1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.d3 Bc5 5.O-O O-O 6.c3");
    const enough = inspectGame("1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.d3 Bc5 5.O-O O-O 6.c3 a6");
    expect(short.kind === "valid" && short.shortGame).toBe(true);
    expect(enough.kind === "valid" && enough.shortGame).toBe(false);
  });
});

describe("analyzeAvailability", () => {
  const valid = inspectGame("1.e4 e5 2.Nf3 Nc6") as Inspection;

  it("pede uma partida válida (IN-18)", () => {
    expect(analyzeAvailability({ kind: "empty" }, "w", READY)).toEqual({
      enabled: false,
      label: "Analisar partida →",
      hint: "Cole uma partida válida",
    });
  });

  it("pede a cor quando a partida é válida (IN-19)", () => {
    expect(analyzeAvailability(valid, null, READY)).toEqual({
      enabled: false,
      label: "Analisar partida →",
      hint: "Selecione com qual cor você jogou",
    });
  });

  it("mostra o carregamento do motor quando só ele falta (IN-20)", () => {
    expect(analyzeAvailability(valid, "b", { status: "loading", percent: 40 })).toEqual({
      enabled: false,
      label: "Carregando o motor… 40%",
      hint: null,
    });
  });

  it("explica quando o motor falhou (IN-21)", () => {
    expect(analyzeAvailability(valid, "b", { status: "failed", percent: 10 })).toEqual({
      enabled: false,
      label: "Analisar partida →",
      hint: "O motor não carregou. Tente de novo acima.",
    });
  });

  it("habilita com tudo pronto", () => {
    expect(analyzeAvailability(valid, "w", READY)).toEqual({
      enabled: true,
      label: "Analisar partida →",
      hint: null,
    });
  });
});

describe("estimateSeconds (IN-24)", () => {
  it("usa 30 s antes de haver partida", () => {
    expect(estimateSeconds(null)).toBe(30);
  });

  it("calcula ~200 ms por posição, arredondando a 5 s", () => {
    expect(estimateSeconds(144)).toBe(30);
    expect(estimateSeconds(300)).toBe(60);
    expect(estimateSeconds(4)).toBe(5);
    // 37 meios-lances = 38 posições = 7,6 s → 10 s (sem o +1 seriam 7,4 s → 5 s).
    expect(estimateSeconds(37)).toBe(10);
  });
});

describe("levelStorage", () => {
  function memoryStorage(initial: Record<string, string> = {}) {
    const values = new Map(Object.entries(initial));
    return {
      values,
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
  }

  it("começa em Iniciante sem nada guardado (IN-15)", () => {
    expect(loadLevel(memoryStorage())).toBe("beginner");
    expect(loadLevel(undefined)).toBe("beginner");
  });

  it("lê o nível guardado e ignora valores estranhos", () => {
    expect(loadLevel(memoryStorage({ [LEVEL_STORAGE_KEY]: "intermediate" }))).toBe("intermediate");
    expect(loadLevel(memoryStorage({ [LEVEL_STORAGE_KEY]: "expert" }))).toBe("beginner");
  });

  it("guarda o nível na chave do produto (IN-16)", () => {
    const storage = memoryStorage();
    saveLevel(storage, "advanced");
    expect([...storage.values]).toEqual([[LEVEL_STORAGE_KEY, "advanced"]]);
  });

  it("não quebra quando o armazenamento falha (IN-25)", () => {
    const broken = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(loadLevel(broken)).toBe("beginner");
    expect(() => saveLevel(broken, "advanced")).not.toThrow();
  });
});
