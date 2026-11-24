import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { type ActorRefFrom, createActor, fromPromise, setup } from "xstate";
import type { PositionEvaluation } from "../../evaluation";
import { referenceResult } from "../../review/fixtures/referenceResult";
import { type EvaluateInput, trainingMachine } from "../machines/trainingMachine";
import { TrainingScreen } from "./TrainingScreen";

const result = referenceResult();

// Variantes do motor para cada tentativa no momento 1 (posição antes de 22...Ta7).
const LINES: Record<string, string[]> = {
  "r7/5kpp/p1p1rn2/8/1Pp1pPbP/P5N1/3B1KP1/b6R w": ["h1a1", "e6e2"],
  "r3r3/5kpp/p1p2n2/8/1PpbpPbP/P5N1/3B1KP1/7R w": ["f2f1", "d4b2", "d2c3", "b2c3"],
  "4r3/r4kpp/p1p2n2/8/1Pp1pPbP/P5N1/3B1KP1/b6R w": ["h1a1", "a7d7"],
};

function renderTraining(options: { ply?: number; fail?: boolean } = {}) {
  const evaluateAttempt = fromPromise<PositionEvaluation, EvaluateInput>(async ({ input }) => {
    if (options.fail) throw new Error("motor caiu");
    const key = Object.keys(LINES).find((fen) => input.fen.startsWith(fen));
    if (!key) throw new Error(`posição sem variante no teste: ${input.fen}`);
    const pv = LINES[key] as string[];
    return {
      fen: input.fen,
      depth: 18,
      score: { kind: "cp", value: 0 },
      bestMove: pv[0] ?? null,
      pv,
    };
  });
  const backs: string[] = [];
  const parent = setup({
    actors: { training: trainingMachine.provide({ actors: { evaluateAttempt } }) },
  }).createMachine({
    invoke: {
      id: "training",
      src: "training",
      input: { result, ply: options.ply ?? 44, engine: null },
    },
    on: { "TRAINING.BACK": { actions: () => backs.push("back") } },
  });
  const actor = createActor(parent).start();
  const trainingRef = actor.getSnapshot().children.training as ActorRefFrom<typeof trainingMachine>;
  render(<TrainingScreen trainingRef={trainingRef} />);
  return { backs };
}

const user = () => userEvent.setup();
const square = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name},`) });

describe("TrainingScreen", () => {
  it("mostra o exercício do momento 1 sem entregar a resposta (TR-01, TR-02)", () => {
    renderTraining();
    expect(screen.getByText("Momento 1 de 5")).toBeInTheDocument();
    expect(screen.getByText("Encontre o lance · tipo: peça atacada")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Uma das suas peças está em perigo. O que fazer?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Posição real da sua partida, antes do lance 22. Na partida você jogou 22...Ta7.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", {
        name: "Posição antes de 22...Ta7, vista pelas pretas. O bispo em a1 está destacado.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pretas jogam (você)")).toBeInTheDocument();
    // Pretas embaixo: a primeira casa desenhada é h1 e a última é a8.
    const squares = screen
      .getByRole("group", { name: /^Posição antes de 22\.\.\.Ta7/ })
      .querySelectorAll("[data-square]");
    expect(squares[0]).toHaveAttribute("data-square", "h1");
    expect(squares[63]).toHaveAttribute("data-square", "a8");
    expect(screen.queryByText(/Bd4/)).not.toBeInTheDocument();
    // A peça em perigo fica marcada.
    expect(square("a1")).toHaveAttribute("data-mark", "red");
  });

  it("seleciona a peça e mostra os destinos (TR-03)", async () => {
    renderTraining();
    await user().click(square("a1"));
    expect(square("a1")).toHaveAttribute("aria-pressed", "true");
    expect(square("d4").querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("refuta 22...Te6 e anuncia a tentativa (TR-05, TR-13)", async () => {
    renderTraining();
    const u = user();
    await u.click(square("e8"));
    await u.click(square("e6"));
    const status = await screen.findByRole("status");
    expect(await within(status).findByText("Tentativa 1")).toBeInTheDocument();
    expect(within(status).getByText("22...Te6 ainda perde o bispo")).toBeInTheDocument();
    expect(
      within(status).getByText("Depois de 23.Txa1, o bispo some do tabuleiro."),
    ).toBeInTheDocument();
    // A resposta aparece no tabuleiro, e o rótulo não fala mais em destaque.
    expect(square("a1")).toHaveAccessibleName("a1, torre branca");
    expect(
      screen.getByRole("group", { name: "Posição antes de 22...Ta7, vista pelas pretas." }),
    ).toBeInTheDocument();
    // Sem revelar a solução (step_04 §7).
    expect(within(status).queryByText(/Bd4|Bb2|solução/)).toBeNull();
    expect(square("d4")).not.toHaveAttribute("data-mark", "green");
    await u.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(square("a1")).toHaveAccessibleName("a1, bispo preto");
    expect(within(status).getByText("Tentativa 1")).toBeInTheDocument();
    // Segunda tentativa errada (o lance da partida) vira "Tentativa 2".
    await u.click(square("a8"));
    await u.click(square("a7"));
    expect(await within(status).findByText("Tentativa 2")).toBeInTheDocument();
    expect(
      within(status).getByText(
        "Depois de 23.Txa1, o bispo some do tabuleiro. Esse foi o lance jogado na partida.",
      ),
    ).toBeInTheDocument();
  });

  it("aceita 22...Bd4+ e mostra continuação, princípio e próximo (TR-07)", async () => {
    renderTraining();
    const u = user();
    await u.click(square("a1"));
    await u.click(square("d4"));
    expect(await screen.findByText("22...Bd4+ resolve o problema.")).toBeInTheDocument();
    expect(screen.getByText(/^Continuação do motor: Rf1 Bb2 Bc3 Bxc3/)).toBeInTheDocument();
    expect(
      screen.getByText("Antes de cada lance, confira quais peças suas estão atacadas."),
    ).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Próximo momento →" }));
    expect(screen.getByText("Momento 2 de 5")).toBeInTheDocument();
  });

  it("revela as dicas em ordem e mostra a solução (TR-08)", async () => {
    renderTraining();
    const u = user();
    await u.click(screen.getByRole("button", { name: "Dica" }));
    expect(screen.getByText("Olhe a casa a1: quem ataca o bispo?")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Outra dica" }));
    expect(screen.getByText("O bispo pode sair dali ou ser protegido.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Outra dica" })).toBeDisabled();
    await u.click(screen.getByRole("button", { name: "Mostrar solução" }));
    expect(screen.getByText("A solução é 22...Bd4+.")).toBeInTheDocument();
    expect(square("d4")).toHaveAttribute("data-mark", "green");
  });

  it("avisa quando o motor falha (TR-14)", async () => {
    renderTraining({ fail: true });
    const u = user();
    await u.click(square("a1"));
    await u.click(square("d4"));
    expect(
      await screen.findByText("Não foi possível conferir o lance. Tente de novo."),
    ).toBeInTheDocument();
  });

  it("no último momento leva ao resumo e volta ao resultado (TR-11, TR-12)", async () => {
    const last = result.keyMoments.at(-1)?.ply as number;
    const { backs } = renderTraining({ ply: last });
    const u = user();
    expect(
      screen.getByText("Este é o último momento. Depois dele você vê quantos acertou de primeira."),
    ).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Mostrar solução" }));
    await u.click(screen.getByRole("button", { name: "Ver resumo do treino" }));
    expect(screen.getByRole("heading", { name: "0 de 1 de primeira" })).toBeInTheDocument();
    await act(async () => {
      await u.click(screen.getByRole("button", { name: "Voltar ao resultado" }));
    });
    expect(backs).toEqual(["back"]);
  });

  it("o link do topo volta ao resultado a qualquer momento (TR-12)", async () => {
    const { backs } = renderTraining();
    await user().click(screen.getByRole("button", { name: "← Voltar ao resultado" }));
    expect(backs).toEqual(["back"]);
  });
});
