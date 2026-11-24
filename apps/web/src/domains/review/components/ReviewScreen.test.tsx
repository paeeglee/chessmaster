import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createActor, createMachine, fromPromise } from "xstate";
import type { GameExplanation, MoveExplanation, QuestionAnswer } from "../../explanation";
import { referenceResult } from "../fixtures/referenceResult";
import {
  type AskInput,
  type ExplainInput,
  type MoveExplainInput,
  reviewMachine,
} from "../machines/reviewMachine";
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
  explainMove?: (args: { input: MoveExplainInput }) => Promise<MoveExplanation>;
  /** Ajusta o resultado do fixture antes de abrir a tela. */
  adjust?: (result: ReturnType<typeof referenceResult>) => ReturnType<typeof referenceResult>;
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
      explainMove: fromPromise<MoveExplanation, MoveExplainInput>(
        options.explainMove ??
          (async ({ input }) => ({ text: `Explicação do lance ${input.ply}.` })),
      ),
    },
  });
  const received: string[] = [];
  const events: { type: string; ply?: number }[] = [];
  const base = referenceResult(
    withExplanation ? { explanation } : { explanation: null, aiFailed: true },
  );
  const parent = createMachine({
    invoke: {
      id: "review",
      src: logic,
      input: options.adjust ? options.adjust(base) : base,
    },
    on: {
      "*": {
        actions: ({ event }) => {
          received.push(event.type);
          events.push(event as { type: string; ply?: number });
        },
      },
    },
  });
  const actor = createActor(parent).start();
  const review = actor.getSnapshot().children.review as Parameters<
    typeof ReviewScreen
  >[0]["reviewRef"];
  render(<ReviewScreen reviewRef={review} />);
  return { received, events };
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
    // Os dados dos motores continuam: tabuleiro, gráfico e lances.
    expect(screen.getByRole("region", { name: "Tabuleiro da partida" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Vantagem de material/ })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Lances" })).toBeInTheDocument();
    // Sem IA, os momentos usam os textos dos motores.
    expect(screen.getByText("Deixou o bispo em a1 ser capturado.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("heading", { name: explanation.verdict })).toBeInTheDocument();
    expect(screen.getByText("✓ IA: só explica, não calcula")).toBeInTheDocument();
  });

  it("o rodapé mostra a tabela de finais como não necessária quando não foi usada (TB-08)", () => {
    renderReview();
    expect(screen.getByText("– Tabela de finais (não necessária)")).toBeInTheDocument();
    expect(screen.queryByText(/✓ Tabela de finais/)).toBeNull();
  });

  it("o rodapé mostra a tabela de finais usada ou com falha (TB-08)", () => {
    renderReview({ adjust: (result) => ({ ...result, endgameStatus: "done" }) });
    expect(screen.getByText("✓ Tabela de finais")).toBeInTheDocument();
  });

  it("o rodapé avisa a falha da tabela de finais (TB-06)", () => {
    renderReview({ adjust: (result) => ({ ...result, endgameStatus: "failed" }) });
    expect(screen.getByText("✕ Tabela de finais: falhou")).toBeInTheDocument();
  });

  it("mostra o 4º cartão com os lances até o mate e o ideal (TB-07)", () => {
    renderReview({
      adjust: (result) => ({
        ...result,
        endgameStatus: "done",
        endgame: {
          kind: "KRK",
          position: 130,
          strongColor: "b",
          playerIsStrong: true,
          winner: "b",
          optimalMoves: 5,
          movesToMate: 7,
        },
      }),
    });
    expect(screen.getByText("7 lances")).toBeInTheDocument();
    expect(screen.getByText("para o mate de torre no final")).toBeInTheDocument();
    expect(screen.getByText("o mais rápido era 5")).toBeInTheDocument();
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

  it("pede o treino do momento aberto e de todos a partir do primeiro (RV-12)", async () => {
    const { events } = renderReview();
    await userEvent.click(screen.getByRole("button", { name: "Ver 43...Te6" }));
    await userEvent.click(screen.getByRole("button", { name: "Treinar este momento" }));
    await userEvent.click(screen.getByRole("button", { name: "Treinar os 5 momentos" }));
    expect(events).toEqual([
      { type: "TRAINING.REQUESTED", ply: 86 },
      { type: "TRAINING.REQUESTED", ply: 44 },
    ]);
  });

  it("clicar no círculo do gráfico abre o momento na lista (RV-08)", async () => {
    renderReview();
    await userEvent.click(screen.getByRole("button", { name: "Momento 4: 43...Te6" }));
    expect(screen.getByRole("button", { name: "Ver 43...Te6" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("clicar num momento-chave na lista de lances abre o momento (RV-10)", async () => {
    renderReview();
    const moves = screen.getByRole("region", { name: "Lances" });
    await userEvent.click(within(moves).getByRole("button", { name: "Te6??" }));
    expect(screen.getByRole("button", { name: "Ver 43...Te6" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Antes de 43...Te6?")).toBeInTheDocument();
  });

  it("com mais de 5 candidatos, oferece ver todos os lances anotados (R-07)", () => {
    renderReview({
      adjust: (result) => ({
        ...result,
        verdicts: result.verdicts.map((verdict) =>
          verdict.ply === 2 && result.keyMoments[0]
            ? { ...result.keyMoments[0], ply: 2, moveLabel: "1...d5" }
            : verdict,
        ),
      }),
    });
    expect(screen.getByRole("link", { name: "ver todos os lances anotados" })).toHaveAttribute(
      "href",
      "#lances",
    );
  });

  it("com 5 candidatos ou menos, não mostra o link", () => {
    renderReview();
    expect(screen.queryByRole("link", { name: "ver todos os lances anotados" })).toBeNull();
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

  it("pergunta fora da partida recebe o aviso e aponta as sugestões (R-11)", async () => {
    renderReview({
      answer: async () => ({
        answer: "Eu só falo sobre esta partida.",
        in_scope: false,
      }),
    });
    await userEvent.type(
      screen.getByLabelText("Pergunte à IA sobre esta partida"),
      "Qual a capital da França?",
    );
    await userEvent.click(screen.getByRole("button", { name: "Perguntar" }));
    expect(await screen.findByText("Eu só falo sobre esta partida.")).toBeInTheDocument();
    expect(screen.getByText("Experimente uma das sugestões acima.")).toBeInTheDocument();
  });

  it("pergunta dentro da partida não mostra o aviso", async () => {
    renderReview();
    await userEvent.click(screen.getByRole("button", { name: "Por que 12...Bxa1 foi bom?" }));
    expect(await screen.findByText("Porque ganhou a torre.")).toBeInTheDocument();
    expect(screen.queryByText("Experimente uma das sugestões acima.")).toBeNull();
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
