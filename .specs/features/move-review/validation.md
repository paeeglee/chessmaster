# F9 · Revisão lance a lance Validation

**Date**: 2026-11-24
**Spec**: `.specs/features/move-review/spec.md`
**Diff range**: `origin/main..HEAD` (00374b7..68a4d82, 9 commits, 62 files)
**Verifier**: independent sub-agent (author ≠ verifier)
**Verdict**: FAIL ❌ (4 surviving non-equivalent mutants, one of them hiding a real MR-11 defect; all gates green)

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Engine 500 ms | ✅ Done | 36f1bc9 |
| T2 Move quality | ✅ Done | 34389ca |
| T3 Move facts | ✅ Done | 775b76b |
| T4 Move reviews in result | ✅ Done | b474a7a |
| T5 Move explanation API | ✅ Done | ea67226 |
| T6 Coach region | ✅ Done | 7f14f73 |
| T7 Coach panel, eval bar, icons | ✅ Done | e765889 |
| T8 e2e + docs | ✅ Done | 68a4d82 |

---

## Spec-Anchored Acceptance Criteria

| Req | Spec-defined outcome | `file:line` + assertion | Result |
| --- | -------------------- | ----------------------- | ------ |
| MR-01 | every ply classified on the 7-label scale | `apps/web/src/domains/analysis/model/moveReview.test.ts:24` `expect(reviews).toHaveLength(144)`; bands `apps/web/src/domains/analysis/model/moveQuality.test.ts:35-42` (`quality(1.99)`→excellent … `quality(20)`→blunder) | ✅ PASS |
| MR-02 | played = engine best → Melhor | `apps/web/src/domains/analysis/model/moveQuality.test.ts:30` `expect(quality(3, true)).toBe("best")`; `apps/web/src/domains/analysis/model/moveReview.test.ts:45` 12...Bxa1 `quality: "best"` | ✅ PASS (see gap G2) |
| MR-03 | mate → 100 / 0 for the mover | `apps/web/src/domains/analysis/model/moveQuality.test.ts:13-16` | ✅ PASS (mate 0 not covered, G1) |
| MR-04 | previous loss ≥ 10 and loss ≥ 10 → Perdeu a chance | `apps/web/src/domains/analysis/model/moveQuality.test.ts:46-51` (10/10 → miss, 9.99 → inaccuracy, prev 9.99 → mistake) | ✅ PASS |
| MR-20 | D3 loss ≥ 2 → at least Erro, ≥ 5 → Capivarada, miss kept | `apps/web/src/domains/analysis/model/moveReview.test.ts:80-82,86`; reference 22...Ta7 = Erro `:32`, 43...Te6 = Capivarada `:41` | ✅ PASS |
| MR-05 | best move label (pt SAN + number), line ≤ 6, isBest | `apps/web/src/domains/analysis/model/moveFacts.test.ts:54-58` `bestMoveLabel === "22...Bd4+"`, `bestLine.length <= 6` | ✅ PASS |
| MR-06 | pieces left undefended / attacked by cheaper piece | `apps/web/src/domains/analysis/model/moveFacts.test.ts:86` `undefended == [{b,e4}]`; `apps/web/src/domains/game/model/lines.test.ts:94,100,105` | ✅ PASS |
| MR-07 | missed material ≥ 1 and still-en-prise pieces | `apps/web/src/domains/analysis/model/moveFacts.test.ts:68-69,88` | ✅ PASS |
| MR-08 | why: check, mate in N, wins N, saves piece | `apps/web/src/domains/analysis/model/moveFacts.test.ts:59-63,104`; text `apps/web/src/domains/review/model/coach.test.ts:41-48` | ✅ PASS |
| MR-09 | move-list icon with accessible name | `apps/web/src/domains/review/components/ReviewScreen.test.tsx:423` `getAllByRole("img", { name: "Erro" })` | ✅ PASS |
| MR-10 | panel: tag, "Melhor era …", facts, "Ver a linha do motor" | `apps/web/src/domains/review/components/ReviewScreen.test.tsx:361-367,378-379,408-410` | ✅ PASS (G2) |
| MR-11 | eval bar from White's side, ±10, mate "M N" | `apps/web/src/domains/review/model/coach.test.ts:82-87` labels; `:91-93` share | ⚠️ G1: final mate position wrong for White wins |
| MR-12 | initial position invites to pick a move | `apps/web/src/domains/review/components/ReviewScreen.test.tsx:417`; no request `apps/web/src/domains/review/machines/reviewMachine.test.ts:287` | ✅ PASS |
| MR-13 | first selection requests `POST /api/move-explanations`, "Pensando…" | `apps/web/src/domains/review/machines/reviewMachine.test.ts:214-216`; client `apps/web/src/domains/explanation/client/explanationClient.test.ts:65-77`; contract `apps/web/src/domains/analysis/model/contract.test.ts:131-162` | ✅ PASS |
| MR-14 | verified (only contract moves/squares/numbers), one retry, then error | `apps/api/src/game_analyzer/domains/explanation/tests/test_move_explanations.py:66,75,106-107,182-183` | ✅ PASS (G4) |
| MR-15 | cached per ply, no second call | `apps/web/src/domains/review/machines/reviewMachine.test.ts:234` `calls == [44, 10]` | ✅ PASS |
| MR-16 | AI down → facts kept + "Explicação indisponível" + "Tentar de novo" | `apps/web/src/domains/review/components/ReviewScreen.test.tsx:392-397`; `apps/web/src/domains/review/machines/reviewMachine.test.ts:269-271`; route 503 `test_move_explanations.py:175-176` | ✅ PASS |
| MR-17 | 500 ms, depth 12, estimate follows | `apps/web/src/domains/evaluation/model/uci.test.ts:92`; `apps/web/src/domains/game-input/model/model.test.ts:90,95-96` | ✅ PASS |
| MR-18 | mate → 100 for mover, stalemate → 50 | stalemate `apps/web/src/domains/analysis/model/moveReview.test.ts:60`; mate `:46` | ❌ GAP: mate assertion does not discriminate (M8 survived) |
| MR-19 | no best move → facts omit it | `apps/web/src/domains/analysis/model/moveFacts.test.ts:111` | ✅ PASS |
| step_03 R-14 | = MR-01 | as MR-01 | ✅ |
| step_03 R-15 | = MR-06..MR-10 | as above | ✅ |
| step_03 R-16 | = MR-13..MR-16 | as above | ✅ |
| step_03 R-17 | = MR-11 | as MR-11 | ⚠️ G1 |
| step_03 AC "22...Ta7 Erro, Melhor era 22...Bd4+, bispo a1 continuou atacado, texto da IA" | exact strings | component `ReviewScreen.test.tsx:361-370`; e2e `apps/web/e2e/review.spec.ts:48-58` (regex: Erro\|Capivarada, prefix "Melhor era 22...") | ✅ PASS (e2e looser by design: real Stockfish) |
| step_03 AC "12...Bxa1 → Melhor + 'Este foi o lance do motor.'" | exact strings | `ReviewScreen.test.tsx:378-379` | ✅ PASS |
| Success criterion (spec) | 22...Ta7 Erro, Bd4+, AI text on demand in e2e | `apps/web/e2e/review.spec.ts:48-58` | ✅ PASS |

### Reference-game sanity check (fixture `reference-game.evaluations.json`, player = black)

Distribution: 56 Melhor, 41 Excelente, 23 Bom, 11 Imprecisão, 6 Erro, 5 Capivarada, 2 Perdeu a chance (144 plies).

- All 5 key moments (44, 54, 82, 86, 112) are Erro or Capivarada; 43...Te6 and 56...Ta8 (loss 5) are Capivarada. No key moment is labelled better than Erro.
- Every ply where the played move equals the engine's best (34) is Melhor.
- Final 72...Ta6# gets winAfter 100 → Melhor.
- 44.Cd4 (opponent loses 10 points) is "Perdeu a chance", as MR-20 allows.
- **22 of the 56 Melhor labels are not the engine move** (loss ≤ 0 by search noise or a lost mate-against position, e.g. 69.Ra7, 71.Ra7 at win 0 → 0). The panel then shows "71.Ra7 · Melhor" next to "Melhor era 71.Rb8." (G2).

---

## Discrimination Sensor

Scratch git worktree (detached HEAD, symlinked `node_modules` / `.venv`, `PYTHONPATH=src` so the scratch API source wins). Full Vitest suite or full pytest per mutant. Baseline porcelain (empty) matched after `git worktree remove`.

| # | File:line | Mutation | Result |
| - | --------- | -------- | ------ |
| M1 | `apps/web/src/domains/analysis/model/moveQuality.ts:44` | logistic sign flipped | ✅ Killed |
| M2 | `moveQuality.ts:28` | Excelente band 2 → 3 | ✅ Killed |
| M3 | `moveQuality.ts:61` | `isBest` ignored | ✅ Killed |
| M4 | `moveQuality.ts:62` | miss rule inverted | ✅ Killed |
| M5 | `moveQuality.ts:42` | mate 100/0 swapped | ✅ Killed |
| M6 | `apps/web/src/domains/analysis/model/moveReview.ts:35` | material floor removed | ✅ Killed |
| M7 | `moveReview.ts:8` | Capivarada floor 5 → 6 | ✅ Killed |
| M8 | `moveReview.ts:55` | terminal checkmate override removed | ❌ Survived |
| M9 | `moveReview.ts:56` | stalemate override removed | ✅ Killed |
| M10 | `apps/web/src/domains/game/model/lines.ts:127` | cheaper-attacker `<` → `<=` | ✅ Killed |
| M11 | `lines.ts:123` | king-attacker filter removed | ⚪ Equivalent (king value 100 is never cheaper; filter is dead code) |
| M12 | `apps/web/src/domains/analysis/model/moveFacts.ts:129` | undefended ↔ stillEnPrise | ✅ Killed |
| M13 | `moveFacts.ts:110` | missedMaterial sign | ✅ Killed |
| M14 | `moveFacts.ts:133` | check ignores `+` | ✅ Killed |
| M15 | `moveFacts.ts:121` | mateIn side inverted | ✅ Killed |
| M16 | `moveFacts.ts:118` | `saves` ignores piece moved by best | ⚪ Equivalent (origin square is empty after the move, so the clause is redundant) |
| M17 | `apps/web/src/domains/analysis/model/contract.ts:85` | mover inverted | ✅ Killed |
| M18 | `apps/web/src/domains/review/machines/reviewMachine.ts:112` | re-request cached plies | ✅ Killed (request loop, tests time out) |
| M19 | `reviewMachine.ts:112` | never request | ✅ Killed |
| M20 | `reviewMachine.ts:237` | COACH.RETRY keeps the failure | ✅ Killed |
| M21 | `apps/web/src/domains/review/model/review.ts:243` | reviewedPly ignores key moment ahead | ✅ Killed |
| M22 | `apps/web/src/domains/review/model/coach.ts:102` | eval label sign swapped | ✅ Killed |
| M23 | `apps/web/src/domains/review/components/MoveList.tsx:23` | icon name = internal id | ✅ Killed |
| M24 | `apps/web/src/domains/evaluation/model/searchPlan.ts:5` | 500 → 200 ms | ✅ Killed |
| M25 | `apps/api/src/game_analyzer/domains/explanation/domain/verification.py:141` | best-line numbering off | ✅ Killed |
| M26 | `verification.py:162` | any number allowed | ✅ Killed |
| M27 | `verification.py:149` | unlabeled `Tb7` allowed in move facts | ❌ Survived |
| M28 | `apps/web/playwright.config.ts:56` | API `reuseExistingServer` re-enabled | ❌ Survived (config, no guard) |
| M29 | `apps/web/playwright.config.ts:6` | e2e API back on port 8000 | ❌ Survived (config, no guard) |

**Sensor depth**: extended (29 manual mutants).
**Result**: 23/27 non-equivalent killed (85%), 2 equivalent: FAIL ❌.

Note: some killed runs also timed out "navega com os botões e gira (RV-06)" because of CPU load from the M18 hang. Each kill above was confirmed by a requirement-specific failing test, not by that timeout.

---

## Gate Check

- `make check`: ✅ Biome (146 files), tsc, mypy, Ruff; Vitest **494 passed** (43 files, coverage 96.71% statements / 91.78% branches); pytest **98 passed** (99.56%).
- `make test-e2e`: ✅ **18 passed** (6.9 min), own API on 8100 with `AI_PROVIDER=fake`, preview on 4173, user's `make dev` untouched.
- Tests before the feature (origin/main): 447 web + 81 api = 528. After: 494 + 98 = 592 (**+64**, none removed). No skips.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical | ✅ (two dead clauses: `lines.ts:123`, `moveFacts.ts:118`) |
| DDD boundaries (`model/` pure, no xstate; domains via `index.ts`) | ✅ |
| Matches patterns (fromPromise actors, `provide()` in tests, closed contract) | ✅ |
| Spec-anchored outcome check | ⚠️ G1, G2 |
| Per-layer coverage (domain 1:1; route happy/422/502/503) | ✅ |
| Guidelines: `docs/engineering/quality.md`, `docs/architecture/code-structure.md` | ✅ |
| Docs updated (general.md D1 + 7.1/7.2, step_03 R-14..R-17, overview F9 + ports, glossary, CLAUDE.md) | ✅ |

UI: no mockup exists for the coach panel. The panel reuses the step_03 tokens (`border-line`, `bg-surface`, `bg-canvas`, `text-ink-muted`, `font-serif`, `rounded-xl`), and the new `quality-*` and `eval-*` colors live once in `apps/web/src/app/theme.css`. I took no separate screenshot. The e2e confirms the panel, icons and bar render under cross-origin isolation.

---

## Ranked Gaps (fix tasks)

1. **G1 · MR-11/MR-18: "mate 0" is ambiguous (Major).** Stockfish reports `mate 0` for the side that is mated, and `toWhitePerspective` turns it into `{mate, 0}` for either color. `winChance` (`apps/web/src/domains/analysis/model/moveQuality.ts:41`) maps it to White = 0, so when **White** mates, the final position's eval bar shows Black at 100% with the label "M0" (`apps/web/src/domains/review/model/coach.ts:97`). The MR-18 override hides this for the classification, and the fixture (Black mates) hides it for the test, which is why M8 survives. **Fix:** decide the winner of a `mate 0` from the FEN side to move (the side to move is mated), either at storage time or in `whiteShare`/`evaluationLabel`, and label it "#" or "M0" with the winner's sign. Add tests: (a) `reviewMoves` on a game where White mates, with the override removed, must still give winAfter 100; (b) `whiteShare`/`evaluationLabel` for White-wins and Black-wins final positions.
2. **G2 · MR-02/MR-10: "Melhor" with "Melhor era X" (Major UX, spec-precision).** `classifyQuality` returns Melhor when `loss <= 0` (`moveQuality.ts:61`), but `bestMoveSentence` keys on `facts.isBest` (`apps/web/src/domains/review/model/coach.ts:61`). That gives 22 contradictory panels in the reference game. **Fix:** pick one rule in the spec. Either (a) Melhor only when `isBest`, and loss ≤ 0 becomes Excelente, or (b) when quality is Melhor but not the engine move, write "Tão bom quanto o lance do motor (X)." Pin it with a coach test on ply 141 (71.Ra7).
3. **G3 · e2e port isolation is unguarded (Minor).** M28/M29 survive. **Fix:** add a Vitest test that imports `apps/web/playwright.config.ts` and asserts the `api` web server uses a port other than 8000, `reuseExistingServer === false` and `env.AI_PROVIDER === "fake"`, and that the `web` server's `API_PROXY_TARGET` points to the same port.
4. **G4 · MR-14: no rejection test for an unlabeled move outside the move contract (Minor).** M27 survives. **Fix:** in `apps/api/src/game_analyzer/domains/explanation/tests/test_move_explanations.py`, assert `verify_move_explanation(text("Tb7 era melhor."), contract()) == ["lance Tb7 não está no contrato"]`.
5. **G5 · Spec wording (Cosmetic).** The spec success criterion says the bishop on a1 was "left undefended", but it was already en prise, and step_03 and the code say "continuou atacado e sem defesa" (stillEnPrise). **Fix:** align the spec's Success Criteria with step_03. Also remove the dead clauses at `lines.ts:123` and `moveFacts.ts:118`, or justify them in a comment.

---

## Requirement Traceability Update

| Requirement | New status |
| ----------- | ---------- |
| MR-01..MR-10, MR-12..MR-17, MR-19, MR-20 | ✅ Verified |
| MR-11 | ❌ Needs fix (G1) |
| MR-18 | ❌ Needs fix (G1, M8) |
| MR-02 / MR-10 wording | ⚠️ Spec-precision gap (G2) |

---

## Summary

**Overall**: ❌ Not ready. Fix G1 to G4 and re-verify (iteration 1 of 3).
**Spec-anchored check**: 18/20 MR + 4/4 R matched, 2 needing fixes, 1 spec-precision gap.
**Sensor**: 23/27 non-equivalent killed (2 equivalent).
**Gate**: make check (494 + 98) ✅, make test-e2e 18/18 ✅.
