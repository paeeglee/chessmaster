import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createActor, fromCallback, fromPromise } from "xstate";
import type { EngineClient, PositionEvaluation } from "../../evaluation";
import type { GameExplanation } from "../../explanation";
import { parseGameText, replayGame } from "../../game";
import referenceGameHtml from "../../game/fixtures/reference-game.chesscom.html?raw";
import type { AnalysisRequest } from "../../game-input";
import referenceEvaluations from "../fixtures/reference-game.evaluations.json";
import { analysisMachine } from "../machines/analysisMachine";
import type { AnalysisSummary } from "../model/summary";
import { AnalyzingScreen } from "./AnalyzingScreen";

const evaluations = referenceEvaluations as PositionEvaluation[];

function referenceRequest() {
  const parsed = parseGameText(referenceGameHtml);
  if (parsed.kind !== "parsed") throw new Error("partida inválida");
  const replayed = replayGame(parsed.game);
  if (replayed.kind !== "legal") throw new Error("lance ilegal");
  return {
    game: replayed.game,
    playerColor: "b" as const,
    level: "beginner" as const,
    priorities: [],
  };
}

type Send = (event: { type: string; evaluation?: PositionEvaluation }) => void;

function startAnalysis() {
  const control: { send: Send } = { send: () => {} };
  const machine = analysisMachine.provide({
    actors: {
      evaluatePositions: fromCallback(({ sendBack }) => {
        control.send = sendBack as Send;
      }),
      explainGame: fromPromise<
        GameExplanation,
        { request: AnalysisRequest; summary: AnalysisSummary }
      >(() => new Promise<GameExplanation>(() => {})),
    },
  });
  const actor = createActor(machine, {
    input: { request: referenceRequest(), engine: {} as EngineClient },
  }).start();
  const evaluateUpTo = (count: number) =>
    act(() => {
      for (const evaluation of evaluations.slice(
        actor.getSnapshot().context.evaluations.length,
        count,
      )) {
        control.send({ type: "POSITION.EVALUATED", evaluation });
      }
    });
  return { actor, control, evaluateUpTo };
}

/** Item da lista de etapas pelo nome (o estado vem logo depois, para leitores de tela). */
function stage(name: string): HTMLElement {
  const item = screen
    .getAllByRole("listitem")
    .find((element) => element.textContent?.includes(`${name} —`));
  if (!item) throw new Error(`etapa ${name} não encontrada`);
  return item;
}

describe("AnalyzingScreen", () => {
  it("mostra o passo 2, o título e as cinco etapas (AS-09)", () => {
    const { actor } = startAnalysis();
    render(<AnalyzingScreen analysisRef={actor} onCancel={() => {}} />);
    expect(screen.getByRole("heading", { name: "Analisando sua partida…" })).toBeInTheDocument();
    expect(screen.getByText("Analisar").closest("[aria-current]")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(stage("Leitura dos lances")).toHaveTextContent("Leitura dos lances — concluída");
    expect(stage("Motor de regras")).toHaveTextContent("Motor de regras — concluída");
    expect(stage("Motor de avaliação")).toHaveTextContent("Motor de avaliação — em andamento");
    expect(stage("Tabela de finais")).toHaveTextContent("Tabela de finais — aguardando");
    expect(stage("Explicação da IA")).toHaveTextContent("Explicação da IA — aguardando");
    const order = screen
      .getAllByRole("listitem")
      .map((element) => element.textContent ?? "")
      .filter((text) => text.includes(" — "))
      .map((text) => text.replace(/^\d|^✓|^!/, "").split(" — ")[0]);
    expect(order).toEqual([
      "Leitura dos lances",
      "Motor de regras",
      "Motor de avaliação",
      "Tabela de finais",
      "Explicação da IA",
    ]);
    expect(screen.getByText("Extrai os 144 lances do texto colado")).toBeInTheDocument();
  });

  it("acompanha o progresso real, o tabuleiro e o último lance (AS-10, AS-11)", async () => {
    const { actor, evaluateUpTo } = startAnalysis();
    render(<AnalyzingScreen analysisRef={actor} onCancel={() => {}} />);
    await evaluateUpTo(88);
    const bar = screen.getByRole("progressbar", { name: "Motor de avaliação" });
    expect(bar).toHaveAttribute("aria-valuenow", String(Math.floor((88 / 145) * 100)));
    expect(screen.getByText(/^lance 44 de 72/)).toBeInTheDocument();
    expect(screen.getByText("Lance 44 de 72")).toBeInTheDocument();
    expect(screen.getByText("44.Cd4")).toBeInTheDocument();
    const board = screen.getByRole("img", { name: /Posição em análise/ });
    expect(board.querySelector("[data-square]")).toHaveAttribute("data-square", "h1");
  });

  it("lista os achados à medida que o motor confirma (AS-12)", async () => {
    const { actor, evaluateUpTo } = startAnalysis();
    render(<AnalyzingScreen analysisRef={actor} onCancel={() => {}} />);
    expect(screen.getByText("Nada por enquanto.")).toBeInTheDocument();
    await evaluateUpTo(45);
    expect(screen.getByText("12.Ce2?")).toBeInTheDocument();
    expect(screen.getByText("22...Ta7?")).toBeInTheDocument();
    expect(screen.getByText("deixou o bispo em a1 ser capturado")).toBeInTheDocument();
  });

  it("depois de avaliar, a tabela de finais fica não necessária e a IA em andamento", async () => {
    const { actor, control, evaluateUpTo } = startAnalysis();
    render(<AnalyzingScreen analysisRef={actor} onCancel={() => {}} />);
    await evaluateUpTo(145);
    act(() => control.send({ type: "EVALUATION.DONE" }));
    expect(stage("Tabela de finais")).toHaveTextContent("Tabela de finais — não necessária");
    expect(stage("Explicação da IA")).toHaveTextContent("Explicação da IA — em andamento");
    expect(screen.getByText("Etapa 5 de 5: explicação da IA.")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("mostra a falha do motor e tenta de novo (AS-07)", async () => {
    const { actor, control } = startAnalysis();
    render(<AnalyzingScreen analysisRef={actor} onCancel={() => {}} />);
    act(() => control.send({ type: "EVALUATION.FAILED" }));
    expect(stage("Motor de avaliação")).toHaveTextContent("Motor de avaliação — falhou");
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(stage("Motor de avaliação")).toHaveTextContent("Motor de avaliação — em andamento");
  });

  it("cancela a análise (AS-08)", async () => {
    const { actor } = startAnalysis();
    const onCancel = vi.fn();
    render(<AnalyzingScreen analysisRef={actor} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar análise" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
