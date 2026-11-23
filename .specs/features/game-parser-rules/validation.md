# F1 · Game domain: parser and rules engine Validation

**Date**: 2026-11-23 (round 3, after test commit `b4c03cd`)
**Spec**: `.specs/features/game-parser-rules/spec.md`
**Diff range**: `65ed199..b4c03cd` (F0 squash-merged as `65ed199`; F1 commits `8e13d81`, `7aac4f5`, `08cebc5`, `7c40c02`, `d43488a`, `080e344`; first report `654d2f1`; fixes `8689171`; round-2 report `8fe6b35`; M22 test `b4c03cd`)
**Verifier**: independent sub-agent (author ≠ verifier)
**Verdict**: PASS

Round 3: `b4c03cd` adds the two assertions from Fix 1, and M22 is now killed. Round 2 had failed on M22 alone (no test for stray text followed only by a move number).

---

## Re-verification of the first report's gaps

| First-report gap | Fix in `8689171` | Verified |
| ---------------- | ---------------- | -------- |
| 1. GAME-08 left text between moves undefined; the rest was dropped silently | Spec: a non-move token followed by a move or move number → `unrecognized`. GAME-26 (Unicode figurines) and GAME-27 (clocks) added | ✅ (the "move number follows" branch was pinned in round 3 by `b4c03cd`) |
| 2. GAME-03 never cut inside a tag | `model/parseGameText.test.ts:37-49` | ✅ |
| 3. Boundary regexes too narrow | `index.test.ts:32-34`, `:40-41` | ✅ injection checks B1–B5 all fail the test |
| 4. Bare `?` missing in GAME-07 | `model/moveText.test.ts:35` (`a6?`) | ✅ |
| Comment `Bb4` → `Bb3` | `model/replay.test.ts:173` | ✅ |

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | `model/types.ts`, `model/notation.ts` |
| T2 | ✅ Done | `model/moveText.ts` (now with `interrupted`, figurines, clocks) |
| T3 | ✅ Done | `model/chesscomHtml.ts`, `model/parseGameText.ts` |
| T4 | ✅ Done | `model/replay.ts` |
| T5 | ✅ Done | `index.ts`, boundary test, glossary |
| Verification fixes | ✅ Done | `8689171` + `b4c03cd` |

---

## Spec-Anchored Acceptance Criteria

Paths relative to `apps/web/src/domains/game/`.

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| GAME-01 | `chesscom-html`, 144 tokens, first `d4 d5 Nc3 e6`, last `Ra6`, result `0-1` | `model/parseGameText.test.ts:17` `format).toBe("chesscom-html")`; `:19` `toHaveLength(144)`; `:20` `toEqual(["d4","d5","Nc3","e6"])`; `:21` `at(-1)).toBe("Ra6")`; `:24` `result).toBe("0-1")` | ✅ PASS |
| GAME-02 | No `game-result-node` → moves kept, result `null` | `model/parseGameText.test.ts:33` `toHaveLength(144)`; `:34` `result).toBeNull()` | ✅ PASS |
| GAME-03 | Fragment cut mid-element / extra page text → every complete `move-text` in order | `model/parseGameText.test.ts:40` cut inside a tag → `toEqual(["Nc3","e6","Nf3","Nc6","e3","Nf6","Bd3"])`; `:55` page text + unclosed `<div>` → 8 moves | ✅ PASS |
| GAME-04 | `move-list`, tokens `d4 d5 Nc3 e6 Nf3` | `model/parseGameText.test.ts:71` `toBe("move-list")`; `:73` `toEqual(["d4","d5","Nc3","e6","Nf3"])`; `model/moveText.test.ts:6` | ✅ PASS |
| GAME-05 | Portuguese list → same English tokens | `model/parseGameText.test.ts:79` `notation).toBe("pt")`; `:80` `sanMoves).toEqual(english.sanMoves)` | ✅ PASS |
| GAME-06 | Only `R`/`B`, legal only in PT → PT (`R` = king) | `model/replay.test.ts:120` `notation).toBe("pt")`; `:121` `{ san: "Ke2", piece: "k" }` | ✅ PASS |
| GAME-07 | `+ # ! ? !! ?? !? ?!`, NAGs, `{}`, `()` → same tokens | `model/moveText.test.ts:37` `toEqual(tokenizeMoveText(clean).moves)`; `:38` exact list (string at `:35` now has bare `?` and `#!?`); `:50` nested variations | ✅ PASS |
| GAME-08 (wrap/surround) | Moves from first `1.` to last move/result | `model/moveText.test.ts:54` surrounded text → `["e4","e5","Nf3","Nc6"]`; `:159` trailing stray text → `interrupted).toBe(false)`; `model/parseGameText.test.ts:90-91` HTML-wrapped list + result | ✅ PASS |
| GAME-08 (stray token inside) | Non-move token followed by a move **or move number** → `unrecognized` | `model/parseGameText.test.ts:108` `parseGameText("1.e4 e5 2.Xf3 Nc6 3.Bb5")).toEqual({ kind: "unrecognized" })`; `model/moveText.test.ts:143` `{ moves: ["e4","e5"], result: null, interrupted: true }` (move follows); `model/moveText.test.ts:151` `tokenizeMoveText("1.e4 e5 2.Nf3 Nc6 obrigado 3.")).toEqual({ moves: ["e4","e5","Nf3","Nc6"], result: null, interrupted: true })` and `model/parseGameText.test.ts:109` `toEqual({ kind: "unrecognized" })` (bare move number follows) | ✅ PASS |
| GAME-09 | `1-0`, `0-1`, `1/2-1/2`, `½-½` → result; `*`/none → `null` | `model/moveText.test.ts:67` `toEqual({ moves: ["e4","e5"], result, interrupted: false })` over 6 rows | ✅ PASS |
| GAME-10 | `0-0`/`0-0-0` → `O-O`/`O-O-O` | `model/moveText.test.ts:79` exact list; `:94` `0-1` not castling | ✅ PASS |
| GAME-11 | Empty / whitespace → `empty` | `model/parseGameText.test.ts:97` `toEqual({ kind: "empty" })` | ✅ PASS |
| GAME-12 | Prose / random HTML → `unrecognized` | `model/parseGameText.test.ts:104` `toEqual({ kind: "unrecognized" })` | ✅ PASS |
| GAME-13 | PGN tag pair → `unrecognized` | `model/parseGameText.test.ts:113` `toEqual({ kind: "unrecognized" })` | ✅ PASS |
| GAME-14 | > 512 000 UTF-8 bytes → `too-large`, before parsing | `model/parseGameText.test.ts:118` `{ kind: "too-large", bytes: MAX_PASTE_BYTES + 8 }`; `:123` exactly 512 000 → `parsed`; `:128` UTF-8. First check at `model/parseGameText.ts:46` | ✅ PASS |
| GAME-15 | 144 plies with all fields | `model/replay.test.ts:33` `toHaveLength(144)`; `:35-49` full `toEqual` of ply 1; `:51-53` index and FEN chain | ✅ PASS |
| GAME-16 | Ply 24 `Bxa1` (b, move 12, captures rook); ply 44 `Ra7` (b, move 22); ply 144 `Ra6#` mate | `model/replay.test.ts:60-68`, `:69`, `:70-77` | ✅ PASS |
| GAME-17 | Checkmate → `checkmate`, winner's result whatever was pasted | `model/replay.test.ts:82-83`, `:90`, `:91-94`, `:98` | ✅ PASS |
| GAME-18 | Stalemate → `stalemate`, `1/2-1/2` | `model/replay.test.ts:105` | ✅ PASS |
| GAME-19 | Neither → `null` termination, pasted result or `null` | `model/replay.test.ts:109-113` | ✅ PASS |
| GAME-20 | Illegal move → ply, move number, color, written token, plies before | `model/replay.test.ts:152` `{ ply: 5, moveNumber: 3, color: "w", writtenMove: "Txa1" }`; `:153`; `:158-161`; `:166-169` | ✅ PASS |
| GAME-21 | 300 plies < 1000 ms | `model/replay.test.ts:191-192` | ✅ PASS |
| GAME-22 | `Nf3 Qxd8 Rxa1 Kf2 Bxa1 e8=Q+ O-O` → `Cf3 Dxd8 Txa1 Rf2 Bxa1 e8=D+ O-O` | `model/notation.test.ts:17` over rows `:6-12` | ✅ PASS |
| GAME-23 | Only `index.ts`; no `chess.js` import outside `game/` (static, side-effect, dynamic) | `index.test.ts:21` exported keys; `:36` `offenders).toEqual([])` (regex `:33`) | ✅ PASS |
| GAME-24 | Model has no React, XState or network API | `index.test.ts:45` `offenders).toEqual([])` (regex `:41` includes `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`) | ✅ PASS |
| GAME-25 | `e8=Q`, `e8Q`, `e8=D` → queen | `model/replay.test.ts:143` over `:138-140` | ✅ PASS |
| GAME-26 | `♘f3`, `♞c6` → English letters | `model/moveText.test.ts:123` `toEqual(["e4","e5","Nf3","Nc6","Bb5","Qh4"])` | ✅ PASS |
| GAME-27 | Clocks `0:59`, `[1:02:03]` between moves ignored | `model/moveText.test.ts:134` `toEqual(["e4","e5","Nf3","Nc6"])` | ✅ PASS |

**Status**: ✅ 27/27 ACs fully evidenced with spec-anchored assertions.

Notes (no change needed):

- The spec lists GAME-26 and GAME-27 as items 8 and 9, between items 5 and 6 of the plain-list story. The numbering is cosmetic.
- The GAME-26 and GAME-27 test names do not carry their IDs (`moveText.test.ts:122`, `:133`).

### Chess facts (checked with chess.js 1.4.0, unchanged since the first report)

- Ply 24 `12...Bxa1` captures a rook.
- The Sam Loyd line ends in stalemate: `isStalemate() = true`, not in check, 0 legal moves.
- Fool's mate and `4.Qxf7#` are checkmate.
- `bxa8Q` gives `bxa8=Q`, with `captured: "r"` and `promotion: "q"`.
- In `1.e4 e5 2.Re2 Bb3`, `Re2` is illegal in English, `Ke2` is legal and `Bb3` is illegal.

### Verifier probes (scratch only, against `8689171`)

| Input | Outcome |
| ----- | ------- |
| `1.e4 e5 2.Nf3 Nc6 obrigado 3.` | `unrecognized`: correct per spec; tested since `b4c03cd` |
| `1.e4 e5 2.Nf3 gg 1-0` | parsed, 3 moves, `1-0` (stray text then a result is not an interruption) |
| `1.e4 0:59.9 e5` | parsed, `e4 e5` |
| `1. e4 {[%clk 0:09:58]} e5` | parsed, `e4 e5` |
| `1.e4 e5 12.4 2.Nf3` | `unrecognized` (`12.4` reads as move number 12 plus stray `4`; the code comment says decimal clocks without `:` are not supported) |
| `Minha partida 1.e4 e5 2.Nf3 Nc6 joguei 2 vezes` | parsed, 4 moves |
| `1.e4 e5 2.♘f3 ♞c6` | parsed, `e4 e5 Nf3 Nc6` |

---

## Discrimination Sensor

**Scratch setup**: a fresh `git worktree add --detach` at `8689171` in the session scratchpad, then `pnpm install --frozen-lockfile`. Each mutant was applied alone, `pnpm vitest run` was run, and the file was restored with `git checkout` before the next one. Afterwards the scratch was checked out at `65ed199` to count the pre-feature tests, then removed with `git worktree remove --force`.

**Isolation**: the real tree's `git status --porcelain` was empty before and after, so it matches the baseline.

Line numbers are those in `8689171`.

| # | File | Mutation | Killed? |
| - | ---- | -------- | ------- |
| M1 | `model/notation.ts:16` | Swap R/K mapping | ✅ (4 failed) |
| M2 | `model/moveText.ts:52` | Drop NAG stripping | ✅ (1) |
| M3 | `model/moveText.ts:50` | Drop `{comment}` stripping | ✅ (1) |
| M4 | `model/replay.ts:71` | Checkmate winner always `1-0` | ✅ (2) |
| M5 | `model/replay.ts:73` | Ignore stalemate | ✅ (1) |
| M6 | `model/replay.ts:114` | `writtenMove` from `sanMoves` | ✅ (1) |
| M7 | `model/parseGameText.ts:46` | `>` → `>=` | ✅ (1) |
| M8 | `model/parseGameText.ts:52` | No PGN detection | ✅ (1) |
| M9 | `model/chesscomHtml.ts:13` | Skip `data-figurine` inlining | ✅ (4 + file crash) |
| M10 | `model/replay.ts:101` | First failing reading instead of furthest | ✅ (1) |
| M11 | `model/moveText.ts:51` | Drop variation stripping | ✅ (2) |
| M12 | `model/moveText.ts:56` | Drop `0-0` → `O-O` | ✅ (1) |
| M13 | `model/replay.ts:22` | Flip ply color | ✅ (9) |
| M14 | `model/replay.ts:57` | `isCheckmate` from `inCheck()` | ✅ (1) |
| M15 | `model/parseGameText.ts:62` | Portuguese not translated | ✅ (4) |
| M16 | `model/chesscomHtml.ts:31` | Ignore `game-result-node` | ✅ (1) |
| M17 | `model/moveText.ts:113` | Do not start at first `1.` | ✅ (1) |
| M18 | `model/parseGameText.ts:57` | Ignore `interrupted` | ✅ (1) |
| M19 | `model/moveText.ts:122` | Never set `interrupted` | ✅ (2) |
| M20 | `model/moveText.ts:119` | Stray text ends the list silently (old behavior) | ✅ (2) |
| M21 | `model/moveText.ts:119` | Stray text interrupts even at the end | ✅ (2) |
| M22 | `model/moveText.ts:120` | Move numbers after stray text no longer count (`token.kind === "move"` only) | ❌ Survived in round 2 → ✅ Killed in round 3 (2 failed) |
| M23 | `model/moveText.ts:53` | Drop Unicode figurine mapping | ✅ (1) |
| M24 | `model/moveText.ts:42` | `♘` → `B` | ✅ (1) |
| M25 | `model/moveText.ts:73` | Drop clock skipping | ✅ (1) |
| M26 | `model/moveText.ts:47` | Clock regex without brackets | ✅ (1) |
| M27 | `model/parseGameText.ts:33` | Chess.com path reports `interrupted` | ✅ (4 + file crash) |

**Boundary-test injections.** These are faults in source files, run against the widened regexes in `index.test.ts`; each one made the test fail.

| # | Injection | Result |
| - | --------- | ------ |
| B1 | `import("chess.js")` in `src/shared/lib/` | ✅ fails |
| B2 | `import "chess.js"` in `src/shared/lib/` | ✅ fails |
| B3 | `new WebSocket(...)` in `game/model` | ✅ fails |
| B4 | `new XMLHttpRequest()` in `game/model` | ✅ fails |
| B5 | `new EventSource(...)` in `game/model` | ✅ fails |

A mutation of the test regex itself was discarded as meaningless, since it only checks for offenders that do not exist.

**Round 3 re-run.** A fresh scratch worktree at `b4c03cd` (`pnpm install --frozen-lockfile`) re-ran the GAME-08 mutants, then was removed with `git worktree remove --force`. The real tree's porcelain was empty before and after, matching the baseline.

| # | Mutation | Round 3 |
| - | -------- | ------- |
| M17 | Do not start at first `1.` | ✅ Killed (1) |
| M18 | Ignore `interrupted` | ✅ Killed (1) |
| M19 | Never set `interrupted` | ✅ Killed (3) |
| M20 | Stray text ends the list silently | ✅ Killed (3) |
| M21 | Stray text interrupts even at the end | ✅ Killed (2) |
| M22 | Move numbers after stray text do not count | ✅ Killed (2) |

**Sensor depth**: P0-style manual run (27 mutants + 5 injections covering all new branches)
**Result**: 27/27 mutants killed (M22 since round 3), 5/5 injections caught: PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical changes / no scope creep | ✅ |
| Matches patterns (DDD, public `index.ts`, colocated tests, pt-BR comments, English identifiers) | ✅ |
| Spec-anchored outcome check | ✅ |
| Coverage: `game/model` 100% lines, 94.49% branches (≥ 90%) | ✅ |
| Every test maps to an AC, edge case or Done-when | ✅ |
| Guidelines: `CLAUDE.md`, `docs/engineering/quality.md`, `docs/architecture/code-structure.md` | ✅ |
| Context7 lookup (CLAUDE.md) | Not verifiable from repository artifacts; the orchestrator must confirm it |

---

## Edge Cases

- [x] Promotion `e8=Q`, `e8Q`, `e8=D` → queen (`model/replay.test.ts:137-144`)
- [x] `1...e5` start → illegal at ply 1 (`model/replay.test.ts:164-170`)
- [x] Stray text followed only by a move number → `unrecognized` (`model/moveText.test.ts:151`, `model/parseGameText.test.ts:109`)

---

## Gate Check

- **Gate command**: `make check` (Node 26; Biome now runs with `--error-on-warnings`)
- **Result**: exit 0
  - Biome: 31 files clean
  - `tsc --noEmit`: clean
  - Vitest: 93 passed, 0 failed, 0 skipped (8 files)
  - pytest: 9 passed
- **Coverage**: all files 100% statements, 94.54% branches; `game/model` 94.49% branches
- **Test count before feature** (`65ed199`): 8
- **Test count after feature**: 93
- **Delta**: +85
- **Skipped tests**: none
- `make test-e2e` not run: F1 has no user-flow changes (orchestrator instruction)

---

## Fix Plans

### Fix 1: pin the "move number follows stray text" branch of GAME-08

- **Root cause**: `model/moveText.ts:120` treats a following move number as a continuation, which is what the spec requires. The only tests (`model/moveText.test.ts:143`, `model/parseGameText.test.ts:108`) have a move after the stray token, so dropping `|| token.kind === "number"` (M22) still passes.
- **Fix task**: in `apps/web/src/domains/game/model/moveText.test.ts`, add
  `expect(tokenizeMoveText("1.e4 e5 2.Nf3 Nc6 obrigado 3.")).toEqual({ moves: ["e4","e5","Nf3","Nc6"], result: null, interrupted: true })`
  and, in `model/parseGameText.test.ts`, the matching `{ kind: "unrecognized" }` assertion.
- **Verify**: re-run M22; it must be killed.
- **Priority**: Minor (test-only; behavior already correct)
- **Status**: ✅ Done in `b4c03cd`; M22 killed in round 3

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| GAME-01 … GAME-27 | Implementing | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 27/27 ACs fully evidenced
**Sensor**: 27/27 mutants killed, 5/5 boundary injections caught
**Gate**: `make check` exit 0; 93 Vitest + 9 pytest passed

**What works**: every gap from the first report is fixed. Stray text inside the list is rejected instead of being dropped silently. Unicode figurines and clocks are read. The fragment cut inside a tag is tested, the boundary regexes cover side-effect and dynamic imports plus XHR, WebSocket and EventSource, and the bare `?` is now in the GAME-07 string.

**Next steps**: none for verification; the orchestrator confirms the Context7 lookup and opens the PR.
