# F8 · Treinar momento-chave Validation

**Date**: 2026-11-24 (round 3)
**Spec**: `.specs/features/training-screen/spec.md`
**Diff range**: `origin/main..HEAD` (`9d8486c..039ce3a`). Round 3 re-verified `039ce3a` ("pin the training board label and orientation") on top of the round-2 fix `964139e` and the feature commits `999ccef..335ba3b`.
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: PASS

Every TR-01..TR-14 requirement, every step_04 §7 criterion and §8 keyboard play and text-for-highlights have spec-anchored evidence. Both gates are green. The discrimination sensor kills **29/29** mutants in Vitest, including the orientation mutant, which round 1 caught only in Playwright.

History: round 1 FAIL (M06, M20, M21 survived; §8 text missing), round 2 FAIL (N02, N05 survived on the new label code), round 3 PASS.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Move helpers and exercise model | ✅ Done | `d9ef78a`, `2416dbd` |
| T2 Training machine and app wiring | ✅ Done | `c1ee22e` |
| T3 Interactive board and screen | ✅ Done | `79b27ef`, `632d8e8` |
| T4 End-to-end and docs | ✅ Done | `335ba3b` |
| Fix round 1 (G1–G6) | ✅ Done | `964139e` |
| Fix round 2 (R2-1, R2-2, M15 in Vitest) | ✅ Done | `039ce3a` |

`tasks.md` `**Status**: Done`; spec traceability TR-01..TR-14 `Done`, 14/14 mapped.

---

## Gate Check (round 3, HEAD `039ce3a`)

- **`make check`**: exit 0. Biome, `tsc --noEmit`, Ruff and mypy are clean. Vitest: 37 files, **418 passed** (round 2: 417). Coverage is 98.69% stmts / 91.15% branches overall, and the per-domain 90% `model/**` thresholds pass, `training/model` included. pytest: 75 passed.
- **`make test-e2e`**: exit 0, **16 passed** in 2.2 min. This run built and served its own web app (`[web] vite build`, `vite preview`), and both `[full-analysis] e2e/training.spec.ts` tests passed with the real engine.
- **Discarded runs (environment, not code)**: the first round-3 attempt overlapped another worktree's Playwright run. Vitest hit one 15 s timeout in the unchanged `review/components/explore.test.tsx` (RV-06) under CPU load, and the e2e run reused a foreign server on port 4173 that then went away (11 connection failures). Both gates were rerun after ports 4173/8000 had been free for 30 s and passed.
- **Test delta**: Vitest 365 (before F8) → 418 (+53); Playwright 14 → 16 (+2). No tests were removed. Every changed assertion is stricter than before.
- **Skipped**: none.

---

## Round-2 gaps re-checked

| Gap | Fix verified | Evidence |
| --- | ------------ | -------- |
| R2-1 highlight sentence leaves with the mark | ✅ | `apps/web/src/domains/training/components/TrainingScreen.test.tsx:107`: while the refutation is on the board, `getByRole("group", {name: "Posição antes de 22...Ta7, vista pelas pretas."})`, which is the exact name without the sentence. N02 killed. |
| R2-2 gender of the sentence | ✅ | The sentence moved to `apps/web/src/domains/training/model/exercise.ts:256-262` (`highlightSentence`), and `TrainingScreen.tsx:144-145` uses it only `atStart`. `model/exercise.test.ts:237-243`: `toBe("O bispo em a1 está destacado.")`, `toBe("A torre em a3 está destacada.")` (ply 86), `toBeNull()` without a lost piece. N05 and N06 killed. |
| M15 orientation in Vitest | ✅ | `TrainingScreen.test.tsx:75-80`: `squares[0]` `data-square="h1"`, `squares[63]` `"a8"` for Black. Killed in Vitest; `e2e/training.spec.ts:16-17` still checks it in the browser. |

Round-1 gaps G1–G6 stay closed (evidence below).

---

## Spec-Anchored Acceptance Criteria

### TR requirements (spec.md)

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| TR-01 | Position before the mistake, player's side, player to move, "Momento N de M" | `machines/trainingMachine.test.ts:58-65` (`index` 3 for ply 86, `fen` = `fenBefore`); `model/exercise.test.ts:36-39` (side to move `"b"`); `TrainingScreen.test.tsx:54-80` (`"Momento 1 de 5"`, board group name, `squares[0]` h1 / `squares[63]` a8, "Pretas jogam (você)"); `e2e/training.spec.ts:10-18` | ✅ |
| TR-02 | Kicker, question, context, answer not revealed | `model/exercise.test.ts:41-47` `toEqual({kicker: "Encontre o lance · tipo: peça atacada", question: "Uma das suas peças está em perigo. O que fazer?", context: "Posição real da sua partida, antes do lance 22. Na partida você jogou 22...Ta7."})`; `TrainingScreen.test.tsx` `queryByText(/Bd4/)` null at load | ✅ |
| TR-03 | Legal destinations highlighted; illegal targets ignored | `model/exercise.test.ts:170-180` (`squareClick`); `trainingMachine.test.ts:72-87`; `TrainingScreen.test.tsx:86-91`; `shared/ui/Board.test.tsx:88-89` ("…, destino possível") | ✅ |
| TR-04 | Engine-evaluated; accepted when not a D3 mistake | `model/exercise.test.ts:49-81` (Te6 `accepted:false`; Bd4+ and Bb2 `accepted:true`); `trainingMachine.test.ts:96` (engine called with the FEN after Te6); `e2e/training.spec.ts:28-47` real engine | ✅ |
| TR-05 | "Tentativa N", "{lance} ainda perde {peça}", reply on board, return, no solution | `model/exercise.test.ts:59-62` exact title/text; `trainingMachine.test.ts:99-113` (reply FEN, 1199 ms still `refuting`, +1 ms `playing`, back to `fenBefore`), `:122-130` (`attempt: 2`); `TrainingScreen.test.tsx:93-124` ("Tentativa 1", `a1, torre branca`, no `Bd4\|Bb2\|solução`, d4 not green, "Tentativa 2"); `e2e/training.spec.ts:30-37` | ✅ |
| TR-06 | "Esse foi o lance jogado na partida." | `model/exercise.test.ts:83-90`; `TrainingScreen.test.tsx:118-123` | ✅ |
| TR-07 | Confirm, ≤ 4-ply continuation, principle, "Próximo momento" | `model/exercise.test.ts:74` (4 of 5 plies); `TrainingScreen.test.tsx:126-138` ("22...Bd4+ resolve o problema.", `/^Continuação do motor: Rf1 Bb2 Bc3 Bxc3/`, principle, "Momento 2 de 5"); `e2e/training.spec.ts:44-49` | ✅ |
| TR-08 | Hints pattern → piece, capped at 2; solution in green + "Próximo momento" | `model/exercise.test.ts:92-97`; `trainingMachine.test.ts` hint-cap test (`hintLevel` stays 2) and solution test (`saw-solution`); `TrainingScreen.test.tsx:140-151` (order, "Outra dica" disabled, "A solução é 22...Bd4+.", d4 `data-mark="green"`) | ✅ |
| TR-09 | Undo to start, history kept | `trainingMachine.test.ts` "Desfazer volta na hora" (`attempts: 1`, `lastMove: null`); `TrainingScreen.test.tsx:112-114`; `e2e/training.spec.ts:39-40` | ✅ |
| TR-10 | first-try / with-hint / saw-solution | `model/exercise.test.ts:137-141`; `trainingMachine.test.ts` `{44:"first-try"}`, `{44:"with-hint"}` (after a wrong attempt and after a hint), `saw-solution` | ✅ |
| TR-11 | "N de M de primeira" with M = moments in this session, + "Voltar ao resultado" | `model/exercise.test.ts:142-144` `"3 de 5 de primeira"`; `TrainingScreen.test.tsx:163-177` (opened on the last moment: `"0 de 1 de primeira"`, back sends `TRAINING.BACK`) | ✅ |
| TR-12 | Back to Result at any time | `TrainingScreen.test.tsx:179-183`; `trainingMachine.test.ts` `sendParent` test; `app/appMachine.test.ts:230-262` (input `{result, ply: 86, engine}`, `training` → `review`); `e2e/training.spec.ts` keyboard test ends on "Resumo da partida" | ✅ |
| TR-13 | `role="status"` | `TrainingScreen.test.tsx:98`; `e2e/training.spec.ts:30-37` | ✅ |
| TR-14 | Engine failure message, reset, not counted | `trainingMachine.test.ts` TR-14 test (`feedback {kind:"error"}`, `attempts: 0`, `fen` = `fenBefore`); `TrainingScreen.test.tsx:153-161` exact text | ✅ |

### step_04 §7 and §8

| Criterion | Evidence | Result |
| --------- | -------- | ------ |
| Moment 1 before 22...Ta7, black at the bottom, black to move | `e2e/training.spec.ts:10-18`; `TrainingScreen.test.tsx:75-80` | ✅ |
| 22...Te6 → 23.Txa1, "ainda perde o bispo", no solution | `e2e/training.spec.ts:28-37` (real engine, `$`-anchored regex, `not.toContainText("Bd4")`); `TrainingScreen.test.tsx:105-111` | ✅ |
| 22...Bd4+ accepted, continuation and principle shown | `e2e/training.spec.ts` keyboard test; `TrainingScreen.test.tsx:126-138` | ✅ |
| 22...Bb2 also accepted (T-03) | `e2e/training.spec.ts:42-47`; `model/exercise.test.ts:77-81` | ✅ |
| §8 keyboard: Tab to the square, Enter, Enter | `shared/ui/Board.test.tsx` keyboard test (focus + `{Enter}`); `e2e/training.spec.ts` focus a1 + Enter, focus d4 + Enter → accepted | ✅ |
| §8 feedback with `role="status"` | TR-13 | ✅ |
| §8 highlights come with text | danger mark: `TrainingScreen.test.tsx:71`, `:107`, `model/exercise.test.ts:237-243`, `e2e/training.spec.ts:12`; destinations: `Board.test.tsx:88-89`; solution: "A solução é 22...Bd4+." | ✅ |

**Status**: ✅ All ACs covered. One wording note: the TR-07 confirmation text is not fixed by the spec; the implementation uses "{lance} resolve o problema.", and the tests pin it.

---

## Discrimination Sensor (round 3)

A fresh detached `git worktree` at `039ce3a` in the session scratchpad, with `node_modules` symlinked. Each mutant was applied alone against the Vitest suites for `training`, `game`, `app` and `shared/ui/Board` (17 files, 224 tests green on the clean scratch), then restored. The scratch was removed; the real worktree's `git status --porcelain` was empty before and after.

| # | File | Fault | Result |
| - | ---- | ----- | ------ |
| M01 | `training/model/exercise.ts` `checkAttempt` | accept rule inverted | ✅ Killed |
| M02 | `exercise.ts` `checkAttempt` | accept everything (D3 threshold ignored) | ✅ Killed |
| M03 | `exercise.ts` `checkAttempt` | `repeatedGameMove` always false | ✅ Killed |
| M04 | `training/machines/trainingMachine.ts` `checking.onDone` | refutation not shown on the board | ✅ Killed |
| M05 | `trainingMachine.ts` `refuting.after` | never returns to the start | ✅ Killed |
| M06 | `trainingMachine.ts:17` | `REFUTATION_MS` 1200 → 12000 | ✅ Killed |
| M07 | `components/TrainingScreen.tsx` hint box | hint order swapped | ✅ Killed |
| M08 | `trainingMachine.ts` `hintsLeft` | hints not capped at 2 | ✅ Killed |
| M09 | `exercise.ts` `outcomeOf` | a wrong attempt still first-try | ✅ Killed |
| M10 | `exercise.ts` `summaryText` | with-hint counted as first-try | ✅ Killed |
| M11 | `trainingMachine.ts` `onError` | engine error counted as an attempt | ✅ Killed |
| M12 | `trainingMachine.ts` `onError` | engine error does not reset the board | ✅ Killed |
| M13 | `exercise.ts` `squareClick` | squares without legal moves (opponent pieces) selected | ✅ Killed |
| M14 | `shared/ui/Board.tsx` | `disabled` ignored | ✅ Killed |
| M15 | `TrainingScreen.tsx` | orientation fixed to white | ✅ Killed (now in Vitest too) |
| M16 | `trainingMachine.ts` `solved` | `MOMENT.NEXT` skips a moment | ✅ Killed |
| M17 | `TrainingScreen.tsx` | `TRAINING.BACK` not sent | ✅ Killed |
| M18 | `app/appMachine.ts:141` | app passes no engine | ✅ Killed |
| M19 | `appMachine.ts:140` | app passes the wrong ply | ✅ Killed |
| M20 | `trainingMachine.ts` `checking.onDone` | "Tentativa N" frozen at 1 | ✅ Killed |
| M21 | `TrainingScreen.tsx` wrong card | wrong feedback prints the solution | ✅ Killed |
| M22 | `exercise.ts:24` | continuation capped at 6 instead of 4 | ✅ Killed |
| M23 | `trainingMachine.ts` `refuting` | `UNDO` ignored during the refutation | ✅ Killed |
| N01 | `TrainingScreen.tsx:145` | board label drops the highlight sentence | ✅ Killed |
| N02 | `TrainingScreen.tsx:144` | sentence kept after leaving the start (`atStart` dropped) | ✅ Killed |
| N03 | `Board.tsx:148` | ", destino possível" removed | ✅ Killed |
| N04 | `Board.tsx:148` | suffix on every square | ✅ Killed |
| N05 | `exercise.ts:260` | always "destacado" | ✅ Killed |
| N06 | `exercise.ts:258` | a sentence even without a lost piece | ✅ Killed |

**Sensor depth**: P0-style manual run (29 behavior mutants).
**Result**: 29/29 killed - ✅ PASS

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ (Board gains an interactive mode; the read-only mode is unchanged and tested) |
| No scope creep | ✅ (T-11, drag and AI training texts left out as `spec.md` says) |
| Matches patterns | ✅ `setup({types, actors, guards, actions})`, side effect in the `evaluateAttempt` actor, rules and texts in `training/model` (the highlight sentence now included), cross-domain imports only through `index.ts` |
| Spec-anchored outcome check | ✅ |
| Per-layer coverage (domain 1:1 ACs; UI happy + edge + error) | ✅ |
| Every test maps to a requirement | ✅ |
| Documented guidelines: `docs/engineering/quality.md`, `docs/architecture/code-structure.md` | ✅ |

---

## Edge Cases

- [x] Engine failure (TR-14): message, reset, not counted.
- [x] Engine without a PV: accepted, no reply and no refutation (`model/exercise.test.ts:184-194`).
- [x] Illegal PV reply: board unchanged (`model/exercise.test.ts:196-203`).
- [x] No or illegal best move: no solution label (`model/exercise.test.ts:205-212`).
- [x] Promotion promotes to a queen (`model/exercise.test.ts:214-227`).
- [x] Board locked while checking (`TrainingScreen.tsx` `disabled={!playing}`; `Board.test.tsx` disabled test; M14 killed).
- [x] Training opened on a later moment: the summary counts the moments of this session (TR-11 as amended; `TrainingScreen.test.tsx:172`).

---

## Visual check

The Verifier did not do a screenshot comparison (optional in this run). The e2e runs against `vite preview` with the isolation headers on. Copy differences from `docs/design/step_04/Treino.dc.html` are deliberate: the instruction reads "Clique na peça e depois na casa de destino" because there is no drag in the MVP.

---

## Requirement Traceability Update

| Requirement | Round 1 | Round 2 | Round 3 |
| ----------- | ------- | ------- | ------- |
| TR-01..TR-04, TR-06..TR-10, TR-12..TR-14 | ✅ | ✅ | ✅ Verified |
| TR-05 | ❌ | ✅ | ✅ Verified |
| TR-11 | ⚠️ | ✅ | ✅ Verified |
| step_04 §8 text for highlights | ❌ | ⚠️ | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 14/14 TR, 4/4 step_04 §7 and the §8 criteria matched.
**Sensor**: 29/29 mutations killed in Vitest.
**Gate**: `make check` 418 Vitest + 75 pytest passed; `make test-e2e` 16 passed.

**What works**: the T-03 accept rule with the real engine (Te6 refuted by 23.Txa1, Bd4+ and Bb2 accepted), the refutation and its 1.2 s return, the attempt numbering, the repeated-move notice, the hidden solution, ordered and capped hints, the solution in green, undo, the outcomes and session summary, back navigation, engine failure, keyboard play, and text for every board highlight.

**Next steps**: none for F8. Follow-ups already logged in `spec.md` Out of Scope: AI-written training texts, drag and drop, and the T-11 extra exercise.
