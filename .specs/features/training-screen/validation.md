# F8 · Treinar momento-chave Validation

**Date**: 2026-11-23
**Spec**: `.specs/features/training-screen/spec.md`
**Diff range**: `origin/main..HEAD` (`9d8486c..335ba3b`, 7 commits, 22 files, +2051/-37)
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: FAIL

Both gates are green and every TR requirement and step_04 §7 criterion has test evidence. The verdict is FAIL because 3 of 24 sensor mutants survive on spec-defined behavior: the attempt number in "Tentativa N" (TR-05), "sem revelar a solução" (TR-05 / step_04 §7 AC2) and the 1.2 s refutation window (spec assumption T-04). §8 "casas destacadas vêm acompanhadas de texto" is not met for the red danger mark and the legal-destination dots. All gaps are small test or label fixes (see Fix Plans).

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Move helpers and exercise model | ✅ Done | `d9ef78a`, `2416dbd` |
| T2 Training machine and app wiring | ✅ Done | `c1ee22e` |
| T3 Interactive board and screen | ✅ Done | `79b27ef`, `632d8e8` |
| T4 End-to-end and docs | ✅ Done | `335ba3b`; `docs/architecture/overview.md` "Treino (F8)" added |

`tasks.md` still says `**Status**: In Progress` and the spec traceability table still says `Pending` for TR-01..TR-14 (see G6).

---

## Gate Check

- **`make check`**: exit 0.
  - Biome checked 128 files, clean. `tsc --noEmit` clean. Ruff and mypy clean (33 source files).
  - Vitest: 37 files, **416 passed**. Coverage 98.68% stmts / 91.05% branches overall. The per-domain 90% `model/**` thresholds in `apps/web/vite.config.ts:43-56` include `src/domains/training/model/**` and pass. `trainingMachine.ts` 97.36% stmts, `TrainingScreen.tsx` 100% stmts, `Board.tsx` 100% stmts.
  - pytest: 75 passed.
- **`make test-e2e`**: exit 0, **16 passed** in 2.1 min, including `[full-analysis] e2e/training.spec.ts` (2 tests, real Stockfish). Ports 4173/8000 were free before and after.
- **Test delta**: F7 had 365 Vitest tests, F8 has 416 (+51). Playwright went from 14 to 16 (+2). No tests were removed. The one changed existing test (`apps/web/src/app/appMachine.test.ts:230-262`) is stricter: it now asserts the training input.
- **Skipped**: none.

---

## Spec-Anchored Acceptance Criteria

### TR requirements (spec.md)

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| TR-01 | Position before the mistake, player's side, player to move, "Momento N de M" + dots | `apps/web/src/domains/training/machines/trainingMachine.test.ts:58-65`: `context.index` 3 for ply 86, `context.fen` = `exercise.ply.fenBefore`. `model/exercise.test.ts:36-39`: side to move `"b"`. `components/TrainingScreen.test.tsx:55`: `getByText("Momento 1 de 5")`; `:69-71` board group name and "Pretas jogam (você)". Orientation: `apps/web/e2e/training.spec.ts:16-17`: first square `h1`, last `a8`. | ✅ (dots not asserted, cosmetic) |
| TR-02 | "Encontre o lance · tipo: {tipo}", a question, "Posição real… Na partida você jogou {lance}." | `model/exercise.test.ts:41-47`: `toEqual({kicker: "Encontre o lance · tipo: peça atacada", question: …, context: "Posição real da sua partida, antes do lance 22. Na partida você jogou 22...Ta7."})`. `TrainingScreen.test.tsx:56-67` (rendered); `:72` `queryByText(/Bd4/)` null at load. | ✅ |
| TR-03 | Legal destinations highlighted; illegal targets ignored | `model/exercise.test.ts:170-180` (`squareClick`: select, reselect, move `Bd4+`, opponent `h1` → clear, illegal `a3` → clear). `trainingMachine.test.ts:72-87`: `destinations` contains `d4`, `h8`/`d2` clear without a move, state stays `playing`. `TrainingScreen.test.tsx:77-82`: `aria-pressed="true"` on a1, dot inside d4. `game/model/moves.test.ts` `legalDestinations`/`playMove`. | ✅ |
| TR-04 | Attempt evaluated by the engine; accepted when not a D3 mistake | `model/exercise.test.ts:49-63` (`Te6` `accepted:false`), `:65-75` (`Bd4+` `accepted:true`), `:77-81` (`Bb2` `accepted:true`). `trainingMachine.test.ts:96`: engine called with the FEN after `Te6`; `:241-249` default actor calls `engine.evaluate` with the FEN after `Bb2`. `e2e/training.spec.ts:28-42` with the real engine. | ✅ |
| TR-05 | "Tentativa N", "{lance} ainda perde {peça}", engine reply on the board, return to start, no solution | `model/exercise.test.ts:59-62`: `toEqual({title: "22...Te6 ainda perde o bispo", text: "Depois de 23.Txa1, o bispo some do tabuleiro."})`. `trainingMachine.test.ts:99-110`: `attempt: 1`, `lastMove {h1,a1}`, reply FEN, back to `fenBefore` after `REFUTATION_MS`. `TrainingScreen.test.tsx:90-96`: "Tentativa 1", title, text, `a1, torre branca`. **No test reaches "Tentativa 2"** (M20 survives) and **no test asserts the solution is absent after a wrong attempt** (M21 survives). | ❌ GAP (G1, G2) |
| TR-06 | Repeated game move adds "Esse foi o lance jogado na partida." | `model/exercise.test.ts:83-90`: `toBe("Depois de 23.Txa1, o bispo some do tabuleiro. Esse foi o lance jogado na partida.")`. `trainingMachine.test.ts:143-148`: `repeatedGameMove: true`. | ✅ |
| TR-07 | Confirm, continuation (≤ 4 plies), principle, "Próximo momento" | `model/exercise.test.ts:74`: `continuation` length 4 from a 5-ply PV. `TrainingScreen.test.tsx:107-113`: "22...Bd4+ resolve o problema.", `/^Continuação do motor: Rf1 Bb2 Bc3 Bxc3/`, principle text, "Próximo momento →" → "Momento 2 de 5". `e2e/training.spec.ts:42-47` (Bb2, real engine). The confirmation wording is not fixed by the spec. | ✅ (⚠️ wording) |
| TR-08 | Hints pattern → piece, capped; "Mostrar solução" with a green destination and "Próximo momento" | `model/exercise.test.ts:92-97`: `"Olhe a casa a1: quem ataca o bispo?"`, `"O bispo pode sair dali ou ser protegido."`, `solutionLabel` `"22...Bd4+"`. `trainingMachine.test.ts:156-166`: `hintLevel` 1 → 2 → stays 2. `:168-179`: `solutionShown`, `outcomes {44:"saw-solution"}`. `TrainingScreen.test.tsx:116-127`: hint order, "Outra dica" disabled, "A solução é 22...Bd4+.", `d4` `data-mark="green"`. | ✅ |
| TR-09 | "Desfazer" returns to start, keeps attempt history | `trainingMachine.test.ts:118-126`: `UNDO` in `refuting` → `playing`, `attempts: 1`, `lastMove: null`. `TrainingScreen.test.tsx:97-99`: a1 back to `bispo preto`, "Tentativa 1" still shown. `e2e/training.spec.ts:37-38`. | ✅ |
| TR-10 | first-try / with-hint / saw-solution per moment | `model/exercise.test.ts:137-141` (`outcomeOf` four cases). `trainingMachine.test.ts:138` `{44:"first-try"}`, `:153` `{44:"with-hint"}` after a wrong attempt, `:165` `{44:"with-hint"}` after a hint, `:177` `saw-solution`. | ✅ |
| TR-11 | After the last moment: "N de M de primeira" + "Voltar ao resultado" | `model/exercise.test.ts:142-144`: `toBe("3 de 5 de primeira")`. `trainingMachine.test.ts:191-201`: all moments → `finished`, 5 outcomes. `TrainingScreen.test.tsx:139-152`: heading "0 de 1 de primeira", "Voltar ao resultado" sends `TRAINING.BACK`. | ✅ (⚠️ M when starting mid-session, G5) |
| TR-12 | "← Voltar ao resultado" returns at any time | `TrainingScreen.test.tsx:155-159`: `backs` `["back"]`. `trainingMachine.test.ts:225-239`: `sendParent` reaches the parent. `app/appMachine.test.ts:256-262`: app `training` → `review`, input `{result, ply: 86, engine}`. `e2e/training.spec.ts:59-60` through the wired app. | ✅ |
| TR-13 | Feedback in `role="status"` | `TrainingScreen.test.tsx:89-94`: `findByRole("status")` contains "Tentativa 1" and the texts. `e2e/training.spec.ts:30-35`. | ✅ |
| TR-14 | Engine failure → "Não foi possível conferir o lance. Tente de novo.", position resets | `trainingMachine.test.ts:181-189`: `playing`, `feedback {kind:"error"}`, `attempts: 0`, `fen` = `fenBefore`. `:250-256` (no engine). `TrainingScreen.test.tsx:129-137`: exact text. | ✅ |

### step_04 §7 acceptance criteria

| Criterion | Evidence | Result |
| --------- | -------- | ------ |
| Moment 1 opens before 22...Ta7, black at the bottom, black to move | `e2e/training.spec.ts:10-18`: "Momento 1 de N", board "Posição antes de 22...Ta7, vista pelas pretas.", first square `h1`, last `a8`, "Pretas jogam (você)". `model/exercise.test.ts:37`. | ✅ |
| 22...Te6 → 23.Txa1 and "ainda perde o bispo", without the solution | `e2e/training.spec.ts:28-35` (real engine): "Tentativa 1", "22...Te6 ainda perde o bispo", `/^Depois de 23\.Txa1, o bispo some do tabuleiro\./`. The board reply is asserted only in Vitest (`TrainingScreen.test.tsx:96`). "Sem a solução" has **no assertion** (the e2e regex is not anchored at the end). | ❌ GAP (G2) |
| 22...Bd4+ accepted, continuation and principle shown | `e2e/training.spec.ts:50-58` (keyboard, real engine): "22...Bd4+ resolve o problema.". Continuation and principle: `TrainingScreen.test.tsx:107-111`. | ✅ |
| 22...Bb2 also accepted (T-03) | `e2e/training.spec.ts:40-45` (real engine): "22...Bb2 resolve o problema." + principle. `model/exercise.test.ts:77-81`. | ✅ |

### step_04 §8 accessibility

| Criterion | Evidence | Result |
| --------- | -------- | ------ |
| Keyboard: Tab to the square, Enter on origin, Enter on destination | `apps/web/src/shared/ui/Board.test.tsx:91-97` (focus + `{Enter}` → `onSquareClick("e2")`). `e2e/training.spec.ts:52-58`: focus a1 + Enter, focus d4 + Enter → accepted. | ✅ |
| Feedback announced with `role="status"` | TR-13. | ✅ |
| Highlighted squares come with text | The solution has text ("A solução é 22...Bd4+."). The red danger mark on a1 and the legal-destination dots have none: the board label is "Posição antes de 22...Ta7, vista pelas pretas." without the mockup's "O bispo preto em a1 está destacado." (`docs/design/step_04/Treino.dc.html`, `boardLabel`), and the dots are `aria-hidden` (`apps/web/src/shared/ui/Board.tsx:133-138`) with square names like "d4, vazia". | ❌ GAP (G4) |

**Status**: ❌ Gaps present (G1, G2, G4) · ⚠️ spec-precision gaps flagged (G3, G5)

---

## Discrimination Sensor

Scratch: a detached `git worktree` at the session scratchpad (`HEAD 335ba3b`), `apps/web/node_modules` symlinked. Each mutant was applied alone, the Vitest suites for `training`, `game`, `app` and `shared/ui/Board` ran (17 files, 222 tests green on the clean scratch), and the file was restored. M15 also ran `e2e/training.spec.ts` (`full-analysis`, real engine) against the scratch build. The scratch worktree was removed; the real worktree's `git status --porcelain` was empty before and after.

| # | File | Fault | Result |
| - | ---- | ----- | ------ |
| M01 | `training/model/exercise.ts:116` | accept rule inverted (`!==` → `===` "mistake") | ✅ Killed |
| M02 | `exercise.ts:116` | accept everything (D3 threshold ignored) | ✅ Killed |
| M03 | `exercise.ts:118` | `repeatedGameMove` always false | ✅ Killed |
| M04 | `training/machines/trainingMachine.ts:195` | refutation not shown on the board | ✅ Killed |
| M05 | `trainingMachine.ts:217-220` | refutation never returns to the start | ✅ Killed |
| M06 | `trainingMachine.ts:17` | `REFUTATION_MS` 1200 → 12000 | ❌ **Survived** (G3) |
| M07 | `training/components/TrainingScreen.tsx:217` | hint order swapped | ✅ Killed |
| M08 | `trainingMachine.ts:100` | hints not capped at 2 | ✅ Killed |
| M09 | `exercise.ts:188` | a wrong attempt still counts as first-try | ✅ Killed |
| M10 | `exercise.ts:193` | summary counts with-hint as first-try | ✅ Killed |
| M11 | `trainingMachine.ts:207` | engine error counts as an attempt | ✅ Killed |
| M12 | `trainingMachine.ts:206` | engine error does not reset the board | ✅ Killed |
| M13 | `exercise.ts:214` | squares without legal moves (opponent pieces) get selected | ✅ Killed |
| M14 | `shared/ui/Board.tsx:150` | `disabled` ignored | ✅ Killed |
| M15 | `TrainingScreen.tsx:176` | orientation fixed to white | ✅ Killed (e2e only: `e2e/training.spec.ts:16`; Vitest survives) |
| M16 | `trainingMachine.ts:233` | `MOMENT.NEXT` skips a moment | ✅ Killed |
| M17 | `TrainingScreen.tsx:144` | `TRAINING.BACK` not sent | ✅ Killed |
| M18 | `app/appMachine.ts:141` | app passes no engine | ✅ Killed |
| M19 | `appMachine.ts:140` | app passes the wrong ply | ✅ Killed |
| M20 | `trainingMachine.ts:194` | "Tentativa N" frozen at 1 | ❌ **Survived** (G1) |
| M21 | `TrainingScreen.tsx:70` | wrong-attempt feedback also prints "A solução é 22...Bd4+." | ❌ **Survived** (G2) |
| M22 | `exercise.ts:24` | continuation capped at 6 instead of 4 | ✅ Killed |
| M23 | `trainingMachine.ts:223` | `UNDO` ignored during the refutation | ✅ Killed |

**Sensor depth**: P0-style manual run (23 behavior mutants + 1 e2e confirmation).
**Result**: 20/23 killed (M15 needs Playwright) - ❌ FAIL

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ (Board gains an interactive mode; the read-only mode is unchanged and still tested) |
| No scope creep | ✅ (T-11, drag and AI texts left out as the spec says) |
| Matches patterns | ✅ `setup({types, actors, guards, actions})`, side effect in the `evaluateAttempt` actor, rules in `training/model`, cross-domain imports only through `index.ts` |
| Spec-anchored outcome check | ❌ G1, G2 |
| Per-layer coverage (domain 1:1 ACs; UI happy + edge + error) | ✅ |
| Every test maps to a requirement | ✅ |
| Documented guidelines followed: `docs/engineering/quality.md`, `docs/architecture/code-structure.md` | ✅ |

---

## Edge Cases

- [x] Engine failure (TR-14): message, reset, not counted as an attempt.
- [x] Engine without a PV: accepted, no reply and no refutation (`model/exercise.test.ts:184-194`).
- [x] Illegal PV reply: board unchanged (`model/exercise.test.ts:196-203`).
- [x] No or illegal best move: no solution label (`model/exercise.test.ts:205-212`).
- [x] Promotion promotes to a queen (`model/exercise.test.ts:214-227`, `game/model/moves.test.ts`).
- [x] Board locked while checking (spec sweep): `disabled={!playing}` (`TrainingScreen.tsx:188`), Board test `Board.test.tsx:99-106`, M14 killed.
- [ ] Training opened from a later moment: the session covers only that moment and the later ones, so the summary is "N de (remaining)" (`TrainingScreen.test.tsx:148` asserts "0 de 1 de primeira"). The spec does not define M (G5).

---

## Visual check

Not repeated by the Verifier (optional in this run). The author's e2e ran against `vite preview` with isolation headers on. Copy differences against `docs/design/step_04/Treino.dc.html` are deliberate: "Clique na peça e depois na casa de destino" instead of "Clique ou arraste para jogar" (no drag in the MVP), and "Desfazer" is disabled at the start position.

---

## Fix Plans

Ranked by severity.

### G1 (Major): "Tentativa N" is not tested beyond 1 (TR-05, M20)

- **Root cause**: every test makes at most one wrong attempt before checking `feedback.attempt`.
- **Fix task**: in `apps/web/src/domains/training/machines/trainingMachine.test.ts`, play `e8e6`, `UNDO`, play `a8a7`, then `expect(context.feedback).toMatchObject({kind: "wrong", attempt: 2})`. In `TrainingScreen.test.tsx:84-100`, after "Desfazer" play `a8→a7` and `findByText("Tentativa 2")`.
- **Done when**: M20 is killed.

### G2 (Major): "sem revelar a solução" has no assertion (TR-05, step_04 §7 AC2, M21)

- **Root cause**: the tests check that the right texts are present, never that the solution is absent after a wrong attempt.
- **Fix task**: in `TrainingScreen.test.tsx:84-100`, after the refutation, `expect(within(status).queryByText(/Bd4|Bb2|A solução/)).toBeNull()` and `expect(square("d4")).not.toHaveAttribute("data-mark", "green")`. In `apps/web/e2e/training.spec.ts:33-35`, anchor the regex at the end (`…tabuleiro\.$`) and add `await expect(status).not.toContainText("Bd4")`.
- **Done when**: M21 is killed.

### G3 (Minor): the 1.2 s refutation window is not pinned (spec assumption T-04, M06)

- **Root cause**: `trainingMachine.test.ts:106` advances by the imported `REFUTATION_MS`, so any value passes.
- **Fix task**: advance by the literal (`vi.advanceTimersByTimeAsync(1199)` → still `refuting`; `+1` → `playing`), or `expect(REFUTATION_MS).toBe(1200)`.
- **Done when**: M06 is killed.

### G4 (Minor): highlighted squares are not described in text (step_04 §8)

- **Root cause**: the danger mark and the destination dots exist only as color/shape; the board label leaves out what the mockup's label says.
- **Fix task**: append the mark description to the board label (for example "O bispo preto em a1 está destacado.", from `exercise.moment.lostPiece` while `atStart`) in `TrainingScreen.tsx:178`, and add ", destino possível" to the destination squares' `aria-label` in `shared/ui/Board.tsx` (`squareLabel`). Test by accessible name in `TrainingScreen.test.tsx` and `Board.test.tsx`.
- **Done when**: `getByRole("group", {name: /O bispo preto em a1 está destacado/})` and `getByRole("button", {name: "d4, vazia, destino possível"})` pass after selecting a1.

### G5 (Spec-precision): M in "N de M de primeira" when training starts at a later moment (TR-11)

- **Root cause**: TR-11 does not say whether M counts every key moment or only the ones trained in this session; "Momento 4 de 5" plus a summary of "0 de 2" is possible today.
- **Fix task**: decide in `spec.md` TR-11 (recommended: M = moments trained in the session, and say so), then pin it with a test starting at ply 86 (`index` 3) that finishes and asserts the exact summary.

### G6 (Housekeeping): traceability not updated

- **Fix task**: set `tasks.md` `**Status**` to Done and the spec traceability rows to Verified once G1–G4 are closed.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| TR-01..TR-04 | Pending | ✅ Verified |
| TR-05 | Pending | ❌ Needs Fix (G1, G2) |
| TR-06..TR-10 | Pending | ✅ Verified |
| TR-11 | Pending | ⚠️ Verified, spec-precision gap (G5) |
| TR-12..TR-14 | Pending | ✅ Verified |
| step_04 §8 (text for highlights) | - | ❌ Needs Fix (G4) |

---

## Summary

**Overall**: ❌ Not Ready (small fixes)

**Spec-anchored check**: 13/14 TR and 3/4 step_04 §7 criteria matched; 2 spec-precision gaps (TR-07 wording, TR-11 M).
**Sensor**: 20/23 killed in the suites (M15 killed only by e2e); M06, M20 and M21 survived.
**Gate**: `make check` 416 Vitest + 75 pytest passed; `make test-e2e` 16 passed.

**What works**: the T-03 accept rule (Te6 refuted by 23.Txa1, Bd4+ and Bb2 accepted with the real engine), refutation and return, repeated-move notice, ordered and capped hints, solution, undo, outcomes and summary, back navigation, engine failure, and keyboard play.

**Next steps**: close G1–G4 (test and label changes only), decide G5 in the spec, then re-verify.
