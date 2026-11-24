import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// Partida legal que chega a rei e torre contra rei (pretas) e termina em mate com
// jogo perfeito: exercita o worker da tabela de finais no navegador (motor 4).
const krkMate = readFileSync(
  join(import.meta.dirname, "../src/domains/analysis/fixtures/krk-mate.txt"),
  "utf8",
);

test.describe("tabela de finais (F5)", () => {
  // Com ~500 ms por posição, a análise da partida de referência leva cerca de 75 s.
  test.setTimeout(300_000);

  test("a etapa 4 roda e o resultado mostra os lances até o mate", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Motor pronto")).toBeVisible({ timeout: 90_000 });
    await page.getByLabel("Partida").fill(krkMate);
    await page.getByRole("button", { name: "Pretas" }).click();
    await page.getByRole("button", { name: "Analisar partida →" }).click();
    await expect(page.getByRole("region", { name: "Resumo da partida" })).toBeVisible({
      timeout: 240_000,
    });
    await expect(page.getByText("10 lances", { exact: true })).toBeVisible();
    await expect(page.getByText("para o mate de torre no final")).toBeVisible();
    await expect(page.getByText("o mais rápido era 10")).toBeVisible();
    await expect(page.getByText("✓ Tabela de finais")).toBeVisible();
  });
});
