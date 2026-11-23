# F4a · analysis-model Validation

## Validation: analysis-model - FAIL (round 2)

**Date**: 2026-11-23
**Spec**: `.specs/features/analysis-model/spec.md`
**Diff range**: `e31cb46..HEAD` (HEAD = `acbe470`). The branch was rebased onto `origin/main` after F3 was squash-merged as `e31cb46`. Round 1 ran on `249a603..228badf` (report `19f1486`, lessons `6e76023`). The round-2 fixes are in `09a8ea4` and `acbe470`.
**Verifier**: independent sub-agent (author ≠ verifier)

Round 2 fixes kill 6 of the 7 round-1 survivors (M1, M2, M3, M11, M23, M26). They also close the
AN-09/glossary and AN-15/Assumptions spec gaps, and per-domain coverage thresholds now work in the
gate. **One mutant still survives: M21 ("only defender")**. The new AN-08 test at
`apps/web/src/domains/analysis/model/classify.test.ts:294-310` claims the knight on e4 has two
defenders, the bishop on g2 and the pawn on f3. chess.js shows `attackers(e4, w) = ["f3"]`: the
bishop on g2 is blocked by the pawn on f3. The moved piece was never a defender, so the test cannot
tell "only defender" from "any defender". This is a test defect; the application code is correct.

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
| AN-08 | moved piece was the **only** defender → `defender-moved` | `analysis/model/classify.test.ts:146-152` (single defender → `defender-moved`); `:294-310` intended negative case | ❌ GAP: the position at `:296` has only one defender (`f3`), so M21 survives |
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

**Status**: ❌ 1 gap (AN-08 negative case); 0 spec-precision gaps open.

### Chess-fact sanity check of the new positions (chess.js script, not committed)

| Test | Claim | chess.js |
| ---- | ----- | -------- |
| `classify.test.ts:245` exchangeFen | Bb6 attacks d4; e3 defends d4; Rd4 loses exactly 2 | `isAttacked(d4,b)=true`, defenders `[e3,d1]`, `Rd4`/`a3`/`Kf2` legal ✅ |
| `:270-279` forced | Rb1 is also taken (Nxb1) | legal ✅ |
| `:296` two defenders | Ne4 defended by Bg2 **and** f3 | `attackers(e4,w)=["f3"]`: **Bg2 is blocked by f3** ❌ |
| `:314` protected by move | Bf1-g2 starts defending e4, which was undefended | before `[]`, after `["g2"]` ✅ |
| `:327` promotion | Rc2 lets b1=Q; no white piece captured | `Rc2`, `Rb1`, `b1=Q+` legal ✅ |
| `:339` gain 2 | Bxd4 wins R, e5 recaptures | d4 defenders `[e5]`, `Bxd4` legal ✅ |

---

## Discrimination Sensor (round 2)

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
**Sensor result**: 10/11 killed, 1 survived (M21) → FAIL
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
- **Gate result**: exit 0. Web: 23 files, 252 passed, 0 failed, 0 skipped. API: 9 passed
- **Test count**: 242 (round 1) → 252 (+10). None removed
- **Failures**: none

---

## Fix Plans

### Fix A (Minor, test only): make the AN-08 two-defender test real, kills M21
- **Where**: `apps/web/src/domains/analysis/model/classify.test.ts:294-310`
- **Task**: replace the pawn on f3 with a pawn on d3 so the bishop on g2 really defends e4.
  - `fen = "6k1/8/8/3p4/4N3/3P4/6B1/6K1 w - - 0 1"` (checked with chess.js: `attackers(e4,w) = ["d3","g2"]`, e4 attacked by d5)
  - `after = "6k1/8/8/3p4/4N3/3P3B/8/6K1 b - - 1 1"`
  - `after.pv = ["d5e4", "d3e4", "g8f8"]`
  - Keep the expectation `{ kind: "mistake", loss: 2, mistakeType: "hanging-piece", lostPiece: { type: "n", square: "e4" } }`. With M21 this returns `defender-moved`.
- **Done when**: M21 is killed.

---

## Requirement Traceability Update

| Requirement | Status |
| ----------- | ------ |
| AN-01..AN-07, AN-09..AN-20 | ✅ Verified |
| AN-08 | ⚠️ Needs Fix (test) |

---

## Summary

**Overall**: ❌ Not Ready (one test fix)

**Overall result**: FAIL
**Spec-anchored check**: 19/20 ACs matched; 1 gap (AN-08 negative case)
**Sensor**: 10/11 killed this round (M21 survived)
**Gate**: 252 web + 9 api passed

**Next steps**: apply Fix A (test only), then re-verify M21.
