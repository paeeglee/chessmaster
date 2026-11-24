# F5 · Endgame tablebase Validation

**Date**: 2026-11-24 (round 2)
**Spec**: `.specs/features/endgame-tablebase/spec.md`
**Diff range**: `origin/main..HEAD` (`bfa4c46..008350a`). Round 2 re-verified the fix commit `008350a` on top of round 1 (`8aa1073`, report `5f6cf3b`).
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: PASS
**Result**: PASS (round 2, latest)

All round-1 gaps are closed. Both gates are green, and all 23 sensor mutants are killed, including the 2 that survived round 1 (6 and 22). The independent chess.js check from round 1 still holds, because `008350a` changes only tests and specs.

## Round 2 (HEAD `008350a`)

| Round-1 gap | Fix evidence | Result |
| ----------- | ------------ | ------ |
| Fix 1: blocker logic (mutant 6) | `apps/web/src/domains/evaluation/model/tablebase/tablebase.test.ts:71` - `8/8/4R3/4K3/8/8/4k3/8 w` `toMatchObject({ winner: "w" })`; `:73-75` - `8/8/4R3/4K3/8/4k3/8/8 b` (e2 escape behind the strong king) is not null and `dtmPlies` is not 0 | ✅ Mutant 6 killed |
| Fix 2: stage 4 on screen (TB-06, mutant 22) | `apps/web/src/domains/analysis/components/AnalyzingScreen.test.tsx:201` - `"Etapa 4 de 5: tabela de finais."`; `:202` - `"Tabela de finais — em andamento"`; `:204` - `"— falhou"`; `:205` - `"Explicação da IA — em andamento"`; `:211` / `:208` - `"aguardando"` → `"não necessária"` | ✅ Mutants 21 and 22 killed by TB-06 tests |
| Fix 3: docs drift | `spec.md` TB-08 adds "✕ Tabela de finais: falhou" (step_03 R-12); traceability marked Done (T1–T3); `design.md` drops `board.ts` | ✅ |

- **`make check`** (round 2): exit 0. Biome checked 136 files; Ruff, `tsc` and mypy clean. Vitest: 39 files, **445 passed** (+3), 96.31% stmts / 91% branches. pytest: 75 passed.
- **`make test-e2e`** (round 2): exit 0, **18 passed** (3.0 min), including `e2e/endgame.spec.ts:15`. Ports 4173/8000 were free before the run.
- **Sensor** (round 2): the same 23 mutants ran in a fresh detached scratch worktree at `008350a`, using the full web Vitest suite. **23/23 killed.** The scratch worktree was removed and pruned, and real-tree porcelain matches the baseline (empty).

The round-1 sections below are kept for history. Their FAIL items are resolved by the table above.

---

# Round 1 (HEAD `8aa1073`)

Round 1 was FAIL. The behavior was already correct (0 mismatches against chess.js in 10,000 positions), but 2 of 23 mutants survived.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Tablebase generator and probe | ✅ Done | `510a112`; `board.ts` from design.md was folded into `generate.ts` |
| T2 Worker, client and analysis stage 4 | ✅ Done | `ac6d952` |
| T3 Result card, footer and docs | ✅ Done | `2fe70bf`, e2e in `8aa1073` |

---

## Spec-Anchored Acceptance Criteria

| Req | Spec-defined outcome | `file:line` + assertion | Result |
| --- | -------------------- | ----------------------- | ------ |
| TB-01 | Result and DTM for every legal KQK/KRK position; longest win KQK 10, KRK 16 | `apps/web/src/domains/evaluation/model/tablebase/tablebase.test.ts:24` - `expect(longestMate(kqk)).toBe(10)`; `:25` - `expect(longestMate(krk)).toBe(16)`; `:29` - no `UNKNOWN` left | ✅ PASS (also confirmed independently, see below) |
| TB-02 | Mate has DTM 0; stalemate is a draw; lone king taking the undefended piece is a draw | `tablebase.test.ts:45` - mate `toMatchObject({ dtmPlies: 0, mateInMoves: 0 })`; `:53` - stalemate `winner: null, dtmPlies: null`; `:60` - capture of the undefended rook `winner: null` | ✅ PASS |
| TB-03 | Probe returns result + DTM for either strong color; other material returns null | `tablebase.test.ts:35` - full `toEqual` for mate in 1; `:70` - black strong `strongColor: "b", mateInMoves: 1`; `:78-82` - two rooks, extra pawn, wrong table, malformed FEN → `toBeNull()` | ✅ PASS |
| TB-04 | No KQK/KRK → stage 4 "não necessária", no table generated | `apps/web/src/domains/analysis/machines/analysisMachine.test.ts:247` - `expect(probes).toEqual([])`; `:248` - `endgameStatus: "skipped"`; `apps/web/src/domains/analysis/components/AnalyzingScreen.test.tsx:139` - `"Tabela de finais — não necessária"` | ✅ PASS |
| TB-05 | Runs after evaluation, probes the first such position, stores `endgame` (kind, ply, strong side, optimal, played-or-null) | `analysisMachine.test.ts:262` - `endgameStatus` `"running"`; `:263` - probe FEN is the first KRK position; `:266` - output `endgame`; `apps/web/src/domains/analysis/model/endgame.test.ts:19` - `position: 1`; `:67` - real game `position: 88, kind: "KRK", strongColor: "b"`; `:71` - `optimalMoves: 10, movesToMate: 10`; `:55` - no mate → `movesToMate` null | ✅ PASS |
| TB-06 | Tablebase failure → analysis continues without `endgame`, stage 4 "falhou" | `analysisMachine.test.ts:277` - `endgame: null, endgameStatus: "failed", explanation` | ⚠️ Machine-level only: no component test renders stage 4 as "falhou" (see Gap 2) |
| TB-07 | Player strong + mate → "{N} lances" / "para o mate de {dama\|torre} no final" / "o mais rápido era {M}" | `apps/web/src/domains/review/components/ReviewScreen.test.tsx:139-141`; `apps/web/src/domains/review/model/review.test.ts:60` - `{ value: "1 lance", label: "para o mate de dama no final" }`; `:64` weak side → 3 cards; `:67` no mate → 3 cards; `apps/web/e2e/endgame.spec.ts:25-27` | ✅ PASS |
| TB-08 | Footer "✓ Tabela de finais" when used, "– Tabela de finais (não necessária)" otherwise | `ReviewScreen.test.tsx:109`, `:114`; `endgame.spec.ts:28` | ✅ PASS; ⚠️ spec-precision: the implementation adds a third state, "✕ Tabela de finais: falhou" (`apps/web/src/domains/review/components/ReviewSidebar.tsx:141`, asserted at `ReviewScreen.test.tsx:120`), which TB-08 does not define. It matches step_03 R-12 ("se algum falhou") |
| TB-09 | Illegal positions (side not to move in check, adjacent kings, overlapping pieces) are not stored | `tablebase.test.ts:80` (side not to move in check → null), `:81` | ✅ PASS for check; adjacency and overlap are only covered indirectly by the max-DTM test |

**Status**: ❌ Gaps present (sensor survivor in TB-01/TB-09 code; TB-06 UI unasserted) · ⚠️ 1 spec-precision gap (TB-08 failure state)

### Independent tablebase sanity check (scratch only, not committed)

Run as a throwaway Vitest file in the scratch worktree, using chess.js 1.4.0 as an independent move generator:

- **Consistency (Bellman check)**: 4,000 random legal KRK positions with white strong, 2,000 with black strong, and 4,000 KQK positions. For each one, the table value equals the value rebuilt from its chess.js children: strong side = 1 + min over winning children; weak side = 0 for checkmate, draw for stalemate, draw if any capture is available, otherwise 1 + max. The check also confirmed `mateInMoves` = ⌈plies/2⌉ and the strong color. **0 mismatches.**
- **Published maxima**: KQK 10, KRK 16 ✅.
- **Hand-picked positions** ✅:
  - Lone king takes the unprotected queen (`k7/1Q6/8/8/8/8/8/7K b`) → draw.
  - Lone king takes the checking rook (`kR6/8/1K6/… b`) → draw.
  - Back-rank mate (`R1k5/8/2K5/… b`) → DTM 0.
  - Stalemate next to a protected rook (`k7/1R6/1K6/… b`) → draw.
  - KQK mate in 1, white and black strong → 1.
  - KRK mate in 1 (`k7/8/K7/…/7R w`) → 1.
  - Adjacent kings, and the side not to move in check → null.
- **Fixture** `apps/web/src/domains/analysis/fixtures/krk-mate.txt`: legal in chess.js (108 plies). Position 88 (after 44...Rxc6+) is the first one with KQK/KRK material: KRK with black strong. Every later position stays KRK, and the game ends in checkmate (54...Rc8#).

---

## Discrimination Sensor

The sensor ran in a detached scratch worktree (`git worktree add --detach … HEAD`, `node_modules` symlinked) and ran the full web Vitest suite for each mutant. Real-tree porcelain was empty before and after the sensor (match). The scratch worktree was removed and pruned.

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| 1 | `evaluation/model/tablebase/generate.ts:131` | weak king may step next to the strong king | ✅ |
| 2 | `generate.ts:131-132` | capture of a protected piece allowed | ✅ |
| 3 | `generate.ts:176` | stalemate scored as mate (`0`) | ✅ |
| 4 | `generate.ts:197` | strong side `some` → `every` (min → all-children) | ✅ |
| 5 | `generate.ts:209` | weak side `every` → `some` | ✅ |
| 6 | `generate.ts:99` | slider ignores blockers (attacks through the strong king) | ❌ **Survived** |
| 7 | `generate.ts:116` | `isLegal` ignores check on the side not to move | ✅ |
| 8 | `evaluation/model/tablebase/probe.ts:74` | side-to-move mapping inverted | ✅ |
| 9 | `probe.ts:93` | `mateInMoves` +1 (strong to move) | ✅ |
| 10 | `probe.ts:93` | `mateInMoves` +1 (weak to move) | ✅ |
| 11 | `probe.ts:66` | strong color detection inverted | ✅ |
| 12 | `analysis/model/endgame.ts:34` | `findEndgameStart` position off by one | ✅ |
| 13 | `endgame.ts:30` | `findEndgameStart` returns last, not first | ✅ |
| 14 | `endgame.ts:57` | `movesToMate` counts both sides | ✅ |
| 15 | `endgame.ts:49` | mate credited when the weak side moved last | ✅ |
| 16 | `analysis/machines/analysisMachine.ts:154` | stage 4 always entered (probe called without an ending) | ✅ |
| 17 | `analysisMachine.ts:193` | probe failure → `evaluationFailed` | ✅ |
| 18 | `analysisMachine.ts:193` | failure recorded as `skipped` | ✅ |
| 19 | `review/model/review.ts:57` | 4th card shown when the player is the weak side | ✅ |
| 20 | `review.ts:62` | caption "o mais rápido era" dropped | ✅ |
| 21 | `analysis/components/AnalyzingScreen.tsx:62` | stage 4 always `"skipped"` | ✅ (only incidentally, by the AS-09 test) |
| 22 | `AnalyzingScreen.tsx:75` | "Etapa 4 de 5: tabela de finais." never shown | ❌ **Survived** |
| 23 | `review/components/ReviewSidebar.tsx:139` | footer always "✓ Tabela de finais" | ✅ |

**Mutant 6 is not equivalent.** The independent chess.js check run against it fails at once. For example, `8/8/4R3/4K3/8/8/4k3/8 w` (the rook shielded by its own king) probes as `null` instead of a win. The max-DTM test does not catch it because the longest mates happen not to depend on that shielding.

**Sensor depth**: P0-style manual (23 mutants over every new branch of engine 4 and stage 4).
**Result (round 1)**: 21/23 killed - ❌ FAIL. **Round 2**: 23/23 killed - ✅ PASS (mutants 6 and 22 are now killed by `tablebase.test.ts:69` and `AnalyzingScreen.test.tsx:201`).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ (`summarize` was extracted into a named action so both `EVALUATION.DONE` branches can reuse it) |
| No scope creep | ✅ (the "falhou" footer state is the only addition beyond the spec; see TB-08) |
| Matches patterns | ✅ fromPromise actor injected via `provide`; `model/` has no xstate import; cross-domain access goes through `evaluation/index.ts` |
| DDD structure (`docs/architecture/code-structure.md`) | ✅ generator/probe in `evaluation/model`, worker in `evaluation/workers`, summary in `analysis/model` |
| Spec-anchored outcome check | ⚠️ TB-06 UI text and the step_02 headline are unasserted |
| Per-layer coverage | ✅ `evaluation/model/tablebase` 98.9% stmts / 98.5% branches; global 96.3% |
| Every test maps to a requirement | ✅ |
| Documented guidelines followed: `docs/engineering/quality.md`, `CLAUDE.md` | ✅ |

---

## Edge Cases

- [x] Side not to move in check → illegal (TB-09)
- [x] Adjacent kings / overlapping pieces → illegal (code `generate.ts:113-114`; covered by mutant 1 and the max-DTM test, with no direct probe test)
- [x] Black as the strong side
- [ ] Strong king shielding the piece's line: correct in the code, but no test pins it (Gap 1)
- [x] Probe returns null (illegal FEN) → `endgameStatus: "done"`, no card (`analysisMachine.test.ts:287`)

---

## Gate Check

- **`make check`**: exit 0. Biome checked 136 files; Ruff, `tsc` and mypy clean. Vitest: 39 files, **442 passed**, coverage 96.31% stmts / 90.9% branches (per-domain `model/` ≥ 90%). pytest: 75 passed, 99.28%.
- **`make test-e2e`**: exit 0, **18 passed** (3.0 min), including `e2e/endgame.spec.ts:15` in `full-analysis` (21.7 s). Ports 4173/8000 were free before the run.
- **Test files**: 37 on `origin/main` → 39 (+`tablebase.test.ts`, +`endgame.test.ts`), plus new cases in the machine, review and ReviewScreen tests. No test was deleted. One footer assertion changed from "(ainda não disponível)" to "(não necessária)", as TB-08 requires.
- **Skipped**: none.

---

## Fix Plans

### Fix 1 (Major): pin the blocker logic of the attack test (mutant 6)

- **Root cause**: no test has a position where the strong king stands between its rook or queen and a square that matters, so `generate.ts:99` is unasserted.
- **Fix task**: in `apps/web/src/domains/evaluation/model/tablebase/tablebase.test.ts`, add two cases:
  - `probe(krk, "8/8/4R3/4K3/8/8/4k3/8 w - - 0 1")` is not null and has `winner: "w"` (a legal position where the king shields the rook).
  - A weak-to-move case where the lone king's only escape square is on the rook's line behind the strong king, asserted as not mate.
- **Done when**: mutant 6 is killed and `make lint-web typecheck-web test-web` passes.

### Fix 2 (Minor): assert stage 4 on the Analisando screen (TB-06, mutant 22)

- **Root cause**: `AnalyzingScreen.test.tsx` only covers the "não necessária" path. The "em andamento" / "concluída" / "falhou" rendering of stage 4 and the headline "Etapa 4 de 5: tabela de finais." (`AnalyzingScreen.tsx:62`, `:75`) are untested.
- **Fix task**: render `AnalyzingScreen` with the KRK request (`krkGame()`), a fake engine, and a `probeEndgame` that stays pending and then rejects. Assert the headline "Etapa 4 de 5: tabela de finais.", stage "Tabela de finais — em andamento", and then "Tabela de finais — falhou".
- **Done when**: mutants 21 and 22 are killed by a TB-06 test.

### Fix 3 (Cosmetic, docs): spec and design drift

- Add the failure state "✕ Tabela de finais: falhou" to TB-08 in `spec.md`.
- Update the traceability table, which still says "Pending" for all 9 requirements.
- Remove `board.ts` from `design.md`; it does not exist.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| TB-01 | Pending | ✅ Verified (round 2) |
| TB-02, TB-03, TB-04, TB-05, TB-07 | Pending | ✅ Verified |
| TB-06 | Pending | ✅ Verified (round 2, UI asserted) |
| TB-08 | Pending | ✅ Verified (spec text updated in round 2) |
| TB-09 | Pending | ✅ Verified (round 2) |

---

## Summary

**Overall (round 2)**: ✅ Ready. 9/9 requirements match the spec outcome, 23/23 mutants are killed, `make check` (445 + 75) and `make test-e2e` (18) pass.

**Round 1 overall**: ❌ Not Ready. The behavior was correct, but the tests had 2 holes.

**Spec-anchored check**: 7/9 matched the spec outcome without reservations; TB-06 is machine-only; 1 spec-precision gap (TB-08).
**Sensor**: 21/23 killed.
**Gate**: `make check` 442 + 75 passed; `make test-e2e` 18 passed.

**What works**:
- The tables are exact: independently confirmed, with published maxima of 10 and 16.
- Stage 4 is skipped, run and failed correctly in the machine.
- The first KRK position of the real game is probed: 10 optimal moves = 10 played.
- The 4th card and the footer render, and the browser e2e passes with the worker.

**Next steps**: implement Fix 1 and Fix 2 (tests only), add Fix 3 to the docs, then re-verify. This is round 1 of 3.
