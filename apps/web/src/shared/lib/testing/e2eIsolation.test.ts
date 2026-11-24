import { afterEach, describe, expect, it, vi } from "vitest";

// O `make test-e2e` nunca pode usar o `make dev` (porta 8000, IA de verdade): o api dos
// testes tem porta própria, sempre com o provedor falso, e o preview aponta para ele.
describe("isolamento do e2e", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("o api dos testes tem porta própria, IA falsa e nunca é reaproveitado", async () => {
    const { default: config } = await import("../../../../playwright.config");
    const servers = Array.isArray(config.webServer) ? config.webServer : [config.webServer];
    const api = servers.find((server) => server?.name === "api");
    const web = servers.find((server) => server?.name === "web");
    if (!api?.url || !web) throw new Error("servidores do e2e não encontrados");
    const apiPort = new URL(api.url).port;
    expect(apiPort).not.toBe("8000");
    expect(api.command).toContain(`--port ${apiPort}`);
    expect(api.env).toMatchObject({ AI_PROVIDER: "fake" });
    expect(api.reuseExistingServer).toBe(false);
    expect(web.reuseExistingServer).toBe(false);
    expect(web.env?.API_PROXY_TARGET).toBe(`http://localhost:${apiPort}`);
  });

  it("o proxy de /api segue API_PROXY_TARGET e usa a 8000 por padrão", async () => {
    vi.stubEnv("API_PROXY_TARGET", "http://localhost:8100");
    const withTarget = (await import("../../../../vite.config")).default;
    expect(withTarget.server?.proxy?.["/api"]).toBe("http://localhost:8100");
    vi.unstubAllEnvs();
    vi.stubEnv("API_PROXY_TARGET", undefined);
    vi.resetModules();
    const fallback = (await import("../../../../vite.config")).default;
    expect(fallback.server?.proxy?.["/api"]).toBe("http://localhost:8000");
  });
});
