/// <reference types="vitest/config" />
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Cabeçalhos que deixam a página cross-origin isolated, liberando o
// SharedArrayBuffer para o Stockfish multi-thread (D1). Valem no dev e no preview.
export const crossOriginIsolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    headers: crossOriginIsolationHeaders,
    // Mesma origem no desenvolvimento: o frontend chama /api/... e o Vite repassa ao
    // FastAPI. O preview herda este proxy. Os testes Playwright apontam para um api
    // próprio (API_PROXY_TARGET), para nunca usar o `make dev` com a IA de verdade.
    proxy: {
      "/api": process.env.API_PROXY_TARGET ?? "http://localhost:8000",
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    headers: crossOriginIsolationHeaders,
  },
  test: {
    environment: "jsdom",
    // Alguns testes reproduzem a partida de referência inteira (145 posições); com a
    // máquina ocupada (ex.: Stockfish rodando), 5 s é pouco.
    testTimeout: 15_000,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.gen.ts", "src/main.tsx", "src/**/fixtures/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        // 90% em cada camada de domínio separadamente (quality.md), não na média.
        ...Object.fromEntries(
          // Os scripts do pnpm rodam a partir de apps/web.
          readdirSync(resolve("src/domains")).map((domain) => [
            `src/domains/${domain}/model/**`,
            { lines: 90, functions: 90, branches: 90, statements: 90 },
          ]),
        ),
      },
    },
  },
});
