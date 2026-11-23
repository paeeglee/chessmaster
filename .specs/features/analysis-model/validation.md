# F4a · analysis-model Validation

## Validation: analysis-model - FAIL (round 3)

**Date**: 2026-11-23
**Spec**: `.specs/features/analysis-model/spec.md`
**Diff range**: `e31cb46..HEAD` (HEAD = `89fcfdd`). Round 3 fixes are `3ad0b5e` and `89fcfdd` (missing import; `3ad0b5e` alone fails tsc, so it was verified at `89fcfdd`). The branch was rebased onto `origin/main` after F3 was squash-merged as `e31cb46`. Round 1 ran on `249a603..228badf` (report `19f1486`, lessons `6e76023`). The round-2 fixes are in `09a8ea4` and `acbe470`.
**Verifier**: independent sub-agent (author ≠ verifier)

### Round 3 summary

Round 3 replaces the AN-08 position with a real two-defender position
(`6k1/8/8/3p4/4N3/3P4/6B1/6K1 w`) and asserts
`defendersOf(fen, "e4", "w").sort()` equals `["d3", "g2"]` at
`apps/web/src/domains/analysis/model/classify.test.ts:304`. M21 (`defenders.includes(ply.from)`) is
now **killed**.

A sibling mutant still **survives**: M21b, which drops only the size check and leaves
`defenders[0] === ply.from` at `classify.ts:43`. chess.js returns attackers in board-scan order
(`["d3","g2"]`). In the test the moved piece is `g2`, which is second in that order, so a rule that
looks only at the first defender gives the same answer. The "only" condition passes because of the
library's ordering, not because the test pins it down. This is a test defect; the application code
is correct.

Round 2 history: fixes `09a8ea4` and `acbe470` killed M1, M2, M3, M11, M23 and M26, added the
glossary "protected by the move" rule (M28–M30 killed), and made the per-domain coverage threshold
work (M31 killed).

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 line helpers | ✅ Done | - |
| T2 material + classification + fixture | ✅ Done | `classify.ts:47-50` adds the glossary "protected by the move" rule |
| T3 selection, patterns, strengths, findings, boundary | ✅ Done | - |
| Round-1 fixes 1–9 | ⚠️ 8/9 effective | Fix 4 (AN-08 two defenders) uses a position that does not have two defenders |

---

## Spec-Anchored Acceptance Criteria

Test paths are relative to `apps/web/src/domains/`.

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| AN-01 | P1 N3 B3 R5 Q9 K0, own minus opponent | `analysis/model/classify.test.ts:34-36`: `toBe(1 + 5 + 3 + 9)`, `toBe(-18)`, `toBe(8)` | ✅ PASS |
| AN-02 | plies + 1 values, `[0] = 0` | `analysis/model/classify.test.ts:43-46`: `toHaveLength(145)`, `toBe(0)`, delta `toBe(5)` | ✅ PASS |
| AN-03 | mistake iff drop ≥ 2 **and** best − played ≥ 2; `loss = best − played` | `analysis/model/classify.test.ts:255` `toMatchObject({ kind: "mistake", loss: 2 })`; `:267` loss 1 → `toBe("none")`; `:279` forced loss → `toBe("none")`; `:67-76` `loss: 3` | ✅ PASS (M1, M2, M23 killed) |
| AN-04 | opponent move → `opponent-mistake` | `analysis/model/classify.test.ts:81-86` | ✅ PASS |
| AN-05 | gain ≥ 2, not a mistake → `strength` + `gain` | `analysis/model/classify.test.ts:347` `{ kind: "strength", gain: 2, wonPiece: {r,d4} }`; `:90-97` gain 5 | ✅ PASS (M26 killed) |
| AN-06 | played = best → never a mistake | `analysis/model/classify.test.ts:282-291`: played line loses the rook, the best PV has no capture, `toBe("none")` | ✅ PASS (M3 killed). The old test at `:187-210` still cannot fail on its own; it is harmless |
| AN-07 | PT label, PT SAN best move, piece | `analysis/model/classify.test.ts:67-76`, `:146-152` (`bestMoveSan: "Rf2"`), `:90-97` | ✅ PASS |
| AN-08 | moved piece was the **only** defender → `defender-moved` | `analysis/model/classify.test.ts:146-152` (single defender → `defender-moved`); `:304` `toEqual(["d3","g2"])` + `:305-310` `mistakeType: "hanging-piece"` | ⚠️ PARTIAL: M21 is killed; M21b survives because the moved defender is never first in chess.js scan order |
| AN-09 | attacked before, not moved, **not protected by the move** → `hanging-piece` | `analysis/model/classify.test.ts:132-136` (hanging); `:322` move protects the piece → `mistakeType: "other"`; `:180-184` (moved piece) | ✅ PASS (M28, M29, M30 killed). The spec now matches the glossary |
| AN-10 | neither / no piece → `other` | `analysis/model/classify.test.ts:180-184`; `:334` promotion → `{ mistakeType: "other", lostPiece: null }` | ✅ PASS |
| AN-11 | 22...Ta7, 27...Tb7, 41...Ta1, 43...Te6, 56...Ta8 | `analysis/model/classify.test.ts:57-63` | ✅ PASS (unchanged by the protected-by-move rule) |
| AN-12 | 22...Ta7 hanging, Ba1, `Bd4+` | `analysis/model/classify.test.ts:67-76` full `toEqual` | ✅ PASS |
| AN-13 | 12.Ce2 opponent mistake, rook a1 | `analysis/model/classify.test.ts:81-86` | ✅ PASS |
| AN-14 | top 5 by loss, chronological, ties earlier | `analysis/model/keyMoments.test.ts:48`, `:53` | ✅ PASS |
| AN-15 | exact template strings | `analysis/model/keyMoments.test.ts:84-123` | ✅ PASS. The Assumptions row now points to AN-15 |
| AN-16 | groups by count, then first occurrence | `analysis/model/keyMoments.test.ts` groupPatterns `toEqual` | ✅ PASS |
| AN-17 | up to 3 strengths by gain, chronological, only strengths | `analysis/model/keyMoments.test.ts:68` with mixed mistake/opponent/none input → `[5, 7, 9]` | ✅ PASS (M11 killed) |
| AN-18 | boundary | `analysis/index.test.ts:13`, `:22` | ✅ PASS |
| AN-19 | empty PV → first move only | `game/model/lines.test.ts:25` | ✅ PASS |
| AN-20 | stale PV → stop | `game/model/lines.test.ts:30` | ✅ PASS |

**Status**: ⚠️ 1 partial (AN-08: order-dependent case); 0 spec-precision gaps open.

### Chess-fact sanity check of the new positions (chess.js script, not committed)

| Test | Claim | chess.js |
| ---- | ----- | -------- |
| `classify.test.ts:245` exchangeFen | Bb6 attacks d4; e3 defends d4; Rd4 loses exactly 2 | `isAttacked(d4,b)=true`, defenders `[e3,d1]`, `Rd4`/`a3`/`Kf2` legal ✅ |
| `:270-279` forced | Rb1 is also taken (Nxb1) | legal ✅ |
| `:296` two defenders (round 3) | Ne4 defended by Bg2 **and** d3 | `attackers(e4,w)=["d3","g2"]` (scan order), e4 attacked by d5 ✅ |
| `:314` protected by move | Bf1-g2 starts defending e4, which was undefended | before `[]`, after `["g2"]` ✅ |
| `:327` promotion | Rc2 lets b1=Q; no white piece captured | `Rc2`, `Rb1`, `b1=Q+` legal ✅ |
| `:339` gain 2 | Bxd4 wins R, e5 recaptures | d4 defenders `[e5]`, `Bxd4` legal ✅ |

---

## Discrimination Sensor (round 3, AN-08)

Fresh scratch: `git worktree add --detach <scratchpad>/f4a-sensor3 HEAD` at `89fcfdd`, then
`pnpm install --frozen-lockfile`, then `pnpm test` (252 tests) per mutant. The scratch was removed
afterwards, and the real-tree `git status --porcelain` was empty before and after.

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| M21 | `analysis/model/classify.ts:43` | `defenders.includes(ply.from)` (any defender) | ✅ Killed |
| M21b | `analysis/model/classify.ts:43` | `defenders[0] === ply.from` (size check dropped) | ❌ **Survived** |
| M6b | `analysis/model/classify.ts:43-45` | defender-moved branch removed | ✅ Killed |
| M25 | `analysis/model/classify.ts:43` | moved-piece exclusion dropped | ✅ Killed |
| M32 | `analysis/model/classify.ts:41` | defenders read from `fenAfter` | ✅ Killed |

**Round 3 sensor result**: 4/5 killed, 1 survived (M21b) → FAIL

## Discrimination Sensor (round 2, history)

Fresh scratch: `git worktree add --detach <scratchpad>/f4a-sensor2 HEAD`, then
`pnpm install --frozen-lockfile`, then `pnpm test` (`vitest run --coverage`, 252 tests) per mutant.
Each mutation was reverted after its run.

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| M1 | `analysis/model/classify.ts:17` | threshold 2 → 3 | ✅ Killed (4 failed) |
| M2 | `analysis/model/classify.ts:75` | drop `loss >= T` | ✅ Killed |
| M3 | `analysis/model/classify.ts:75` | drop `!isBestMove` | ✅ Killed |
| M11 | `analysis/model/keyMoments.ts:25` | strengths keep mistakes | ✅ Killed |
| M21 | `analysis/model/classify.ts:43` | only defender → any defender (`includes`) | ❌ **Survived** |
| M23 | `analysis/model/classify.ts:75` | `loss >=` → `>` | ✅ Killed (3 failed) |
| M26 | `analysis/model/classify.ts:94` | `gain >=` → `>` | ✅ Killed |
| M28 | `analysis/model/classify.ts:50` | drop `!protectedByMove` | ✅ Killed |
| M29 | `analysis/model/classify.ts:47` | protected check reads `fenBefore` | ✅ Killed |
| M30 | `analysis/model/classify.ts:47` | protected = any defender after the move | ✅ Killed |
| M31 | `apps/web/vite.config.ts:48-49` | skip the promotion test; per-domain threshold must fail | ✅ Killed: `Coverage for branches (88.73%) does not meet "src/domains/analysis/model/**" threshold (90%)` |

The round-1 killed mutants (M4–M20, M22, M24, M25, M27) cover code the fixes did not touch, except
`classify.ts:46-52`, which M28–M30 cover again.
**Round 2 sensor result**: 10/11 killed, 1 survived (M21, fixed in round 3)
**Isolation**: real-tree `git status --porcelain` was empty before and after; `f4a-sensor2` removed (`git worktree list` has no entry).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical (rule change is 2 lines at `classify.ts:47-50`) | ✅ |
| Matches patterns (DDD, pure `model/`) | ✅ |
| Spec-anchored outcome check | ⚠️ AN-08 negative case not discriminating |
| Coverage: `analysis/model` 100% statements / 91.54% branches; `game/model` 94.66% branches; per-domain 90% enforced (`apps/web/vite.config.ts:48-49`, sensor M31) | ✅ |
| Guidelines: `docs/engineering/quality.md` (updated for per-domain thresholds) | ✅ |

---

## Gate Check

- **Gate command**: `make check`
- **Gate result (round 3, `89fcfdd`)**: exit 0. Web: 23 files, 252 passed, 0 failed, 0 skipped; `analysis/model` 100% statements / 91.54% branches. API: 9 passed
- **Test count**: 242 (round 1) → 252 (+10). None removed
- **Failures**: none

---

## Fix Plans

### Fix B (Minor, test only): make the "only" check independent of attacker order, kills M21b
- **Where**: `apps/web/src/domains/analysis/model/classify.test.ts`, next to `:294-310`
- **Task**: add a case on the same `fen` where the **first** defender in scan order moves.
  - ply `d3d4` (pawn)
  - `after = "6k1/8/8/3p4/3PN3/8/6B1/6K1 b - - 0 1"`
  - `before = evaluation(fen, "e4c3", ["e4c3","g8f8"])`
  - `after.pv = ["d5e4","g2e4","g8f8"]`
  - expect `{ kind: "mistake", loss: 2, mistakeType: "hanging-piece", lostPiece: { type: "n", square: "e4" } }`

  Checked with chess.js: defenders before are `["d3","g2"]`, defenders after are `["g2"]`, e4 is attacked by d5, and `dxe4 Bxe4` is legal. With M21b this returns `defender-moved`.
- **Done when**: M21 and M21b are both killed.

---

## Requirement Traceability Update

| Requirement | Status |
| ----------- | ------ |
| AN-01..AN-07, AN-09..AN-20 | ✅ Verified |
| AN-08 | ⚠️ Needs Fix (test, Fix B) |

---

## Summary

**Overall**: ❌ Not Ready (one test fix)

**Overall result**: FAIL
**Spec-anchored check**: 19/20 ACs fully matched; AN-08 partial
**Sensor**: round 3 4/5 killed (M21b survived)
**Gate**: 252 web + 9 api passed at `89fcfdd`

**Next steps**: apply Fix B (one extra test), then re-verify M21/M21b.
