# F2 · Evaluation engine (Stockfish in the browser) Specification

## Problem Statement

Engine 3 (D1) must evaluate every position with the full Stockfish NNUE build in a Web Worker, multi-threaded when the page is cross-origin isolated. The ~94 MB download must start as soon as the page opens, show its progress without blocking anything, and expose a ready engine that the analysis pipeline (F4) can call. Nothing of this exists yet.

## Goals

- [ ] Opening the app downloads and starts the multi-thread engine; the status reaches "Motor pronto" in a real browser with isolation on.
- [ ] Other code gets an `EngineClient` that evaluates a FEN with ~200 ms per position and minimum depth 12.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Analysing a whole game, key moments, findings | F4 |
| Endgame tablebase (engine 4) | F5 |
| Final placement and styling of the indicator inside the Colar screen | F3 (this feature renders a minimal status line in the shell) |
| Production cache headers (`Cache-Control: immutable`) | No hosting is defined yet; file names already carry the version |
| Lite builds and the ASM-JS fallback | D1 mandates the full build |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Package and builds | npm `stockfish@19.0.1`; `bin/stockfish-19.{js,wasm}` (multi-thread) and `bin/stockfish-19-single.{js,wasm}` (single-thread) | overview.md: official npm WASM build, both full builds | y (docs) |
| Copy step | `apps/web/scripts/copy-engine.mjs` copies both builds plus `Copying.txt` to `public/engine/` as `stockfish-19.0.1-mt.*`, `stockfish-19.0.1-st.*`, run by `postinstall` and `make setup-web` | overview.md: copied from node_modules, versioned names, not in git | y (docs) |
| Build choice | `crossOriginIsolated === true` → multi-thread with `max(1, hardwareConcurrency − 1)` threads; otherwise single-thread with 1 thread | D1 | y (PRD) |
| Download progress | The page transfers a `MessagePort` to the worker as `{ progressPort }`; the engine posts `{ percent, loaded, total }` on it while it downloads the `.wasm` | Protocol built into stockfish.js 19 (`progressPort` message) | y (package code) |
| Ready | Engine is ready after `uci` → `uciok`, `setoption name Threads value N`, `isready` → `readyok` | Standard UCI handshake | y |
| Evaluation per position | `position fen <fen>` + `go movetime 200`; if the final `info` depth is below 12, run `go depth 12` on the same position and use that result | D1: ~200 ms per position with minimum depth 12 | n |
| Score orientation | Scores are stored from White's point of view (`cp` or `mate`), converted from the side-to-move score that UCI reports | One orientation avoids sign bugs downstream | n |
| Loading failure | Worker `error` event, a failed `.wasm` download, or no `uciok` within 120 s → `failed`; "Tentar de novo" terminates the old worker and restarts the download | step_01 state "Falha no download do motor" | n |
| Status text | "Carregando o motor de análise… N%" (N = floor of percent × 100), "Motor pronto", "Não foi possível carregar o motor" + "Tentar de novo" | step_01 C-14 and states table | y (PRD) |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Ship the engine files with the app ⭐ MVP

**Acceptance Criteria**:

1. WHEN `pnpm install` (or `make setup-web`) runs THEN `apps/web/public/engine/` SHALL contain `stockfish-19.0.1-mt.js`, `stockfish-19.0.1-mt.wasm`, `stockfish-19.0.1-st.js`, `stockfish-19.0.1-st.wasm` and `Copying.txt`, copied from the installed `stockfish` package. <!-- EVAL-01 -->
2. The `apps/web/public/engine/` folder SHALL stay out of git. <!-- EVAL-02 -->

### P1: Choose the right build ⭐ MVP

1. WHEN the page is cross-origin isolated THEN `chooseEngineBuild` SHALL return the multi-thread script URL and `hardwareConcurrency − 1` threads (minimum 1). <!-- EVAL-03 -->
2. WHEN the page is not cross-origin isolated THEN it SHALL return the single-thread script URL and 1 thread. <!-- EVAL-04 -->

### P1: Load the engine on page open with visible progress ⭐ MVP

1. WHEN the app starts THEN the engine loader SHALL start downloading immediately, without any user action. <!-- EVAL-05 -->
2. WHILE the engine downloads THE loader SHALL expose the progress as an integer percent 0–100, updated from the progress port. <!-- EVAL-06 -->
3. WHEN the handshake completes (`uciok`, Threads set, `readyok`) THEN the loader SHALL be in state `ready` and expose an `EngineClient`. <!-- EVAL-07 -->
4. IF the worker fails or `uciok` does not arrive within 120 s THEN the loader SHALL be in state `failed`. <!-- EVAL-08 -->
5. WHEN the user asks to retry from `failed` THEN the loader SHALL terminate the old worker and start a new download from 0%. <!-- EVAL-09 -->
6. WHILE loading, ready and failed, the status line SHALL read "Carregando o motor de análise… N%", "Motor pronto", and "Não foi possível carregar o motor" with a "Tentar de novo" button, announced with `aria-live="polite"`. <!-- EVAL-10 -->
7. WHEN the app is served with isolation in a real browser THEN the status SHALL reach "Motor pronto" using the multi-thread build. <!-- EVAL-11 -->

### P1: Evaluate a position ⭐ MVP

1. WHEN `EngineClient.evaluate(fen)` runs THEN it SHALL send `position fen <fen>` and `go movetime 200` and resolve with depth, score, best move (UCI) and principal variation (UCI) from the last `info` and `bestmove` lines. <!-- EVAL-12 -->
2. IF the depth reached is below 12 THEN the client SHALL run `go depth 12` on the same position and resolve with that search. <!-- EVAL-13 -->
3. The resolved score SHALL be from White's point of view: a side-to-move score of `cp 35` with Black to move SHALL become `cp -35`; `mate 3` with Black to move SHALL become `mate -3`. <!-- EVAL-14 -->
4. WHEN the position has no legal moves (`bestmove (none)`) THEN the client SHALL resolve with `bestMove: null` and the score the engine reported (`mate 0` / `cp 0`). <!-- EVAL-15 -->
5. WHEN `evaluate` is called again before the previous call resolves THEN calls SHALL run one after the other in call order. <!-- EVAL-16 -->
6. WHEN `terminate()` is called THEN the worker SHALL be terminated and pending evaluations SHALL reject. <!-- EVAL-17 -->

### P1: Domain boundary ⭐ MVP

1. UCI parsing, score orientation and build choice SHALL be pure functions in `src/domains/evaluation/model/` with no Worker, React or XState imports; the domain SHALL be used only through `src/domains/evaluation/index.ts`. <!-- EVAL-18 -->

---

## Edge Cases

- WHEN an `info` line has no `score` (e.g. `info string …`, `info currmove …`) THEN the parser SHALL ignore it. <!-- EVAL-19 -->
- WHEN an `info` line reports `lowerbound`/`upperbound` THEN the parser SHALL ignore its score. <!-- EVAL-20 -->

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | FENs come from the rules engine (F1); EVAL-15 covers terminal positions. |
| Failure / partial-failure states | EVAL-08, EVAL-09, EVAL-17. |
| Idempotency / retry | EVAL-09. |
| Auth boundaries & rate limits | N/A because the engine runs locally. |
| Concurrency / ordering | EVAL-16. |
| Data lifecycle / expiry | N/A because nothing is stored; browser HTTP cache keeps the file. |
| Observability | N/A in F2; analysis metrics belong to F4. |
| External-dependency failure | EVAL-08 (download/worker failure). |
| State-transition integrity | EVAL-05..09 (loader states). |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| EVAL-01 | P1: Files | Design | Pending |
| EVAL-02 | P1: Files | Design | Pending |
| EVAL-03 | P1: Build | Design | Pending |
| EVAL-04 | P1: Build | Design | Pending |
| EVAL-05 | P1: Loading | Design | Pending |
| EVAL-06 | P1: Loading | Design | Pending |
| EVAL-07 | P1: Loading | Design | Pending |
| EVAL-08 | P1: Loading | Design | Pending |
| EVAL-09 | P1: Loading | Design | Pending |
| EVAL-10 | P1: Loading | Design | Pending |
| EVAL-11 | P1: Loading | Design | Pending |
| EVAL-12 | P1: Evaluate | Design | Pending |
| EVAL-13 | P1: Evaluate | Design | Pending |
| EVAL-14 | P1: Evaluate | Design | Pending |
| EVAL-15 | P1: Evaluate | Design | Pending |
| EVAL-16 | P1: Evaluate | Design | Pending |
| EVAL-17 | P1: Evaluate | Design | Pending |
| EVAL-18 | P1: Boundary | Design | Pending |
| EVAL-19 | Edge case | Design | Pending |
| EVAL-20 | Edge case | Design | Pending |

**Coverage:** 20 total, 0 mapped to tasks, 20 unmapped ⚠️ (mapped in Tasks)

---

## Success Criteria

- [ ] Playwright sees "Motor pronto" on the preview server with `crossOriginIsolated === true`.
- [ ] `make check` passes with ≥ 90% coverage on `src/domains/evaluation/model/**`.
