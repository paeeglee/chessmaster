# F4b · Analysis pipeline and screen Validation

**Date**: 2026-11-23
**Spec**: `.specs/features/analysis-screen/spec.md`
**Diff range**: `9de6292..2c2d0f4` (branch `feat/analysis-screen`)
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: FAIL

The gates are green, but 2 discrimination-sensor mutants survived (AS-11 last-move highlight, `advantage_started_at` ≥ +2 boundary). Validate procedure: a surviving mutant is a fix task. AS-11 also has a behavior defect: the caption and the board disagree by one ply.

---

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
**Result**: 29/31 killed - ❌ FAIL
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
