import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";

export const referenceGame = readFileSync(
  join(import.meta.dirname, "../src/domains/game/fixtures/reference-game.chesscom.html"),
  "utf8",
);

/** Cola a partida de referência, escolhe as pretas e começa a análise. */
export async function startReferenceAnalysis(page: Page) {
  await page.goto("/");
  await expect(page.getByText("Motor pronto")).toBeVisible({ timeout: 90_000 });
  await page.getByLabel("Partida").fill(referenceGame);
  await page.getByRole("button", { name: "Pretas" }).click();
  await page.getByRole("button", { name: "Analisar partida →" }).click();
  await expect(page.getByRole("heading", { name: "Analisando sua partida…" })).toBeVisible();
}

/** Analisa a partida de referência com o motor de verdade e espera a tela Resultado. */
export async function analyzeReferenceGame(page: Page) {
  await startReferenceAnalysis(page);
  await expect(page.getByRole("region", { name: "Resumo da partida" })).toBeVisible({
    timeout: 240_000,
  });
}

/** Momentos-chave que saem em toda rodada do motor (27...Tb7 é limítrofe). */
export const STABLE_MOMENTS = ["22...Ta7", "41...Ta1", "43...Te6", "56...Ta8"];
