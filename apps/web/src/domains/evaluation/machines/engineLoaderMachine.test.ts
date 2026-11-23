import { describe, expect, it } from "vitest";
import { createActor, fromCallback } from "xstate";
import type { EngineClient } from "../engine/EngineClient";
import type { EngineBuild } from "../model/types";
import { type EngineLoaderEvent, engineLoaderMachine } from "./engineLoaderMachine";

type Controls = { send: (event: EngineLoaderEvent) => void; stopped: number; started: number };

function loaderWithFakeActor() {
  const controls: Controls = { send: () => {}, stopped: 0, started: 0 };
  const machine = engineLoaderMachine.provide({
    actors: {
      loadEngine: fromCallback<EngineLoaderEvent, { build: EngineBuild }>(({ sendBack }) => {
        controls.started += 1;
        controls.send = sendBack;
        return () => {
          controls.stopped += 1;
        };
      }),
    },
  });
  const actor = createActor(machine).start();
  return { actor, controls };
}

const fakeEngine = { evaluate: async () => ({}) } as unknown as EngineClient;

describe("engineLoaderMachine", () => {
  it("começa a baixar assim que inicia, em 0% (EVAL-05)", () => {
    const { actor, controls } = loaderWithFakeActor();
    expect(actor.getSnapshot().value).toBe("loading");
    expect(actor.getSnapshot().context.percent).toBe(0);
    expect(controls.started).toBe(1);
  });

  it("acompanha a porcentagem do download (EVAL-06)", () => {
    const { actor, controls } = loaderWithFakeActor();
    controls.send({ type: "ENGINE.PROGRESS", percent: 40 });
    expect(actor.getSnapshot().context.percent).toBe(40);
  });

  it("fica pronto com o cliente do motor (EVAL-07)", () => {
    const { actor, controls } = loaderWithFakeActor();
    controls.send({ type: "ENGINE.READY", engine: fakeEngine });
    expect(actor.getSnapshot().value).toBe("ready");
    expect(actor.getSnapshot().context.engine).toBe(fakeEngine);
    expect(actor.getSnapshot().context.percent).toBe(100);
  });

  it("vai para falha quando o carregamento falha (EVAL-08)", () => {
    const { actor, controls } = loaderWithFakeActor();
    controls.send({ type: "ENGINE.FAILED" });
    expect(actor.getSnapshot().value).toBe("failed");
  });

  it("tentar de novo encerra o carregamento anterior e recomeça em 0% (EVAL-09)", () => {
    const { actor, controls } = loaderWithFakeActor();
    controls.send({ type: "ENGINE.PROGRESS", percent: 70 });
    controls.send({ type: "ENGINE.FAILED" });
    expect(controls.stopped).toBe(1);
    actor.send({ type: "RETRY" });
    expect(actor.getSnapshot().value).toBe("loading");
    expect(actor.getSnapshot().context.percent).toBe(0);
    expect(controls.started).toBe(2);
  });

  it("ignora RETRY enquanto carrega", () => {
    const { actor, controls } = loaderWithFakeActor();
    actor.send({ type: "RETRY" });
    expect(controls.started).toBe(1);
  });

  it("sem isolamento de origem, escolhe o build de uma thread (jsdom)", () => {
    const { actor } = loaderWithFakeActor();
    expect(actor.getSnapshot().context.build.variant).toBe("single-thread");
  });
});
