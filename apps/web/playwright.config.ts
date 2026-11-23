import { defineConfig, devices } from "@playwright/test";

const previewUrl = "http://localhost:4173";

// Os testes rodam contra o build servido pelo `vite preview`, que envia os mesmos
// cabeçalhos de isolamento de origem do servidor de desenvolvimento.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: previewUrl,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      name: "web",
      command: "pnpm build && pnpm preview",
      url: previewUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
