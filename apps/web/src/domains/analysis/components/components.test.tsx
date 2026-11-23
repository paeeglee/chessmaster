import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Finding } from "../model/findings";
import { AnalysisStages, type Stage } from "./AnalysisStages";
import { FindingsSoFar } from "./FindingsSoFar";

const STAGES: Stage[] = [
  { title: "Leitura dos lances", description: "Extrai os 144 lances", status: "done" },
  { title: "Motor de regras", description: "Reconstrói", status: "done" },
  {
    title: "Motor de avaliação",
    description: "Calcula",
    status: "running",
    detail: "lance 44 de 72 · ~12 s restantes",
    progress: 60,
  },
  { title: "Tabela de finais", description: "Resultado exato", status: "skipped" },
  { title: "Explicação da IA", description: "Transforma", status: "waiting" },
];

describe("AnalysisStages (AS-09, AS-10)", () => {
  it("lista as cinco etapas em ordem, com o estado de cada uma", () => {
    render(<AnalysisStages stages={STAGES} />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Leitura dos lances — concluída"),
      expect.stringContaining("Motor de regras — concluída"),
      expect.stringContaining("Motor de avaliação — em andamento"),
      expect.stringContaining("Tabela de finais — não necessária"),
      expect.stringContaining("Explicação da IA — aguardando"),
    ]);
  });

  it("mostra o progresso real e o tempo restante da etapa 3", () => {
    render(<AnalysisStages stages={STAGES} />);
    const bar = screen.getByRole("progressbar", { name: "Motor de avaliação" });
    expect(bar).toHaveAttribute("aria-valuenow", "60");
    expect(screen.getByText("lance 44 de 72 · ~12 s restantes")).toBeInTheDocument();
  });

  it("oferece tentar de novo numa etapa que falhou (AS-07)", async () => {
    const onRetry = vi.fn();
    const failed = STAGES.map((stage) =>
      stage.title === "Motor de avaliação"
        ? { ...stage, status: "failed" as const, onRetry }
        : stage,
    );
    render(<AnalysisStages stages={failed} />);
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("FindingsSoFar (AS-12)", () => {
  const finding = (ply: number, tag: Finding["tag"] = "Erro"): Finding => ({
    ply,
    tag,
    moveLabel: `${ply}?`,
    text: `achado ${ply}`,
  });

  it("mostra tag, lance e texto de cada achado", () => {
    render(<FindingsSoFar findings={[finding(23, "Adversário"), finding(44)]} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Adversário23? achado 23");
    expect(items[1]).toHaveTextContent("Erro44? achado 44");
  });

  it("mostra no máximo 6 achados", () => {
    render(<FindingsSoFar findings={[1, 2, 3, 4, 5, 6, 7, 8].map((ply) => finding(ply))} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });

  it("avisa quando ainda não há achados", () => {
    render(<FindingsSoFar findings={[]} />);
    expect(screen.getByText("Nada por enquanto.")).toBeInTheDocument();
  });
});
