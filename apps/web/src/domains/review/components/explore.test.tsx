import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useActor } from "@xstate/react";
import { describe, expect, it } from "vitest";
import { fromPromise } from "xstate";
import type { GameExplanation, QuestionAnswer } from "../../explanation";
import { referenceResult } from "../fixtures/referenceResult";
import { type AskInput, type ExplainInput, reviewMachine } from "../machines/reviewMachine";
import { BoardPanel } from "./BoardPanel";
import { MaterialChart } from "./MaterialChart";
import { MoveList } from "./MoveList";

const logic = reviewMachine.provide({
  actors: {
    askQuestion: fromPromise<QuestionAnswer, AskInput>(async () => ({
      answer: "",
      in_scope: true,
    })),
    explainGame: fromPromise<GameExplanation, ExplainInput>(async () => {
      throw new Error("sem IA");
    }),
  },
});

function Explore({ short = false }: { short?: boolean }) {
  const result = referenceResult();
  const input = short
    ? {
        ...result,
        request: {
          ...result.request,
          game: { ...result.request.game, plies: result.request.game.plies.slice(0, 20) },
        },
      }
    : result;
  const [snapshot, send] = useActor(logic, { input });
  return (
    <>
      <BoardPanel context={snapshot.context} send={send} />
      <MaterialChart context={snapshot.context} send={send} />
      <MoveList context={snapshot.context} send={send} />
    </>
  );
}

function board() {
  return screen.getByRole("img", { name: /^Posição:/ });
}

function firstSquare() {
  return board().querySelector("[data-square]")?.getAttribute("data-square");
}

describe("tabuleiro do resultado", () => {
  it("abre antes de 22...Ta7, com as pretas embaixo e as marcações (RV-05, RV-07)", () => {
    render(<Explore />);
    expect(screen.getByText("Antes de 22...Ta7?")).toBeInTheDocument();
    expect(screen.getByText("Pretas jogam")).toBeInTheDocument();
    expect(firstSquare()).toBe("h1");
    expect(board().querySelector('[data-square="a1"]')).toHaveAttribute("data-mark", "red");
    expect(board().querySelector('[data-square="d4"]')).toHaveAttribute("data-mark", "green");
    expect(screen.getByText(/lance sugerido \(Bd4\+\)/)).toBeInTheDocument();
  });

  it("navega com os botões e gira (RV-06)", async () => {
    render(<Explore />);
    await userEvent.click(screen.getByRole("button", { name: "Próximo lance" }));
    expect(screen.getByText("Depois de 22...Ta7")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Início" }));
    expect(screen.getByText("Posição inicial")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Fim" }));
    expect(screen.getByText("Depois de 72...Ta6#")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Lance anterior" }));
    expect(screen.getByText("Depois de 72.Ra8")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Girar" }));
    expect(firstSquare()).toBe("a8");
  });

  it("navega com as setas, Home e End no painel (RV-06)", async () => {
    render(<Explore />);
    screen.getByRole("region", { name: "Tabuleiro da partida" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Depois de 22...Ta7")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByText("Depois de 21...Te8")).toBeInTheDocument();
    await userEvent.keyboard("{Home}");
    expect(screen.getByText("Posição inicial")).toBeInTheDocument();
    await userEvent.keyboard("{End}");
    expect(screen.getByText("Depois de 72...Ta6#")).toBeInTheDocument();
  });
});

describe("gráfico de material (RV-08, RV-10)", () => {
  it("marca os momentos com o número do lance e leva até eles", async () => {
    render(<Explore />);
    const circles = screen.getAllByRole("button", { name: /^Momento \d/ });
    expect(circles.map((circle) => circle.textContent)).toEqual(["22", "27", "41", "43", "56"]);
    await userEvent.click(screen.getByRole("button", { name: "Momento 4: 43...Te6" }));
    expect(screen.getByText("Antes de 43...Te6?")).toBeInTheDocument();
    const selected = screen.getByRole("region", { name: "Lances" }).querySelector("[aria-current]");
    expect(selected).toHaveTextContent("Te6??");
  });

  it("descreve o gráfico em texto", () => {
    render(<Explore />);
    expect(
      screen.getByRole("img", {
        name: /^Gráfico da vantagem de material das pretas ao longo dos 72 lances/,
      }),
    ).toBeInTheDocument();
  });

  it("some em partidas com menos de 15 lances", () => {
    render(<Explore short />);
    expect(screen.queryByRole("img", { name: /^Gráfico/ })).not.toBeInTheDocument();
  });
});

describe("lista de lances (RV-09, RV-10)", () => {
  it("mostra as anotações e destaca o lance do momento", () => {
    render(<Explore />);
    const moves = screen.getByRole("region", { name: "Lances" });
    expect(within(moves).getByRole("button", { name: "Bxa1!" })).toBeInTheDocument();
    expect(within(moves).getByRole("button", { name: "Ta7?" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(within(moves).getByRole("button", { name: "Te6??" })).toBeInTheDocument();
  });

  it("clicar num lance comum move o tabuleiro até depois dele", async () => {
    render(<Explore />);
    await userEvent.click(
      within(screen.getByRole("region", { name: "Lances" })).getByRole("button", { name: "Ce2" }),
    );
    expect(screen.getByText("Depois de 12.Ce2")).toBeInTheDocument();
  });
});
