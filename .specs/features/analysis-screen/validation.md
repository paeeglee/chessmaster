# F4b · Analysis pipeline and screen Validation

**Date**: 2026-11-24 (round 5, re-verification of the round-4 test fixes)
**Spec**: `.specs/features/analysis-screen/spec.md`
**Diff range**: `9de6292..8fd158f` (round 5 re-verified `8fd158f` on `fix/f4b-verification-gaps`; F4b on `main` is `91cc8cc`)
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: PASS

Round 5 confirms all six round-4 gaps (R4-1..R4-6) are fixed. The gates are green: `make check`, and `make test-e2e` 15/15 twice. The sensor caught all 16 unit faults (S09 and S16 included) and both e2e assertion faults. E4 (the played-line rule) is still a product decision for the user. See "Round 5" at the end of this file. Rounds 1–4 are kept below.

---

## Round 3 · Gate Check (HEAD `bb4d357`)

- **`make check`**: exit 0. Biome clean, tsc + mypy clean, Vitest 29 files / **302 passed** (98.53% stmts, 91.86% branches), pytest 75 passed.
- **`make test-e2e`**:
  - First run **exit 2**. 11 passed, 1 failed (`e2e/analysis.spec.ts:25`: `toHaveCount(5)` got `4`), and the cancel test did not run (serial mode).
  - The next 3 full runs exit 0 with 13 passed. **Full suite: 3/4 green.**
- **`analysis.spec.ts` alone** (`--repeat-each 3 --workers 1`, both tests): **6/6 green**.
- Likely cause: `fullyParallel: true` (`apps/web/playwright.config.ts:10`) runs the other spec files next to the analysis on this 10-CPU machine. The multi-thread 200 ms search becomes shallower, so a key moment is missed. `test.describe.configure({ mode: "serial" })` only serializes inside the file. The artifact of the failed run was overwritten, so which moment was missed was not recorded.
- Ports 4173/8000 were free before and after.

## Round 3 · Round-2 gaps re-checked

| Round-2 gap | Fix evidence | Result |
| ----------- | ------------ | ------ |
| N1 continuation false positive | `apps/web/src/domains/analysis/model/classify.ts` `classifyPly`: continuation = `[uciOf(reply), ...evaluations[index + 1].pv]`; the probe is a regression test in `apps/web/src/domains/analysis/model/classify.test.ts:393-407` (`expect(verdict.kind).toBe("none")`); `classifyGame` test at `classify.test.ts:411-418` (altered PV → still `mistake` 22...Ta7; without the post-reply evaluation → `none`). Spec AS-03 + assumption updated and marked **needs product confirmation** | ✅ (T01, T02, T03, T07 killed) |
| N2 `readyok` wait | `apps/web/src/domains/evaluation/engine/EngineClient.test.ts:228-262` - the fake answers `stop` with a late `bestmove h2h3` before `readyok`; the next evaluate resolves `bestMove: "e2e4"` | ✅ (T08 killed) |
| N3 continuation wiring | Machine uses `classifyPly` (`apps/web/src/domains/analysis/machines/analysisMachine.ts:100-105`); test `apps/web/src/domains/analysis/machines/analysisMachine.test.ts:159-183` (altered PV at index 44 → finding "22...Ta7?" and first key moment 22...Ta7) | ✅ (T04, T06 killed) |

AS-03 evidence was updated to the new timing: `analysisMachine.test.ts:87-96` (engine hangs at 46, findings ⊇ "Erro 22...Ta7?", all `ply <= 44`) and `AnalyzingScreen.test.tsx:125-131` (`evaluateUpTo(46)`).

## Round 3 · Discrimination Sensor (fresh scratch `f4b-sensor3` at `bb4d357`)

| # | Target | Mutation | Killed? |
| - | ------ | -------- | ------- |
| T01 | `classify.ts` `classifyPly` | drop the actual reply (PV-after only) | ✅ |
| T02 | `classifyPly` | reply without the PV after it | ✅ |
| T03 | `classifyPly` | reply + raw game continuation (round-2 rule) | ✅ |
| T04 | `analysisMachine.ts:103` | classify ply k at position k (not k+1) | ✅ |
| T05 | `analysisMachine.ts:122` | last ply not classified on EVALUATION.DONE | ❌ **Survived** |
| T06 | `analysisMachine.ts:100-105` | machine uses `classifyMove` without continuation | ✅ |
| T07 | `classify.ts:81` | better line for the mover chosen | ✅ |
| T08 | `EngineClient.ts:106` | `isready` not awaited (round-2 R06) | ✅ |
| T09 | `AnalyzingScreen.tsx:28` | last-move marks removed (M29) | ✅ |
| T10 | `contract.ts:28` | `>=` → `>` (M17) | ✅ |

**Sensor outcome (historical)**: 9/10 killed - ❌ FAIL. Scratch removed with `git worktree remove --force`; the real tree's `git status --porcelain` matches the baseline (empty).

## Round 3 · Remaining gaps (escalated to the user, iteration cap reached)

1. **E1 - `make test-e2e` is flaky under the parallel suite (Major for the gate).** 1 of 4 full runs failed with 4 key moments. Options, pick one:
   - (a) Put `analysis.spec.ts` in its own Playwright project that runs after the others (`dependencies`) with `workers: 1`, or give the reference-game test the machine alone.
   - (b) Keep the parallel run but assert what is stable: "22...Ta7?" first, at least 4 key moments, and the key moments equal to the classification of the evaluations the browser actually computed.
   - (c) Accept a longer `movetime` in e2e only.

   It is also a product signal: under CPU load the same game can give 4 or 5 key moments (D1 accepts non-determinism; consider stating it in step_02 §5 "Computador lento").
2. **E2 - Last-ply finding untested (T05 survived, Minor).** `apps/web/src/domains/analysis/machines/analysisMachine.ts:115-123`. Key moments are unaffected (the summary uses `classifyGame`), but a mistake on the last ply would never reach "Já encontrado". Fix: a machine test with a short game whose last ply is a mistake (or a fake evaluation that makes it one), asserting the finding after `EVALUATION.DONE`.
3. **E3 - Residual risk, not verified (no fix required now).** The UCI protocol says `isready` must be answered "also when the engine is calculating". Real Stockfish may therefore send `readyok` before the late `bestmove` of the stopped search. The new fake models the friendly order only. A sturdier sync would wait for the stopped search's `bestmove` (when a search was running) before `readyok`/the next `go`.
4. **E4 - Product confirmation pending.** The played-line rule (spec assumption "Played line robustness", `Confirmed? n`) changes how D3 is measured.

---

## Round 2 · Gate Check

- **`make check`** (HEAD `ec2f46c`): exit 0. Biome clean, tsc + mypy clean, Vitest 29 files / **298 passed** (98.52% stmts, 91.81% branches), pytest 75 passed.
- **`make test-e2e`**: exit 0, **13 passed** (34.3 s).
- **Flakiness of `analysis.spec.ts` "momentos-chave"**:
  - At `3e19578` (before the continuation rule) it failed in 2 of 5 runs, with 4 key moments instead of 5 (27...Tb7 missing). Multi-thread Stockfish at 200 ms is not deterministic.
  - At `ec2f46c`: 5 of 5 green (one `make test-e2e` + `--repeat-each 4 --workers 1`).
- Ports 4173/8000 were free before and after.

## Round 2 · Round-1 gaps re-checked

| Round-1 gap | Fix evidence | Result |
| ----------- | ------------ | ------ |
| 1 AS-11 highlight (M29) | `apps/web/src/shared/ui/Board.tsx:72` `data-mark`; `apps/web/src/domains/analysis/components/AnalyzingScreen.test.tsx:110-112` - f5/d4 `data-mark="last"`, `querySelectorAll("[data-mark]")` length 2 | ✅ R01 killed |
| 2 ≥ +2 boundary (M17) | `apps/web/src/domains/analysis/model/contract.test.ts:104-116` - timeline `[0,1,2,3,…]` → `{ ply: 2, label: "1...d5" }` | ✅ R02 killed |
| 3 caption/board mismatch | `progress.ts:24` now uses the last evaluated position; `AnalyzingScreen.tsx:97` uses `lastPly.moveNumber`; `AnalyzingScreen.test.tsx:115-122` - 89 evaluations → "Lance 44 de 72", "44...Texe3+", `/^lance 44 de 72/`; `summary.test.ts:91` - `(89,145,17800)` → 61%, move 44, 12 s. The spec assumption was updated to match | ✅ R03, R04 killed |
| 4 AI-failure warning | `apps/web/src/app/App.test.tsx:141` - `findByText("A explicação não pôde ser gerada.")` | ✅ |
| 5 AS-16 pipeline level | `apps/web/src/domains/analysis/machines/analysisMachine.test.ts:145-156` - 4-ply game reaches `done`, 5 calls, `keyMoments` `[]` | ✅ |
| 6/7 spec narrowings | `spec.md` assumptions: no stage times for 1–2; contract without FENs/scores, with rationale | ✅ (decisions recorded, `Confirmed? n`) |
| 8 stale `bestmove` after cancel | `EngineClient.ts:106` queues `isready`→`readyok`; `EngineClient.test.ts:222` - `["stop","isready"]` | ⚠️ Partial: R06 survived (see N2) |
| doc drift | `design.md` components table fixed | ✅ |

## Round 2 · Discrimination Sensor (fresh scratch `f4b-sensor2` at `ec2f46c`)

| # | Target | Mutation | Killed? |
| - | ------ | -------- | ------- |
| R01 | `AnalyzingScreen.tsx:28` | last-move marks removed | ✅ |
| R02 | `contract.ts:28` | `>=` → `>` | ✅ |
| R03 | `AnalyzingScreen.tsx:97` | caption back to `ceil(evaluated/2)` | ✅ |
| R04 | `progress.ts:24` | `currentPosition` back to `evaluated` | ✅ |
| R05 | `EngineClient.ts:106` | no `isready` after `stop` | ✅ |
| R06 | `EngineClient.ts:106` | `isready` sent but the next search does not wait for `readyok` | ❌ **Survived** |
| R07 | `classify.ts:81` | game line ignored | ✅ |
| R08 | `classify.ts:81` | better line (for the mover) chosen | ✅ |
| R09 | `classify.ts:138` | `classifyGame` continuation skips the opponent's reply | ❌ **Survived** |
| R10 | `analysisMachine.ts:112-114` | machine passes no continuation | ❌ **Survived** |
| R11 | `analysisMachine.ts:113` | machine continuation skips the reply | ❌ **Survived** |

**Sensor outcome (historical)**: 7/11 killed - ❌ FAIL. Scratch removed with `git worktree remove --force`; the real tree's `git status --porcelain` matches the baseline (empty).

### Probe: continuation rule false positive (scratch only, not committed)

The position is `4r1k1/8/8/8/4N3/3P4/8/6K1 w`. The knight on e4 is **defended** by the pawn on d3.

- **Played:** White plays the quiet Kg1-h2. The engine PV after the move has no capture (`g8f8`). In the game Black plays Rxe4 and White does not recapture (`continuation: ["e8e4","h2g3"]`).
- **Result:** `classifyMove` returns `{"kind":"mistake","moveLabel":"1.Rh2","loss":3,"mistakeType":"hanging-piece","lostPiece":{"type":"n","square":"e4"}}`.

Kh2 did not hang anything: the engine line shows no loss, and the knight was protected. The real error is White's next move, which fails to recapture. That move is classified on its own as well, so one blunder becomes **two key moments**, and the first is mislabeled "Peça atacada".

Why it happens: the game capture line stops at the mover's first non-capture, so the loss lands on the earlier move. This contradicts:

- **D3** (general.md 10, "confirmada pelo motor");
- the glossary definition of "Peça atacada" ("não foi … protegida").

The reference game still yields exactly 5 key moments, so the fixtures do not expose this.

## Round 2 · Ranked gaps

1. **N1 - Continuation rule false positive / double counting (Major, behavior).** In `apps/web/src/domains/analysis/model/classify.ts:78-83` the game line can override the engine without engine confirmation. Fix:
   - Only take the opponent's actual **reply** from the game: `[continuation[0], ...]`.
   - Then continue with the engine PV of the position after that reply (`evaluations[ply.index + 1].pv`, which starts with the mover's best recapture). The recapture then stays engine-confirmed.
   - In the machine this means a ply is classified once the position after the reply is evaluated (one ply later; the last ply falls back to the engine line).
   - Add the probe above as a regression test that expects `kind: "none"` for Kh2.
   - Record the rule in the spec and in `docs/architecture/overview.md`, and confirm it with the user, since it changes D3.
2. **N2 - `readyok` wait not discriminated (R06 survived, Minor).** The fake worker in `apps/web/src/domains/evaluation/engine/EngineClient.test.ts:206-225` never sends the late `bestmove` after `stop`. Fix: make the fake reply `bestmove a2a3` to `stop` asynchronously (before `readyok`), then assert that the next `evaluate` resolves with its own best move (`e2e4`), not the stale one.
3. **N3 - Continuation wiring untested (R09, R10, R11 survived, Minor).**
   - `classify.ts:138` and `analysisMachine.ts:112-114` are only covered through fixture PVs that already contain the captures.
   - The machine also re-implements `uciOf` inline, so findings during the analysis and the final summary can drift.
   - Fix: export or reuse one helper for "continuation of ply i". Add a `classifyGame` test and an analysis-machine test where the engine PV lacks the capture but the game has it, and assert that the finding and the key moment appear.

---

# Round 1 report (kept for history)

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | Model lives in `model/summary.ts` (design.md says `result.ts`); `EngineClient.cancel` added |
| T2 | ✅ Done | `buildContract` in `analysis/model/contract.ts` (design.md lists `explanation/model/contract.ts`; tasks.md explains why) |
| T3 | ✅ Done | Machines and wiring tested with `createActor` + `provide` |
| T4 | ⚠️ Partial | AS-11 highlight untested; caption/board off by one ply (see Gaps 1, 3) |
| T5 | ✅ Done | e2e runs the reference game with the real Stockfish and `AI_PROVIDER=fake` |

---

## Spec-Anchored Acceptance Criteria

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| AS-01 | Stages 1–2 done immediately, stage 3 running | `apps/web/src/domains/analysis/components/AnalyzingScreen.test.tsx:78-80` - `expect(stage("Leitura dos lances")).toHaveTextContent("… — concluída")`, `"Motor de avaliação — em andamento"`; `machines/analysisMachine.test.ts:81` - `expect(actor.getSnapshot().value).toBe("evaluating")` | ✅ PASS |
| AS-02 | plies+1 positions, one by one, in order; progress after each one | `machines/analysisMachine.test.ts:83-84` - `expect(engine.calls).toEqual(positionsOf(referenceRequest()))`, `toHaveLength(145)`; `AnalyzingScreen.test.tsx:103` - `aria-valuenow` = `floor(88/145*100)` | ✅ PASS |
| AS-03 | Finding added as soon as both positions around the ply are evaluated | `machines/analysisMachine.test.ts:88-95` - engine hangs at position 45; `findings` contains `"Adversário 12.Ce2?"`, `"Erro 22...Ta7?"` and every `ply <= 44` | ✅ PASS |
| AS-04 | Stage 3 done, stage 4 "não necessária", stage 5 starts with the contract | `AnalyzingScreen.test.tsx:126-127` - `"Tabela de finais — não necessária"`, `"Explicação da IA — em andamento"`; `analysisMachine.test.ts:102-108` - the explain input carries the 5 key moments | ✅ PASS |
| AS-05 | Result opens automatically with the analysis and the explanation | `analysisMachine.test.ts:110-113` - `output.explanation` toEqual the fake, `aiFailed` false; `app/appMachine.test.ts:193-194` - `value` `"review"`, `context.result` toBe(result); `e2e/analysis.spec.ts:29-36` | ✅ PASS |
| AS-06 | AI error → Result with the analysis and `aiFailed: true` | `analysisMachine.test.ts:121-122` - `toMatchObject({ explanation: null, aiFailed: true })`, 5 key moments | ✅ PASS (machine). The UI warning is untested (Gap 4) |
| AS-07 | Evaluation fails → stage 3 failed + "Tentar de novo" restarts from the first position | `analysisMachine.test.ts:128-134` - `evaluationFailed`, after RETRY `evaluations` toEqual `[]`, 145 calls; `AnalyzingScreen.test.tsx:138-140` - `"— falhou"` → click → `"— em andamento"` | ✅ PASS |
| AS-08 | Engine gets `stop`, the pipeline stops, back to Colar with the same text and choices | `evaluation/engine/EngineClient.test.ts:218-221` - running + queued reject `"Análise cancelada"`, `commands` contains `"stop"`; `analysisMachine.test.ts:141-142` - `engine.cancels` toBe(1); `appMachine.test.ts:156-163`; `e2e/analysis.spec.ts:41-48` | ✅ PASS |
| AS-09 | Step 2, title, five stages in order with their state | `AnalyzingScreen.test.tsx:73-94` - heading, `aria-current="step"`, order array | ✅ PASS |
| AS-10 | "lance N de M · ~S s restantes" + progressbar `aria-valuenow` = percent | `model/summary.test.ts:90-95` - `analysisProgress(87,145,17400)` toEqual `{percent:60,currentMove:44,totalMoves:72,remainingSeconds:12}`; `components.test.tsx:38-39`; `AnalyzingScreen.test.tsx:103-104` (the screen-level test does not assert the `~S s` part; only the regex `^lance 44 de 72`) | ✅ PASS |
| AS-11 | Board = position being evaluated, player's side, last move highlighted, caption "Lance N de M" + last move | `AnalyzingScreen.test.tsx:105-108` - `"Lance 44 de 72"`, `"44.Cd4"`, first square `h1` (Black's side). **Highlight not asserted (M29 survived).** The board shows the last *evaluated* position, not the one being evaluated, so at odd counts the caption is one move ahead of the label (Gap 3) | ❌ GAP |
| AS-12 | Tag + text, max 6, chronological | `components.test.tsx:66-72` - items `"Adversário23? achado 23"`, `toHaveLength(6)`; `summary.test.ts:53-55` - sorted plies; `AnalyzingScreen.test.tsx:116-118` | ✅ PASS |
| AS-13 | `aria-live="polite"` on stage changes, not every position | `AnalyzingScreen.test.tsx:128-131` - `"Etapa 5 de 5: explicação da IA."` has `aria-live="polite"`; M30 (count added to the live text) killed | ✅ PASS |
| AS-14 | Every contract field filled from the engines | `analysis/model/contract.test.ts:31-81` - level, priorities, color, result, termination, outcome, `total_moves` 72, moves PT SAN, key moments with type/piece/best move, opponent mistakes, strengths, patterns, timeline | ⚠️ Spec-precision gap: general.md 7.2 lists "posições e avaliações", but AS-14 and the F6 schema leave out per-position evaluations/FENs |
| AS-15 | 5 key moments 22...Ta7, 27...Tb7, 41...Ta1, 43...Te6, 56...Ta8; outcome "win"; advantage start 12...Bxa1 | `contract.test.ts:49-55`, `:37` `outcome_for_player: "win"`, `:67` `toEqual({ ply: 24, label: "12...Bxa1" })` | ✅ PASS. The ≥ +2 boundary is not discriminated (M17 survived, Gap 2) |
| AS-16 | No key moments → still reaches the Result | `summary.test.ts:82-83` - `keyMoments` toEqual `[]` (summary level only; no machine/app test reaches `done`/`review` with zero key moments) | ⚠️ Partial (Gap 5) |

### step_02 PRD §6 acceptance criteria

| PRD AC | Evidence | Result |
| ------ | -------- | ------ |
| Stages 1–2 completed in < 1 s, stage 3 shows real progress | `AnalyzingScreen.test.tsx:78-80` (synchronous at mount); `e2e/analysis.spec.ts:26` progressbar visible | ✅ |
| "22...Ta7?" shows before the analysis ends | `analysisMachine.test.ts:88-95` (engine hung at position 45); `AnalyzingScreen.test.tsx:115-117`. Note: `e2e/analysis.spec.ts:28` does not discriminate this, because the Result placeholder also shows "22...Ta7?" | ✅ |
| Cancel → Colar keeps the text and choices | `appMachine.test.ts:148-163`; `e2e/analysis.spec.ts:39-48` | ✅ |
| AI failed → Result with engine data and the failure warning | Machine: `analysisMachine.test.ts:121`. The warning "A explicação não pôde ser gerada." (`apps/web/src/app/App.tsx:37`) has no test | ⚠️ Partial (Gap 4) |

**Status**: ❌ Gaps present (AS-11) · ⚠️ 2 spec-precision/partial items (AS-14, AS-16)

---

## Discrimination Sensor

Scratch worktree at `HEAD` (`.../scratchpad/f4b-sensor`), `pnpm install --frozen-lockfile` + `copy-engine.mjs`. Each mutant was applied alone, `pnpm exec vitest run` was run (293 tests), and the file was restored.

| # | File | Mutation | Killed? |
| - | ---- | -------- | ------- |
| M01 | `analysis/machines/analysisMachine.ts:37` | skip the initial position | ✅ |
| M02 | `analysisMachine.ts:52` | evaluate positions in reverse order | ✅ |
| M03 | `analysisMachine.ts:103,121` | findings only at EVALUATION.DONE | ✅ |
| M04 | `analysisMachine.ts:149` | `aiFailed` not set on AI error | ✅ |
| M05 | `analysisMachine.ts:89` | RETRY does not reset evaluations/findings | ✅ |
| M06 | `analysisMachine.ts:66` | cleanup does not call `engine.cancel()` | ✅ |
| M07 | `evaluation/engine/EngineClient.ts:101` | cancel does not reject queued work | ✅ |
| M08 | `EngineClient.ts:102` | cancel does not send `stop` | ✅ |
| M09 | `analysis/model/progress.ts:25` | percent divided by plies+2 | ✅ |
| M10 | `progress.ts:29` | remaining positions off by one | ✅ |
| M11 | `progress.ts:29` | floor instead of ceil | ✅ |
| M12 | `progress.ts:21` | "de M" uses plies | ✅ |
| M13 | `progress.ts:24` | "Lance N" uses plies | ✅ |
| M14 | `components/AnalyzingScreen.tsx:61` | stage 4 "done" instead of "não necessária" | ✅ |
| M15 | `model/contract.ts:14` | `outcome_for_player` inverted | ✅ |
| M16 | `contract.ts:45` | `advantage_started_at` shifted one ply | ✅ |
| M17 | `contract.ts:28` | `balance >= 2` → `balance > 2` | ❌ **Survived** |
| M18 | `contract.ts:51` | `best_move` null | ✅ |
| M19 | `model/classify.ts:87` | best move in English SAN | ✅ |
| M20 | `contract.ts:37` | `total_moves` = plies | ✅ |
| M21 | `contract.ts:41` | moves `san` not Portuguese | ✅ |
| M22 | `app/appMachine.ts:73` | app does not store the engine | ✅ |
| M23 | `appMachine.ts:104` | REVIEW.NEW_GAME keeps the text | ✅ |
| M24 | `analysisMachine.ts:145` | explanation not stored on success | ✅ |
| M25 | `model/findings.ts:43` | Erro/Adversário tags swapped | ✅ |
| M26 | `components/FindingsSoFar.tsx:12` | 7 findings visible | ✅ |
| M27 | `explanation/client/explanationClient.ts:37` | wrong endpoint | ✅ |
| M28 | `AnalyzingScreen.tsx:89` | board ignores the player's color | ✅ |
| M29 | `AnalyzingScreen.tsx:28` | last-move highlight removed | ❌ **Survived** |
| M30 | `AnalyzingScreen.tsx:80` | aria-live announces every position | ✅ |
| M31 | `appMachine.ts:93` | ANALYSIS.CANCELLED has no target | ✅ |

**Sensor depth**: extended lightweight (31 manual mutants; e2e not re-run per mutant because the unit suite killed every pipeline mutant).
**Sensor outcome (historical)**: 29/31 killed - ❌ FAIL
**Isolation**: scratch removed with `git worktree remove --force`; the real tree's `git status --porcelain` matches the pre-sensor baseline (empty).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / no scope creep | ✅ |
| Surgical changes | ✅ (`theme.css` line-height tweak is justified by the mockups) |
| Matches patterns (XState `setup`, actors in `provide`, pure `model/`) | ✅ |
| DDD boundaries (`index.ts` entry points; `model/` free of xstate) | ✅ |
| Spec-anchored outcome check | ⚠️ AS-11 highlight, AS-16 end-to-end path |
| Per-layer coverage (domain 1:1 ACs) | ✅ machine transitions covered; coverage 98.2% stmts / 90.97% branches |
| Every test maps to a spec requirement | ✅ |
| Guidelines followed: `docs/engineering/quality.md`, `docs/architecture/code-structure.md` | ✅ |

## Edge Cases

- [x] No key moments: no code path depends on the count, and the summary is empty but complete (`summary.test.ts:74-84`). No pipeline-level test.
- [x] Engine failure + retry: `analysisMachine.test.ts:125-135`.
- [x] Cancel with queued searches: `EngineClient.test.ts:206-225`.
- [ ] Re-analysis right after cancel: not covered (see Risk 8).

---

## Gate Check

- **`make check`**: exit 0. Biome clean; tsc + mypy clean; Vitest **29 files, 293 tests passed** (coverage 98.24% stmts, 90.97% branches, 97.94% funcs, 98.43% lines); pytest 75 passed (99%).
- **`make test-e2e`**: exit 0. **13 passed** (34.9 s), including `analysis.spec.ts` with the reference game (31.7 s, real Stockfish, `AI_PROVIDER=fake`) and cancel.
- **Test count before feature**: 253 web tests (293 − 40 added; 0 removed). **After**: 293. **Delta**: +40 (plus 2 e2e).
- **Skipped**: none. **Failures**: none. Ports 4173/8000 free after the run.

---

## Gaps and Fix Plans (ranked)

1. **AS-11 highlight unasserted (M29 survived)** - Major. `apps/web/src/domains/analysis/components/AnalyzingScreen.test.tsx:98-109`. The marks are only visible through CSS classes. Fix: expose the mark on the square (e.g. `data-mark={marks[name]}` in `apps/web/src/shared/ui/Board.tsx:71`), then assert that the from/to squares of 44.Cd4 carry `last` and that other squares do not.
2. **`advantage_started_at` ≥ +2 boundary (M17 survived)** - Minor. `apps/web/src/domains/analysis/model/contract.test.ts:66-68`. Fix: add a unit test with a synthetic `AnalysisSummary` whose `materialTimeline` reaches exactly `2` (e.g. `[0, 1, 2, 3]`) and expect `advantage_started_at.ply === 2`.
3. **AS-11 caption/board mismatch** - Minor (behavior). `apps/web/src/domains/analysis/components/AnalyzingScreen.tsx:22-28,97-99`. The board and its label show the last evaluated position (index n−1), but "Lance N" is computed for position n. After an odd number of evaluations, e.g. 89, the screen shows "Lance 45 de 72" next to "44...X", while the mockup pairs "Lance 44 de 72" with "44...Texe3+". Fix: derive N from the displayed ply (`Math.ceil(lastPly.index / 2)`), or show the position being evaluated (`plies[evaluations.length - 1]`) so the board, label and caption agree. Add a test at an odd count.
4. **AI-failure warning on the Result is untested (PRD §6 AC4)** - Minor. `apps/web/src/app/App.tsx:34-38`. Fix: a component test rendering the app in `review` with `aiFailed: true`, asserting "A explicação não pôde ser gerada." ("Tentar de novo" on the Result belongs to F7).
5. **AS-16 only at summary level** - Minor. `apps/web/src/domains/analysis/model/summary.test.ts:74-84`. Fix: a machine test with a short game (e.g. the first 2 plies and a matching fake engine) that reaches `done` with `output.keyMoments` `[]`.
6. **Spec-precision: per-stage time** - Cosmetic. step_02 §2 says each stage has a time, and the mockup shows "0,2 s" / "0,4 s"; the spec and the screen leave it out. Decide and log it in the spec.
7. **Spec-precision: AS-14 vs general.md 7.2** - The contract has no per-position evaluations/FENs ("lances, posições e avaliações"). Confirm the F6 schema is the intended reading and log the decision.
8. **Risk (no fix required now)**: `EngineClient.cancel` (`apps/web/src/domains/evaluation/engine/EngineClient.ts:97-104`) does not wait for the `bestmove` that Stockfish sends after `stop`. A search started before that late line arrives could take it as its own result. Consider an `isready`/`readyok` sync (or discarding one `bestmove`) after cancel.
9. **Doc drift**: `design.md` names `analysis/model/result.ts` and `explanation/model/contract.ts`; the code uses `analysis/model/summary.ts` and `analysis/model/contract.ts`.

---

## Requirement Traceability Update

| Requirement | New Status |
| ----------- | ---------- |
| AS-01..AS-10, AS-12, AS-13, AS-15 | ✅ Verified |
| AS-11 | ❌ Needs Fix (Gaps 1, 3) |
| AS-14 | ⚠️ Verified with spec-precision gap (Gap 7) |
| AS-16 | ⚠️ Partial evidence (Gap 5) |

## Summary

**Overall**: ❌ Not Ready (FAIL)
**Spec-anchored check**: 13/16 matched, 1 gap (AS-11), 2 flagged (AS-14 precision, AS-16 partial)
**Sensor**: 29/31 killed (M17, M29 survived)
**Gate**: `make check` 293 + 75 passed; `make test-e2e` 13 passed
**Next steps**: fix Gaps 1–3 (plus 4–5 cheaply), then re-verify.

---

## Author follow-up after round 3 (not re-verified: round limit reached)

The round limit in validate.md was reached, so these fixes were applied by the author and are reported to the user instead of a 4th verifier round.

| Gap | Resolution | Evidence |
| --- | ---------- | -------- |
| E1 flaky e2e | `full-analysis` Playwright project (analysis/review/training specs) runs after the others with `workers: 1`. Diagnosis with 8 serial real-engine runs: only 27...Tb7 varies (missed 2/8); it is borderline for the engine itself (eval −8.70 → −7.37, Be2 vs Nxf4 near-equal at 200 ms). e2e asserts the 4 stable moments; Vitest still asserts all 5 with the fixed fixture | `apps/web/playwright.config.ts`, `apps/web/e2e/analysis.spec.ts:32`, `docs/architecture/overview.md` ("Lances limítrofes"); `make test-e2e` 3/3 green |
| E2 last-ply finding | Machine test with the game cut at 22...Ta7 expects the finding after EVALUATION.DONE; mutant (no classification on DONE) killed | `apps/web/src/domains/analysis/machines/analysisMachine.test.ts` (last test) |
| E3 readyok before bestmove | `cancel()` waits for the stopped search's `bestmove` (2 s cap) before `isready`; tests for readyok-first order, timeout and no-search cancel; mutant (skip the wait) killed | `apps/web/src/domains/evaluation/engine/EngineClient.ts` (`cancel`), `EngineClient.test.ts` |
| E4 product confirmation | Open: the played-line rule (actual reply + engine PV after it) refines how D3 is measured; flagged to the user | `.specs/features/analysis-screen/spec.md` (assumptions) |

---

## Round 4 (re-verification on main)

**HEAD**: `9d8486c` (`main`: F4b `91cc8cc` + F7 `9d8486c`). Worktree `.worktrees/docs/f4b-reverification`.
**Verdict**: ❌ FAIL. 14/16 sensor mutants killed. Both survivors are in the E3 tests. Every AC has spec-anchored evidence, and every gate is green.

### Round 4 · Gate Check

- **`make check`**: exit 0. Biome clean, tsc + mypy clean, Vitest **33 files / 365 passed** (98.23% stmts, 90.54% branches, 98.02% funcs, 98.51% lines), pytest **75 passed**.
- **`make test-e2e`**: **3 full runs, 3/3 exit 0, 14 passed each** (1.1–1.2 min). The log confirms the order: all 11 `[chromium]` tests finish first, then `[full-analysis]` runs `analysis.spec.ts:7`, `analysis.spec.ts:34` and `review.spec.ts:7` one at a time.
- Ports 4173/8000 were checked before each run, with a wait loop because another verifier shares them. They were free each time.

### Round 4 · Post-round-3 fixes (E1–E4)

| Fix | Evidence | Result |
| --- | -------- | ------ |
| E1 full-analysis project | `apps/web/playwright.config.ts:4` (`FULL_ANALYSIS_SPECS`), `:23` (`testIgnore` in `chromium`), `:31-33` (`testMatch`, `workers: 1`, `dependencies: ["chromium"]`). `apps/web/e2e/analysis.spec.ts:22` first moment `toContainText("22...Ta7?")`; `:24` count 4 or 5; `:25-27` every `STABLE_MOMENTS` label (`apps/web/e2e/reference.ts`: 22...Ta7, 41...Ta1, 43...Te6, 56...Ta8) is present. 3/3 green | ✅ (weakness R4-3) |
| E2 last-ply finding | `apps/web/src/domains/analysis/machines/analysisMachine.test.ts:185-199`: the game is cut at 22...Ta7, the test expects 45 calls and `labels.at(-1)` toBe `"22...Ta7?"`. Mutant S04 (no classification on DONE) is killed only by this test | ✅ |
| E3 stale `bestmove` | `apps/web/src/domains/evaluation/engine/EngineClient.ts:101-124`. `EngineClient.test.ts:266-295` covers `readyok` before `bestmove`: the next search resolves `e2e4`, not the stale `h2h3`, and `isready` is sent twice. `:297-321` covers the cap with fake timers. `:323-340` covers cancel without a search: the command tail is `stop, isready, position, go`. Mutants S06, S07 and S08 are killed. **S09 and S16 survive (R4-1, R4-2)** | ⚠️ behavior correct, tests not discriminating |
| E4 played-line rule | Still `Confirmed? n` in `spec.md` (assumption "Played line robustness"). This is a product decision, so it was not verified. **It is still waiting for the user** | ⏸ user decision |

### Round 4 · Spec-anchored AC check (current line numbers)

| ID | Evidence (`file:line` - assertion) | Result |
| -- | ---------------------------------- | ------ |
| AS-01 | `apps/web/src/domains/analysis/components/AnalyzingScreen.test.tsx:78-82`: stages 1–2 "— concluída", stage 3 "— em andamento", stages 4–5 "— aguardando"; `analysisMachine.test.ts:81` `value` toBe `"evaluating"` | ✅ |
| AS-02 | `analysisMachine.test.ts:83-84`: `calls` toEqual `positionsOf(...)`, length 145; `AnalyzingScreen.test.tsx:103`: `aria-valuenow` = `floor(88/145*100)` | ✅ |
| AS-03 | `analysisMachine.test.ts:87-97`: engine hangs at 46, findings ⊇ "Adversário 12.Ce2?" and "Erro 22...Ta7?", all `ply <= 44`; `:185-199`: last ply on DONE; `:159-183`: actual-reply continuation | ✅ |
| AS-04 | `AnalyzingScreen.test.tsx:139-140`: "Tabela de finais — não necessária", "Explicação da IA — em andamento"; `analysisMachine.test.ts:103-109`: the explain input has the 5 key moments | ✅ |
| AS-05 | `analysisMachine.test.ts:110-114`; `apps/web/src/app/appMachine.test.ts:166` (review with result); `e2e/analysis.spec.ts:14,29` | ✅ |
| AS-06 | `analysisMachine.test.ts:122` `toMatchObject({ explanation: null, aiFailed: true })`; UI warning `apps/web/src/app/App.test.tsx:141` "A explicação não pôde ser gerada." (the round-1 Gap 4 is closed) | ✅ |
| AS-07 | `analysisMachine.test.ts:129-135`: `evaluationFailed`, RETRY → `evaluations` `[]`, 145 calls; `AnalyzingScreen.test.tsx:151-153`: "— falhou" → "— em andamento" | ✅ |
| AS-08 | `EngineClient.test.ts:206-228`: running and queued searches reject "Análise cancelada", the commands go `stop` → `isready`, and the next search resolves; `analysisMachine.test.ts:143` `cancels` toBe 1; `appMachine.test.ts:148`; `e2e/analysis.spec.ts:34-43` | ✅ |
| AS-09 | `AnalyzingScreen.test.tsx:70-95`: heading, `aria-current`, the five stages in order | ✅ |
| AS-10 | `apps/web/src/domains/analysis/components/components.test.tsx:39` "lance 44 de 72 · ~12 s restantes"; `AnalyzingScreen.test.tsx:103-104` | ✅ |
| AS-11 | `AnalyzingScreen.test.tsx:105-112`: "Lance 44 de 72", "44.Cd4", Black's side (`h1` first), `data-mark="last"` on f5/d4 and exactly 2 marks; `:115-121`: odd count shows "44...Texe3+" with "Lance 44 de 72" | ✅ (round-1 Gaps 1 and 3 closed) |
| AS-12 | `components.test.tsx:63-72` tag + text, max 6; `AnalyzingScreen.test.tsx:124-131` | ✅ |
| AS-13 | `AnalyzingScreen.test.tsx:141` "Etapa 5 de 5: explicação da IA." has `aria-live="polite"` | ✅ |
| AS-14 | `apps/web/src/domains/analysis/model/contract.test.ts` (all fields; key-moment `loss` is checked, S12 killed). The contract has no positions or scores, which narrows general.md 7.2 and is logged in the spec with `Confirmed? n` | ⚠️ spec decision still unconfirmed |
| AS-15 | `contract.test.ts:67` `advantage_started_at` `{ ply: 24, label: "12...Bxa1" }`; `:113-115` boundary exactly 2 → ply 2; 5 key moments in the same file | ✅ |
| AS-16 | `analysisMachine.test.ts:146-157`: the 4-ply game reaches `done`, `keyMoments` `[]` | ✅ (round-1 Gap 5 closed) |

| step_02 §6 AC | Evidence | Result |
| ------------- | -------- | ------ |
| Stages 1–2 done in < 1 s, stage 3 shows real progress | `AnalyzingScreen.test.tsx:78-80` (synchronous at mount); `e2e/analysis.spec.ts:11` progressbar | ✅ |
| "22...Ta7?" before the end | `analysisMachine.test.ts:87-97`; `AnalyzingScreen.test.tsx:130`. `e2e/analysis.spec.ts:13` still does not discriminate this (R4-4) | ✅ |
| Cancel keeps the text and choices | `appMachine.test.ts:148`; `e2e/analysis.spec.ts:37-43` | ✅ |
| AI failure → Result with data and warning | `App.test.tsx:112-143`: the warning plus "Nenhuma perda de material importante." | ✅ |

### Round 4 · Discrimination Sensor (fresh scratch `f4b-sensor4` at `9d8486c`)

The scratch is a detached `git worktree` in the session scratchpad, set up with `pnpm install --frozen-lockfile` and `copy-engine.mjs`. The baseline Vitest run was 365/365. Each mutant was applied alone, the full `vitest run` was executed, and the file was restored.

| # | Target | Mutation | Killed? | Killed by |
| - | ------ | -------- | ------- | --------- |
| S01 | `analysis/model/classify.ts` `classifyPly` | continuation drops the actual reply | ✅ | `classify.test.ts`, `analysisMachine.test.ts:159` |
| S02 | `classifyPly` | `previousFen` not passed (strength rule) | ✅ | review tests (F7) via the reference fixture |
| S03 | `analysisMachine.ts:106-108` | no findings on POSITION.EVALUATED | ✅ | `analysisMachine.test.ts:87`, `AnalyzingScreen.test.tsx:124` |
| S04 | `analysisMachine.ts:122` | last ply not added on DONE (E2) | ✅ | `analysisMachine.test.ts:185` |
| S05 | `analysis/model/progress.ts:24` | caption follows position n, not n−1 | ✅ | `summary.test.ts`, `AnalyzingScreen.test.tsx:115` |
| S06 | `EngineClient.ts:107` | cancel does not send `stop` | ✅ | `EngineClient.test.ts:206,323` |
| S07 | `EngineClient.ts:106` | never wait for the stale `bestmove` (E3) | ✅ | `EngineClient.test.ts:266` |
| S08 | `EngineClient.ts:121` | no `isready` after cancel | ✅ | `EngineClient.test.ts:206,266,323` |
| S09 | `EngineClient.ts:28` | `STALE_BESTMOVE_TIMEOUT_MS` 2000 → 60000 | ❌ **Survived** | the test advances by the imported constant |
| S10 | `analysisMachine.ts:135` | RETRY has no target | ✅ | `analysisMachine.test.ts:126`, `AnalyzingScreen.test.tsx:147` |
| S11 | `analysisMachine.ts:150` | AI error leaves `aiFailed: false` | ✅ | `analysisMachine.test.ts:117` |
| S12 | `analysis/model/contract.ts:52` | key-moment `loss` → 0 | ✅ | `contract.test.ts` |
| S13 | `AnalyzingScreen.tsx:61` | stage 4 "done" instead of "não necessária" | ✅ | `AnalyzingScreen.test.tsx:134` |
| S14 | `AnalyzingScreen.tsx:66` | stage 5 "waiting" while explaining | ✅ | `AnalyzingScreen.test.tsx:134` |
| S15 | `AnalyzingScreen.tsx:45` | stage 3 "running" when evaluation failed | ✅ | `AnalyzingScreen.test.tsx:147` |
| S16 | `EngineClient.ts:165-167` | `searching` never reset, so every later cancel waits for a `bestmove` that never comes | ❌ **Survived** | `EngineClient.test.ts:323` still passes but takes **2004 ms** (measured), which contradicts its title "não espera bestmove" |

**Sensor outcome (historical)**: 14/16 killed - ❌ FAIL. Scratch removed with `git worktree remove --force`; `git worktree list` no longer shows it; the real tree's `git status --porcelain` matches the pre-sensor baseline (empty).

S16 matters in the app. `analysisMachine` calls `engine.cancel()` every time it leaves `evaluating` (`analysisMachine.ts:64-67`), including after a normal EVALUATION.DONE. With S16, each later engine use would wait 2 s. The current code is correct; the tests do not protect it.

### Round 4 · Ranked gaps

1. **R4-1 - "cancel without a search does not wait" is not asserted (S16 survived, Minor).** `apps/web/src/domains/evaluation/engine/EngineClient.test.ts:323-340`. Fix: run the test with `vi.useFakeTimers()`, call `client.cancel()` and `client.evaluate(START_FEN)`, then `await vi.advanceTimersByTimeAsync(0)` and assert the next evaluation already resolved (or that `worker.commands` already contains `isready` and `go movetime 200`) **without** advancing `STALE_BESTMOVE_TIMEOUT_MS`.
2. **R4-2 - the 2 s cap is constant-coupled (S09 survived, Minor).** `EngineClient.test.ts:316` advances by the imported `STALE_BESTMOVE_TIMEOUT_MS`, so any value passes. Fix: assert `STALE_BESTMOVE_TIMEOUT_MS` toBe `2000`, or advance by a literal `1999` (expect still pending) and then `1` (expect resolved). The second also proves the next search does not start before the cap.
3. **R4-3 - e2e accepts any 5th key moment (Minor).** `apps/web/e2e/analysis.spec.ts:24-27` checks that the count is 4 or 5 and the 4 stable labels, but an unexpected 5th moment would pass. Fix: also assert that every listed moment is one of `[...STABLE_MOMENTS, "27...Tb7"]`.
4. **R4-4 - e2e "22...Ta7? before the end" is still not discriminating (Cosmetic, carried from round 1).** `e2e/analysis.spec.ts:13` can match the Result screen. Fix: assert it while `heading "Analisando sua partida…"` is still visible (scope the lookup to the "Já encontrado" region).
5. **R4-5 - spec drift (Cosmetic).** `.specs/features/analysis-screen/spec.md:9` (Goal) still says "with the five key moments found" in the real browser, while `docs/architecture/overview.md` ("Lances limítrofes") and the e2e accept 4 or 5. Fix: reword the goal to "the four stable key moments (27...Tb7 is borderline; the exact five are asserted in Vitest)".
6. **R4-6 - real-engine cancel → re-analyze path is not exercised end to end (Risk).** `e2e/analysis.spec.ts:34-43` stops at "Analisar partida →" enabled. Fix: cancel mid-run, start again, and assert the first finding "22...Ta7?". This checks E3 against real Stockfish, which the fakes only model.
7. **E4 - product confirmation pending (user decision).** The played-line rule (actual reply + PV after it) is still `Confirmed? n` in `spec.md`.

### Round 4 · Traceability

AS-01..AS-13, AS-15, AS-16: ✅ Verified. AS-14: ⚠️ verified, but the no-positions/scores narrowing is still unconfirmed. AS-08 (E3 hardening): behavior verified, tests need R4-1 and R4-2.

**Next steps**: fix R4-1 and R4-2 (test-only, about 15 lines in `EngineClient.test.ts`), optionally R4-3..R4-6, then re-run the sensor on S09 and S16. This round runs after the 3-iteration cap at the user's explicit request; the result goes back to the user.

---

## Round 5 (re-verification of the round-4 fixes)

**HEAD**: `8fd158f` ("test(web): pin the stale bestmove wait and harden the analysis e2e") on `fix/f4b-verification-gaps`, on top of `main` `9d8486c`. The commit only touches tests and the spec goal: `apps/web/src/domains/evaluation/engine/EngineClient.test.ts`, `apps/web/e2e/analysis.spec.ts` and `.specs/features/analysis-screen/spec.md:9`. Production code is unchanged since round 4, so the round-4 AC table still applies.
**Verdict**: ✅ PASS

### Round 5 · Gate Check

- **`make check`**: exit 0. Biome clean, tsc + mypy clean, Vitest **33 files / 365 passed** (98.23% stmts, 90.54% branches), pytest **75 passed**.
- **`make test-e2e`**: **2 full runs, 2/2 exit 0, 15 passed each** (1.6 min and 1.9 min). `[full-analysis]` runs after `[chromium]`: `analysis.spec.ts:7`, `:40`, `:52` (new) and `review.spec.ts:7`.
- Ports 4173/8000 were checked before each run, with a wait loop because another verifier shares them. They were free each time.

### Round 5 · Round-4 gaps re-checked

| Gap | Fix evidence | Result |
| --- | ------------ | ------ |
| R4-1 (S16) no-search cancel waits | `EngineClient.test.ts:330-357`: fake timers, `advanceTimersByTimeAsync(0)` only (`:347`), then `expect(result).toMatchObject({ bestMove: "e2e4" })` (`:348`) and the command tail `stop, isready, position, go` | ✅ S16 killed |
| R4-2 (S09) 2 s cap | `EngineClient.test.ts:315` `expect(STALE_BESTMOVE_TIMEOUT_MS).toBe(2000)`; `:321` advance 1999 → `settled` false; then 1 ms → resolves `e2e4` | ✅ S09 killed |
| R4-3 any 5th moment | `apps/web/e2e/analysis.spec.ts:30-33`: every listed moment ∈ `[...STABLE_MOMENTS, "27...Tb7"]` | ✅ X2 killed |
| R4-4 "22...Ta7?" before the end | `e2e/analysis.spec.ts:13-15`: the label is looked up inside `region "Já encontrado"`, and the heading "Analisando sua partida…" is still visible right after | ✅ X1 killed |
| R4-5 spec goal | `.specs/features/analysis-screen/spec.md:9`: "four stable key moments … the exact five are checked in Vitest" | ✅ |
| R4-6 cancel → re-analyze, real engine | `e2e/analysis.spec.ts:52-66`: cancel during evaluation, analyze again, "22...Ta7?" in "Já encontrado", then the Result. This is a smoke test of the real path. It does not catch a stale `bestmove` (X3 survives at e2e level); the unit test `EngineClient.test.ts:266` does (S07) | ✅ (see note) |
| E4 played-line rule | `spec.md` assumption "Played line robustness" is still `Confirmed? n` | ⏸ user decision |

### Round 5 · Discrimination Sensor (fresh scratch `f4b-sensor5` at `8fd158f`)

**Unit level.** The scratch is a detached `git worktree`, with `pnpm install --frozen-lockfile` and `copy-engine.mjs`; the baseline was 365/365. I re-ran the same 16 faults as round 4 (S01–S16, defined in the Round 4 table), each alone with a full `vitest run`. **16/16 killed.** S09 is killed by "segue sem o bestmove atrasado depois do limite de tempo" and S16 by "cancelar sem busca em andamento não espera bestmove".

**E2e level.** Each fault was built with `pnpm build` and run with `playwright test --project=full-analysis --no-deps e2e/analysis.spec.ts`, after checking the ports were free.

| # | Mutation | Targets | Killed? |
| - | -------- | ------- | ------- |
| X1 | no findings on POSITION.EVALUATED (`analysisMachine.ts:106-108`) | R4-4, R4-6 "Já encontrado" assertions | ✅ (`analysis.spec.ts:7` and `:52` failed on `toBeVisible`) |
| X2 | `summary.ts`: drop 27...Tb7 and add a fake 5th moment "60...Tz9" | R4-3 membership check | ✅ (`analysis.spec.ts:7` failed) |
| X3 | `EngineClient.ts:106`: never wait for the stale `bestmove` | R4-6 cancel → re-analyze | ❌ survived at e2e level; **killed at unit level** (S07). The first X3 attempt (`false && …`) failed the `tsc` step of the build, so it was discarded as invalid and re-run with a type-clean form |

**Result**: 16/16 unit + 2/2 e2e-assertion faults killed - ✅ PASS. X3 is an observability limit of the real engine: a stale `bestmove` at position 0 does not change any visible finding. The behavior is protected by `EngineClient.test.ts:266-295`. Scratch removed with `git worktree remove --force`; `git worktree list` no longer shows it; the real tree's `git status --porcelain` matches the pre-sensor baseline (empty).

### Round 5 · Remaining notes (non-blocking)

1. **E4 - product confirmation pending (user decision).** The played-line rule changes how D3 is measured. It is still `Confirmed? n`.
2. **Test title overclaims (Cosmetic).** `e2e/analysis.spec.ts:52` says "sem resultado velho", but it cannot observe a stale result (X3). Consider renaming it to "cancelar no meio e analisar de novo chega ao resultado", or point to the unit test in a comment.
3. **AS-14 narrowing** (no positions or scores in the contract) is still `Confirmed? n` in the spec.

### Round 5 · Traceability

AS-01..AS-16: ✅ Verified (AS-14 with the logged narrowing). F4b is done apart from the E4 product confirmation.
