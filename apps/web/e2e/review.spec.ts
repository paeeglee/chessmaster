import { expect, test } from "@playwright/test";
import { analyzeReferenceGame, STABLE_MOMENTS } from "./reference";

test.describe("resultado da análise (step_03)", () => {
  test.setTimeout(180_000);

  test("mostra o resultado da partida de referência e leva ao treino", async ({ page }) => {
    await analyzeReferenceGame(page);
    const summary = page.getByRole("region", { name: "Resumo da partida" });
    const board = page.getByRole("region", { name: "Tabuleiro da partida" });
    const moments = page.getByRole("region", { name: "Momentos-chave" });

    await test.step("resumo e momentos-chave em ordem (R-01, R-07)", async () => {
      await expect(summary.getByText("Vitória · 0-1")).toBeVisible();
      await expect(summary.getByText("Você: pretas · 72 lances · xeque-mate")).toBeVisible();
      const texts = await moments.getByRole("listitem").allTextContents();
      const found = STABLE_MOMENTS.map((label) => texts.findIndex((text) => text.includes(label)));
      expect(found.every((index) => index >= 0)).toBe(true);
      expect([...found].sort((a, b) => a - b)).toEqual(found);
    });

    await test.step("o tabuleiro abre antes de 22...Ta7, com as pretas embaixo (R-02)", async () => {
      await expect(board.getByText("Antes de 22...Ta7?")).toBeVisible();
      await expect(board.getByText("Pretas jogam")).toBeVisible();
      // Com as pretas embaixo, a primeira casa desenhada é h1 e a última é a8.
      const squares = board.locator("[data-square]");
      await expect(squares.first()).toHaveAttribute("data-square", "h1");
      await expect(squares.last()).toHaveAttribute("data-square", "a8");
      await expect(board.locator('[data-square="a1"]')).toHaveAttribute("data-mark", "red");
    });

    await test.step("o círculo do gráfico leva ao momento de 43...Te6 (R-06)", async () => {
      await page.getByRole("button", { name: /^Momento \d: 43\.\.\.Te6$/ }).click();
      await expect(board.getByText("Antes de 43...Te6?")).toBeVisible();
      await expect(page.getByRole("button", { name: "Ver 43...Te6" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await expect(
        page.getByRole("region", { name: "Lances" }).locator('[aria-current="true"]'),
      ).toHaveText("Te6??");
    });

    await test.step("Pergunte à IA responde com fatos dos motores (R-11)", async () => {
      await page.getByLabel("Pergunte à IA sobre esta partida").fill("Onde eu errei?");
      await page.getByRole("button", { name: "Perguntar" }).click();
      await expect(page.getByText("Onde eu errei?")).toBeVisible();
      await expect(
        page.getByText(/^Pelos motores, os momentos-chave desta partida foram 22\.\.\.Ta7/),
      ).toBeVisible({ timeout: 30_000 });
    });

    await test.step("Treinar abre a tela de treino (R-12)", async () => {
      await page.getByRole("button", { name: /^Treinar os \d momentos/ }).click();
      await expect(page.getByRole("button", { name: "← Voltar ao resultado" })).toBeVisible();
    });
  });
});
