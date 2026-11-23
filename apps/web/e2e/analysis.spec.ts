import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";

const referenceGame = readFileSync(
  join(import.meta.dirname, "../src/domains/game/fixtures/reference-game.chesscom.html"),
  "utf8",
);

async function startReferenceAnalysis(page: Page) {
  await page.goto("/");
  await expect(page.getByText("Motor pronto")).toBeVisible({ timeout: 90_000 });
  await page.getByLabel("Partida").fill(referenceGame);
  await page.getByRole("button", { name: "Pretas" }).click();
  await page.getByRole("button", { name: "Analisar partida →" }).click();
  await expect(page.getByRole("heading", { name: "Analisando sua partida…" })).toBeVisible();
}

test.describe("análise da partida (step_02)", () => {
  test.setTimeout(180_000);

  test("analisa a partida de referência e abre o resultado com os momentos-chave", async ({
    page,
  }) => {
    await startReferenceAnalysis(page);
    await expect(page.getByRole("progressbar", { name: "Motor de avaliação" })).toBeVisible();
    // O primeiro achado aparece antes do fim da análise (A-05).
    await expect(page.getByText("22...Ta7?")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Resultado da análise" })).toBeVisible({
      timeout: 120_000,
    });
    const moments = page.getByRole("region", { name: "Momentos-chave" }).getByRole("listitem");
    await expect(moments).toHaveCount(5);
    await expect(moments.first()).toContainText("22...Ta7?");
    // Texto da IA (provedor falso, só com fatos do contrato).
    await expect(page.getByText(/^Vitória\./)).toBeVisible();
  });

  test("cancelar volta à tela Colar com a partida e a cor", async ({ page }) => {
    await startReferenceAnalysis(page);
    await page.getByRole("button", { name: "Cancelar análise" }).click();
    await expect(page.getByLabel("Partida")).toHaveValue(referenceGame);
    await expect(page.getByRole("button", { name: "Pretas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // O motor continua pronto para a próxima análise.
    await expect(page.getByRole("button", { name: "Analisar partida →" })).toBeEnabled();
  });
});
