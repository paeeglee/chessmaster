import { describe, expect, it } from "vitest";
import { createActor } from "xstate";
import { appMachine } from "./appMachine";

describe("appMachine", () => {
  it("começa na tela Colar a partida", () => {
    const actor = createActor(appMachine).start();
    expect(actor.getSnapshot().value).toBe("gameInput");
    actor.stop();
  });
});
