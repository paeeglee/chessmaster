import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fromCallback } from "xstate";
import { engineLoaderMachine } from "../domains/evaluation";
import { server } from "../shared/lib/testing/server";
import { App } from "./App";
import { appMachine } from "./appMachine";

function appWithEngine(outcome: "ENGINE.FAILED" | { type: "ENGINE.PROGRESS"; percent: number }) {
  return appMachine.provide({
    actors: {
      engineLoader: engineLoaderMachine.provide({
        actors: {
          loadEngine: fromCallback(({ sendBack }) => {
            sendBack(outcome === "ENGINE.FAILED" ? { type: "ENGINE.FAILED" } : outcome);
          }),
        },
      }),
    },
  });
}

describe("App", () => {
  it("mostra a marca do produto no cabeçalho", () => {
    render(<App />);
    const banner = screen.getByRole("banner");
    expect(within(banner).getByText("Analisador de partidas")).toBeInTheDocument();
    expect(
      within(banner).getByText("Entenda seus erros e treine a partir deles"),
    ).toBeInTheDocument();
  });

  it("não mostra 'Minhas partidas', que está fora do MVP (D2)", () => {
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Seções" });
    expect(within(nav).getByRole("link", { name: "Analisar partida" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).queryByText("Minhas partidas")).not.toBeInTheDocument();
  });

  it("mostra a tela atual da máquina raiz, sem depender do backend", async () => {
    const requests: string[] = [];
    const recordRequest = ({ request }: { request: Request }) => {
      requests.push(request.url);
    };
    server.events.on("request:start", recordRequest);
    try {
      render(<App />);
      expect(screen.getByRole("heading", { level: 1, name: "Analise sua partida" })).toBeVisible();
      // Dá tempo para efeitos assíncronos dispararem requisições.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(requests).toEqual([]);
    } finally {
      server.events.removeListener("request:start", recordRequest);
    }
  });

  it("usa os tokens do tema em vez de cores literais", () => {
    const dir = join(import.meta.dirname);
    const components = readdirSync(dir).filter(
      (file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"),
    );
    // Cores, fontes, raios e sombras vêm do tema (theme.css), nunca de valores soltos.
    const literalToken =
      /#[0-9a-fA-F]{3,8}\b|rgba?\(|Iowan|Palatino|system-ui|ui-monospace|(?:shadow|rounded|font)-\[/;
    for (const file of components) {
      const source = readFileSync(join(dir, file), "utf8");
      expect(source, file).not.toMatch(literalToken);
    }
  });

  it("mostra o progresso do motor ao abrir a página (EVAL-05, EVAL-06)", () => {
    render(<App logic={appWithEngine({ type: "ENGINE.PROGRESS", percent: 40 })} />);
    expect(screen.getByText("Carregando o motor de análise… 40%")).toBeInTheDocument();
  });

  it("deixa tentar de novo quando o motor falha (EVAL-09, EVAL-10)", () => {
    render(<App logic={appWithEngine("ENGINE.FAILED")} />);
    expect(screen.getByText("Não foi possível carregar o motor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });
});
