import { expect, test } from "@playwright/test";
import { referenceGame, STABLE_MOMENTS, startReferenceAnalysis } from "./reference";

test.describe("análise da partida (step_02)", () => {
  test.setTimeout(180_000);

  test("analisa a partida de referência e abre o resultado com os momentos-chave", async ({
    page,
  }) => {
    await startReferenceAnalysis(page);
    await expect(page.getByRole("progressbar", { name: "Motor de avaliação" })).toBeVisible();
    // O primeiro achado aparece em "Já encontrado" antes do fim da análise (A-05).
    const findings = page.getByRole("region", { name: "Já encontrado" });
    await expect(findings.getByText("22...Ta7?")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Analisando sua partida…" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Resumo da partida" })).toBeVisible({
      timeout: 120_000,
    });
    const moments = page.getByRole("region", { name: "Momentos-chave" }).getByRole("listitem");
    // Com o motor de verdade (200 ms, várias threads), o 27...Tb7 é limítrofe: em
    // algumas rodadas o melhor lance escolhido também perde o bispo e a diferença
    // cai para 1 ponto. Os outros quatro saem sempre; a lista exata dos 5 é
    // conferida no Vitest com as avaliações fixas do fixture.
    await expect(moments.first()).toContainText("22...Ta7?");
    const texts = await moments.allTextContents();
    expect(texts.length === 4 || texts.length === 5).toBe(true);
    for (const label of STABLE_MOMENTS) {
      expect(texts.some((text) => text.includes(label))).toBe(true);
    }
    // Nenhum momento fora dos quatro estáveis e do limítrofe 27...Tb7.
    for (const text of texts) {
      expect([...STABLE_MOMENTS, "27...Tb7"].some((label) => text.includes(label))).toBe(true);
    }
    // Texto da IA (provedor falso, só com fatos do contrato).
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /^Vitória\. A vantagem começou em 12\.\.\.Bxa1\./,
    );
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

  test("cancelar no meio e analisar de novo chega ao resultado", async ({ page }) => {
    await startReferenceAnalysis(page);
    // Cancela com a avaliação em andamento (o Stockfish está buscando).
    await expect(page.getByRole("progressbar", { name: "Motor de avaliação" })).toBeVisible();
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Cancelar análise" }).click();
    await page.getByRole("button", { name: "Analisar partida →" }).click();
    await expect(page.getByRole("heading", { name: "Analisando sua partida…" })).toBeVisible();
    const findings = page.getByRole("region", { name: "Já encontrado" });
    await expect(findings.getByText("22...Ta7?")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("region", { name: "Resumo da partida" })).toBeVisible({
      timeout: 120_000,
    });
  });
});
