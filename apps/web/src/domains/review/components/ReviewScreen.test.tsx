import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createActor, createMachine, fromPromise } from "xstate";
import type { GameExplanation, QuestionAnswer } from "../../explanation";
import { referenceResult } from "../fixtures/referenceResult";
import { type AskInput, type ExplainInput, reviewMachine } from "../machines/reviewMachine";
import { ReviewScreen } from "./ReviewScreen";

const explanation: GameExplanation = {
  verdict: "Vitória. A vantagem começou em 12...Bxa1.",
  patterns_sentence: "Padrões: deixar uma peça atacada no lugar.",
  key_moments: [
    {
      ply: 44,
      summary: "22...Ta7 deixou o bispo em a1.",
      explanation: "O bispo em a1 já estava atacado.",
    },
  ],
  strengths: [{ ply: 24, text: "12...Bxa1 ganhou a torre em a1." }],
  next_game_habit: "Antes de cada lance, confira quais das suas peças estão atacadas.",
};

type Options = {
  withExplanation?: boolean;
  answer?: () => Promise<QuestionAnswer>;
  explain?: () => Promise<GameExplanation>;
};

function renderReview(options: Options = {}) {
  const withExplanation = options.withExplanation ?? true;
  const logic = reviewMachine.provide({
    actors: {
      askQuestion: fromPromise<QuestionAnswer, AskInput>(
        options.answer ?? (async () => ({ answer: "Porque ganhou a torre.", in_scope: true })),
      ),
      explainGame: fromPromise<GameExplanation, ExplainInput>(
        options.explain ?? (async () => explanation),
      ),
    },
  });
  const received: string[] = [];
  const parent = createMachine({
    invoke: {
      id: "review",
      src: logic,
      input: referenceResult(
        withExplanation ? { explanation } : { explanation: null, aiFailed: true },
      ),
    },
    on: { "*": { actions: ({ event }) => received.push(event.type) } },
  });
  const actor = createActor(parent).start();
  const review = actor.getSnapshot().children.review as Parameters<
    typeof ReviewScreen
  >[0]["reviewRef"];
  render(<ReviewScreen reviewRef={review} />);
  return { received };
}

describe("resumo (RV-01, RV-02)", () => {
  it("mostra resultado, contexto, manchete, padrões e cartões", () => {
    renderReview();
    const band = screen.getByRole("region", { name: "Resumo da partida" });
    expect(within(band).getByText("Vitória · 0-1")).toBeInTheDocument();
    expect(within(band).getByText("Você: pretas · 72 lances · xeque-mate")).toBeInTheDocument();
    expect(within(band).getByRole("heading", { level: 1 })).toHaveTextContent(explanation.verdict);
    expect(within(band).getByText(explanation.patterns_sentence)).toBeInTheDocument();
    expect(
      screen.getByText("momentos em que você perdeu material").previousSibling,
    ).toHaveTextContent("5");
    expect(screen.getByText("seu melhor lance").previousSibling).toHaveTextContent("12...Bxa1!");
  });
});

describe("IA indisponível (RV-03)", () => {
  it("avisa, esconde hábito e perguntas, e tenta de novo", async () => {
    renderReview({ withExplanation: false });
    expect(
      screen.getByRole("heading", { name: "A explicação não pôde ser gerada." }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Hábito para a próxima partida")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Pergunte à IA sobre esta partida")).not.toBeInTheDocument();
    expect(screen.getByText("✕ IA: falhou")).toBeInTheDocument();
    // Sem IA, os momentos usam os textos dos motores.
    expect(screen.getByText("Deixou o bispo em a1 ser capturado.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("heading", { name: explanation.verdict })).toBeInTheDocument();
    expect(screen.getByText("✓ IA: só explica, não calcula")).toBeInTheDocument();
  });
});

describe("momentos-chave (RV-11, RV-12, RV-13)", () => {
  it("lista os cinco em ordem, com tipo, e o primeiro expandido", () => {
    renderReview();
    const list = screen.getByRole("region", { name: "Momentos-chave" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => item.textContent?.match(/^\d+\.\.\.T[a-h]\d\?+/)?.[0])).toEqual([
      "22...Ta7?",
      "27...Tb7?",
      "41...Ta1?",
      "43...Te6??",
      "56...Ta8??",
    ]);
    expect(within(items[0] as HTMLElement).getByText("Peça atacada")).toBeInTheDocument();
    expect(within(list).getByRole("button", { name: "Ver 22...Ta7" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(within(list).getByText("O bispo em a1 já estava atacado.")).toBeInTheDocument();
    expect(within(list).getByText("Melhor: 22...Bd4+")).toBeInTheDocument();
    expect(within(list).getByText("Vantagem: +9 → +6")).toBeInTheDocument();
  });

  it("abrir outro momento fecha o anterior e move o tabuleiro", async () => {
    renderReview();
    await userEvent.click(screen.getByRole("button", { name: "Ver 27...Tb7" }));
    expect(screen.getByRole("button", { name: "Ver 27...Tb7" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: "Ver 22...Ta7" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByText("Antes de 27...Tb7?")).toBeInTheDocument();
  });

  it("pede o treino do momento e de todos a partir do primeiro", async () => {
    const { received } = renderReview();
    await userEvent.click(screen.getByRole("button", { name: "Treinar este momento" }));
    await userEvent.click(screen.getByRole("button", { name: "Treinar os 5 momentos" }));
    expect(received).toEqual(["TRAINING.REQUESTED", "TRAINING.REQUESTED"]);
  });

  it("mostra a linha do motor no tabuleiro", async () => {
    renderReview();
    await userEvent.click(screen.getByRole("button", { name: "Ver a linha no tabuleiro" }));
    expect(screen.getByText(/Depois de 22\.\.\.Ta7|Linha do motor/)).toBeInTheDocument();
  });
});

describe("pontos fortes e hábito (RV-14, RV-15)", () => {
  it("usa os textos da IA", () => {
    renderReview();
    expect(screen.getByText("12...Bxa1 ganhou a torre em a1.")).toBeInTheDocument();
    expect(screen.getByText(explanation.next_game_habit)).toBeInTheDocument();
  });

  it("sem IA, usa o texto dos motores", () => {
    renderReview({ withExplanation: false });
    const strengths = screen.getByRole("region", { name: "O que você fez bem" });
    expect(strengths).toHaveTextContent("12...Bxa1! — ganhou a torre em a1.");
  });
});

describe("Pergunte à IA (RV-16, RV-17)", () => {
  it("pergunta por um chip e mostra a resposta", async () => {
    let finish: (answer: QuestionAnswer) => void = () => {};
    renderReview({
      answer: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    });
    await userEvent.click(screen.getByRole("button", { name: "Por que 12...Bxa1 foi bom?" }));
    expect(screen.getByText("Pensando…")).toBeInTheDocument();
    await act(async () => finish({ answer: "Porque ganhou a torre.", in_scope: true }));
    expect(screen.getByText("Porque ganhou a torre.")).toBeInTheDocument();
  });

  it("pergunta pelo campo", async () => {
    renderReview();
    await userEvent.type(
      screen.getByLabelText("Pergunte à IA sobre esta partida"),
      "E o lance 41?",
    );
    await userEvent.click(screen.getByRole("button", { name: "Perguntar" }));
    expect(await screen.findByText("Porque ganhou a torre.")).toBeInTheDocument();
    expect(screen.getByText("E o lance 41?")).toBeInTheDocument();
  });

  it("avisa quando não conseguiu responder", async () => {
    renderReview({
      answer: async () => {
        throw new Error("503");
      },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Qual padrão de erro mais se repetiu?" }),
    );
    expect(
      await screen.findByText("Não foi possível responder agora. Tente de novo."),
    ).toBeInTheDocument();
  });
});

describe("rodapé e nova análise (RV-18, RV-19)", () => {
  it("lista os motores usados", () => {
    renderReview();
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("Motores usados");
    expect(footer).toHaveTextContent("✓ Regras");
    expect(footer).toHaveTextContent("✓ Avaliação");
  });

  it("pede confirmação antes de descartar a análise", async () => {
    const { received } = renderReview();
    await userEvent.click(screen.getByRole("button", { name: "Analisar outra partida" }));
    expect(
      screen.getByRole("alertdialog", { name: "Analisar outra partida?" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Continuar aqui" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(received).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Analisar outra partida" }));
    await userEvent.click(screen.getByRole("button", { name: "Descartar e analisar outra" }));
    expect(received).toEqual(["REVIEW.NEW_GAME"]);
  });
});
