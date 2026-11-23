# F0 · Scaffolding Validation

## Validation verdict: PASS

**Date**: 2026-11-23
**Spec**: `.specs/features/scaffold/spec.md`
**Diff range**: `ee2d76d..7791655` (branch `chore/scaffold-apps`)
**Verifier**: independent sub-agent (author ≠ verifier)
**Iteration**: 2 of 3 (re-verification after fix commit `7791655`)

### History

- **Round 1** (`ee2d76d..bef97af`, report commit `3e060f4`): verdict was FAIL with three gaps.
  - G1: `make lint` passed on Biome warnings such as `any` (SCAF-16, probe T1).
  - G2: no automated test for dev-server headers (SCAF-01, mutant M11).
  - G3: the "shell makes no API call" test did not discriminate (SCAF-26, mutant M10).
  - Two spec-precision notes: SCAF-06 and SCAF-24.
- **Round 2** (this report): `7791655` fixes all three gaps and both notes. Every gate is green, the original surviving mutants and the T1 probe are now killed, and 5 new mutants aimed at the new tests are killed too.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | Toolchain; `strict: true`; `engines.node` |
| T2 | ✅ Done | Tokens, root machine, header shell |
| T3 | ✅ Done | Preview headers e2e-tested; dev + preview headers unit-tested (`serverConfig.test.ts`) |
| T4 | ✅ Done | API, settings, export, `llm` marker |
| T5 | ✅ Done | Lint gate now fails on warnings (`--error-on-warnings`) |
| T6 | ✅ Done | Proxy e2e, `generate-api-types` idempotent |
| T7 | ✅ Done | Docs updated; `design.md` MSW option name fixed |

---

## Spec-Anchored Acceptance Criteria

| AC | Spec-defined outcome | `file:line` + assertion / command evidence | Result |
| -- | -------------------- | ------------------------------------------ | ------ |
| SCAF-01 | Dev server sends COOP `same-origin` + COEP `require-corp` | `apps/web/src/app/serverConfig.test.ts:6` - `expect(crossOriginIsolationHeaders).toEqual({ "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" })`; `:13` - `expect(viteConfig.server?.headers).toEqual(crossOriginIsolationHeaders)` (M11 and M1b killed). Manual round 1: `curl -sI :5173/` showed both headers. | ✅ PASS |
| SCAF-02 | Preview server sends the same two headers | `apps/web/e2e/isolation.spec.ts:8` - `toBe("same-origin")`; `:9` - `toBe("require-corp")`; `apps/web/src/app/serverConfig.test.ts:14` - `expect(viteConfig.preview?.headers).toEqual(crossOriginIsolationHeaders)` (M1 and M11b killed) | ✅ PASS |
| SCAF-03 | `window.crossOriginIsolated === true` | `apps/web/e2e/isolation.spec.ts:14` - `expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true)` (M1 killed) | ✅ PASS |
| SCAF-04 | Banner with "Analisador de partidas"; `<html lang="pt-BR">` | `apps/web/e2e/isolation.spec.ts:19` - `toHaveAttribute("lang", "pt-BR")`; `:20` - `getByRole("banner")).toContainText("Analisador de partidas")`; `apps/web/src/app/App.test.tsx:12` (M9 and M16 killed) | ✅ PASS |
| SCAF-05 | Machine built with `setup({ types })` and `createActorContext`; shell reads state through the context | `apps/web/src/app/appMachine.ts:5-17`, `AppMachineContext.ts:4`, `App.tsx:5`; `apps/web/src/app/appMachine.test.ts:8` - `expect(actor.getSnapshot().value).toBe("gameInput")`; `App.test.tsx:36` - heading rendered for `gameInput` (M15 killed) | ✅ PASS |
| SCAF-06 | Tokens defined once; shell uses no literal colors, font stacks, radii or shadows | Tokens: `apps/web/src/app/theme.css:5-36`. `apps/web/src/app/App.test.tsx:55` - `expect(source, file).not.toMatch(literalToken)`, which bans hex, `rgb(a)(`, the literal font stacks and arbitrary `shadow-[`/`rounded-[`/`font-[` values (M6, M6b and M6c killed) | ✅ PASS |
| SCAF-07 | `strict: true` | `apps/web/tsconfig.json:8`; `make typecheck-web` exits 2 on a type error (round 1, probe T4) | ✅ PASS |
| SCAF-08 | `GET /api/health` returns `200 {"status": "ok"}` | `apps/api/tests/test_health.py:11` - `status_code == 200`; `:12` - `json() == {"status": "ok"}` (M2 killed) | ✅ PASS |
| SCAF-09 | `/api/` is proxied to `http://localhost:8000` | `apps/web/src/app/serverConfig.test.ts:18` - `expect(viteConfig.server?.proxy).toEqual({ "/api": "http://localhost:8000" })`; `apps/web/e2e/proxy.spec.ts:6` - `toBe(200)`; `:7` - `toEqual({ status: "ok" })` (M5 and M5b killed). Manual round 1: `curl :5173/api/health` returned `{"status":"ok"} 200`. | ✅ PASS |
| SCAF-10 | Reads the 3 vars from env and `.env`; defaults are `openai` and `gpt-5.1` | `apps/api/tests/test_config.py:24` - `== "openai"`; `:25` - `== "gpt-5.1"`; `:36-38` (env); `:44` (`.env` file) (M3 and M3b killed) | ✅ PASS |
| SCAF-11 | Empty key: the app starts and answers health | `apps/api/tests/test_config.py:50` - `client.get("/api/health").json() == {"status": "ok"}` | ✅ PASS |
| SCAF-12 | DDD layout: `main.py` creates the app; config lives in `shared/` | `apps/api/src/game_analyzer/main.py:8-17`, `shared/config.py:7-20`, `shared/health.py:6-15` (structure inspected) | ✅ PASS |
| SCAF-13 | OpenAPI at `/api/openapi.json` | `apps/api/tests/test_health.py:20-21` (M8 killed) | ✅ PASS |
| SCAF-14 | `make setup` installs everything and copies `.env` without overwriting | `Makefile:27-52`. Round 1, on a fresh scratch worktree: the first `make setup` exited 0 and created `.env`; the second exited 0 and kept the appended `MARKER=1`. | ✅ PASS |
| SCAF-15 | `make dev` starts both servers; Ctrl+C stops both | `Makefile:56-57`. Round 1 pty run: both ports were up, `\x03` was sent, both ports closed. | ✅ PASS (command evidence) |
| SCAF-16 | Biome + Ruff, `*.gen.ts` excluded, non-zero on any violation | `apps/web/package.json:14` - `biome check --error-on-warnings .`. Round 2 probe T1: `export const anyThing: any = 1;` made `make check` exit 2 at `lint-web`, and typecheck never ran. Round 1 probes T2 (`*.gen.ts` ignored, exit 0), T3 (Ruff, exit 2), T8 (error, exit 2) and T9 (format, exit 2). | ✅ PASS |
| SCAF-17 | `make format` runs Biome and `ruff format` | `Makefile:75-81`; round 1 run on the real tree exited 0 with no changes | ✅ PASS |
| SCAF-18 | `tsc --noEmit` + mypy strict, non-zero on error | `Makefile:83-89`; round 1 probes T4 and T5 both exited 2 | ✅ PASS |
| SCAF-19 | Vitest stack + pytest-cov; fail below the coverage thresholds | `apps/web/vite.config.ts:31,38-49`, `vitest.setup.ts:7`, `apps/api/pyproject.toml:45`; round 1 probes T6 (72.34%) and T7 (61.53%) both exited 2 | ✅ PASS |
| SCAF-20 | `llm` tests deselected by default | `apps/api/tests/test_markers.py:6` - `markexpr == "not llm"` (M4 killed) | ✅ PASS |
| SCAF-21 | `make test-e2e` builds, runs preview and Playwright | `Makefile:99-100`, `apps/web/playwright.config.ts:20-34`; round 2 `CI=1 make test-e2e` passed 4/4 | ✅ PASS |
| SCAF-22 | `check` runs lint, then typecheck, then test, and stops at the first failure | `Makefile:102`; round 2 probe T1 and round 1 probe T8: lint failed and no later step ran | ✅ PASS |
| SCAF-23 | Export the schema without a server; generate `schema.gen.ts` | `Makefile:106-110`; `apps/api/tests/test_export_openapi.py:12`; round 2 `make generate-api-types` exited 0 and `git diff --exit-code` showed no change | ✅ PASS |
| SCAF-24 | `setup/dev/lint/format/typecheck/test` have `-web`/`-api` variants; `test-e2e`/`check`/`generate-api-types` have none; `make help` lists every target | `Makefile:27-97`; `make help` lists all 24 targets, matching the reworded spec line exactly | ✅ PASS |
| SCAF-25 | `engines.node` matches 26; `requires-python` matches 3.14 | `apps/web/package.json:8` - `">=26 <27"`; `apps/api/pyproject.toml:5` - `">=3.14,<3.15"` | ✅ PASS |
| SCAF-26 | Backend down: proxy returns 5xx and the shell still renders, without depending on the backend | `apps/web/src/app/App.test.tsx:39` - `expect(requests).toEqual([])`, which records MSW `request:start` events after a tick (M10 killed with `AssertionError: expected [ 'http://localhost/api/health', …] to deeply equal []`). Manual round 1: with the API down, `:5173/api/health` returned 502 and `:5173/` returned 200. | ✅ PASS |

**Status**: ✅ All 26 ACs covered and matching the spec outcome; no spec-precision gaps open

---

## Discrimination Sensor

Round 2 used a fresh scratch worktree at `7791655` (`pnpm install --frozen-lockfile`, `uv sync --locked`). Each mutant was reverted after its run. The worktree was removed with `git worktree remove --force`, and the real tree's `git status --porcelain` matched the pre-sensor baseline (empty).

| # | File:line | Mutation | Tests | Round 1 | Round 2 |
| - | --------- | -------- | ----- | ------- | ------- |
| M1 | `apps/web/vite.config.ts:28` | Preview headers COOP only | Playwright | ✅ Killed | - |
| M1b | `apps/web/vite.config.ts:10` | COEP `require-corp` → `credentialless` | Vitest | - | ✅ Killed |
| M2 | `shared/health.py:10,15` | Payload `ok` → `up` | pytest | ✅ Killed | - |
| M3 / M3b | `shared/config.py:12-13` | Default model / provider changed | pytest | ✅ Killed | - |
| M4 | `apps/api/pyproject.toml:42` | Drop `-m "not llm"` | pytest | ✅ Killed | - |
| M5 | `apps/web/vite.config.ts:21-23` | Remove `/api` proxy | Playwright | ✅ Killed | - |
| M5b | `apps/web/vite.config.ts:22` | Proxy target → `:8001` | Vitest | - | ✅ Killed |
| M6 | `AppHeader.tsx:7` | `bg-brand` → `bg-[#0d5f63]` | Vitest | ✅ Killed | - |
| M6b | `AppHeader.tsx:12` | `font-serif` → `font-["Iowan_Old_Style"]` | Vitest | - | ✅ Killed |
| M6c | `AppHeader.tsx:22` | `shadow-raised` → `shadow-[0_1px_3px_black]` | Vitest | - | ✅ Killed |
| M7 | `AppHeader.tsx:26` | Add "Minhas partidas" link | Vitest | ✅ Killed | - |
| M8 | `main.py:12` | `openapi_url` → `/openapi.json` | pytest | ✅ Killed | - |
| M9 | `apps/web/index.html:2` | Remove `lang="pt-BR"` | Playwright | ✅ Killed | - |
| M10 | `apps/web/src/app/App.tsx:24` | Shell fires `fetch(".../api/health")` in `useEffect` | Vitest | ❌ Survived | ✅ Killed (`App.test.tsx:39`) |
| M11 | `apps/web/vite.config.ts:18` | Remove `server.headers` (dev) | Vitest | ❌ Survived | ✅ Killed (`serverConfig.test.ts:13`) |
| M11b | `apps/web/vite.config.ts:28` | Remove `preview.headers` | Vitest | - | ✅ Killed (`serverConfig.test.ts:14`) |
| M15 | `appMachine.ts:13` | Initial state → `idle` | Vitest | ✅ Killed | - |
| M16 | `AppHeader.tsx:13` | Brand text changed | Vitest | ✅ Killed | - |

Tooling probes:

| # | Injected fault | Command | Round 1 | Round 2 |
| - | -------------- | ------- | ------- | ------- |
| T1 | `any` in `appMachine.ts` | `make check` | exit 0 (warning only) | exit 2 at `lint-web`; typecheck not run ✅ |
| T2-T9 | `*.gen.ts` ignored; Ruff; tsc; mypy; api and web coverage; error-level lint fail-fast; format | per-target | all as specified ✅ | unchanged code paths; not re-run |

**Sensor depth**: lightweight+ (21 behavior mutants across both rounds, 9 tooling probes)
**Result**: round 2 killed 7/7 mutants and T1 behaved as specified; across both rounds every mutant was killed - PASS

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ (fix commit touches only the 6 files that the gaps named) |
| No scope creep | ✅ |
| Matches patterns | ✅ DDD layout per `docs/architecture/code-structure.md` |
| Spec-anchored outcome check | ✅ |
| Per-layer coverage expectation | ✅ |
| Every test maps to a spec requirement | ✅ (`serverConfig.test.ts` → SCAF-01/02/09) |
| Documented guidelines followed (`docs/engineering/quality.md`) | ✅ (`any` now fails the gate; MSW `onUnhandledFrame: "error"` matches `quality.md`) |

Notes (non-blocking):
- `serverConfig.test.ts` sits in `src/app/` and imports `../../vite.config`. That is acceptable because the root config belongs to the app shell, and Vitest's `include` is `src/**`.
- `get_settings()` (`shared/config.py:18-20`) is not wired into the app yet; F6 will use it.

---

## Edge Cases

- [x] `.env` already exists: `make setup` keeps it.
- [x] Backend down: the proxy returns 502 (manual), and the shell makes no request (`App.test.tsx:39`) and renders (`:36`).
- [x] `*.gen.ts` is ignored by Biome lint and format (probe T2).

---

## Gate Check

- **`make check`**: exit 0.
  - Biome: 19 files, no warnings, with `--error-on-warnings`.
  - Ruff: clean. `tsc`: clean. mypy: no issues in 10 source files.
  - Vitest: 8/8 in 3 files, 100% coverage. pytest: 9/9, 94.29% coverage.
- **`CI=1 make test-e2e`**: exit 0, Playwright 4/4.
- **`make generate-api-types` + `git diff --exit-code`**: no diff.
- **Test count before feature**: 0
- **Test count after fixes**: 21 (Vitest 8, pytest 9, Playwright 4). That is +3 over round 1 (the new `serverConfig.test.ts`); no test was removed, and the changed assertions are stricter.
- **Skipped tests**: none
- **Failures**: none

---

## Requirement Traceability Update (proposed for `spec.md`)

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| SCAF-01 … SCAF-26 | Implementing | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 26/26 ACs matched the spec outcome; 0 open spec-precision gaps
**Sensor**: round 2 killed 7/7 mutants (including the earlier survivors M10 and M11) and probe T1 now fails `make check` as it should
**Gate**: `make check` green (17 unit/integration tests), `make test-e2e` 4/4, generated types up to date

**Lessons**: the round-1 lessons L-001 to L-005 stay as candidates. Round 2 had no new signal and no confirmed lesson was loaded, so nothing was penalized.
