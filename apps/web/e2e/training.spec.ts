import { expect, type Page, test } from "@playwright/test";
import { analyzeReferenceGame } from "./reference";

const square = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`^${name},`) });

async function openTraining(page: Page) {
  await analyzeReferenceGame(page);
  await page.getByRole("button", { name: /^Treinar os \d momentos/ }).click();
  await expect(page.getByText(/^Momento 1 de \d$/)).toBeVisible();
  const board = page.getByRole("group", {
    name: "Posição antes de 22...Ta7, vista pelas pretas. O bispo em a1 está destacado.",
  });
  await expect(board).toBeVisible();
  // Pretas embaixo: a primeira casa desenhada é h1 e a última é a8; vez das pretas.
  await expect(board.locator("[data-square]").first()).toHaveAttribute("data-square", "h1");
  await expect(board.locator("[data-square]").last()).toHaveAttribute("data-square", "a8");
  await expect(page.getByText("Pretas jogam (você)")).toBeVisible();
}

test.describe("treino do momento-chave (step_04)", () => {
  test.setTimeout(180_000);

  test("22...Te6 é refutado e 22...Bb2 é aceito, com o motor de verdade", async ({ page }) => {
    await openTraining(page);
    await expect(page.getByText("Encontre o lance · tipo: peça atacada")).toBeVisible();

    await square(page, "e8").click();
    await square(page, "e6").click();
    const status = page.getByRole("status");
    await expect(status.getByText("Tentativa 1")).toBeVisible({ timeout: 30_000 });
    await expect(status.getByText("22...Te6 ainda perde o bispo")).toBeVisible();
    await expect(
      status.getByText(/^Depois de 23\.Txa1, o bispo some do tabuleiro\.$/),
    ).toBeVisible();
    // Sem revelar a solução (step_04 §7).
    await expect(status).not.toContainText("Bd4");

    await page.getByRole("button", { name: "Desfazer" }).click();
    await expect(square(page, "a1")).toHaveAccessibleName("a1, bispo preto");

    await square(page, "a1").click();
    await square(page, "b2").click();
    await expect(page.getByText("22...Bb2 resolve o problema.")).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText("Antes de cada lance, confira quais peças suas estão atacadas."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Próximo momento →" }).click();
    await expect(page.getByText(/^Momento 2 de \d$/)).toBeVisible();
  });

  test("joga 22...Bd4+ pelo teclado e volta ao resultado", async ({ page }) => {
    await openTraining(page);
    await square(page, "a1").focus();
    await page.keyboard.press("Enter");
    await square(page, "d4").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("22...Bd4+ resolve o problema.")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "← Voltar ao resultado" }).click();
    await expect(page.getByRole("region", { name: "Resumo da partida" })).toBeVisible();
  });
});
