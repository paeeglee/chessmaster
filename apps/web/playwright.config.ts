import { defineConfig, devices } from "@playwright/test";

const previewUrl = "http://localhost:4173";
const FULL_ANALYSIS_SPECS = /(analysis|review|training|endgame)\.spec\.ts$/;

// Os testes rodam contra o build servido pelo `vite preview`, que envia os mesmos
// cabeçalhos de isolamento de origem do servidor de desenvolvimento, com o api de pé
// atrás do proxy de /api.
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
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: FULL_ANALYSIS_SPECS,
    },
    {
      // Os specs que analisam a partida inteira com o Stockfish de verdade rodam
      // sozinhos, um por vez e depois dos outros: a busca de 200 ms fica mais rasa
      // quando outros testes disputam a CPU, e um momento-chave limítrofe pode sumir.
      name: "full-analysis",
      use: { ...devices["Desktop Chrome"] },
      testMatch: FULL_ANALYSIS_SPECS,
      workers: 1,
      dependencies: ["chromium"],
    },
  ],
  webServer: [
    {
      name: "web",
      command: "pnpm build && pnpm preview",
      url: previewUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      name: "api",
      command: "uv run uvicorn game_analyzer.main:app --port 8000",
      cwd: "../api",
      // Textos da IA por template: os testes não chamam um provedor de verdade.
      env: { AI_PROVIDER: "fake" },
      url: "http://localhost:8000/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
