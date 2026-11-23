import { describe, expect, it } from "vitest";
import viteConfig, { crossOriginIsolationHeaders } from "../../vite.config";

describe("servidores do Vite", () => {
  it("define os cabeçalhos de isolamento de origem (D1)", () => {
    expect(crossOriginIsolationHeaders).toEqual({
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    });
  });

  it("envia os cabeçalhos no dev e no preview (SCAF-01, SCAF-02)", () => {
    expect(viteConfig.server?.headers).toEqual(crossOriginIsolationHeaders);
    expect(viteConfig.preview?.headers).toEqual(crossOriginIsolationHeaders);
  });

  it("repassa /api ao backend na porta 8000 (SCAF-09)", () => {
    expect(viteConfig.server?.proxy).toEqual({ "/api": "http://localhost:8000" });
    expect(viteConfig.server?.port).toBe(5173);
    expect(viteConfig.preview?.port).toBe(4173);
  });
});
