# F0 · Scaffolding Validation

## Validation verdict: FAIL

**Date**: 2026-11-23
**Spec**: `.specs/features/scaffold/spec.md`
**Diff range**: `ee2d76d..bef97af` (branch `chore/scaffold-apps`)
**Verifier**: independent sub-agent (author ≠ verifier)

The scaffold works end to end and every gate is green, but three findings block a clean verdict:
one real defect against SCAF-16 (`make lint` / `make check` exit 0 on a Biome warning such as
`any`), and two surviving mutants (dev-server headers and the "shell makes no API call" guard of
SCAF-26) whose behavior is only checked by hand.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | Toolchain present; `strict: true`, `engines.node` ok |
| T2 | ✅ Done | Tokens, machine, header shell |
| T3 | ⚠️ Partial | Preview headers e2e-tested; dev headers only "checked manually" (mutant M11 survived) |
| T4 | ✅ Done | API, settings, export, `llm` marker |
| T5 | ⚠️ Partial | Lint gate passes on Biome warnings (gap G1) |
| T6 | ✅ Done | Proxy e2e, `generate-api-types` idempotent |
| T7 | ✅ Done | Docs updated |

---

## Spec-Anchored Acceptance Criteria

| AC | Spec-defined outcome | `file:line` + assertion / command evidence | Result |
| -- | -------------------- | ------------------------------------------ | ------ |
| SCAF-01 | Dev server sends COOP `same-origin` + COEP `require-corp` | Config: `apps/web/vite.config.ts:8-11,18`. No automated test hits the dev server. Manual: `curl -sI localhost:5173/` printed both headers with the exact values. Mutant M11 (drop `server.headers`) survived. | ❌ GAP (no automated evidence) |
| SCAF-02 | Preview server sends the same two headers | `apps/web/e2e/isolation.spec.ts:8` - `expect(headers?.["cross-origin-opener-policy"]).toBe("same-origin")`; `:9` - `...["cross-origin-embedder-policy"]).toBe("require-corp")` (M1 killed) | ✅ PASS |
| SCAF-03 | `window.crossOriginIsolated === true` (dev or preview, Chromium) | `apps/web/e2e/isolation.spec.ts:14` - `expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true)` (preview; M1 killed) | ✅ PASS |
| SCAF-04 | Banner landmark with "Analisador de partidas"; `<html lang="pt-BR">` | `apps/web/e2e/isolation.spec.ts:19` - `toHaveAttribute("lang", "pt-BR")`; `:20` - `getByRole("banner")).toContainText("Analisador de partidas")`; `apps/web/src/app/App.test.tsx:11` (M9, M16 killed) | ✅ PASS |
| SCAF-05 | Root machine via `setup({ types })`, provided with `createActorContext`, shell reads state through it | `apps/web/src/app/appMachine.ts:5-17`, `AppMachineContext.ts:4`, `App.tsx:5`; `apps/web/src/app/appMachine.test.ts:8` - `expect(actor.getSnapshot().value).toBe("gameInput")`; `App.test.tsx:31` - heading rendered for `gameInput` (M15 killed) | ✅ PASS |
| SCAF-06 | Repeated tokens (colors, 3 font stacks, radii, shadows) defined once; shell uses them, no literals | Tokens: `apps/web/src/app/theme.css:5-36` (values match `design.md` table). `apps/web/src/app/App.test.tsx:41` - `expect(source, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b\|rgba?\(/)` (M6 killed). The guard covers colors in `src/app/*.tsx` only, not literal font/radius/shadow values. | ⚠️ PASS with spec-precision gap |
| SCAF-07 | `strict: true` | `apps/web/tsconfig.json:8`; `make typecheck-web` exits 2 on a type error (sensor T4) | ✅ PASS |
| SCAF-08 | `GET /api/health` → `200 {"status": "ok"}` | `apps/api/tests/test_health.py:11` - `assert response.status_code == 200`; `:12` - `assert response.json() == {"status": "ok"}` (M2 killed) | ✅ PASS |
| SCAF-09 | Dev server proxies `/api/` to `:8000`; `GET :5173/api/health` → `200 {"status":"ok"}` | `apps/web/e2e/proxy.spec.ts:6` - `expect(response.status()).toBe(200)`; `:7` - `toEqual({ status: "ok" })`, run against preview (4173), which inherits `server.proxy` (`vite.config.ts:21-23`; M5 killed). Manual: `curl localhost:5173/api/health` → `{"status":"ok"} 200`. | ✅ PASS (dev port by command evidence) |
| SCAF-10 | Reads `AI_PROVIDER`, `AI_MODEL`, `OPENAI_API_KEY` from env and `.env`; defaults `openai`, `gpt-5.1` | `apps/api/tests/test_config.py:24` - `assert settings.ai_provider == "openai"`; `:25` - `== "gpt-5.1"`; `:36-38` env values; `:44` - `.env` file value (M3, M3b killed) | ✅ PASS |
| SCAF-11 | Empty key → backend starts and answers `/api/health` | `apps/api/tests/test_config.py:50` - `assert client.get("/api/health").json() == {"status": "ok"}` with all AI vars removed and no `.env` | ✅ PASS |
| SCAF-12 | DDD layout: `main.py` creates app + mounts routers; config in `shared/` | `apps/api/src/game_analyzer/main.py:8-17` (`create_app`, `include_router`), `shared/config.py:7-20`, `shared/health.py:6-15` (structural, inspected) | ✅ PASS |
| SCAF-13 | OpenAPI at `/api/openapi.json` | `apps/api/tests/test_health.py:20` - `assert response.status_code == 200`; `:21` - `"/api/health" in response.json()["paths"]` (M8 killed) | ✅ PASS |
| SCAF-14 | `make setup` installs pnpm deps, uv deps, Playwright Chromium, copies missing `.env` without overwriting | `Makefile:27-52`. Command evidence on a fresh scratch worktree: `make setup` exit 0, printed `apps/api/.env criado a partir de apps/api/.env.example`; after appending `MARKER=1`, second `make setup` exit 0, printed `já existe, mantido`, marker kept | ✅ PASS |
| SCAF-15 | `make dev` starts 5173 + 8000 together; Ctrl+C stops both | `Makefile:56-57` (`$(MAKE) -j2`). Command evidence: `make dev` under a pty → both ports listening; `\x03` sent → both ports closed, no leftover process | ✅ PASS (command evidence) |
| SCAF-16 | Biome + Ruff, excluding `*.gen.ts`, **non-zero on any violation** | `Makefile:67-73`, `apps/web/package.json:14`, `apps/web/biome.json:12`. Sensor: error-level Biome violation → `make check` exit 2 (T8); format violation → exit 2 (T9); Ruff violation → exit 2 (T3); violation inside `*.gen.ts` ignored → exit 0 (T2). **But** `export var x: any = 1` (Biome `noExplicitAny`, a warning) → `make check` exit 0 (T1). | ❌ GAP (G1) |
| SCAF-17 | `make format` formats web with Biome, api with `ruff format` | `Makefile:75-81`; ran `make format` on the real tree: exit 0, "No fixes applied", tree unchanged | ✅ PASS |
| SCAF-18 | `tsc --noEmit` + `mypy --strict`, non-zero on error | `Makefile:83-89`, `apps/api/pyproject.toml:32-36`; sensor T4 (tsc) exit 2, T5 (mypy) exit 2 | ✅ PASS |
| SCAF-19 | Vitest (jsdom, RTL, user-event, MSW) + pytest-cov; fail below thresholds | `apps/web/vite.config.ts:31,38-49`, `vitest.setup.ts:7`, `apps/api/pyproject.toml:45`. Sensor T6: api coverage 72.34% → `make test-api` exit 2; T7: web lines 61.53% → `make test-web` exit 2 | ✅ PASS |
| SCAF-20 | pytest skips `@pytest.mark.llm` unless selected | `apps/api/tests/test_markers.py:6` - `assert pytestconfig.option.markexpr == "not llm"`; `:11` marker registered (M4 killed) | ✅ PASS |
| SCAF-21 | `make test-e2e` builds, serves with `vite preview` (headers on), runs Playwright | `Makefile:99-100`, `apps/web/playwright.config.ts:20-34`, `package.json:12`; `CI=1 make test-e2e` → 4 passed | ✅ PASS |
| SCAF-22 | `check` = lint → typecheck → test, stops at first failure | `Makefile:102`; sensor T8: Biome error → exit 2, Ruff/tsc/vitest never ran | ✅ PASS |
| SCAF-23 | Export OpenAPI without a server, generate `schema.gen.ts` with `openapi-typescript` | `Makefile:106-110`; `apps/api/tests/test_export_openapi.py:12` - `assert schema["paths"]["/api/health"]["get"]["responses"]["200"]`; `make generate-api-types` exit 0, `git diff --exit-code` on `schema.gen.ts` exit 0; `schema.gen.ts:7` has `/api/health` | ✅ PASS |
| SCAF-24 | Every aggregate target has `-web`/`-api` variants; `make help` lists all | `Makefile:22-23,27-97`; `make help` lists 24 targets. `setup/dev/lint/format/typecheck/test` have both variants. `test-e2e`, `generate-api-types`, `check` have none; they are not per-app aggregates, but the spec says "every aggregate target". | ⚠️ PASS with spec-precision gap |
| SCAF-25 | `engines.node` matches `.nvmrc` (26); `requires-python` matches `.python-version` (3.14) | `apps/web/package.json:8` - `">=26 <27"`; `apps/api/pyproject.toml:5` - `">=3.14,<3.15"`; `.nvmrc:1` `26`, `.python-version:1` `3.14` | ✅ PASS |
| SCAF-26 | Backend down → proxy returns 5xx **and** shell still renders (shell does not depend on backend) | Manual: uvicorn killed, `curl :5173/api/health` → `502`, `curl :5173/` → `200`. `apps/web/src/app/App.test.tsx:27-32` claims MSW would catch any API call, but mutant M10 (fire-and-forget `fetch("/api/health")` in a `useEffect`) survived: the request settles after the test ends and nothing fails. | ❌ GAP (G3) |

**Status**: ❌ Gaps present (SCAF-01, SCAF-16, SCAF-26); ⚠️ 2 spec-precision gaps (SCAF-06, SCAF-24)

---

## Discrimination Sensor

Scratch worktree at `HEAD` under the session scratchpad, deps installed with `pnpm install --frozen-lockfile` and `uv sync --locked`; each mutant reverted with `git checkout` after its run; worktree removed with `git worktree remove --force`. Real tree `git status --porcelain` matched the pre-sensor baseline (empty).

| # | File:line | Mutation | Tests run | Killed? |
| - | --------- | -------- | --------- | ------- |
| M1 | `apps/web/vite.config.ts:28` | Preview headers → COOP only (no COEP) | Playwright | ✅ Killed (`isolation.spec.ts:9` and `:14`) |
| M2 | `apps/api/src/game_analyzer/shared/health.py:10,15` | Health payload `"ok"` → `"up"` | pytest | ✅ Killed |
| M3 | `apps/api/src/game_analyzer/shared/config.py:13` | Default model `gpt-5.1` → `gpt-4o` | pytest | ✅ Killed |
| M3b | `apps/api/src/game_analyzer/shared/config.py:12` | Default provider `openai` → `anthropic` | pytest | ✅ Killed |
| M4 | `apps/api/pyproject.toml:42` | Drop `-m "not llm"` | pytest | ✅ Killed |
| M5 | `apps/web/vite.config.ts:21-23` | Remove `/api` proxy | Playwright | ✅ Killed (`proxy.spec.ts:6`) |
| M6 | `apps/web/src/app/AppHeader.tsx:7` | `bg-brand` → `bg-[#0d5f63]` | Vitest | ✅ Killed |
| M7 | `apps/web/src/app/AppHeader.tsx:26` | Add "Minhas partidas" link to nav | Vitest | ✅ Killed |
| M8 | `apps/api/src/game_analyzer/main.py:12` | `openapi_url` → `/openapi.json` | pytest | ✅ Killed |
| M9 | `apps/web/index.html:2` | Remove `lang="pt-BR"` | Playwright | ✅ Killed |
| M10 | `apps/web/src/app/App.tsx:24` | Shell fires `fetch("/api/health")` in `useEffect` | Vitest | ❌ Survived → G3 |
| M11 | `apps/web/vite.config.ts:18` | Remove `server.headers` (dev) | Playwright + Vitest | ❌ Survived → G2 |
| M15 | `apps/web/src/app/appMachine.ts:13` | Initial state `gameInput` → `idle` | Vitest | ✅ Killed |
| M16 | `apps/web/src/app/AppHeader.tsx:13` | Brand text → "Analisador" | Vitest | ✅ Killed |

Tooling probes (Makefile contract, same scratch):

| # | Injected fault | Command | Expected | Observed |
| - | -------------- | ------- | -------- | -------- |
| T1 | `export var unused_thing: any = 1;` in `appMachine.ts` | `make check` | non-zero | **exit 0** (Biome: "Found 1 warning. All checks passed!") → G1 |
| T2 | Lint/format garbage appended to `schema.gen.ts` | `make lint-web` | 0 (ignored) | exit 0 ✅ |
| T3 | Unused `import os` in `main.py` | `make lint-api` | non-zero | exit 2 ✅ |
| T4 | `const n: number = "x"` | `make typecheck-web` | non-zero | exit 2 ✅ |
| T5 | `def f() -> int: return "x"` | `make typecheck-api` | non-zero | exit 2 ✅ |
| T6 | Uncovered branchy function in api | `make test-api` | non-zero | exit 2 (72.34% < 80%) ✅ |
| T7 | Uncovered branchy function in web | `make test-web` | non-zero | exit 2 (61.53% < 80%) ✅ |
| T8 | `debugger;` in web | `make check` | non-zero, stop at lint | exit 2; Ruff, tsc, Vitest not run ✅ |
| T9 | Unformatted line in web | `make lint-web` | non-zero | exit 2 ✅ |

**Sensor depth**: lightweight+ (14 behavior mutants, 9 tooling probes)
**Result**: 12/14 mutants killed, 8/9 tooling probes as expected - FAIL

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ (no Stockfish, chess.js, LangChain, real screens) |
| Matches patterns | ✅ DDD layout per `docs/architecture/code-structure.md` |
| Spec-anchored outcome check | ⚠️ SCAF-06, SCAF-24 flagged |
| Per-layer coverage expectation | ⚠️ dev-server headers (SCAF-01) and backend-independence (SCAF-26) lack discriminating tests |
| Every test maps to a spec requirement | ✅ (`test_markers.py` → SCAF-20; `test_export_openapi.py` → SCAF-23; `App.test.tsx:17-25` → D2 / design.md AppHeader) |
| Documented guidelines followed (`docs/engineering/quality.md`) | ❌ "Não use `any`" is not enforced by the lint gate (G1) |

Notes (non-blocking):
- `vitest.setup.ts:7` uses `onUnhandledFrame: "error"` instead of design's `onUnhandledRequest`; this is the MSW 3.0.7 option name (`msw/lib/_chunks/shared-options.d.ts:12`). Verified: an awaited unhandled `fetch` rejects with `[MSW] Error: intercepted a request without a matching request handler`. Update `design.md` wording.
- `get_settings()` (`shared/config.py:18-20`) is not used by the app yet (line 20 uncovered). Fine for F0; F6 will wire it.
- `apps/api/tests/test_export_openapi.py:12` only asserts the 200 response entry is truthy; acceptable for SCAF-23.

---

## Edge Cases

- [x] `.env` already exists → `make setup` keeps it (scratch run, marker preserved)
- [ ] Backend down → proxy 5xx and shell renders: behavior correct by hand (502 / 200), but the automated guard does not discriminate (G3)
- [x] `*.gen.ts` ignored by Biome lint and format (probe T2)

---

## Gate Check

- **`make check`**: exit 0 - Biome clean (18 files), Ruff clean, `tsc` clean, mypy "no issues in 10 source files", Vitest 5/5 (100% coverage), pytest 9/9 (94.29% coverage)
- **`CI=1 make test-e2e`**: exit 0 - 4/4 Playwright tests (isolation ×3, proxy ×1)
- **`make generate-api-types` + `git diff --exit-code schema.gen.ts`**: exit 0 / no diff
- **Test count before feature**: 0 (no apps existed)
- **Test count after feature**: 18 (Vitest 5, pytest 9, Playwright 4)
- **Skipped tests**: none (the `llm` deselection is by design and there are no `llm` tests yet)
- **Failures**: none

---

## Fix Plans

### G1 (Major): lint gate passes on Biome warnings, so `any` reaches `main`

- **Root cause**: `apps/web/package.json:14` runs `biome check .`; in Biome 2.6 `noExplicitAny` (recommended) is a warning and `biome check` exits 0 on warnings. Violates SCAF-16 ("exit non-zero on any violation") and `quality.md` ("Não use `any`").
- **Fix task**: change the `lint` script to `biome check --error-on-warnings .` (keep `format` as is), or set `linter.rules.suspicious.noExplicitAny: "error"` in `apps/web/biome.json`. Prefer `--error-on-warnings` so every future warning fails the gate.
- **Verify**: append `export const x: any = 1;` to any `src/**/*.ts`, run `make check` → non-zero at `lint-web`.

### G2 (Minor): dev-server COOP/COEP have no automated test (SCAF-01, mutant M11)

- **Root cause**: Playwright only runs against `vite preview`; dev headers were checked by hand.
- **Fix task**: export `crossOriginIsolationHeaders` from `apps/web/vite.config.ts` (or move it to a tiny module) and add `apps/web/vite.config.test.ts` asserting `config.server.headers` and `config.preview.headers` both equal `{ "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" }` and `config.server.proxy["/api"] === "http://localhost:8000"`. Alternative: a second Playwright project/webServer on `pnpm dev` (5173) running `isolation.spec.ts`.
- **Verify**: re-run M11 (remove `server.headers`) → test fails.

### G3 (Minor): "shell does not depend on the backend" guard does not discriminate (SCAF-26, mutant M10)

- **Root cause**: `apps/web/src/app/App.test.tsx:27-32` relies on MSW `onUnhandledFrame: "error"`, but a fire-and-forget request settles after the synchronous test ends, so nothing fails.
- **Fix task**: in that test, record requests with `server.events.on("request:start", ...)` (from `src/shared/lib/testing/server.ts`), `render(<App />)`, wait a tick (`await new Promise((r) => setTimeout(r, 0))` or `await waitFor`), and assert the recorded list is empty. Optionally add a Playwright test that routes `/api/**` to a 502 (`page.route`) and asserts the banner still renders.
- **Verify**: re-run M10 → test fails.

---

## Requirement Traceability Update (proposed for `spec.md`)

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| SCAF-02 … SCAF-15, SCAF-17 … SCAF-25 (except below) | Implementing | ✅ Verified |
| SCAF-06, SCAF-24 | Implementing | ✅ Verified (spec-precision note) |
| SCAF-01 | Implementing | ❌ Needs Fix (G2) |
| SCAF-16 | Implementing | ❌ Needs Fix (G1) |
| SCAF-26 | Implementing | ❌ Needs Fix (G3) |

---

## Summary

**Overall**: ❌ Not Ready (3 fix tasks, all small)

**Spec-anchored check**: 23/26 ACs matched the spec outcome; 3 gaps (SCAF-01, SCAF-16, SCAF-26); 2 spec-precision notes (SCAF-06, SCAF-24)
**Sensor**: 12/14 mutants killed; 8/9 tooling probes behaved as specified
**Gate**: `make check` green (14 unit tests), `make test-e2e` 4/4, generated types up to date

**What works**: cross-origin isolation on preview (and on dev, by hand), `/api` proxy, health route, settings defaults, OpenAPI export and type generation, coverage thresholds, `llm` deselection, `make setup` idempotency, `make dev` start/stop, `make check` ordering and fail-fast.

**Next steps**: implement G1–G3, then re-verify (iteration 1 of 3).
