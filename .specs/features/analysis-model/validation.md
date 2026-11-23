# F4a · analysis-model Validation

## Validation: analysis-model - FAIL

**Date**: 2026-11-23
**Spec**: `.specs/features/analysis-model/spec.md`
**Diff range**: `249a603..HEAD` (HEAD = `228badf`; commits 6e2bb67, 9de5c2d, 50bdf01, 33250bd, 228badf)
**Verifier**: independent sub-agent (author ≠ verifier)

The gate is green and the reference game gives exactly the five PRD key moments. The verdict is
FAIL because the discrimination sensor found 6 non-equivalent surviving mutants. Several of them
are in the core D3 rule: the 2-point threshold, the "avoidable versus the best line" check, the
best-move guard and the "only defender" test. No application defect was found; the gaps are in
the tests.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 line helpers (`game/model/lines.ts`) | ✅ Done | Exported from `game/index.ts` |
| T2 material + classification + fixture | ✅ Done | Fixture has 145 positions at depth 18 |
| T3 selection, patterns, strengths, findings, boundary | ✅ Done | Coverage gaps below (AN-17) |

---

## Spec-Anchored Acceptance Criteria

Test paths are relative to `apps/web/src/domains/`.

| ID | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| -- | --------- | -------------------- | ----------------------- | ------ |
| AN-01 | materialBalance | P1 N3 B3 R5 Q9 K0, own minus opponent | `analysis/model/classify.test.ts:34-36`: `toBe(1 + 5 + 3 + 9)`, `toBe(-18)`, `toBe(8)` | ✅ PASS (K=0 is not observable: there is always one king per side, so M4b is an equivalent mutant) |
| AN-02 | materialTimeline | plies + 1 values, `[0] = 0` | `analysis/model/classify.test.ts:43-46`: `toHaveLength(145)`, `timeline[0]).toBe(0)`, delta at ply 24 `toBe(5)` | ✅ PASS |
| AN-03 | mistake when drop ≥ 2 **and** loss vs best ≥ 2; `loss = best − played` | kind `mistake`, loss value | `analysis/model/classify.test.ts:67-76` (`loss: 3`), `:146-152` (`loss: 3`) | ❌ GAP: the threshold boundary is not tested (M1 `2→3` and M23 `>=→>` survive), and neither is the "versus best line" conjunct (M2 survives). No test has loss exactly 2 or a forced (unavoidable) drop |
| AN-04 | opponent move, same rule | kind `opponent-mistake` | `analysis/model/classify.test.ts:81-86`: `toMatchObject({ kind: "opponent-mistake", color: "w", moveLabel: "12.Ce2", ... })` | ✅ PASS (M15 killed) |
| AN-05 | player gain ≥ 2 and not a mistake | kind `strength` with `gain` | `analysis/model/classify.test.ts:90-97`: `toEqual({ kind: "strength", ply: 24, gain: 5, wonPiece: {r,a1} })` | ⚠️ PARTIAL: the gain boundary is not tested (M26 `>=→>` survives) |
| AN-06 | played move = engine best → never a mistake | kind `none` | `analysis/model/classify.test.ts:210`: `expect(verdict.kind).toBe("none")` | ❌ GAP: the test does not discriminate. With `bestMove === played`, the best line is built from `before.pv` and equals the played line, so `loss = 0` even without the guard. M3 (guard removed) survives |
| AN-07 | label PT notation, best move PT SAN, piece | `22...Ta7`, `Bd4+`, `{b,a1}` | `analysis/model/classify.test.ts:67-76` (full `toEqual`), `:146-152` (`bestMoveSan: "Rf2"`, PT king letter), `:90-97` (`wonPiece`) | ✅ PASS |
| AN-08 | moved piece was the **only** defender → `defender-moved` | `defender-moved` | `analysis/model/classify.test.ts:146-152`: `mistakeType: "defender-moved"` | ⚠️ PARTIAL: the "only" part is not tested. M21 (`defenders.includes(ply.from)`) survives. The order against `hanging-piece` is tested (M6 killed) |
| AN-09 | lost piece attacked before and not moved → `hanging-piece` | `hanging-piece` | `analysis/model/classify.test.ts:132-136`; real case `:67-76` | ✅ PASS (M7 killed by `:180-184`). ⚠️ Spec-precision: glossary says "não foi movida **nem protegida**"; neither the spec nor the code checks "protected" |
| AN-10 | neither / no piece → `other` | `other` | `analysis/model/classify.test.ts:180-184`: `mistakeType: "other", lostPiece: {r,a2}` | ✅ PASS. The `lostPiece === null → other` branch (`classify.ts:37-38`) is not covered (coverage reports line 38) |
| AN-11 | reference key moments, in order | 22...Ta7, 27...Tb7, 41...Ta1, 43...Te6, 56...Ta8 | `analysis/model/classify.test.ts:57-63`: `toEqual([...five labels])` | ✅ PASS |
| AN-12 | 22...Ta7 hanging, Ba1, `Bd4+` | exact verdict | `analysis/model/classify.test.ts:67-76`: `toEqual({ ..., mistakeType: "hanging-piece", lostPiece: { type: "b", square: "a1" }, bestMoveSan: "Bd4+" })` | ✅ PASS (chess.js check: a1 attacked by Rh1 and has no black defender) |
| AN-13 | 12.Ce2 opponent mistake, rook a1 | `opponent-mistake`, `{r,a1}` | `analysis/model/classify.test.ts:81-86` | ✅ PASS |
| AN-14 | > 5 mistakes → top 5 by loss, chronological | `[2,4,6,8,12]`, ties by earlier move | `analysis/model/keyMoments.test.ts:48`, `:53` | ✅ PASS (M8, M9, M9b, M10 killed) |
| AN-15 | findingText templates | exact strings | `analysis/model/keyMoments.test.ts:84-88`, `:103`, `:107-109`, `:113-118`, `:122-123` | ✅ PASS (M12, M12b, M22 killed). ⚠️ Spec-precision: the Assumptions table (`"{lance}? deixou…"`, `"do adversário entregou…"`) contradicts AN-15. The tests follow AN-15 |
| AN-16 | groupPatterns by count, then first occurrence | ordered groups | `analysis/model/keyMoments.test.ts:73-77`: `toEqual([hanging×2, defender×2, other×1])` | ✅ PASS (M14, M14b killed) |
| AN-17 | up to 3 strengths, largest gain, chronological | `[5,7,9]` | `analysis/model/keyMoments.test.ts:60` | ⚠️ PARTIAL: the input has only strengths, so excluding mistakes and opponent verdicts is not tested. M11 survives. No tie test |
| AN-18 | boundary: no React/XState/Worker/network; game via index | no offenders | `analysis/index.test.ts:13`, `:22`: `expect(offenders).toEqual([])` | ✅ PASS (manual check: `model/*.ts` import only `../../game` and `../../evaluation` index) |
| AN-19 | empty PV → line is the first move | one capture | `game/model/lines.test.ts:25` | ✅ PASS |
| AN-20 | illegal PV move → stop before it | stops | `game/model/lines.test.ts:30` | ✅ PASS (M17 `break→continue` killed) |

**Status**: ❌ Gaps present (AN-03, AN-06), partial (AN-05, AN-08, AN-17), 2 spec-precision gaps (AN-09 vs glossary, AN-15 vs Assumptions table).

### Chess-fact sanity check (chess.js 1.x script in `apps/web`, not committed)

| Test position | Claim | Checked |
| ------------- | ----- | ------- |
| `4r1k1/8/8/8/4N3/8/8/6K1 w` (`classify.test.ts:125`) | Ne4 attacked by Re8, no white defender | `isAttacked(e4,b)=true`, `attackers(e4,w)=[]` ✅ |
| `4r1k1/8/8/8/4N3/8/6B1/6K1 w` (`classify.test.ts:121`) | Bg2 is the **only** defender of e4; e4 also attacked (so both rules apply and the order is tested) | `attackers(e4,w)=["g2"]`, `isAttacked(e4,b)=true`; after Bh3 there are no defenders; `Kf2` is legal ✅ |
| `4k3/8/8/8/8/2n5/8/R3K3 w` (`classify.test.ts:158`) | Ra2 is taken by Nc3; a2 was attacked before the move | `isAttacked(a2,b)=true`, `Nxa2` legal, `Ra8+` legal ✅ (so the "not moved" rule is tested) |
| `lines.test.ts:5` POSITION | Comment says f6 is "defendido só pelo peão g7" | `attackers(f6,b)=["d8","g7"]`. The assertion (`:55`) is correct; the **comment is wrong** (cosmetic) |
| en passant `lines.test.ts:46` | exf6 e.p. takes the pawn on f5 | `isEnPassant()=true` ✅ |
| Reference position before ply 44 | Ba1 hanging, best `a1d4` | `isAttacked(a1,w)=true`, `attackers(a1,b)=[]` ✅ |

---

## Discrimination Sensor

Scratch: `git worktree add <scratchpad>/f4a-sensor HEAD`, then `pnpm install --frozen-lockfile`, then
for each mutant `pnpm test` (`vitest run --coverage`, full suite of 242 tests). Each mutation was
reverted after its run.

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| M1 | `analysis/model/classify.ts:17` | `KEY_MOMENT_THRESHOLD` 2 → 3 | ❌ Survived |
| M2 | `analysis/model/classify.ts:73` | drop `loss >= T` (avoidable vs best line) | ❌ Survived |
| M3 | `analysis/model/classify.ts:73` | drop `!isBestMove` guard | ❌ Survived |
| M4 | `analysis/model/material.ts:4` | bishop = 4 | ✅ Killed |
| M4b | `analysis/model/material.ts:4` | king = 1 | ➖ Survived, equivalent (one king per side) |
| M5 | `game/model/lines.ts:54` | capture line continues on non-captures | ✅ Killed |
| M6 | `analysis/model/classify.ts:43-52` | hanging check before defender-moved | ✅ Killed |
| M7 | `analysis/model/classify.ts:48` | hanging ignores "not moved" | ✅ Killed |
| M8 | `analysis/model/keyMoments.ts:11` | selection not re-sorted chronologically | ✅ Killed |
| M9 | `analysis/model/keyMoments.ts:9` | selection by ply, not by loss | ✅ Killed |
| M9b | `analysis/model/keyMoments.ts:9` | tie-break: latest first | ✅ Killed |
| M10 | `analysis/model/keyMoments.ts:4` | `MAX_KEY_MOMENTS` 5 → 6 | ✅ Killed |
| M11 | `analysis/model/keyMoments.ts:25` | `selectStrengths` also keeps mistakes | ❌ Survived |
| M11b | `analysis/model/classify.ts:92` | every player move becomes a strength | ✅ Killed |
| M12 | `analysis/model/findings.ts:7` | torre masculine | ✅ Killed |
| M12b | `analysis/model/findings.ts:8` | dama masculine | ✅ Killed |
| M13 | `game/model/lines.ts:34` | en passant square = `to` | ✅ Killed |
| M14 | `analysis/model/keyMoments.ts:38` | patterns ignore count | ✅ Killed |
| M14b | `analysis/model/keyMoments.ts:38` | patterns tie-break reversed | ✅ Killed |
| M15 | `analysis/model/classify.ts:80` | opponent move becomes `mistake` | ✅ Killed |
| M16 | `analysis/model/classify.ts:74` | lost piece = first opponent capture | ✅ Killed |
| M17 | `game/model/lines.ts:51-52` | stale PV move skipped, not stopped | ✅ Killed |
| M18 | `game/model/lines.ts:46` | `maxPlies` ignored | ✅ Killed |
| M19 | `analysis/model/material.ts:14` | color flipped | ✅ Killed |
| M20 | `analysis/model/material.ts:20` | timeline drops initial position | ✅ Killed |
| M21 | `analysis/model/classify.ts:43` | "only defender" → "any defender" | ❌ Survived |
| M22 | `analysis/model/findings.ts:39` | opponent text loses "o adversário" | ✅ Killed |
| M23 | `analysis/model/classify.ts:73` | `loss >= T` → `loss > T` | ❌ Survived |
| M24 | `analysis/model/classify.ts:73` | drop the `drop >= T` conjunct | ✅ Killed |
| M25 | `analysis/model/classify.ts:43` | defender-moved ignores moved-piece exclusion | ✅ Killed |
| M26 | `analysis/model/classify.ts:92` | `gain >= T` → `gain > T` | ❌ Survived |
| M27 | `analysis/model/keyMoments.ts:5` | `MAX_STRENGTHS` 3 → 4 | ✅ Killed |

**Sensor depth**: P0-style manual (28 mutants; classification is the product's data-integrity core)
**Sensor result**: 21 killed, 1 equivalent, 6 survived (M1, M2, M3, M11, M21, M23/M26 boundary) → FAIL
**Isolation**: real-tree `git status --porcelain` was empty before and after; scratch worktree removed.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / no scope creep | ✅ |
| Surgical changes (only `analysis/`, `game/model/lines.ts` + index, docs, fixture script) | ✅ |
| Matches patterns (DDD, `model/` pure, index entry points) | ✅ |
| Spec-anchored outcome check | ❌ AN-03, AN-06 not discriminated |
| Per-layer coverage (domain 1:1 ACs) | ⚠️ AN-05, AN-08, AN-17 partial |
| Every test maps to an AC / edge case | ✅ (helper tests map to T1 Done-when) |
| Guidelines: `docs/engineering/quality.md` | ⚠️ `analysis/model` is 98.73% statements / 98.64% lines but **88.57% branches**. The 90% domain minimum holds on lines; branches are below it. The gate does not catch this: `apps/web/vite.config.ts:43-48` applies the 90% `src/domains/**/model/**` threshold to all model folders together, and `game/model` (94% branches) lifts the total. Uncovered: `classify.ts:38` (no-piece → `other`), `keyMoments.ts:38`, `material.ts:9` |

---

## Edge Cases

- [x] AN-19 empty PV: `game/model/lines.test.ts:25`
- [x] AN-20 stale PV: `game/model/lines.test.ts:30`; illegal first move returns the original position (`:34`)
- [x] Missing evaluations → `none`: `analysis/model/classify.test.ts:226`
- [ ] Mistake where no player piece is captured in the line (`lostPiece: null`, `mistakeType: "other"`) is not tested at classify level

---

## Gate Check

- **Gate command**: `make check` (Biome `--error-on-warnings`, `tsc --noEmit`, `vitest run --coverage`, Ruff, mypy, pytest)
- **Gate result**: exit 0. Web: 23 files, 242 passed, 0 failed, 0 skipped. API: 9 passed
- **Test count before feature**: 208 web tests (242 − 34 added; no `it(` removed in the diff)
- **Test count after feature**: 242
- **Delta**: +34
- **Skipped tests**: none
- **Failures**: none

---

## Fix Plans

### Fix 1 (Major): threshold boundary (AN-03, D3), kills M1/M23
- **Where**: `apps/web/src/domains/analysis/model/classify.test.ts`
- **Task**: add a hand-made `classifyMove` case where the played capture line loses **exactly 2** (for example, a bishop lost for a pawn) against a best line with 0 loss → `kind: "mistake", loss: 2`. Add a pawn-hang case (loss 1) → `kind: "none"`.

### Fix 2 (Major): avoidable vs best line (AN-03), kills M2
- **Task**: add a case where the drop is ≥ 2 but forced, so the best line (`before.bestMove` + `before.pv`) loses the same material. Assert `kind: "none"`.

### Fix 3 (Major): AN-06 guard is untested, kills M3
- **Task**: rewrite `classify.test.ts:187-211` so that `before.bestMove === played` but `before.pv.slice(1)` has no capture while `after.pv` starts with a capture that loses ≥ 2. Without the guard this would be a mistake; assert `kind: "none"`.

### Fix 4 (Minor): "only defender" (AN-08), kills M21
- **Task**: add a position where the lost piece has two defenders and the move takes one away. Assert `mistakeType !== "defender-moved"` (expected `hanging-piece` if it was already attacked).

### Fix 5 (Minor): strengths exclude other verdicts (AN-17), kills M11
- **Where**: `apps/web/src/domains/analysis/model/keyMoments.test.ts:57-61`
- **Task**: add `mistake(...)` and `opponent-mistake` verdicts with large loss to the `selectStrengths` input. Assert the same `[5,7,9]`.

### Fix 6 (Minor): strength boundary (AN-05), kills M26
- **Task**: add a `classifyMove` case with gain exactly 2 → `kind: "strength", gain: 2`.

### Fix 7 (Cosmetic)
- `apps/web/src/domains/game/model/lines.test.ts:4`: the comment says f6 is defended only by g7; it is also defended by Qd8.
- Cover `lostPiece: null → other` (`classify.ts:37-38`) to bring `analysis/model` branches to ≥ 90%.

### Spec follow-ups (author/spec owner)
- AN-09 vs glossary "nem protegida": decide whether a defended-but-attacked piece is `hanging-piece`, then align the spec, the glossary or the code.
- Remove or align the Assumptions-table finding templates with AN-15.

---

## Requirement Traceability Update

| Requirement | New status |
| ----------- | ---------- |
| AN-01, AN-02, AN-04, AN-07, AN-09, AN-10, AN-11, AN-12, AN-13, AN-14, AN-15, AN-16, AN-18, AN-19, AN-20 | ✅ Verified |
| AN-03, AN-06 | ❌ Needs Fix (tests) |
| AN-05, AN-08, AN-17 | ⚠️ Needs Fix (tests) |

---

## Summary

**Overall**: ❌ Not Ready

**Overall result**: FAIL
**Spec-anchored check**: 15/20 fully matched; 2 gaps, 3 partial, 2 spec-precision gaps
**Sensor**: 21/27 non-equivalent mutants killed (6 survived)
**Gate**: 242 web + 9 api passed

**What works**: the reference game gives exactly 22...Ta7, 27...Tb7, 41...Ta1, 43...Te6, 56...Ta8; 22...Ta7 is `hanging-piece`/Ba1/`Bd4+`; 12.Ce2 is an opponent mistake; selection, patterns, findings texts, capture line, en passant and stale PV are all tested with discriminating assertions; the boundary is enforced by a test.

**Issues found**: weak tests on the core D3 rule (threshold, avoidable check, best-move guard, only-defender) and on strengths selection. Fixes 1–6 above.

**Next steps**: route Fixes 1–6 to the implementer (tests only; no code change expected), then re-verify.
