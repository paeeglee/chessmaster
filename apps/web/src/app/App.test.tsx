import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("mostra a marca do produto no cabeçalho", () => {
    render(<App />);
    expect(screen.getByRole("banner")).toHaveTextContent("Analisador de partidas");
  });
});
