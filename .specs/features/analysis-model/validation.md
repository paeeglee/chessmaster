# F4a · analysis-model Validation

## Validation: analysis-model - PASS (round 4, final)

**Date**: 2026-11-23
**Spec**: `.specs/features/analysis-model/spec.md`
**Diff range**: `e31cb46..HEAD` (HEAD = `451110d`). The branch was rebased onto `origin/main` after F3 was squash-merged as `e31cb46`.
**Verifier**: independent sub-agent (author ≠ verifier)

### Round history

| Round | Verified at | Verdict | Surviving mutants | Fix commits |
| ----- | ----------- | ------- | ----------------- | ----------- |
| 1 | `228badf` (pre-rebase, `249a603..`) | FAIL | M1, M2, M3, M11, M21, M23, M26 | `09a8ea4`, `acbe470` |
| 2 | `acbe470` | FAIL | M21 (the "two defenders" position had one defender, because f3 blocks Bg2) | `3ad0b5e`, `89fcfdd` |
| 3 | `89fcfdd` | FAIL | M21b (test passed only because of chess.js attacker order) | `451110d` |
| 4 | `451110d` | **PASS** | none | - |

Reports: `19f1486` (round 1), `e077ca6` (round 2), `5c4402a` (round 3). This fourth round goes past
the usual 3-round limit; the coordinator ran it to close the feature out.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 line helpers (`game/model/lines.ts`) | ✅ Done | - |
| T2 material + classification + fixture | ✅ Done | `classify.ts:47-50` implements the glossary "protected by the move" rule |
| T3 selection, patterns, strengths, findings, boundary | ✅ Done | - |
| Verifier fixes (rounds 1–3) | ✅ Done | Test-only fixes, plus the glossary rule, per-domain coverage thresholds and spec alignment |

---

## Spec-Anchored Acceptance Criteria

Test paths are relative to `apps/web/src/domains/`.

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| AN-01 | P1 N3 B3 R5 Q9 K0, own minus opponent | `analysis/model/classify.test.ts:34-36`: `toBe(1 + 5 + 3 + 9)`, `toBe(-18)`, `toBe(8)` | ✅ PASS |
| AN-02 | plies + 1 values, `[0] = 0` | `analysis/model/classify.test.ts:43-46`: `toHaveLength(145)`, `toBe(0)`, delta `toBe(5)` | ✅ PASS |
| AN-03 | mistake iff drop ≥ 2 **and** best − played ≥ 2; `loss = best − played` | `analysis/model/classify.test.ts:255` `{ kind: "mistake", loss: 2 }`; `:267` loss 1 → `"none"`; `:279` forced loss → `"none"`; `:67-76` `loss: 3` | ✅ PASS |
| AN-04 | opponent move → `opponent-mistake` | `analysis/model/classify.test.ts:81-86` | ✅ PASS |
| AN-05 | gain ≥ 2 → `strength` + `gain` | `analysis/model/classify.test.ts:367` `{ kind: "strength", gain: 2, wonPiece: {r,d4} }`; `:90-97` | ✅ PASS |
| AN-06 | played = best → never a mistake | `analysis/model/classify.test.ts:282-291`: played line loses the rook, the best PV has no capture → `toBe("none")` | ✅ PASS |
| AN-07 | PT label, PT SAN best move, piece | `analysis/model/classify.test.ts:67-76`, `:146-152` (`bestMoveSan: "Rf2"`), `:90-97` | ✅ PASS |
| AN-08 | moved piece was the **only** defender → `defender-moved` | `analysis/model/classify.test.ts:146-152` (single defender → `defender-moved`); `:304` + `:305-310` (two defenders, the **second** listed moves → `hanging-piece`); `:323` + `:324-329` (two defenders, the **first** listed moves → `hanging-piece`) | ✅ PASS |
| AN-09 | attacked before, not moved, not protected by the move → `hanging-piece` | `analysis/model/classify.test.ts:132-136`; `:342` the move protects the piece → `"other"`; `:180-184` moved piece → `"other"` | ✅ PASS |
| AN-10 | neither / no piece → `other` | `analysis/model/classify.test.ts:180-184`; `:354` `{ mistakeType: "other", lostPiece: null }` | ✅ PASS |
| AN-11 | 22...Ta7, 27...Tb7, 41...Ta1, 43...Te6, 56...Ta8 | `analysis/model/classify.test.ts:57-63` `toEqual([...])` | ✅ PASS |
| AN-12 | 22...Ta7 hanging, Ba1, `Bd4+` | `analysis/model/classify.test.ts:67-76` full `toEqual` | ✅ PASS |
| AN-13 | 12.Ce2 opponent mistake, rook a1 | `analysis/model/classify.test.ts:81-86` | ✅ PASS |
| AN-14 | top 5 by loss, chronological, ties earlier | `analysis/model/keyMoments.test.ts:48`, `:53` | ✅ PASS |
| AN-15 | exact template strings | `analysis/model/keyMoments.test.ts:84-123` | ✅ PASS |
| AN-16 | groups by count, then first occurrence | `analysis/model/keyMoments.test.ts` groupPatterns `toEqual` | ✅ PASS |
| AN-17 | up to 3 strengths, only strengths, by gain, chronological | `analysis/model/keyMoments.test.ts:68` mixed input → `[5, 7, 9]` | ✅ PASS |
| AN-18 | boundary | `analysis/index.test.ts:13`, `:22` | ✅ PASS |
| AN-19 | empty PV → first move only | `game/model/lines.test.ts:25` | ✅ PASS |
| AN-20 | stale PV → stop | `game/model/lines.test.ts:30` | ✅ PASS |

**Status**: ✅ All 20 ACs covered with spec-anchored assertions; 0 spec-precision gaps open. AN-09 now matches the glossary, and the AN-15 templates match the Assumptions table.

### Chess-fact sanity check (chess.js scripts, not committed)

Every hand-made position was checked: hanging piece, defender moved, other, exchange (loss 2),
forced loss, protected by the move, promotion, gain 2, and both two-defender cases. In the two-defender
position `6k1/8/8/3p4/4N3/3P4/6B1/6K1 w`, `attackers(e4,w) = ["d3","g2"]` and e4 is attacked by d5.
After `d4`, the defenders are `["g2"]`, and `dxe4 Bxe4` is legal. The real reference position before
ply 44 has Ba1 attacked by Rh1 and undefended.

---

## Discrimination Sensor

All runs were in throwaway worktrees under the session scratchpad, each with
`pnpm install --frozen-lockfile` and then `pnpm test` per mutant. Each scratch was removed afterwards.
The real-tree `git status --porcelain` was empty before and after every round.

**Round 4 (`451110d`, fresh `f4a-sensor4`)**

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| M21 | `analysis/model/classify.ts:43` | `defenders.includes(ply.from)` (any defender) | ✅ Killed (2 failed) |
| M21b | `analysis/model/classify.ts:43` | `defenders[0] === ply.from` (size check dropped) | ✅ Killed (1 failed) |
| M6b | `analysis/model/classify.ts:43-45` | defender-moved branch removed | ✅ Killed |
| M25 | `analysis/model/classify.ts:43` | moved-piece exclusion dropped | ✅ Killed |
| M32 | `analysis/model/classify.ts:41` | defenders read from `fenAfter` | ✅ Killed |

**Earlier rounds, cumulative and still valid.** No later commit touched the code these cover.

- Round 2 killed:
  - threshold: M1 (`2→3`), M23 (`loss >`)
  - rule guards: M2 (avoidable check), M3 (best-move guard)
  - strengths: M11 (strengths filter), M26 (`gain >`)
  - protected by the move: M28, M29, M30
  - coverage: M31 (per-domain threshold fails at 88.73%)
- Round 1 killed:
  - material: M4 (piece value), M19 (color flip), M20 (timeline start)
  - capture line: M5 (continues on non-captures), M13 (en passant square), M17 (stale PV), M18 (maxPlies)
  - mistake type: M6 (check order), M7 (hanging ignores "not moved"), M24 (drop conjunct)
  - selection: M8, M9, M9b, M10 (key moments), M27 (MAX_STRENGTHS), M14, M14b (patterns)
  - findings text: M12, M12b (gender), M22 (opponent prefix)
  - verdicts: M15 (opponent kind), M16 (lost-piece side), M11b (strength guard)
- M4b (king = 1) is an equivalent mutant: each side always has one king.

**Sensor depth**: P0-style manual (classification is the product's data-integrity core)
**Sensor result**: round 4 5/5 killed; all non-equivalent mutants across rounds killed

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical changes | ✅ |
| Matches patterns (DDD, pure `model/`, index entry points) | ✅ |
| Spec-anchored outcome check | ✅ |
| Per-layer coverage: `analysis/model` 100% statements / 91.54% branches; `game/model` 94.66% branches; 90% enforced per domain (`apps/web/vite.config.ts:48-49`) | ✅ |
| Every test maps to an AC, edge case or Done-when | ✅ |
| Guidelines: `docs/engineering/quality.md` | ✅ |

---

## Edge Cases

- [x] AN-19 empty PV: `game/model/lines.test.ts:25`
- [x] AN-20 stale PV: `game/model/lines.test.ts:30`
- [x] Missing evaluations → `none`: `analysis/model/classify.test.ts:226`
- [x] No player piece captured → `other`, `lostPiece: null`: `analysis/model/classify.test.ts:354`

---

## Gate Check

- **Gate command**: `make check`
- **Gate result**: exit 0 at `451110d`. Web: 23 files, 253 passed, 0 failed, 0 skipped. API: 9 passed
- **Test count**: 208 before F4a → 253 after (+45). None removed
- **Failures**: none

---

## Requirement Traceability Update

| Requirement | Status |
| ----------- | ------ |
| AN-01..AN-20 | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Overall result**: PASS
**Spec-anchored check**: 20/20 ACs matched the spec outcome
**Sensor**: round 4 5/5 killed; no surviving non-equivalent mutants
**Gate**: 253 web + 9 api passed
