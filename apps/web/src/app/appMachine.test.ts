import { afterEach, describe, expect, it } from "vitest";
import { createActor, fromCallback, fromPromise } from "xstate";
import { analysisMachine } from "../domains/analysis";
import { engineLoaderMachine } from "../domains/evaluation";
import { gameInputMachine } from "../domains/game-input";
import { appMachine } from "./appMachine";

const READY = { status: "ready", percent: 100 } as const;
const GAME = "1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6";

function startApp(clipboard: () => Promise<string> = async () => "") {
  const logic = appMachine.provide({
    actors: {
      engineLoader: engineLoaderMachine.provide({
        actors: { loadEngine: fromCallback(() => {}) },
      }),
      // A análise de verdade é testada no domínio analysis; aqui ela só fica parada.
      analysis: analysisMachine.provide({
        actors: { evaluatePositions: fromCallback(() => {}) },
      }),
      gameInput: gameInputMachine.provide({
        actors: { readClipboard: fromPromise(clipboard) },
      }),
    },
  });
  return createActor(logic).start();
}

type App = ReturnType<typeof startApp>;

function gameInput(app: App) {
  const child = app.getSnapshot().children.gameInput;
  if (!child) throw new Error("tela Colar não está ativa");
  return child;
}

afterEach(() => {
  localStorage.clear();
});

describe("appMachine com a tela Colar", () => {
  it("começa na tela Colar sem cor, em Iniciante e com as prioridades padrão (IN-13, IN-17)", () => {
    const app = startApp();
    expect(app.getSnapshot().value).toBe("gameInput");
    expect(gameInput(app).getSnapshot().context).toEqual({
      text: "",
      playerColor: null,
      level: "beginner",
      priorities: ["lost-pieces", "endgames"],
      clipboardDenied: false,
    });
  });

  it("começa no nível guardado neste navegador (IN-15)", () => {
    localStorage.setItem("analisador.level", "intermediate");
    expect(gameInput(startApp()).getSnapshot().context.level).toBe("intermediate");
  });

  it("guarda o texto e limpa (IN-10)", () => {
    const app = startApp();
    gameInput(app).send({ type: "TEXT.CHANGED", text: GAME });
    expect(app.getSnapshot().context.draft.text).toBe(GAME);
    gameInput(app).send({ type: "CLEAR" });
    expect(gameInput(app).getSnapshot().context.text).toBe("");
    expect(app.getSnapshot().context.draft.text).toBe("");
  });

  it("cola da área de transferência (IN-11)", async () => {
    const app = startApp(async () => GAME);
    gameInput(app).send({ type: "PASTE" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(gameInput(app).getSnapshot().context.text).toBe(GAME);
    expect(app.getSnapshot().context.draft.text).toBe(GAME);
  });

  it("avisa quando a área de transferência é negada (IN-12)", async () => {
    const app = startApp(async () => {
      throw new Error("NotAllowedError");
    });
    gameInput(app).send({ type: "TEXT.CHANGED", text: GAME });
    gameInput(app).send({ type: "PASTE" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(gameInput(app).getSnapshot().context).toMatchObject({
      clipboardDenied: true,
      text: GAME,
    });
    gameInput(app).send({ type: "TEXT.CHANGED", text: "" });
    expect(gameInput(app).getSnapshot().context.clipboardDenied).toBe(false);
  });

  it("seleciona a cor (IN-14)", () => {
    const app = startApp();
    gameInput(app).send({ type: "COLOR.SELECTED", color: "b" });
    expect(gameInput(app).getSnapshot().context.playerColor).toBe("b");
    gameInput(app).send({ type: "COLOR.SELECTED", color: "w" });
    expect(app.getSnapshot().context.draft.playerColor).toBe("w");
  });

  it("guarda só o nível no navegador (IN-16)", () => {
    const app = startApp();
    gameInput(app).send({ type: "TEXT.CHANGED", text: GAME });
    gameInput(app).send({ type: "COLOR.SELECTED", color: "b" });
    gameInput(app).send({ type: "LEVEL.SELECTED", level: "advanced" });
    expect(gameInput(app).getSnapshot().context.level).toBe("advanced");
    expect({ ...localStorage }).toEqual({ "analisador.level": "advanced" });
  });

  it("alterna as prioridades (IN-17)", () => {
    const app = startApp();
    gameInput(app).send({ type: "PRIORITY.TOGGLED", priority: "opening" });
    gameInput(app).send({ type: "PRIORITY.TOGGLED", priority: "lost-pieces" });
    expect(gameInput(app).getSnapshot().context.priorities).toEqual(["endgames", "opening"]);
  });

  it("não analisa sem cor ou com o motor carregando (IN-19, IN-20)", () => {
    const app = startApp();
    gameInput(app).send({ type: "TEXT.CHANGED", text: GAME });
    gameInput(app).send({ type: "ANALYZE", engine: READY });
    expect(app.getSnapshot().value).toBe("gameInput");
    gameInput(app).send({ type: "COLOR.SELECTED", color: "w" });
    gameInput(app).send({ type: "ANALYZE", engine: { status: "loading", percent: 50 } });
    expect(app.getSnapshot().value).toBe("gameInput");
  });

  it("vai para a análise com a partida e as escolhas (IN-22)", () => {
    const app = startApp();
    gameInput(app).send({ type: "TEXT.CHANGED", text: GAME });
    gameInput(app).send({ type: "COLOR.SELECTED", color: "b" });
    gameInput(app).send({ type: "LEVEL.SELECTED", level: "intermediate" });
    gameInput(app).send({ type: "ANALYZE", engine: READY });
    expect(app.getSnapshot().value).toBe("analyzing");
    const request = app.getSnapshot().context.request;
    expect(request?.game.plies.map((ply) => ply.san)).toEqual([
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
      "Nf6",
    ]);
    expect(request).toMatchObject({
      playerColor: "b",
      level: "intermediate",
      priorities: ["lost-pieces", "endgames"],
    });
  });

  it("ao cancelar, volta à tela Colar com o texto e as escolhas (IN-23)", () => {
    const app = startApp();
    gameInput(app).send({ type: "TEXT.CHANGED", text: GAME });
    gameInput(app).send({ type: "COLOR.SELECTED", color: "b" });
    gameInput(app).send({ type: "PRIORITY.TOGGLED", priority: "plan" });
    gameInput(app).send({ type: "LEVEL.SELECTED", level: "intermediate" });
    gameInput(app).send({ type: "ANALYZE", engine: READY });
    app.send({ type: "ANALYSIS.CANCELLED" });
    expect(app.getSnapshot().value).toBe("gameInput");
    expect(app.getSnapshot().context.request).toBeNull();
    expect(gameInput(app).getSnapshot().context).toMatchObject({
      text: GAME,
      playerColor: "b",
      level: "intermediate",
      priorities: ["lost-pieces", "endgames", "plan"],
    });
  });

  it("leva o motor pronto para a análise e abre o resultado ao terminar (AS-05)", async () => {
    const engine = { evaluate: async () => ({}), cancel: () => {} };
    const result = { keyMoments: [], explanation: null, aiFailed: true };
    let analysisInput: unknown = null;
    const logic = appMachine.provide({
      actors: {
        engineLoader: engineLoaderMachine.provide({
          actors: {
            loadEngine: fromCallback(({ sendBack }) => {
              sendBack({ type: "ENGINE.READY", engine: engine as never });
            }),
          },
        }),
        analysis: fromPromise(async ({ input }) => {
          analysisInput = input;
          return result as never;
        }) as never,
      },
    });
    const app = createActor(logic).start();
    gameInput(app).send({ type: "TEXT.CHANGED", text: GAME });
    gameInput(app).send({ type: "COLOR.SELECTED", color: "w" });
    gameInput(app).send({ type: "ANALYZE", engine: READY });
    expect(app.getSnapshot().value).toBe("analyzing");
    expect(app.getSnapshot().context.engine).toBe(engine);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(analysisInput).toMatchObject({ engine, request: { playerColor: "w" } });
    expect(app.getSnapshot().value).toBe("review");
    expect(app.getSnapshot().context.result).toBe(result);
  });

  it("analisar outra partida volta à tela Colar com o campo vazio (R-13)", async () => {
    const logic = appMachine.provide({
      actors: {
        engineLoader: engineLoaderMachine.provide({
          actors: {
            loadEngine: fromCallback(({ sendBack }) => {
              sendBack({ type: "ENGINE.READY", engine: {} as never });
            }),
          },
        }),
        analysis: fromPromise(async () => ({}) as never) as never,
      },
    });
    const app = createActor(logic).start();
    gameInput(app).send({ type: "TEXT.CHANGED", text: GAME });
    gameInput(app).send({ type: "COLOR.SELECTED", color: "b" });
    gameInput(app).send({ type: "LEVEL.SELECTED", level: "advanced" });
    gameInput(app).send({ type: "ANALYZE", engine: READY });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(app.getSnapshot().value).toBe("review");
    app.send({ type: "REVIEW.NEW_GAME" });
    expect(app.getSnapshot().value).toBe("gameInput");
    expect(app.getSnapshot().context.result).toBeNull();
    expect(gameInput(app).getSnapshot().context).toMatchObject({
      text: "",
      playerColor: null,
      level: "advanced",
    });
  });
});
