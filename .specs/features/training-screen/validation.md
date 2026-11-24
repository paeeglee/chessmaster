# F8 · Treinar momento-chave Validation

**Date**: 2026-11-24 (round 2)
**Spec**: `.specs/features/training-screen/spec.md`
**Diff range**: `origin/main..HEAD` (`9d8486c..964139e`). Round 2 re-verified the fix commit `964139e` on top of the round-1 report (`94bc5db`) and the feature commits (`999ccef..335ba3b`).
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: FAIL

All six round-1 gaps (G1–G6) are closed, and all three round-1 survivors (M06, M20, M21) are now killed. Both gates are green. The verdict stays FAIL because 2 of the 5 mutants aimed at the new §8 label code survive (N02, N05). Both are one-assertion test fixes on the board label (see Fix Plans R2-1 and R2-2). No production defect was found.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Move helpers and exercise model | ✅ Done | `d9ef78a`, `2416dbd` |
| T2 Training machine and app wiring | ✅ Done | `c1ee22e` |
| T3 Interactive board and screen | ✅ Done | `79b27ef`, `632d8e8` |
| T4 End-to-end and docs | ✅ Done | `335ba3b` |
| Fix round 1 (G1–G6) | ✅ Done | `964139e`; `tasks.md` `**Status**: Done`, spec traceability rows Done |

---

## Gate Check (round 2, HEAD `964139e`)

- **`make check`**: exit 0.
  - Biome, `tsc --noEmit`, Ruff and mypy clean.
  - Vitest: 37 files, **417 passed** (round 1: 416, +1). Coverage 98.69% stmts / 91.13% branches overall. The per-domain 90% `model/**` thresholds (`apps/web/vite.config.ts:43-56`) pass, including `training/model`.
  - pytest: 75 passed.
- **`make test-e2e`**: exit 0, **16 passed** in 2.3 min, including both `[full-analysis] e2e/training.spec.ts` tests with the real engine. The first round-2 attempt is invalid: another worktree's `vite preview` took port 4173 between the free-port check and server start, then went away (`Port 4173 is already in use`, `ERR_CONNECTION_REFUSED`). It was rerun once the ports were free and passed.
- **Test delta**: no tests removed. The changed assertions are stricter: an exact board label, an end-anchored e2e regex, a literal 1200 ms, and exact square names with ", destino possível".
- **Skipped**: none.

---

## Round-1 gaps re-checked

| Gap | Fix verified | Evidence |
| --- | ------------ | -------- |
| G1 "Tentativa N" | ✅ | `apps/web/src/domains/training/machines/trainingMachine.test.ts:122-130`: e8e6, `UNDO`, a8a7 → `toMatchObject({kind:"wrong", attempt: 2})`. `components/TrainingScreen.test.tsx:106-114`: `findByText("Tentativa 2")` plus the full repeated-move text. M20 killed. |
| G2 solution hidden after a wrong attempt | ✅ | `TrainingScreen.test.tsx:101-102`: `within(status).queryByText(/Bd4\|Bb2\|solução/)` null, `d4` not `data-mark="green"`. `apps/web/e2e/training.spec.ts:34` regex anchored with `$`; `:37` `not.toContainText("Bd4")`. M21 killed. |
| G3 1.2 s refutation | ✅ | `trainingMachine.test.ts:107-111`: `toBe(1200)`, still `refuting` after 1199 ms, `playing` after 1 more ms. M06 killed. |
| G4 §8 text for highlights | ✅ (two weak spots, R2-1/R2-2) | `TrainingScreen.tsx:140-147` `boardLabel`; `TrainingScreen.test.tsx:71` and `e2e/training.spec.ts:12`: group name "Posição antes de 22...Ta7, vista pelas pretas. O bispo em a1 está destacado.". `shared/ui/Board.tsx:148`; `Board.test.tsx:88-89`: "h3, vazia, destino possível", "f3, vazia, destino possível", and the exact "g1, cavalo branco" with no suffix. N01, N03, N04 killed. |
| G5 TR-11 M | ✅ | `spec.md` TR-11 now defines M as the moments trained in this session and N as first-try without hints. `TrainingScreen.test.tsx:154-163` (opened on the last moment) asserts `"0 de 1 de primeira"`. |
| G6 traceability | ✅ | `tasks.md:12` `**Status**: Done`; spec traceability TR-01..TR-14 `Done`, 14/14 mapped. |

---

## Spec-Anchored Acceptance Criteria

### TR requirements (spec.md)

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| TR-01 | Position before the mistake, player's side, player to move, "Momento N de M" | `trainingMachine.test.ts:58-65` (`index` 3 for ply 86, `fen` = `fenBefore`); `model/exercise.test.ts:36-39` (side to move `"b"`); `TrainingScreen.test.tsx:55` `"Momento 1 de 5"`; orientation `e2e/training.spec.ts:16-17` (first square `h1`, last `a8`) | ✅ |
| TR-02 | Kicker, question, context | `model/exercise.test.ts:41-47` `toEqual({...})` with the three exact strings | ✅ |
| TR-03 | Legal destinations highlighted; illegal targets ignored | `model/exercise.test.ts:170-180`; `trainingMachine.test.ts:72-87`; `TrainingScreen.test.tsx:77-82`; destinations named in text `Board.test.tsx:88-89` | ✅ |
| TR-04 | Engine-evaluated, accepted when not a D3 mistake | `model/exercise.test.ts:49-81` (Te6 refused; Bd4+ and Bb2 accepted); `trainingMachine.test.ts:96`; `e2e/training.spec.ts` real engine | ✅ |
| TR-05 | "Tentativa N", "{lance} ainda perde {peça}", reply on the board, return, no solution | `model/exercise.test.ts:59-62`; `trainingMachine.test.ts:99-113`, `:122-130`; `TrainingScreen.test.tsx:84-114` | ✅ |
| TR-06 | "Esse foi o lance jogado na partida." | `model/exercise.test.ts:83-90`; `TrainingScreen.test.tsx:110-114` | ✅ |
| TR-07 | Confirm, ≤ 4-ply continuation, principle, "Próximo momento" | `model/exercise.test.ts:74`; `TrainingScreen.test.tsx` TR-07 test (`/^Continuação do motor: Rf1 Bb2 Bc3 Bxc3/`, principle, "Momento 2 de 5") | ✅ (⚠️ confirmation wording not fixed by the spec) |
| TR-08 | Hints pattern → piece, capped at 2; solution in green + "Próximo momento" | `model/exercise.test.ts:92-97`; `trainingMachine.test.ts` hint-cap and solution tests; `TrainingScreen.test.tsx` TR-08 test (`d4` `data-mark="green"`) | ✅ |
| TR-09 | Undo to start, history kept | `trainingMachine.test.ts` "Desfazer volta na hora" (`attempts: 1`); `TrainingScreen.test.tsx:103-105` | ✅ |
| TR-10 | first-try / with-hint / saw-solution | `model/exercise.test.ts:137-141`; `trainingMachine.test.ts` outcome assertions | ✅ |
| TR-11 | "N de M de primeira" (M = moments in this session) + "Voltar ao resultado" | `model/exercise.test.ts:142-144` `"3 de 5 de primeira"`; `TrainingScreen.test.tsx:154-167` `"0 de 1 de primeira"` + back | ✅ |
| TR-12 | Back to Result at any time | `TrainingScreen.test.tsx` top-link test; `trainingMachine.test.ts` `sendParent` test; `app/appMachine.test.ts:230-262`; `e2e/training.spec.ts` keyboard test ends on "Resumo da partida" | ✅ |
| TR-13 | `role="status"` | `TrainingScreen.test.tsx:89-94`; `e2e/training.spec.ts:30-37` | ✅ |
| TR-14 | Engine failure message, position resets | `trainingMachine.test.ts` TR-14 test (`attempts: 0`, `fen` = `fenBefore`); `TrainingScreen.test.tsx` TR-14 exact text | ✅ |

### step_04 §7 and §8

| Criterion | Evidence | Result |
| --------- | -------- | ------ |
| Moment 1 before 22...Ta7, black at the bottom, black to move | `e2e/training.spec.ts:10-18` | ✅ |
| 22...Te6 → 23.Txa1, "ainda perde o bispo", no solution | `e2e/training.spec.ts:28-37` (real engine, anchored regex, `not.toContainText("Bd4")`); board reply `TrainingScreen.test.tsx:99` | ✅ |
| 22...Bd4+ accepted with continuation and principle | `e2e/training.spec.ts` keyboard test; `TrainingScreen.test.tsx` TR-07 test | ✅ |
| 22...Bb2 also accepted | `e2e/training.spec.ts:40-45` | ✅ |
| §8 keyboard play | `Board.test.tsx` keyboard test; `e2e/training.spec.ts` focus + Enter on a1 and d4 | ✅ |
| §8 highlights come with text | `TrainingScreen.test.tsx:71`, `e2e/training.spec.ts:12`, `Board.test.tsx:88-89`. Weak: the sentence's removal once the mark is gone, and the feminine form, are untested (R2-1, R2-2). | ✅ (⚠️) |

**Status**: ✅ All ACs covered · ⚠️ 2 weak assertions on the §8 label (sensor survivors)

---

## Discrimination Sensor (round 2)

A fresh detached `git worktree` at `964139e` in the session scratchpad, `node_modules` symlinked. Each mutant was applied alone against the Vitest suites for `training`, `game`, `app` and `shared/ui/Board` (17 files, 223 tests green on the clean scratch), then restored. The scratch was removed; the real worktree's `git status --porcelain` was empty before and after.

| # | Fault | Round 1 | Round 2 |
| - | ----- | ------- | ------- |
| M01–M05, M07–M14, M16–M19, M22, M23 | accept rule inverted / accept everything / repeated move / refutation not shown / no return / hint order / hint cap / outcome / summary / error counted / error no reset / opponent selection / disabled ignored / NEXT skips / BACK not sent / app engine / app ply / continuation cap / Undo during refutation | ✅ Killed | ✅ Killed (all 18) |
| M06 | `REFUTATION_MS` 1200 → 12000 | ❌ Survived | ✅ Killed |
| M15 | orientation fixed to white | ✅ Killed by e2e only | Vitest survives; `e2e/training.spec.ts:16-17` unchanged and still kills it (shown in round 1) |
| M20 | "Tentativa N" frozen at 1 | ❌ Survived | ✅ Killed |
| M21 | wrong feedback prints the solution | ❌ Survived | ✅ Killed |
| N01 | `TrainingScreen.tsx:144` board label drops the highlight sentence | - | ✅ Killed |
| N02 | `TrainingScreen.tsx:144` highlight sentence kept after leaving the start position (`!atStart` dropped) | - | ❌ **Survived** (R2-1) |
| N03 | `Board.tsx:148` ", destino possível" removed | - | ✅ Killed |
| N04 | `Board.tsx:148` suffix on every square | - | ✅ Killed |
| N05 | `TrainingScreen.tsx:146` always "destacado" (wrong for "a torre", "a dama") | - | ❌ **Survived** (R2-2) |

**Result**: 26/28 killed (M15 by e2e) - ❌ FAIL

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical changes / no scope creep | ✅ |
| Matches patterns (XState `setup`, actor side effects, rules in `model/`, `index.ts` boundaries) | ✅ |
| Spec-anchored outcome check | ✅ (2 weak label assertions) |
| Documented guidelines: `docs/engineering/quality.md`, `docs/architecture/code-structure.md` | ✅ |

Note: `boardLabel` (`TrainingScreen.tsx:140-147`) builds a text from a piece and an article inside a component. `hintText` already does the same in `training/model/exercise.ts:159`. Moving the gender rule into `model/` would make it unit-testable next to its twin. This is optional.

---

## Fix Plans

### R2-1 (Minor): the highlight sentence is not shown to leave with the mark (N02)

- **Fix task**: in `apps/web/src/domains/training/components/TrainingScreen.test.tsx` (refutation test, after the wrong attempt and before "Desfazer"), assert `screen.getByRole("group", {name: "Posição antes de 22...Ta7, vista pelas pretas."})`, the label without the sentence, while the refutation is on the board.
- **Done when**: N02 is killed.

### R2-2 (Minor): feminine form untested (N05)

- **Fix task**: render the training on ply 86 (the rook moment) and assert the group name ends with "A torre em … está destacada." (exact square from the fixture). Alternatively, move the sentence into `training/model` and unit-test both genders.
- **Done when**: N05 is killed.

---

## Requirement Traceability Update

| Requirement | Round 1 | Round 2 |
| ----------- | ------- | ------- |
| TR-01..TR-04, TR-06..TR-14 | ✅ Verified | ✅ Verified |
| TR-05 | ❌ Needs Fix | ✅ Verified |
| TR-11 | ⚠️ spec-precision | ✅ Verified (spec now defines M) |
| step_04 §8 highlights with text | ❌ Needs Fix | ⚠️ Implemented; R2-1/R2-2 test gaps |

---

## Summary

**Overall**: ❌ Not Ready (two test-only fixes left)

**Spec-anchored check**: 14/14 TR and 4/4 §7 criteria matched; §8 covered with 2 weak assertions.
**Sensor**: 26/28 killed (M15 by e2e); N02 and N05 survived.
**Gate**: `make check` 417 Vitest + 75 pytest passed; `make test-e2e` 16 passed.

**Next steps**: add the two assertions in R2-1 and R2-2, then a round-3 re-verify (the last of the 3 allowed iterations).
