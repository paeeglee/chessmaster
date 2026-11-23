import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Board, readPlacement, squareLabel } from "./Board";

const FINAL = "K7/2k5/r7/1p6/1p6/8/8/8 w - - 0 73";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function squaresInOrder(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll("[data-square]"),
    (el) => el.getAttribute("data-square") ?? "",
  );
}

describe("readPlacement", () => {
  it("lê as fileiras do FEN", () => {
    const rows = readPlacement(FINAL);
    expect(rows[0]).toEqual(["K", "", "", "", "", "", "", ""]);
    expect(rows[2]?.[0]).toBe("r");
    expect(rows).toHaveLength(8);
  });
});

describe("Board", () => {
  it("expõe a descrição da posição como imagem", () => {
    render(<Board fen={START} orientation="w" label="Posição inicial" />);
    expect(screen.getByRole("img", { name: "Posição inicial" })).toBeInTheDocument();
  });

  it("com as brancas embaixo, começa em a8 e termina em h1", () => {
    const { container } = render(<Board fen={START} orientation="w" label="x" />);
    const order = squaresInOrder(container);
    expect(order[0]).toBe("a8");
    expect(order[63]).toBe("h1");
  });

  it("com as pretas embaixo, começa em h1 e termina em a8 (IN-14)", () => {
    const { container } = render(<Board fen={START} orientation="b" label="x" />);
    const order = squaresInOrder(container);
    expect(order[0]).toBe("h1");
    expect(order[63]).toBe("a8");
  });

  it("desenha as peças com glifos e as marcações com as cores do tema", () => {
    const { container } = render(
      <Board fen={FINAL} orientation="b" marks={{ a8: "red", a6: "last" }} label="x" />,
    );
    const a8 = container.querySelector('[data-square="a8"]');
    const a6 = container.querySelector('[data-square="a6"]');
    expect(a8?.textContent).toBe("♚︎");
    expect(a8?.className).toContain("bg-board-red-light");
    expect(a6?.className).toContain("bg-board-last-light");
    expect(container.querySelector('[data-square="a7"]')?.className).toContain("bg-board-dark");
    expect(a6?.querySelector("span")?.className).toContain("text-piece-black");
    expect(a8?.querySelector("span")?.className).toContain("text-piece-white");
  });

  it("mostra coordenadas só quando pedido", () => {
    const { container, rerender } = render(<Board fen={START} orientation="w" label="x" />);
    expect(container.querySelector('[data-square="a1"]')?.textContent).toBe("♜︎");
    rerender(<Board fen={START} orientation="w" coordinates label="x" />);
    expect(container.querySelector('[data-square="a1"]')?.textContent).toBe("♜︎1a");
  });
});

describe("Board interativo", () => {
  it("vira um grupo de casas clicáveis com nomes acessíveis", async () => {
    const onSquareClick = vi.fn();
    render(
      <Board
        fen={START}
        orientation="w"
        label="Posição do treino"
        onSquareClick={onSquareClick}
        marks={{ g1: "selected" }}
        destinations={["f3", "h3"]}
      />,
    );
    const group = screen.getByRole("group", { name: "Posição do treino" });
    expect(group.querySelectorAll("button")).toHaveLength(64);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "g1, cavalo branco" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "f3, vazia" }));
    expect(onSquareClick).toHaveBeenCalledWith("f3");
  });

  it("joga pelo teclado: Tab até a casa e Enter (§8)", async () => {
    const onSquareClick = vi.fn();
    render(<Board fen={START} orientation="w" label="Treino" onSquareClick={onSquareClick} />);
    screen.getByRole("button", { name: "e2, peão branco" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onSquareClick).toHaveBeenCalledWith("e2");
  });

  it("bloqueia as casas quando desabilitado", async () => {
    const onSquareClick = vi.fn();
    render(
      <Board fen={START} orientation="w" label="Treino" onSquareClick={onSquareClick} disabled />,
    );
    await userEvent.click(screen.getByRole("button", { name: "e2, peão branco" }));
    expect(onSquareClick).not.toHaveBeenCalled();
  });

  it("nomeia peças com o gênero certo", () => {
    expect(squareLabel("d8", "q")).toBe("d8, dama preta");
    expect(squareLabel("a1", "R")).toBe("a1, torre branca");
    expect(squareLabel("e1", "K")).toBe("e1, rei branco");
    expect(squareLabel("e4", "")).toBe("e4, vazia");
  });
});
