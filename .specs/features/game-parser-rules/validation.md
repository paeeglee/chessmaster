# F1 · Game domain: parser and rules engine Validation

**Date**: 2026-11-23
**Spec**: `.specs/features/game-parser-rules/spec.md`
**Diff range**: `bef97af..9f4da8e` (b40f248, a72e538, c1518e8, 13ec09b, 3723206, 9f4da8e)
**Verifier**: independent sub-agent (author ≠ verifier)
**Verdict**: PASS

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | `model/types.ts`, `model/notation.ts`; GAME-22 tested both ways (`notation.test.ts:5-35`) |
| T2 | ✅ Done | `model/moveText.ts`; each AC has exact expected tokens |
| T3 | ✅ Done | `model/chesscomHtml.ts`, `model/parseGameText.ts`; fixture → 144 tokens, `0-1` |
| T4 | ✅ Done | `model/replay.ts`; plies 24, 44, 144 asserted |
| T5 | ✅ Done | `index.ts`, boundary test, glossary (`termination`, `notation`, `written move`) |

---

## Spec-Anchored Acceptance Criteria

Paths relative to `apps/web/src/domains/game/`.

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| GAME-01 | `chesscom-html`, 144 tokens, first `d4 d5 Nc3 e6`, last `Ra6`, result `0-1` | `model/parseGameText.test.ts:17` `expect(game.format).toBe("chesscom-html")`; `:19` `toHaveLength(144)`; `:20` `toEqual(["d4","d5","Nc3","e6"])`; `:21` `at(-1)).toBe("Ra6")`; `:24` `result).toBe("0-1")` | ✅ PASS |
| GAME-02 | No `game-result-node` → moves kept, result `null` | `model/parseGameText.test.ts:33` `toHaveLength(144)`; `:34` `result).toBeNull()` (replace target exists verbatim in fixture) | ✅ PASS |
| GAME-03 | Fragment with page text / unclosed element → every complete `move-text` in order | `model/parseGameText.test.ts:41` `toEqual(["Nc3","e6","Nf3","Nc6","e3","Nf6","Bd3","Bd6"])` (leading page text, trailing unclosed `<div>`) | ✅ PASS (see gap 2) |
| GAME-04 | `move-list`, tokens `d4 d5 Nc3 e6 Nf3` | `model/parseGameText.test.ts:57` `format).toBe("move-list")`; `:59` `toEqual(["d4","d5","Nc3","e6","Nf3"])`; `model/moveText.test.ts:6` | ✅ PASS |
| GAME-05 | Portuguese list → same English tokens as the English list | `model/parseGameText.test.ts:65` `notation).toBe("pt")`; `:66` `portuguese.sanMoves).toEqual(english.sanMoves)`; `model/replay.test.ts:132` same FENs | ✅ PASS |
| GAME-06 | Only `R`/`B`, legal only in PT → read as PT (`R` = king) | `model/replay.test.ts:120` `notation).toBe("pt")`; `:121` `toMatchObject({ san: "Ke2", piece: "k" })` | ✅ PASS |
| GAME-07 | `+ # ! ? !! ?? !? ?!`, NAGs, `{}`, `()` → same tokens as clean list | `model/moveText.test.ts:36` `toEqual(tokenizeMoveText(clean).moves)`; `:37` exact list; `:49` nested variations | ✅ PASS (bare `?` not in the test string — gap 4) |
| GAME-08 | HTML-wrapped / surrounded text → moves from first `1.` to last move/result | `model/moveText.test.ts:53-55` `toEqual(["e4","e5","Nf3","Nc6"])`; `model/parseGameText.test.ts:76-77` HTML + `&nbsp;` + result | ⚠️ Spec-precision gap (gap 1) |
| GAME-09 | `1-0`, `0-1`, `1/2-1/2`, `½-½` → that result; `*`/none → `null` | `model/moveText.test.ts:66` `toEqual({ moves: ["e4","e5"], result })` over 6 rows (`:59-64`) | ✅ PASS |
| GAME-10 | `0-0`/`0-0-0` → `O-O`/`O-O-O` | `model/moveText.test.ts:74` exact list incl. `"O-O"`, `"O-O-O"`; `:89` `0-1` not taken as castling | ✅ PASS |
| GAME-11 | Empty / whitespace → `empty` | `model/parseGameText.test.ts:83` `toEqual({ kind: "empty" })` | ✅ PASS |
| GAME-12 | Prose / random HTML → `unrecognized` | `model/parseGameText.test.ts:90` `toEqual({ kind: "unrecognized" })` | ✅ PASS |
| GAME-13 | PGN tag pair, even with movetext → `unrecognized` | `model/parseGameText.test.ts:95` `toEqual({ kind: "unrecognized" })` | ✅ PASS |
| GAME-14 | > 512 000 UTF-8 bytes → `too-large`, before parsing | `model/parseGameText.test.ts:100` `toEqual({ kind: "too-large", bytes: MAX_PASTE_BYTES + 8 })`; `:105` exactly 512 000 → `parsed`; `:110` UTF-8 bytes. Ordering: `model/parseGameText.ts:44-47` is the first check | ✅ PASS |
| GAME-15 | 144 plies with index, move number, color, SAN, from/to, piece, captured, FEN before/after, check/mate flags | `model/replay.test.ts:33` `toHaveLength(144)`; `:35-49` full `toEqual` of ply 1; `:51-53` index and FEN chain; `:56` `finalFen` | ✅ PASS |
| GAME-16 | Ply 24 `Bxa1` black move 12 capturing a rook; ply 44 `Ra7` black move 22; ply 144 `Ra6#` mate | `model/replay.test.ts:60-68` `{ index: 24, moveNumber: 12, color: "b", san: "Bxa1", captured: "r" }`; `:69` `{ index: 44, moveNumber: 22, color: "b", san: "Ra7" }`; `:70-77` `{ index: 144, san: "Ra6#", isCheckmate: true }` | ✅ PASS |
| GAME-17 | Final checkmate → `checkmate`, winner result regardless of pasted result | `model/replay.test.ts:82-83`; `:90` pasted `1-0` → `result: "0-1"`; `:91-94` Fool's mate + `1-0` → `0-1`; `:98` white mate → `1-0` | ✅ PASS |
| GAME-18 | Final stalemate → `stalemate`, `1/2-1/2` | `model/replay.test.ts:105` `toMatchObject({ termination: "stalemate", result: "1/2-1/2" })` | ✅ PASS |
| GAME-19 | Neither → `termination: null`, pasted result or `null` | `model/replay.test.ts:109-113` both cases | ✅ PASS |
| GAME-20 | Illegal move → stop; ply, move number, color, token as written (`Txa1`), plies before | `model/replay.test.ts:152` `toEqual({ ply: 5, moveNumber: 3, color: "w", writtenMove: "Txa1" })`; `:153` `["d4","d5","Nc3","e6"]`; `:158-161` black; `:166-169` `1...e5` edge case | ✅ PASS |
| GAME-21 | Parse + replay 300 plies < 1000 ms | `model/replay.test.ts:191` `toHaveLength(300)`; `:192` `toBeLessThan(1000)` | ✅ PASS |
| GAME-22 | `Nf3 Qxd8 Rxa1 Kf2 Bxa1 e8=Q+ O-O` → `Cf3 Dxd8 Txa1 Rf2 Bxa1 e8=D+ O-O` | `model/notation.test.ts:17` `toPortugueseSan(english)).toBe(portuguese)` over rows `:6-12` (exact spec table) | ✅ PASS |
| GAME-23 | Exposed only via `index.ts`; no `chess.js` import outside `game/` | `index.test.ts:21` `Object.keys(game).sort()).toEqual([...])`; `:34` `offenders).toEqual([])` | ✅ PASS (regex scope — gap 3) |
| GAME-24 | Model has no React, XState or network API | `index.test.ts:42` `offenders).toEqual([])` | ✅ PASS (regex scope — gap 3) |
| GAME-25 | `e8=Q`, `e8Q`, `e8=D` → queen | `model/replay.test.ts:143` `toMatchObject({ san: "bxa8=Q", promotion: "q", captured: "r" })` over 3 forms (`:138-140`) | ✅ PASS |

**Status**: ✅ All 25 ACs covered with spec-anchored assertions; 1 spec-precision gap flagged (GAME-08).

### Chess facts the tests rely on (checked independently with chess.js 1.4.0)

- Ply 24 `12...Bxa1`: in the fixture, the e5 bishop reaches a1 after `10.dxe5`, `7.b4`, `12.Ne2` cleared d4/b2/c3; chess.js reports `captured: "r"` (test passes on real replay).
- Stalemate line (`replay.test.ts:26-27`, Sam Loyd 10-move): after `10.Qe6` chess.js gives `isStalemate() = true`, `inCheck() = false`, 0 legal moves (FEN `5bnr/4p1pq/4Qpkr/7p/7P/4P3/PPPP1PP1/RNB1KBNR b KQ - 2 10`).
- Fool's mate and `4.Qxf7#` are checkmate; `5.bxa8Q` gives `san: "bxa8=Q"`, `captured: "r"`, `promotion: "q"`.
- `1.e4 e5 2.Re2 Bb3`: `Re2` illegal in English, `Ke2` legal, `Bb3` illegal → furthest reading fails at ply 4 as asserted.

### Verifier probes (scratch only)

- Fragment cut mid-attribute at start and mid-tag at end → 7 complete moves (`Nc3 … Bd3`), the cut `Bd6` cell dropped: matches GAME-03.
- `1.e4? e5 2.Nf3?` → `e4 e5 Nf3`; `4.O-O+` → `O-O`; `exd6e.p.` → `exd6`.
- `1.e4 e5 2.♘f3` (Unicode figurine, another site's copy) → 2 moves, replay `legal`: the rest of the game is silently dropped (see gap 1).

---

## Discrimination Sensor

Scratch: `git worktree add` at `HEAD` in the session scratchpad, `pnpm install --frozen-lockfile`, one mutant at a time, `pnpm vitest run`, file restored with `git checkout` between mutants, then `git worktree remove --force`. Real tree `git status --porcelain` was empty before and after (match).

| # | File | Mutation | Killed? |
| - | ---- | -------- | ------- |
| M1 | `model/notation.ts:16` | Swap R/K mapping (`K→T`, `R→R`) | ✅ Killed (4 failed) |
| M2 | `model/moveText.ts:33` | Drop NAG stripping | ✅ Killed (1) |
| M3 | `model/moveText.ts:31` | Drop `{comment}` stripping | ✅ Killed (1) |
| M4 | `model/replay.ts:71` | Checkmate winner always `1-0` | ✅ Killed (2) |
| M5 | `model/replay.ts:73` | Ignore stalemate | ✅ Killed (1) |
| M6 | `model/replay.ts:114` | `writtenMove` from `sanMoves` | ✅ Killed (1) |
| M7 | `model/parseGameText.ts:45` | Size check `>` → `>=` | ✅ Killed (1) |
| M8 | `model/parseGameText.ts:51` | No PGN detection | ✅ Killed (1) |
| M9 | `model/chesscomHtml.ts:13` | Skip figurine inlining | ✅ Killed (3 failed, 1 file crashed) |
| M10 | `model/replay.ts:101` | Report first failing reading, not furthest | ✅ Killed (1) |
| M11 | `model/moveText.ts:32` | Drop variation stripping | ✅ Killed (2) |
| M12 | `model/moveText.ts:36` | Drop `0-0` → `O-O` | ✅ Killed (1) |
| M13 | `model/replay.ts:22` | Flip ply color | ✅ Killed (9) |
| M14 | `model/replay.ts:57` | `isCheckmate` from `inCheck()` | ✅ Killed (1) |
| M15 | `model/parseGameText.ts:61` | Portuguese not translated to English | ✅ Killed (4) |
| M16 | `model/chesscomHtml.ts:31` | Ignore `game-result-node` | ✅ Killed (1) |
| M17 | `model/moveText.ts:86` | Do not start at first `1.` | ✅ Killed (1) |

**Sensor depth**: lightweight+ (17 manual mutants, all branches of the new model code)
**Result**: 17/17 killed - PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes (only `game/`, `package.json`, lockfile, glossary, specs) | ✅ |
| No scope creep | ✅ |
| Matches patterns (DDD: `domains/game/model`, public `index.ts`, colocated tests, pt-BR comments, English identifiers) | ✅ |
| Spec-anchored outcome check | ✅ |
| Per-layer coverage: domain 1:1 ACs; 100% lines / 93.93% branches on `game/model` (≥ 90%) | ✅ |
| Every test maps to an AC, edge case or Done-when (extra tests: `0-1` vs castling, nested variations, numberless list, English tie-break, black illegal move — all support GAME-06/07/09/10/20) | ✅ |
| Documented guidelines followed: `CLAUDE.md`, `docs/engineering/quality.md`, `docs/architecture/code-structure.md` | ✅ |
| Context7 lookup (CLAUDE.md) | Not verifiable from repository artifacts; the orchestrator must confirm it from the implementer's summary |

Cosmetic: `model/replay.test.ts:173` comment says "Bb4 sem caminho" but the token is `Bb3`.

---

## Edge Cases

- [x] Promotion `e8=Q`, `e8Q`, `e8=D` → queen (`model/replay.test.ts:137-144`)
- [x] `1...e5` start → illegal at ply 1 (`model/replay.test.ts:164-170`)

---

## Gate Check

- **Gate command**: `make check` (full gate from tasks.md), Node 26
- **Result**: exit 0. Biome clean, `tsc --noEmit` clean, Vitest 83 passed / 0 failed / 0 skipped (7 files), pytest 9 passed
- **Coverage**: all files 100% statements / 94% branches; `game/model` 100% lines, 93.93% branches (threshold 90%)
- **Test count before feature** (`bef97af`): 5
- **Test count after feature**: 83
- **Delta**: +78
- **Skipped tests**: none
- **Failures**: none
- `make test-e2e` not run: F1 has no user-flow or e2e changes (instruction from orchestrator; ports in use by another verifier)

---

## Gaps (non-blocking, ranked)

1. **⚠️ Spec-precision gap, GAME-08.** The spec defines text before the first `1.` and after the last move/result, but not non-move text *between* moves. `model/moveText.ts:92-93` stops at the first non-move token, so the rest of the game is silently dropped and replay still returns `legal` (probe: `1.e4 e5 2.♘f3` → 2 plies). **Fix**: decide in `spec.md` whether an unknown token mid-list is skipped, ends the list, or makes the paste `unrecognized`/partial, and add a test with a mid-list stray token (e.g. a clock `0:59` or `♘f3`).
2. **GAME-03 test does not cut mid-tag.** `model/parseGameText.test.ts:38-40` slices at element boundaries. The verifier probe shows a mid-attribute/mid-tag cut works, but no test pins it. **Fix**: slice the fixture at `indexOf('move-node-0-2"') + 5` and `indexOf('data-figurine="B"></span>d6') + 10` and assert the 7 moves `Nc3 … Bd3`.
3. **Boundary regexes are narrow (GAME-23/24).** `index.test.ts:32` only matches `from "chess.js"` (misses `import "chess.js"` and `import("chess.js")`); `index.test.ts:38` only matches `fetch(` (misses `XMLHttpRequest`, `WebSocket`, `EventSource`). **Fix**: widen both regexes.
4. **GAME-07 bare `?` not in the annotated string** (`model/moveText.test.ts:34`). Behavior is correct (probe), same regex class. **Fix**: add `?` to one move in the string.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| GAME-01 … GAME-25 | Implementing | ✅ Verified (GAME-08 with spec-precision gap noted) |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 25/25 ACs matched spec outcome; 1 spec-precision gap (GAME-08)
**Sensor**: 17/17 mutations killed
**Gate**: `make check` exit 0; 83 Vitest + 9 pytest passed

**What works**: Chess.com HTML (figurines, result node, fragments), plain lists in English/Portuguese with annotations, NAGs, comments, variations and HTML garbage, empty/unrecognized/PGN/too-large rejection, chess.js replay with full ply data, board-decided termination, furthest-reading illegal-move error with the written token, Portuguese display, domain boundary.

**Next steps**: optional fix tasks for gaps 1–4; gap 1 needs a spec decision first.
