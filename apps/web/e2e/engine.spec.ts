import { expect, test } from "@playwright/test";

test("carrega o Stockfish multi-thread ao abrir a página (EVAL-05, EVAL-11)", async ({ page }) => {
  const wasmRequest = page.waitForRequest(/\/engine\/stockfish-19\.0\.1-mt\.wasm$/);
  await page.goto("/");
  await wasmRequest;
  expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true);
  await expect(page.getByText("Motor pronto")).toBeVisible({ timeout: 90_000 });
});
