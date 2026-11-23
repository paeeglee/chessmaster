import { expect, test } from "@playwright/test";

test.describe("isolamento de origem (D1)", () => {
  test("a página é servida com COOP e COEP", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    const headers = await response?.allHeaders();
    expect(headers?.["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers?.["cross-origin-embedder-policy"]).toBe("require-corp");
  });

  test("o navegador fica cross-origin isolated", async ({ page }) => {
    await page.goto("/");
    expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true);
  });

  test("a casca abre em português com a marca no cabeçalho", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.getByRole("banner")).toContainText("Analisador de partidas");
  });
});
