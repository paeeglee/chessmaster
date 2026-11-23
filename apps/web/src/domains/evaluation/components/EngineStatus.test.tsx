import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EngineStatus } from "./EngineStatus";

describe("EngineStatus (EVAL-10)", () => {
  it("mostra a porcentagem enquanto carrega", () => {
    render(<EngineStatus status="loading" percent={40} onRetry={() => {}} />);
    expect(screen.getByText("Carregando o motor de análise… 40%")).toBeInTheDocument();
  });

  it("mostra Motor pronto", () => {
    render(<EngineStatus status="ready" percent={100} onRetry={() => {}} />);
    expect(screen.getByText("Motor pronto")).toBeInTheDocument();
  });

  it("mostra a falha e oferece tentar de novo", async () => {
    const onRetry = vi.fn();
    render(<EngineStatus status="failed" percent={70} onRetry={onRetry} />);
    expect(screen.getByText("Não foi possível carregar o motor")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("anuncia as mudanças para leitores de tela", () => {
    const { container } = render(<EngineStatus status="loading" percent={0} onRetry={() => {}} />);
    expect(container.firstElementChild).toHaveAttribute("aria-live", "polite");
  });
});
