# F2 · Evaluation engine Validation

**Date**: 2026-11-23 (round 1)
**Spec**: `.specs/features/evaluation-engine/spec.md`
**Diff range**: `6f6e9eb..18c36b9` (spec `71b234b`; code `0d53a8f`, `27fef51`, `f25fa91`, `9961d13`, `18c36b9`)
**Verifier**: independent sub-agent (author ≠ verifier)
**Verdict**: FAIL

Three behavior-level mutants survive the test suite (M12, M16, M17). Each maps to a spec outcome that has no discriminating assertion: the loader's integer percent from the progress port (EVAL-06), the 120 s `uciok` limit (EVAL-08) and the "Tentar de novo" button reaching the loader in the app (EVAL-09). All gates pass; the code behaves as specified on reading. The gaps are in the tests only.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Engine files and build choice | ✅ Done | - |
| T2 UCI parsing and score orientation | ✅ Done | - |
| T3 EngineClient | ✅ Done | - |
| T4 Loader machine, status, app wiring | ⚠️ Partial | Progress wiring and retry wiring not discriminated by tests (M12, M17) |
| T5 Real engine e2e and docs | ✅ Done | - |

---

## Spec-Anchored Acceptance Criteria

Paths are relative to `apps/web/`.

| ID | Spec-defined outcome | `file:line` + assertion / command evidence | Result |
| -- | -------------------- | ------------------------------------------ | ------ |
| EVAL-01 | `public/engine/` holds `stockfish-19.0.1-{mt,st}.{js,wasm}` + `Copying.txt` after `make setup-web`, `pnpm dev`, `pnpm build` | Command: fresh scratch worktree with no `public/engine/` → `node scripts/copy-engine.mjs` printed "5 arquivo(s) copiado(s)" and `ls` showed exactly the 5 files (mt.wasm 99,076,105 B, st.wasm 99,169,054 B); second run copied nothing. Wiring: `package.json:11` (`dev`), `package.json:12` (`build`), `Makefile` `setup-web` → `pnpm copy-engine`. `make test-e2e` log shows `node scripts/copy-engine.mjs && tsc --noEmit && vite build`. Version tie: `src/domains/evaluation/model/engineBuild.test.ts:31` `expect(...version).toBe(ENGINE_VERSION)` | ✅ PASS (command evidence) |
| EVAL-02 | `public/engine/` out of git | Command: `git check-ignore -v` → `.gitignore:20:apps/web/public/engine/` for `stockfish-19.0.1-mt.wasm` and `Copying.txt`; scratch `git status --porcelain` empty after the copy | ✅ PASS (command evidence) |
| EVAL-03 | Isolated → mt URL, `hardwareConcurrency − 1` threads, min 1 | `src/domains/evaluation/model/engineBuild.test.ts:8` `toEqual({ variant: "multi-thread", scriptUrl: "/engine/stockfish-19.0.1-mt.js", threads: 7 })`; `:16` `.threads).toBe(1)` for 1 core | ✅ PASS |
| EVAL-04 | Not isolated → st URL, 1 thread | `src/domains/evaluation/model/engineBuild.test.ts:22` `toEqual({ variant: "single-thread", scriptUrl: "/engine/stockfish-19.0.1-st.js", threads: 1 })`; `src/domains/evaluation/machines/engineLoaderMachine.test.ts:75` `build.variant).toBe("single-thread")` (jsdom) | ✅ PASS |
| EVAL-05 | Download starts on app start without user action | `src/domains/evaluation/machines/engineLoaderMachine.test.ts:31-33` `value).toBe("loading")`, `percent).toBe(0)`, `controls.started).toBe(1)`; `src/app/App.test.tsx:78` `getByText("Carregando o motor de análise… 40%")` with the loader invoked by `appMachine`; `e2e/engine.spec.ts:4-6` `waitForRequest(/stockfish-19\.0\.1-mt\.wasm$/)` after only `page.goto("/")` | ✅ PASS |
| EVAL-06 | Loader exposes integer percent 0–100 from the progress port | `src/domains/evaluation/model/progress.test.ts:14` `toPercent(fraction)).toBe(percent)` (0.999→99, 1.2→100, NaN→0); `src/domains/evaluation/engine/EngineClient.test.ts:69` `received).toEqual([{ percent: 0.4, loaded: 40, total: 100 }])`; `src/domains/evaluation/machines/engineLoaderMachine.test.ts:39` `percent).toBe(40)`. **Missing**: no test asserts the loader's `context.percent` after a real port message; `src/domains/evaluation/machines/loadEngine.test.ts:45` posts `0.42` but only asserts `ready`. Mutant M12 (`engineLoaderMachine.ts:46` raw fraction instead of `toPercent`) survives | ❌ GAP |
| EVAL-07 | After `uciok`, Threads set, `readyok` → `ready` with `EngineClient` | `src/domains/evaluation/engine/EngineClient.test.ts:59` `commands).toEqual(["uci", "setoption name Threads value 7", "isready"])`; `src/domains/evaluation/machines/engineLoaderMachine.test.ts:45-46` `value).toBe("ready")`, `engine).toBe(fakeEngine)`; `src/domains/evaluation/machines/loadEngine.test.ts:47-49` `ready`, `engine).not.toBeNull()`, `worker.terminated).toBe(false)` | ✅ PASS |
| EVAL-08 | Worker error or no `uciok` within **120 s** → `failed` | `src/domains/evaluation/engine/EngineClient.test.ts:75` `rejects.toThrow("O motor não respondeu a tempo")` (with `timeoutMs: 20`); `:85` `rejects.toThrow("Falha no worker do motor")`; `src/domains/evaluation/machines/loadEngine.test.ts:67` `value).toBe("failed")`. **Missing**: the 120 s value (`EngineClient.ts:26`) is never asserted; mutant M16 (120 s → 10 s) survives | ❌ GAP |
| EVAL-09 | Retry from `failed` terminates old worker, new download from 0% | `src/domains/evaluation/machines/engineLoaderMachine.test.ts:60-64` `stopped).toBe(1)`, `value).toBe("loading")`, `percent).toBe(0)`, `started).toBe(2)`; `src/domains/evaluation/machines/loadEngine.test.ts:68` `worker.terminated).toBe(true)`. **Missing**: "the user asks to retry" is never exercised through the UI; `src/app/App.test.tsx:84` only checks the button exists, and `src/app/EngineIndicator.tsx:19` is uncovered. Mutant M17 (`onRetry={() => {}}`) survives | ❌ GAP |
| EVAL-10 | Texts "Carregando o motor de análise… N%", "Motor pronto", "Não foi possível carregar o motor" + "Tentar de novo"; `aria-live="polite"` | `src/domains/evaluation/components/EngineStatus.test.tsx:9` `getByText("Carregando o motor de análise… 40%")`; `:14` `getByText("Motor pronto")`; `:20-22` failure text + `getByRole("button", { name: "Tentar de novo" })` + `onRetry).toHaveBeenCalledOnce()`; `:27` `toHaveAttribute("aria-live", "polite")` | ✅ PASS |
| EVAL-11 | Real browser with isolation reaches "Motor pronto" with the mt build | `e2e/engine.spec.ts:4` mt `.wasm` request; `:7` `crossOriginIsolated).toBe(true)`; `:8` `getByText("Motor pronto")).toBeVisible({ timeout: 90_000 })` — passed in 1.2 s | ✅ PASS |
| EVAL-12 | Sends `position fen <fen>` + `go movetime 200`; resolves depth, score, bestMove, pv from last `info` + `bestmove` | `src/domains/evaluation/engine/EngineClient.test.ts:100` `commands.slice(3)).toEqual([\`position fen ${START_FEN}\`, "go movetime 200"])`; `:101-107` `toEqual({ fen, depth: 14, score: { kind: "cp", value: 31 }, bestMove: "e2e4", pv: ["e2e4","e7e5","g1f3"] })` (last of two `info` lines) | ✅ PASS |
| EVAL-13 | Depth < 12 → `go depth 12`, resolve with that search | `src/domains/evaluation/engine/EngineClient.test.ts:123-132` commands end with `"go depth 12"`, `toMatchObject({ depth: 12, score: { cp 25 }, bestMove: "e2e4" })`; `src/domains/evaluation/model/uci.test.ts:97-98` `needsDeeperSearch(11)).toBe(true)`, `(12)).toBe(false)` | ✅ PASS |
| EVAL-14 | `cp 35` Black to move → `cp -35`; `mate 3` → `mate -3` | `src/domains/evaluation/model/uci.test.ts:71-75` exact values; `src/domains/evaluation/engine/EngineClient.test.ts:143` `score).toEqual({ kind: "cp", value: -35 })` | ✅ PASS |
| EVAL-15 | `bestmove (none)` → `bestMove: null`, score as reported | `src/domains/evaluation/model/uci.test.ts:53` `toEqual({ bestMove: null })`; `src/domains/evaluation/engine/EngineClient.test.ts:155-162` `toEqual({ ..., score: { kind: "mate", value: 0 }, bestMove: null, pv: [] })`, `not.toContain("go depth 12")` | ✅ PASS |
| EVAL-16 | Overlapping calls run one after the other in call order | `src/domains/evaluation/engine/EngineClient.test.ts:185-192` first search delayed 20 ms; `first.score` cp 1, `second.score` cp −2, commands strictly ordered | ✅ PASS |
| EVAL-17 | `terminate()` terminates worker, pending evaluations reject | `src/domains/evaluation/engine/EngineClient.test.ts:201-203` `rejects.toThrow("Motor encerrado")`, `worker.terminated).toBe(true)`, later call rejects. A second *queued* evaluation is not tested; by reading (`EngineClient.ts:80-81,125-126`) it also rejects | ✅ PASS |
| EVAL-18 | Pure model (no Worker/React/XState); domain used only via `index.ts` | Command: `grep ^import src/domains/evaluation/model/*.ts` → only `./types`; `grep -rn domains/evaluation/` outside the domain → no hits (`app/` imports `../domains/evaluation`). No automated guard | ✅ PASS (command evidence) |
| EVAL-19 | `info` without `score` ignored | `src/domains/evaluation/model/uci.test.ts:35-36` `parseInfoLine(line)).toBeNull()` for `info string …`, `info … currmove …`, `wdl` | ✅ PASS |
| EVAL-20 | `lowerbound`/`upperbound` score ignored | `src/domains/evaluation/model/uci.test.ts:43` `toBeNull()` for both bounds | ✅ PASS |

**Status**: ❌ Gaps present (EVAL-06, EVAL-08, EVAL-09; tests only). No spec-precision gaps: every AC states an exact value or state.

---

## Discrimination Sensor

Scratch: `git worktree add <scratchpad>/f2-sensor HEAD`, `pnpm install --frozen-lockfile`, `node scripts/copy-engine.mjs`. One mutant at a time, `pnpm vitest run`, killed = non-zero exit; file restored with `git checkout` after each. Paths relative to `apps/web/src/`.

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| M1 | `domains/evaluation/model/engineBuild.ts:20` | threads = `hardwareConcurrency` (no −1) | ✅ Killed |
| M2 | `domains/evaluation/model/engineBuild.ts:16` | always multi-thread, even without isolation | ✅ Killed |
| M3 | `domains/evaluation/engine/EngineClient.ts:97` | drop the `go depth 12` search | ✅ Killed |
| M4 | `domains/evaluation/model/uci.ts:55` | score sign never flipped | ✅ Killed |
| M5 | `domains/evaluation/model/uci.ts:19` | `lowerbound`/`upperbound` filter removed | ✅ Killed |
| M6 | `domains/evaluation/model/uci.ts:42` | `bestmove (none)` → `"(none)"` | ✅ Killed |
| M7 | `domains/evaluation/engine/EngineClient.ts:80` | `evaluate` not serialized | ✅ Killed |
| M8 | `domains/evaluation/engine/EngineClient.ts:91` | `terminate()` does not reject pending | ✅ Killed |
| M9 | `domains/evaluation/machines/engineLoaderMachine.ts:57` | loader cleanup terminates a ready engine | ✅ Killed |
| M10 | `domains/evaluation/machines/engineLoaderMachine.ts:89` | `RETRY` accepted while loading | ✅ Killed |
| M11 | `domains/evaluation/model/progress.ts:6` | percent not floored | ✅ Killed |
| M12 | `domains/evaluation/machines/engineLoaderMachine.ts:46` | loader forwards the raw fraction (`progress.percent`) instead of `toPercent(...)` | ❌ Survived → Fix 1 |
| M13 | `domains/evaluation/components/EngineStatus.tsx:14` | "Motor pronto" → "Motor carregado" | ✅ Killed |
| M14 | `domains/evaluation/components/EngineStatus.tsx:12` | `aria-live="off"` | ✅ Killed |
| M15 | `app/appMachine.ts:17` | root does not invoke the loader | ✅ Killed |
| M16 | `domains/evaluation/engine/EngineClient.ts:26` | start timeout 120 s → 10 s | ❌ Survived → Fix 2 |
| M17 | `app/EngineIndicator.tsx:19` | "Tentar de novo" does nothing in the app (`onRetry={() => {}}`) | ❌ Survived → Fix 3 |
| M18 | `domains/evaluation/engine/EngineClient.ts:71` | `setoption name Threads value 1` regardless of build | ✅ Killed |
| M19 | `domains/evaluation/machines/engineLoaderMachine.ts:76` | retry keeps the old percent | ✅ Killed |
| M20 | `domains/evaluation/model/searchPlan.ts:7` | `<` → `<=` (deeper search at depth 12) | ✅ Killed |
| M21 | `domains/evaluation/machines/engineLoaderMachine.ts:53` | failed start does not call `engine.terminate()` | ➖ Survived, equivalent: leaving `loading` stops the actor and its cleanup (`:56-59`, `ready === false`) terminates the worker, so observable behavior is unchanged |

**Sensor depth**: lightweight+ (21 manual mutants; e2e not re-run per mutant because every survivor is outside what `e2e/engine.spec.ts` asserts)
**Result**: 17/20 non-equivalent mutants killed - ❌ FAIL

**Isolation**: real worktree `git status --porcelain` captured before (empty) and after `git worktree remove --force` (empty) — identical. No `git stash` used.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ (only evaluation domain, app wiring, copy script, Makefile, overview.md) |
| No scope creep | ✅ (no tablebase, no lite builds, no cache headers) |
| Matches patterns | ✅ (XState `fromCallback` + `provide`, tests next to code, `index.ts` entry) |
| Spec-anchored outcome check | ❌ EVAL-06, EVAL-08, EVAL-09 lack discriminating assertions |
| Per-layer coverage: `model/` 100% lines; app 99.64% lines | ✅ (`EngineIndicator.tsx:19` uncovered) |
| Every test maps to an AC/edge/Done-when | ✅ (`loadEngine.test.ts` maps to EVAL-07/08; "ignora RETRY enquanto carrega" guards EVAL-09 transitions) |
| Documented guidelines: `docs/engineering/quality.md`, `docs/architecture/code-structure.md` | ✅ (RTL by role/text, no network, pure model, DDD layout) |

Observations (not blocking, no AC):

- `EngineClient.ts:51-53`: a worker `error` while no consumer is waiting (between `uciok` and `isready`, or after ready) is dropped. During start this falls back to the 120 s timeout; after ready, F4 will not learn the worker died until a call hangs. Worth handling when F4 consumes the client.
- `scripts/copy-engine.mjs:25`: "changed" means "different size". Safe today because the target names carry the version.

---

## Edge Cases

- [x] EVAL-19 `info` without score ignored — `uci.test.ts:35-36`
- [x] EVAL-20 bound scores ignored — `uci.test.ts:43`
- [x] Worker creation throws → `failed` — `loadEngine.test.ts:58`
- [x] Loader stopped while loading terminates worker — `loadEngine.test.ts:76`

---

## Gate Check

- **Gate command**: `make check && make test-e2e` (full, from tasks.md)
- **Result**: `make check` passed — Biome, `tsc --noEmit`, mypy, Vitest 149 passed / 0 failed / 0 skipped (coverage 99.66% stmts, 92.93% branches, 99.64% lines), pytest 9 passed (94.29%). `make test-e2e` 5 passed / 0 failed (`engine.spec.ts` 1.2 s). Ports 4173/8000 free before and after.
- **Test count before feature** (`6f6e9eb`, Vitest): 93
- **Test count after feature**: 149
- **Delta**: +56 Vitest tests, +1 Playwright test
- **Skipped tests**: none
- **Failures**: none

---

## Fix Plans

### Fix 1: Loader percent from the real progress port is not asserted (EVAL-06, M12)

- **Root cause**: `machines/loadEngine.test.ts:45` posts `{ percent: 0.42 }` but the worker answers the handshake, so the loader ends in `ready` (percent 100) and the forwarded value is never checked.
- **Fix task**: in `apps/web/src/domains/evaluation/machines/loadEngine.test.ts`, add a test with `new ScriptedWorker(false)` (no handshake), post `{ percent: 0.429, loaded: 429, total: 1000 }` on `worker.progressPort`, `await settle()`, then `expect(actor.getSnapshot().value).toBe("loading")` and `expect(actor.getSnapshot().context.percent).toBe(42)`.
- **Done when**: M12 is killed.
- **Priority**: Major

### Fix 2: The 120 s `uciok` limit is not asserted (EVAL-08, M16)

- **Root cause**: `engine/EngineClient.test.ts:75` passes `timeoutMs: 20`; nothing checks the default the loader uses.
- **Fix task**: in `machines/loadEngine.test.ts`, with `vi.useFakeTimers()` and `new ScriptedWorker(false)`, start the loader, `await vi.advanceTimersByTimeAsync(119_999)` → `value` is `"loading"`; advance 1 ms more → `"failed"` and `worker.terminated` is `true`. Restore real timers in `afterEach`.
- **Done when**: M16 is killed (and a 130 s mutant too).
- **Priority**: Major

### Fix 3: "Tentar de novo" is not exercised through the app (EVAL-09, M17)

- **Root cause**: `app/App.test.tsx:81-85` only checks the button exists; `app/EngineIndicator.tsx:19` is uncovered.
- **Fix task**: in `apps/web/src/app/App.test.tsx`, provide a fake `loadEngine` that sends `ENGINE.FAILED` on its first start and nothing on the second; click `getByRole("button", { name: "Tentar de novo" })` with `userEvent` and expect `getByText("Carregando o motor de análise… 0%")` and the button gone.
- **Done when**: M17 is killed and `EngineIndicator.tsx` reaches 100% lines.
- **Priority**: Major

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| EVAL-01 … EVAL-05 | Implementing | ✅ Verified |
| EVAL-06 | Implementing | ❌ Needs Fix (test) |
| EVAL-07 | Implementing | ✅ Verified |
| EVAL-08 | Implementing | ❌ Needs Fix (test) |
| EVAL-09 | Implementing | ❌ Needs Fix (test) |
| EVAL-10 … EVAL-20 | Implementing | ✅ Verified |

---

## Summary

**Overall**: ❌ Not Ready

**Spec-anchored check**: 17/20 ACs matched with discriminating evidence; 3 gaps (EVAL-06, EVAL-08, EVAL-09); 0 spec-precision gaps
**Sensor**: 17/20 non-equivalent mutants killed (1 equivalent)
**Gate**: `make check` 149 Vitest + 9 pytest passed; `make test-e2e` 5 passed

**What works**: build choice, UCI parsing and orientation, deeper search, `(none)` handling, serialized evaluation, terminate, loader states and cleanup, status texts and `aria-live`, real multi-thread engine reaching "Motor pronto" in Chromium with isolation.

**Issues found**: three tests missing (Fixes 1–3). No application-code defect found.

**Next steps**: implement Fixes 1–3 as test-only commits, then re-verify (round 2 of max 3).
