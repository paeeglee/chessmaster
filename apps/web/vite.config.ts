/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Cabeçalhos que deixam a página cross-origin isolated, liberando o
// SharedArrayBuffer para o Stockfish multi-thread (D1). Valem no dev e no preview.
const crossOriginIsolationHeaders = {
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
    // FastAPI. O preview herda este proxy.
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    headers: crossOriginIsolationHeaders,
  },
  test: {
    environment: "jsdom",
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
        "src/domains/**/model/**": {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
      },
    },
  },
});
