import { expect, test } from "@playwright/test";

test("o frontend alcança o backend por /api na mesma origem", async ({ page }) => {
  await page.goto("/");
  const response = await page.request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
