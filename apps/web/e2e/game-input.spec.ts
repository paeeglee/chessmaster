import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";

const referenceGame = readFileSync(
  join(import.meta.dirname, "../src/domains/game/fixtures/reference-game.chesscom.html"),
  "utf8",
);

async function paste(page: Page, text: string) {
  await page.getByLabel("Partida").fill(text);
}

test.describe("tela Colar a partida (step_01)", () => {
  test("reconhece a partida de referência em até 1 s", async ({ page }) => {
    await page.goto("/");
    const started = Date.now();
    await paste(page, referenceGame);
    await expect(page.getByText("144 lances, todos legais")).toBeVisible();
    await expect(page.getByText("Resultado 0-1, por xeque-mate")).toBeVisible();
    await expect(page.getByRole("img", { name: /Posição final: rei branco em a8/ })).toBeVisible();
    expect(Date.now() - started).toBeLessThan(1000);
  });

  test("texto sem lances e PGN ficam como formato não reconhecido", async ({ page }) => {
    await page.goto("/");
    await paste(page, "isto não é uma partida");
    await expect(page.getByText("Não reconhecemos este texto como uma partida")).toBeVisible();
    await expect(page.getByRole("button", { name: /Analisar partida/ })).toBeDisabled();
    await paste(page, '[Event "Live Chess"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 1-0');
    await expect(page.getByText("Não reconhecemos este texto como uma partida")).toBeVisible();
    await expect(page.getByText("HTML do Chess.com")).toBeVisible();
    await expect(page.getByText("Lista de lances (1.d4 d5 …)")).toBeVisible();
  });

  test("sem cor, nada vem marcado e o botão pede a cor; Pretas gira a miniatura", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Motor pronto")).toBeVisible({ timeout: 90_000 });
    await paste(page, referenceGame);
    await expect(page.getByRole("button", { name: "Brancas" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(page.getByRole("button", { name: "Pretas" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(page.getByRole("button", { name: "Analisar partida →" })).toBeDisabled();
    await expect(page.getByText("Selecione com qual cor você jogou")).toBeVisible();
    await page.getByRole("button", { name: "Pretas" }).click();
    await expect(page.getByRole("button", { name: "Pretas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const firstSquare = page
      .getByRole("img", { name: /Posição final/ })
      .locator("[data-square]")
      .first();
    await expect(firstSquare).toHaveAttribute("data-square", "h1");
    await expect(page.getByRole("button", { name: "Analisar partida →" })).toBeEnabled();
  });

  test("analisar leva à tela Analisando e cancelar volta com tudo preservado", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Motor pronto")).toBeVisible({ timeout: 90_000 });
    await paste(page, referenceGame);
    await page.getByRole("button", { name: "Pretas" }).click();
    await page.getByRole("button", { name: "Analisar partida →" }).click();
    await expect(page.getByRole("heading", { name: "Analisando sua partida" })).toBeVisible();
    await page.getByRole("button", { name: "Cancelar análise" }).click();
    await expect(page.getByLabel("Partida")).toHaveValue(referenceGame);
    await expect(page.getByRole("button", { name: "Pretas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("lembra o nível escolhido e não lembra a cor", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Seu nível").selectOption({ label: "Intermediário" });
    await page.getByRole("button", { name: "Pretas" }).click();
    await page.reload();
    await expect(page.getByLabel("Seu nível")).toHaveValue("intermediate");
    await expect(page.getByRole("button", { name: "Pretas" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("dá para colar e escolher enquanto o motor carrega", async ({ page }) => {
    // Atrasa o .wasm para observar o estado de carregamento.
    await page.route(/stockfish-19\.0\.1-mt\.wasm$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto("/");
    await paste(page, referenceGame);
    await page.getByRole("button", { name: "Pretas" }).click();
    await expect(page.getByRole("button", { name: /Carregando o motor… \d+%/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Analisar partida →" })).toBeEnabled({
      timeout: 90_000,
    });
  });
});
