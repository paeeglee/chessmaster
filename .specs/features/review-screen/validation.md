# F7 · Resultado Validation

**Date**: 2026-11-23
**Spec**: `.specs/features/review-screen/spec.md`
**Diff range**: `origin/main..HEAD` (`91cc8cc..1146618`, 8 commits, 37 files)
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: FAIL

Both gates are green and every RV requirement has a test. Three discrimination mutants survive the whole suite, Vitest and Playwright both:

- **M11 / M12:** the training buttons can send the wrong ply. Tests check only the event type.
- **M15:** clicking a key-moment move in the move list can skip the moment sync (RV-10) without any test failing.

These are fix tasks (F1–F2 below). The feature is not done until they are fixed.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Review model | ✅ Done | `review.ts` + 12 tests |
| T2 Review machine and app wiring | ✅ Done | `reviewMachine.ts`, app `review`/`training` states |
| T3 Board, chart and move list | ✅ Done | `explore.test.tsx` |
| T4 Summary, moments, strengths, ask AI, footer | ✅ Done | `ReviewScreen.test.tsx` |
| T5 E2E and visual check | ✅ Done | `e2e/review.spec.ts` |

---

## Gate Check

- **`make check`**: exit 0. Biome and Ruff clean, `tsc` and mypy clean. Vitest has 33 files and **358 passed**: 98.12% stmts, 90.34% branches, `review/model` at 98% stmts and 91.3% branches. pytest has 75 passed at 99.28%.
- **`make test-e2e`**: exit 0, **14 passed** in 1.1 min, including `[full-analysis] e2e/review.spec.ts:7`. Ports 4173/8000 were free before and after the run.
- **Test delta**: +52 `it(...)` cases in `apps/web/src`, 0 removed, plus 1 new Playwright spec.
- **Skipped**: none.

---

## Spec-Anchored Acceptance Criteria

### RV requirements (spec.md)

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| RV-01 | Band shows result tag, context line, verdict, patterns | `apps/web/src/domains/review/components/ReviewScreen.test.tsx:65-68`: `getByText("Vitória · 0-1")`, `"Você: pretas · 72 lances · xeque-mate"`, `heading level 1 toHaveTextContent(verdict)`, `getByText(patterns_sentence)`. `e2e/review.spec.ts:14-15` | ✅ |
| RV-02 | Cards: number of key moments, best move, max advantage | `apps/web/src/domains/review/model/review.test.ts:42-45`: `{value:"5",…}`, `{value:"12...Bxa1!",…}`. Card 3 is asserted as `` `+${Math.max(...result.materialTimeline)}` ``, which recomputes the implementation formula. | ⚠️ Spec-precision gap: card 3 has no concrete expected value |
| RV-03 | AI failed: "A explicação não pôde ser gerada." + "Tentar de novo"; habit and ask-AI hidden | `ReviewScreen.test.tsx:79-89`: heading present, `queryByText("Hábito…")` null, ask field null, `"✕ IA: falhou"`, retry shows the verdict. Machine: `apps/web/src/domains/review/machines/reviewMachine.test.ts:139-163` | ✅ |
| RV-04 | No key moments: "Nenhuma perda de material importante" | `apps/web/src/app/App.test.tsx:142`: `getByText("Nenhuma perda de material importante.")` | ✅ |
| RV-05 | Opens before the first key moment, from the player's side | `review.test.ts:70` `initialPosition → 43`. `reviewMachine.test.ts:42-46` `{position:43, orientation:"b"}`. `apps/web/src/domains/review/components/explore.test.tsx:57-59` `"Antes de 22...Ta7?"`, first square `h1`. `e2e/review.spec.ts:23-28` | ✅ |
| RV-06 | Início/Anterior/Próximo/Fim buttons, ←/→/Home/End, Girar | `explore.test.tsx:65-90` (captions after each button and key; `firstSquare()` → `a8` after Girar). `reviewMachine.test.ts:49-70` (bounds 0/144) | ✅ |
| RV-07 | Red lost-piece square, green best-move destination, legend "lance sugerido (X)" | `explore.test.tsx:60-62`: `a1 data-mark="red"`, `d4 "green"`, `/lance sugerido \(Bd4\+\)/`. `review.test.ts:81-84` | ✅ |
| RV-08 | Material after every ply, numbered clickable circles, hidden under 15 moves | `review.test.ts:98-107` (145 points, marks at plies 44/54/82/86/112). `explore.test.tsx:96-98,113-116` | ✅ |
| RV-09 | Two columns, `??` for loss ≥ 5, `?` for a key moment, `!` for a strength, selection highlighted | `review.test.ts:52-59` (72 rows, `Bxa1!`, `Ta7?`, `Te6??`). `explore.test.tsx:120-129` (`aria-current="true"` on `Ta7?`) | ✅ |
| RV-10 | Choosing a moment in the list, chart **or move list** syncs board + expanded item + highlight | List: `ReviewScreen.test.tsx:115-127`. Chart: `explore.test.tsx:98-101` checks board and highlight; the expanded item is checked only in `e2e/review.spec.ts:33-41`. **Move list: no test clicks a key-moment move** (M15 survived). | ❌ GAP (move-list entry point) |
| RV-11 | Ordered list, one expanded (`aria-expanded`), type tag, summary, explanation, best move, "Vantagem: +A → +B" | `ReviewScreen.test.tsx:94-127`: order of 5 labels, `"Peça atacada"`, `aria-expanded` true/false, `"Melhor: 22...Bd4+"`, `"Vantagem: +9 → +6"` | ✅ |
| RV-12 | "Treinar este momento" trains **that** moment; "Treinar os N" starts at the **first** | `ReviewScreen.test.tsx:129-134` asserts only `["TRAINING.REQUESTED","TRAINING.REQUESTED"]` (no ply). The machine forwards the ply (`reviewMachine.test.ts:191-195`) and the app stores it (`apps/web/src/app/appMachine.test.ts:248-250`), but no test checks which ply the buttons send. M11 and M12 survived. | ❌ GAP |
| RV-13 | Engine line after the moment, up to 6 plies | `reviewMachine.test.ts:80-94`: `position 44`, `fens.length ≤ 6`, steps to the end and back to `browsing`. The component test `ReviewScreen.test.tsx:139` uses a weak regex. | ✅ |
| RV-14 | Strengths texts from the AI, or templates | `ReviewScreen.test.tsx:146,153`: `"12...Bxa1! — ganhou a torre em a1."`. Net-gain rule: `apps/web/src/domains/analysis/model/classify.test.ts:395-410` `kind "none"` for a recapture | ✅ |
| RV-15 | Habit sentence shown | `ReviewScreen.test.tsx:147` | ✅ |
| RV-16 | Chip or typed question calls `/api/questions`; "Pensando…" while waiting; answer shown | `ReviewScreen.test.tsx:158-181`. Real call through the proxy: `e2e/review.spec.ts:44-51`. Trim: `reviewMachine.test.ts:107-118`. The 500-char cap (`reviewMachine.ts:197`, `maxLength` in `ReviewSidebar.tsx:90`) is untested. | ✅ (cap untested, minor) |
| RV-17 | Failure: "Não foi possível responder agora. Tente de novo." | `ReviewScreen.test.tsx:183-195` | ✅ |
| RV-18 | Footer lists rules, evaluation, tablebase and AI with ✓ or "falhou" | `ReviewScreen.test.tsx:199-205,84,89` (AI ✓ and ✕). Rules, evaluation and tablebase are hard-coded ✓ (`apps/web/src/domains/review/components/ReviewSidebar.tsx:130-132`). | ⚠️ Spec-precision gap (see G4) |
| RV-19 | Confirmation dialog; confirm returns to Colar with the field empty; cancel keeps the result | `ReviewScreen.test.tsx:207-219` (`alertdialog`, cancel then confirm). `reviewMachine.test.ts:180-189`. `appMachine.test.ts:197-226` (`text:""`, `playerColor:null`) | ✅ |
| RV-20 | Lost game: neutral tag "Derrota · 1-0" | `review.test.ts:30` `{label:"Derrota · 0-1", tone:"loss"}`. The `loss` tone uses neutral styling (`SummaryBand.tsx:6`). | ✅ |

### step_03 §7 acceptance criteria

| Criterion | Evidence | Result |
| --------- | -------- | ------ |
| Verdict says the advantage started at move 12 and material went back 5 times | The fake provider builds "A vantagem começou em …" (`apps/api/.../infrastructure/fake_provider.py:76-78`). The e2e only asserts `/^Vitória\./` (`e2e/analysis.spec.ts:29`). | ⚠️ Partial (G5) |
| 5 key moments at 22, 27, 41, 43, 56 | `ReviewScreen.test.tsx:98-104` (fixture). `e2e/review.spec.ts:16-19` (the 4 stable moments; 27...Tb7 is borderline, documented in `docs/architecture/overview.md`) | ✅ |
| Board before 22...Ta7, Black at the bottom | `e2e/review.spec.ts:23-28` | ✅ |
| Click circle 43 → board before 43...Te6, moment 4 expanded, move highlighted | `e2e/review.spec.ts:33-41` | ✅ |
| Off-topic question → AI says it only talks about this game | The backend answer is F6 scope. F7 has no test that renders an `in_scope:false` answer. | ⚠️ Not covered in F7 (G6) |
| AI failed → board, chart and annotated list plus the failure notice | Notice: `ReviewScreen.test.tsx:79-84`, `App.test.tsx:141`. That test does not check board, chart or list in the failed state; they render unconditionally (`ReviewScreen.tsx`). | ⚠️ Partial (G7) |

---

## Discrimination Sensor

Scratch: `git worktree add --detach /tmp/f7-sensor HEAD` with copied `node_modules`. Each mutant ran against `vitest run src/domains/review src/domains/analysis src/app` (147 tests). Survivors were checked against the Playwright suite where the e2e touches the behavior. The scratch was removed (`git worktree remove --force`). The real worktree's `git status --porcelain` matched the empty baseline.

| # | File:line | Mutation | Result |
| - | --------- | -------- | ------ |
| M1 | `review/model/review.ts:101` | `first.ply - 1` → `first.ply` (wrong initial position) | ✅ Killed (6) |
| M2 | `review/machines/reviewMachine.ts:91` | orientation fixed to `"w"` | ✅ Killed (4) |
| M3 | `review/model/review.ts:111` | `momentAt` off by one | ✅ Killed (8) |
| M4 | `review/components/MaterialChart.tsx:93` | circle click sends `POSITION.SELECT` (no moment sync) | ⚠️ Survived Vitest; ✅ killed by `e2e/review.spec.ts:35` (run in scratch: `aria-expanded` "false") |
| M5 | `review/components/MoveList.tsx:54` | highlight follows the position, not the moment | ✅ Killed (2) |
| M6 | `review/machines/reviewMachine.ts:244` | `AI.RETRY` guard always true | ✅ Killed (1) |
| M7 | `review/machines/reviewMachine.ts:269` | `NEW_GAME.REQUEST` skips confirmation | ✅ Killed (2) |
| M8 | `analysis/model/classify.ts:120` | strength gain from `ply.fenBefore` | ✅ Killed (5) |
| M9 | `review/model/review.ts:61` | `??` threshold `>= 5` → `> 5` | ✅ Killed (4) |
| M10 | `review/model/review.ts:195` | chip text changed | ✅ Killed (2) |
| M11 | `review/components/KeyMomentsList.tsx:115` | "Treinar os N" starts at the last moment | ❌ Survived (Vitest and e2e) |
| M12 | `review/components/KeyMomentsList.tsx:93` | "Treinar este momento" sends `ply + 2` | ❌ Survived (Vitest and e2e) |
| M13 | `review/machines/reviewMachine.ts:155` | engine line PV taken from the position before the mistake | ✅ Killed (1) |
| M14 | `review/components/ReviewSidebar.tsx:133` | footer AI always ✓ | ✅ Killed (1) |
| M15 | `review/components/MoveList.tsx:50` | key-moment move click only moves the board | ❌ Survived (Vitest and e2e) |
| M16 | `review/machines/reviewMachine.ts:92` | no moment expanded at open | ✅ Killed (4) |

**Sensor depth**: lightweight+ (16 behavior mutations)
**Result**: 13/16 killed (12 by Vitest, 1 more by e2e). **FAIL**

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / no scope creep | ✅ (the Material/Avaliação toggle and Salvar are correctly out of scope) |
| DDD structure (`review/{model,machines,components,fixtures}`, public `index.ts`, `model/` free of xstate) | ✅ |
| XState: side effects in actors (`askQuestion`, `explainGame`), swapped with `provide()` in tests | ✅ |
| Matches patterns | ✅ |
| Spec-anchored outcome check | ⚠️ RV-02 card 3 mirrors the implementation; RV-12 asserts only the event type |
| Every test maps to a spec requirement | ✅ |
| Guidelines: `docs/engineering/quality.md`, `docs/architecture/code-structure.md` | ✅ |

## Edge Cases

- [x] Lost game, neutral tag (RV-20)
- [x] Short game hides the chart (`explore.test.tsx:113`)
- [x] No key moments (`App.test.tsx:142`), initial position = final (`review.test.ts:77`)
- [ ] More than 5 candidates: the "ver todos os lances anotados" link (step_03 §6, spec Assumptions) is not implemented. No match for the text in `apps/web/src`.

## Visual check

The Verifier did not run an independent screenshot comparison (optional step). The author's T5 commit (`1146618`) records a layout match to `docs/design/step_03/Resultado.dc.html`.

---

## Ranked Gaps and Fix Plans

1. **G1 (Major, RV-12): training buttons send an unverified ply.** M11 and M12 survived.
   - **Fix:** in `apps/web/src/domains/review/components/ReviewScreen.test.tsx:129-134`, record `JSON.stringify(event)` in the parent instead of `event.type`.
   - Expand `Ver 43...Te6`, click "Treinar este momento", and expect `{type:"TRAINING.REQUESTED", ply:86}`.
   - Then click "Treinar os 5 momentos" and expect `ply:44`.
2. **G2 (Major, RV-10): move-list entry point of the moment sync is untested.** M15 survived.
   - **Fix:** in `ReviewScreen.test.tsx`, add a test that clicks the `Te6??` button inside the `Lances` region.
   - Expect `Ver 43...Te6` to have `aria-expanded="true"`, and expect the caption "Antes de 43...Te6?".
   - Also assert `aria-expanded` in the chart test so M4 dies in Vitest and not only in the 30 s e2e. This matches confirmed lesson L-010.
3. **G3 (Minor, step_03 §6): "Mais de 5 candidatos" state missing.**
   - **Fix:** expose the candidate count from analysis and render the "ver todos os lances anotados" link that scrolls to `#lances`, with a component test.
   - Or move the state to Out of Scope in `spec.md` with a reason.
4. **G4 (Minor, RV-18): footer status is hard-coded.**
   - Rules, evaluation and tablebase always show ✓ (`ReviewSidebar.tsx:130-132`). The tablebase (F5) does not exist yet.
   - **Fix:** state in `spec.md` that only AI can fail on this screen (evaluation failure never reaches Resultado). Until F5 lands, hide or mark the tablebase line.
5. **G5 (Minor, §7 verdict AC):** in `e2e/analysis.spec.ts:29` or `e2e/review.spec.ts`, assert `/A vantagem começou em 12\.\.\./` in the level-1 heading.
6. **G6 (Minor, §7 off-topic AC):** add a component test where `askQuestion` resolves `{in_scope:false, answer:"Só falo sobre esta partida…"}` and the answer is shown.
7. **G7 (Minor, §7 AI-failed AC):** in `ReviewScreen.test.tsx:78`, also assert the board region, the chart `img` and the `Lances` region with `Ta7?` in the AI-failed state.
8. **G8 (Cosmetic, RV-02 precision):** replace the recomputed max in `review.test.ts:45` with the fixture's concrete value.

## Requirement Traceability Update

| Requirement | New Status |
| ----------- | ---------- |
| RV-01, RV-03–RV-09, RV-11, RV-13–RV-17, RV-19, RV-20 | ✅ Verified |
| RV-02, RV-18 | ⚠️ Verified with spec-precision gap |
| RV-10, RV-12 | ❌ Needs fix (G2, G1) |

## Summary

**Overall**: ❌ Not ready. Two test-only fixes (G1, G2) close the surviving mutants. G3–G8 are minor.

**Spec-anchored check**: 16/20 RV matched spec outcome; 2 gaps (RV-10, RV-12); 2 spec-precision gaps (RV-02, RV-18)
**Sensor**: 13/16 killed
**Gate**: `make check` 358 + 75 passed; `make test-e2e` 14 passed
