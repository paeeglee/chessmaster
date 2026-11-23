# F7 · Resultado Validation

**Date**: 2026-11-23 (round 2)
**Spec**: `.specs/features/review-screen/spec.md`
**Diff range**: `origin/main..HEAD` (`91cc8cc..e384ad0`). Round 2 re-verified the fix commit `e384ad0` on top of round 1 (`1146618`).
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: PASS

All 8 round-1 gaps (G1–G8) are closed. Both gates are green. All 22 sensor mutants are killed in Vitest: the 16 from round 1 plus 6 aimed at the new code.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Review model | ✅ Done | `review.ts` (+ `hiddenMistakes` in round 2) |
| T2 Review machine and app wiring | ✅ Done | `Question.inScope` added in round 2 |
| T3 Board, chart and move list | ✅ Done | - |
| T4 Summary, moments, strengths, ask AI, footer | ✅ Done | link, off-topic hint, tablebase footer added in round 2 |
| T5 E2E and visual check | ✅ Done | headline assertion tightened in round 2 |
| Fix round (G1–G8) | ✅ Done | `e384ad0` |

---

## Gate Check (round 2, HEAD `e384ad0`)

- **`make check`**: exit 0.
  - Biome checked 118 files, Ruff clean, `tsc` and mypy clean.
  - Vitest: 33 files, **365 passed**. Coverage 98.23% stmts and 90.54% branches overall; `review/model` at 98.05% stmts and 91.3% branches.
  - pytest: 75 passed, 99.28%.
- **`make test-e2e`**: exit 0, **14 passed** in 1.1 min, including `[full-analysis] e2e/analysis.spec.ts` and `e2e/review.spec.ts`. Ports 4173/8000 were free before and after the run.
- **Test delta**: round 1 had 358 Vitest tests, round 2 has 365 (+7). No tests were removed. The only edits to existing assertions make them stricter (event payloads, the literal `+10`, the full headline regex).
- **Skipped**: none.

---

## Round-1 gaps re-checked

| Gap | Fix verified | Evidence |
| --- | ------------ | -------- |
| G1 RV-12 training ply | ✅ | `apps/web/src/domains/review/components/ReviewScreen.test.tsx:150-159`: expands `Ver 43...Te6`, then `expect(events).toEqual([{type:"TRAINING.REQUESTED", ply:86}, {type:"TRAINING.REQUESTED", ply:44}])`. M11 and M12 are now killed. |
| G2 RV-10 move-list and chart entry points | ✅ | `ReviewScreen.test.tsx:170-179`: click `Te6??` in "Lances" → `Ver 43...Te6` `aria-expanded="true"` and "Antes de 43...Te6?". `ReviewScreen.test.tsx:161-168`: click `Momento 4: 43...Te6` → `aria-expanded="true"`. M15 and M4 are now killed in Vitest. |
| G3 more than 5 candidates | ✅ | `apps/web/src/domains/review/model/review.ts:219-223` (`hiddenMistakes` counts only `kind === "mistake"`, the player's). Link at `KeyMomentsList.tsx:112-116`. Tests: `ReviewScreen.test.tsx:181-196` (`link` with `href="#lances"`) and `:198-201` (no link with ≤ 5). |
| G4 RV-18 tablebase status | ✅ | `spec.md` RV-18 narrowed (F5 pending, only the AI can fail here). `ReviewSidebar.tsx:137-138` (`– Tabela de finais (ainda não disponível)`). `ReviewScreen.test.tsx:107-111`: `getByText("– Tabela de finais (ainda não disponível)")`, `queryByText(/✓ Tabela de finais/)` null. |
| G5 headline AC | ✅ | `apps/web/e2e/analysis.spec.ts:29-31`: `toHaveText(/^Vitória\. A vantagem começou em 12\.\.\.Bxa1\./)`. Passed in `make test-e2e`. |
| G6 off-topic question AC | ✅ | `reviewMachine.ts` keeps `inScope: event.output.in_scope`. `ReviewScreen.test.tsx:239-253`: an `in_scope:false` answer shows the answer and "Experimente uma das sugestões acima.". `:255-260`: an in-scope answer has no hint. |
| G7 AI-failed AC | ✅ | `ReviewScreen.test.tsx:97-99`: the "Tabuleiro da partida", `/Vantagem de material/` and "Lances" regions are present with the AI failed. |
| G8 RV-02 precision | ✅ | `apps/web/src/domains/review/model/review.test.ts:45-46`: `toBe("+10")`. |

---

## Spec-Anchored Acceptance Criteria

### RV requirements (spec.md)

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| RV-01 | Result tag, context line, verdict, patterns | `ReviewScreen.test.tsx` "resumo" block: `getByText("Vitória · 0-1")`, `"Você: pretas · 72 lances · xeque-mate"`, `heading level 1`, `patterns_sentence`. `apps/web/e2e/review.spec.ts:14-15` | ✅ |
| RV-02 | Key moment count, best move, max advantage | `review.test.ts:42-46`: `"5"`, `"12...Bxa1!"`, `"+10"` | ✅ |
| RV-03 | Failure notice + "Tentar de novo"; habit and ask-AI hidden | `ReviewScreen.test.tsx:87-105`. `apps/web/src/domains/review/machines/reviewMachine.test.ts:139-163` | ✅ |
| RV-04 | "Nenhuma perda de material importante" | `apps/web/src/app/App.test.tsx:142` | ✅ |
| RV-05 | Before the first key moment, from the player's side | `review.test.ts:70`. `reviewMachine.test.ts:42-46` (`position:43, orientation:"b"`). `explore.test.tsx:57-59`. `e2e/review.spec.ts:23-28` | ✅ |
| RV-06 | Buttons, ←/→/Home/End, Girar | `apps/web/src/domains/review/components/explore.test.tsx:65-90`. `reviewMachine.test.ts:49-70` | ✅ |
| RV-07 | Red lost-piece square, green best-move destination, legend | `explore.test.tsx:60-62`. `review.test.ts:81-84` | ✅ |
| RV-08 | Material per ply, numbered clickable circles, hidden under 15 moves | `review.test.ts:98-107`. `explore.test.tsx:96-101,113-116`. `ReviewScreen.test.tsx:161-168` | ✅ |
| RV-09 | Two columns; `??` for loss ≥ 5, `?`, `!`; highlight | `review.test.ts:52-59`. `explore.test.tsx:120-129` | ✅ |
| RV-10 | Moment from the list, chart or move list syncs board, expanded item and highlight | List: `ReviewScreen.test.tsx` "abrir outro momento". Chart: `:161-168` and `explore.test.tsx:98-101`. Move list: `:170-179`. E2E: `e2e/review.spec.ts:33-41` | ✅ |
| RV-11 | Ordered list, `aria-expanded`, type tag, texts, best move, "Vantagem: +A → +B" | `ReviewScreen.test.tsx` "lista os cinco em ordem" (5 labels, "Peça atacada", "Melhor: 22...Bd4+", "Vantagem: +9 → +6") | ✅ |
| RV-12 | Train this moment / train all from the first | `ReviewScreen.test.tsx:150-159` (ply 86 / ply 44). `apps/web/src/app/appMachine.test.ts:248-250` | ✅ |
| RV-13 | Engine line after the moment, ≤ 6 plies | `reviewMachine.test.ts:80-94` | ✅ |
| RV-14 | Strengths texts (AI or templates), net gains only | `ReviewScreen.test.tsx` "pontos fortes". `apps/web/src/domains/analysis/model/classify.test.ts:395-410` | ✅ |
| RV-15 | Habit sentence | `ReviewScreen.test.tsx` "usa os textos da IA" | ✅ |
| RV-16 | `/api/questions`, "Pensando…", answer shown | `ReviewScreen.test.tsx` "pergunta por um chip" / "pelo campo". `e2e/review.spec.ts:44-51` (real proxy call) | ✅ |
| RV-17 | "Não foi possível responder agora. Tente de novo." | `ReviewScreen.test.tsx` "avisa quando não conseguiu responder" | ✅ |
| RV-18 | Engine statuses; tablebase "ainda não disponível" until F5 | `ReviewScreen.test.tsx:107-111` and the AI ✓/✕ assertions in the RV-03 test | ✅ |
| RV-19 | Confirmation dialog; confirm → Colar with an empty field; cancel keeps the result | `ReviewScreen.test.tsx` "pede confirmação antes de descartar". `reviewMachine.test.ts:180-189`. `appMachine.test.ts:197-226` | ✅ |
| RV-20 | Neutral "Derrota" tag | `review.test.ts:30`. Neutral styling in `SummaryBand.tsx:6` | ✅ |

### step_03 §7 acceptance criteria

| Criterion | Evidence | Result |
| --------- | -------- | ------ |
| Headline: advantage from move 12, material returned 5 times | `e2e/analysis.spec.ts:29-31` asserts "A vantagem começou em 12...Bxa1.". The count is 4 or 5 because 27...Tb7 is borderline (documented in `docs/architecture/overview.md`, "Lances limítrofes"), so the e2e does not pin it. | ✅ (count bounded by the known borderline) |
| 5 key moments 22, 27, 41, 43, 56 | `ReviewScreen.test.tsx` "lista os cinco em ordem" (fixture). `e2e/review.spec.ts:16-19` (4 stable moments) | ✅ |
| Board before 22...Ta7, Black at the bottom | `e2e/review.spec.ts:23-28` | ✅ |
| Circle 43 → position before 43...Te6, moment 4 expanded, move highlighted | `e2e/review.spec.ts:33-41` | ✅ |
| Off-topic question → polite notice and suggestions | `ReviewScreen.test.tsx:239-253` | ✅ |
| AI failed → board, chart, annotated list and failure notice | `ReviewScreen.test.tsx:87-99` | ✅ |

---

## Discrimination Sensor (round 2)

Scratch: `git worktree add --detach /tmp/f7-sensor2 HEAD` with copied `node_modules`. Each mutant ran against `vitest run src/domains/review src/domains/analysis src/app`. The scratch was removed (`git worktree remove --force`, `git worktree prune`). The real worktree's `git status --porcelain` matched the empty pre-sensor baseline.

| # | File | Mutation | Killed? |
| - | ---- | -------- | ------- |
| M1 | `review/model/review.ts` | `initialPosition` returns `first.ply` | ✅ (6) |
| M2 | `review/machines/reviewMachine.ts` | orientation fixed to `"w"` | ✅ (4) |
| M3 | `review/model/review.ts` | `momentAt` off by one | ✅ (9) |
| M4 | `review/components/MaterialChart.tsx` | circle sends `POSITION.SELECT` | ✅ (1), was e2e-only in round 1 |
| M5 | `review/components/MoveList.tsx` | highlight follows the position | ✅ (2) |
| M6 | `review/machines/reviewMachine.ts` | `AI.RETRY` guard always true | ✅ (1) |
| M7 | `review/machines/reviewMachine.ts` | `NEW_GAME.REQUEST` skips confirmation | ✅ (2) |
| M8 | `analysis/model/classify.ts` | strength gain from `ply.fenBefore` | ✅ (6) |
| M9 | `review/model/review.ts` | `??` threshold `> 5` | ✅ (5) |
| M10 | `review/model/review.ts` | chip text changed | ✅ (3) |
| M11 | `review/components/KeyMomentsList.tsx` | "Treinar os N" from the last moment | ✅ (1), survived round 1 |
| M12 | `review/components/KeyMomentsList.tsx` | "Treinar este momento" sends `ply + 2` | ✅ (1), survived round 1 |
| M13 | `review/machines/reviewMachine.ts` | PV from the position before the mistake | ✅ (1) |
| M14 | `review/components/ReviewSidebar.tsx` | footer AI always ✓ | ✅ (1) |
| M15 | `review/components/MoveList.tsx` | key-moment move click only moves the board | ✅ (1), survived round 1 |
| M16 | `review/machines/reviewMachine.ts` | nothing expanded at open | ✅ (3) |
| M17 | `review/model/review.ts` | `hiddenMistakes` floor 1 (link always shown) | ✅ (1) |
| M18 | `review/model/review.ts` | `hiddenMistakes` also counts opponent mistakes | ✅ (1) |
| M19 | `review/components/KeyMomentsList.tsx` | link condition `> 99` (never shown) | ✅ (1) |
| M20 | `review/machines/reviewMachine.ts` | `inScope` forced `true` | ✅ (1) |
| M21 | `review/components/ReviewSidebar.tsx` | off-topic hint on every answer | ✅ (1) |
| M22 | `review/components/ReviewSidebar.tsx` | footer tablebase back to "✓" | ✅ (1) |

**Sensor depth**: lightweight+ (22 behavior mutations)
**Result**: 22/22 killed - PASS

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / no scope creep (toggle, Salvar, Minhas partidas out per spec and D2) | ✅ |
| DDD structure; `model/` free of xstate; cross-domain imports through `index.ts` | ✅ |
| Side effects in actors swapped with `provide()` | ✅ |
| Spec-anchored outcome check (asserted values match the spec) | ✅ |
| Every test maps to a spec requirement | ✅ |
| Guidelines: `docs/engineering/quality.md`, `docs/architecture/code-structure.md` | ✅ |

## Edge Cases

- [x] Lost game, neutral tag (RV-20)
- [x] Short game hides the chart (`explore.test.tsx:113-116`)
- [x] No key moments (`App.test.tsx:142`; `review.test.ts:77`)
- [x] More than 5 candidates → "ver todos os lances anotados" (`ReviewScreen.test.tsx:181-201`)

## Residual notes (non-blocking)

- The 500-character question cap (`maxLength` on the input, `.slice(0, 500)` in the machine) has no dedicated test.
- The 4th stat card ("N lances para o mate") waits on F5. Training is a placeholder until F8. Both are out of F7 scope.
- The Verifier did not run an independent screenshot comparison (optional). The author's T5 commit records the mockup match.

## Round 1 history

Round 1 (HEAD `1146618`) had both gates green but three surviving mutants: M11, M12 and M15. The RV-10 move-list entry point and the RV-12 training ply were untested. It also found five minor gaps (G3–G7) and one cosmetic gap (G8). Fix commit `e384ad0` addressed all of them, and round 2 verified each one above. Lessons L-037–L-039 record the round-1 signals.

## Requirement Traceability Update

| Requirement | New Status |
| ----------- | ---------- |
| RV-01 – RV-20 | ✅ Verified |

## Summary

**Overall**: ✅ Ready
**Spec-anchored check**: 20/20 RV and 6/6 step_03 §7 criteria matched
**Sensor**: 22/22 killed
**Gate**: `make check` (365 Vitest + 75 pytest) and `make test-e2e` (14) passed
