import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { fromCallback } from "xstate";
import { App } from "../../../app/App";
import { appMachine } from "../../../app/appMachine";
import { type EngineClient, engineLoaderMachine } from "../../evaluation";
import referenceGameHtml from "../../game/fixtures/reference-game.chesscom.html?raw";

type EngineEvent =
  | { type: "ENGINE.PROGRESS"; percent: number }
  | { type: "ENGINE.READY"; engine: EngineClient }
  | { type: "ENGINE.FAILED" };

function renderApp() {
  const engine = { send: (_event: EngineEvent) => {} };
  const logic = appMachine.provide({
    actors: {
      engineLoader: engineLoaderMachine.provide({
        actors: {
          loadEngine: fromCallback(({ sendBack }) => {
            engine.send = sendBack;
          }),
        },
      }),
    },
  });
  render(<App logic={logic} />);
  return {
    engineReady: () => act(() => engine.send({ type: "ENGINE.READY", engine: {} as EngineClient })),
    engineProgress: (percent: number) =>
      act(() => engine.send({ type: "ENGINE.PROGRESS", percent })),
    engineFailed: () => act(() => engine.send({ type: "ENGINE.FAILED" })),
  };
}

function paste(text: string) {
  fireEvent.change(screen.getByLabelText("Partida"), { target: { value: text } });
}

function analyzeButton() {
  return screen.getByRole("button", { name: /Analisar partida|Carregando o motor/ });
}

afterEach(() => {
  localStorage.clear();
});

describe("tela Colar: o que encontramos", () => {
  it("convida a colar quando o campo está vazio (IN-03)", () => {
    renderApp();
    expect(screen.getByText("Cole uma partida para começar")).toBeInTheDocument();
  });

  it("mostra as checagens e a posição final da partida de referência (IN-01)", () => {
    renderApp();
    paste(referenceGameHtml);
    expect(screen.getByText("Lista de lances do Chess.com")).toBeInTheDocument();
    expect(screen.getByText("Formato reconhecido automaticamente")).toBeInTheDocument();
    expect(screen.getByText("144 lances, todos legais")).toBeInTheDocument();
    expect(screen.getByText("O motor de regras reconstruiu as 145 posições")).toBeInTheDocument();
    expect(screen.getByText("Resultado 0-1, por xeque-mate")).toBeInTheDocument();
    expect(screen.getByText("Última jogada: 72...Ta6#")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Posição final: rei branco em a8, rei preto em c7, torre preta em a6, peão preto em h5, peão preto em h6, xeque-mate",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Brancas: rei. Pretas: rei, torre e 2 peões.")).toBeInTheDocument();
  });

  it("reconhece a lista simples (IN-02)", () => {
    renderApp();
    paste("1.e4 e5 2.Cf3 Cc6 3.Bc4 Cf6 4.d3 Bc5 5.O-O O-O 6.c3 a6 1-0");
    expect(screen.getByText("Lista de lances")).toBeInTheDocument();
    expect(screen.getByText("12 lances, todos legais")).toBeInTheDocument();
    expect(screen.getByText("Resultado 1-0")).toBeInTheDocument();
  });

  it("explica o formato não reconhecido e abre a ajuda (IN-04)", () => {
    renderApp();
    paste('[Event "Live Chess"]\n\n1. e4 e5');
    expect(screen.getByText("Não reconhecemos este texto como uma partida")).toBeInTheDocument();
    expect(screen.getByText("HTML do Chess.com")).toBeInTheDocument();
    expect(screen.getByText("Lista de lances (1.d4 d5 …)")).toBeInTheDocument();
    expect(screen.getByText("Onde copio isso no Chess.com?").closest("details")).toHaveAttribute(
      "open",
    );
    expect(analyzeButton()).toBeDisabled();
  });

  it("aponta o lance ilegal e bloqueia a análise (IN-05)", () => {
    renderApp();
    paste("1.d4 d5 2.Cc3 e6 3.Txa1");
    expect(screen.getByText("O lance 3 (Txa1) não é possível nesta posição")).toBeInTheDocument();
    expect(analyzeButton()).toBeDisabled();
  });

  it("avisa sem bloquear quando não há resultado (IN-06)", async () => {
    const engine = renderApp();
    engine.engineReady();
    paste("1.e4 e5 2.Cf3 Cc6 3.Bc4 Cf6 4.d3 Bc5 5.O-O O-O 6.c3 a6");
    expect(screen.getByText("Partida sem resultado registrado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Brancas" }));
    expect(analyzeButton()).toBeEnabled();
  });

  it("pede só a lista de lances acima de 500 KB (IN-07)", () => {
    renderApp();
    paste(`1.e4 e5 ${"x".repeat(520_000)}`);
    expect(
      screen.getByText("Cole só a lista de lances: o texto passou de 500 KB."),
    ).toBeInTheDocument();
  });

  it("avisa sobre partida curta sem bloquear (IN-08)", async () => {
    const engine = renderApp();
    engine.engineReady();
    paste("1.f3 e5 2.g4 Qh4#");
    expect(screen.getByText("Partida curta: há pouco a analisar.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pretas" }));
    expect(analyzeButton()).toBeEnabled();
  });

  it("anuncia o resultado da leitura (IN-09)", () => {
    renderApp();
    paste("oi");
    const live = screen
      .getByText("Não reconhecemos este texto como uma partida")
      .closest("[aria-live]");
    expect(live).toHaveAttribute("aria-live", "polite");
  });
});

describe("tela Colar: campo e escolhas", () => {
  it("Limpar esvazia o campo e o painel (IN-10)", async () => {
    renderApp();
    paste("1.e4 e5");
    await userEvent.click(screen.getByRole("button", { name: "Limpar" }));
    expect(screen.getByLabelText("Partida")).toHaveValue("");
    expect(screen.getByText("Cole uma partida para começar")).toBeInTheDocument();
  });

  it("começa sem cor e gira a miniatura para a cor escolhida (IN-13, IN-14)", async () => {
    renderApp();
    paste(referenceGameHtml);
    const white = screen.getByRole("button", { name: "Brancas" });
    const black = screen.getByRole("button", { name: "Pretas" });
    expect(white).toHaveAttribute("aria-pressed", "false");
    expect(black).toHaveAttribute("aria-pressed", "false");
    const board = screen.getByRole("img", { name: /Posição final/ });
    expect(board.querySelector("[data-square]")).toHaveAttribute("data-square", "a8");
    await userEvent.click(black);
    expect(black).toHaveAttribute("aria-pressed", "true");
    expect(white).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("img", { name: /Posição final/ }).querySelector("[data-square]"),
    ).toHaveAttribute("data-square", "h1");
  });

  it("oferece os três níveis, começando em Iniciante, e lembra a escolha (IN-15, IN-16)", async () => {
    renderApp();
    const level = screen.getByLabelText("Seu nível");
    expect(
      within(level)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Iniciante — explique sem jargão", "Intermediário", "Avançado"]);
    expect(level).toHaveValue("beginner");
    await userEvent.selectOptions(level, "Intermediário");
    expect(localStorage.getItem("analisador.level")).toBe("intermediate");
  });

  it("começa com Peças perdidas e Finais marcados e alterna os chips (IN-17)", async () => {
    renderApp();
    const pressed = (name: string) =>
      screen.getByRole("button", { name }).getAttribute("aria-pressed");
    expect(["Peças perdidas", "Finais", "Abertura", "Plano"].map(pressed)).toEqual([
      "true",
      "true",
      "false",
      "false",
    ]);
    await userEvent.click(screen.getByRole("button", { name: "Abertura" }));
    await userEvent.click(screen.getByRole("button", { name: "Finais" }));
    expect(["Peças perdidas", "Finais", "Abertura", "Plano"].map(pressed)).toEqual([
      "true",
      "false",
      "true",
      "false",
    ]);
  });
});

describe("tela Colar: começar a análise", () => {
  it("pede uma partida válida (IN-18)", () => {
    renderApp();
    expect(analyzeButton()).toBeDisabled();
    expect(screen.getByText("Cole uma partida válida")).toBeInTheDocument();
  });

  it("pede a cor quando a partida é válida (IN-19)", () => {
    renderApp();
    paste(referenceGameHtml);
    expect(analyzeButton()).toBeDisabled();
    expect(screen.getByText("Selecione com qual cor você jogou")).toBeInTheDocument();
  });

  it("mostra o progresso do motor e habilita sozinho quando ele fica pronto (IN-20)", async () => {
    const engine = renderApp();
    paste(referenceGameHtml);
    await userEvent.click(screen.getByRole("button", { name: "Pretas" }));
    engine.engineProgress(40);
    expect(screen.getByRole("button", { name: "Carregando o motor… 40%" })).toBeDisabled();
    engine.engineReady();
    expect(screen.getByRole("button", { name: "Analisar partida →" })).toBeEnabled();
  });

  it("explica quando o motor falhou (IN-21)", async () => {
    const engine = renderApp();
    paste(referenceGameHtml);
    await userEvent.click(screen.getByRole("button", { name: "Pretas" }));
    engine.engineFailed();
    expect(analyzeButton()).toBeDisabled();
    expect(screen.getByText("O motor não carregou. Tente de novo acima.")).toBeInTheDocument();
  });

  it("vai para Analisando e, ao cancelar, volta com texto e escolhas (IN-22, IN-23)", async () => {
    const engine = renderApp();
    engine.engineReady();
    paste(referenceGameHtml);
    await userEvent.click(screen.getByRole("button", { name: "Pretas" }));
    await userEvent.click(screen.getByRole("button", { name: "Plano" }));
    await userEvent.click(screen.getByRole("button", { name: "Analisar partida →" }));
    expect(screen.getByRole("heading", { name: "Analisando sua partida" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar análise" }));
    expect(screen.getByLabelText("Partida")).toHaveValue(referenceGameHtml);
    expect(screen.getByRole("button", { name: "Pretas" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Plano" })).toHaveAttribute("aria-pressed", "true");
  });

  it("mostra a estimativa e o aviso de privacidade (IN-24)", () => {
    renderApp();
    expect(
      screen.getByText("Leva cerca de 30 segundos. A partida fica só neste navegador."),
    ).toBeInTheDocument();
    paste("1.f3 e5 2.g4 Qh4#");
    expect(
      screen.getByText("Leva cerca de 5 segundos. A partida fica só neste navegador."),
    ).toBeInTheDocument();
  });
});
