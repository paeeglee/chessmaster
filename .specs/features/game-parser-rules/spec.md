# F1 · Game domain: parser and rules engine Specification

## Problem Statement

Every later engine (evaluation, classification, AI contract) and every screen needs the pasted game as a list of legal moves with the position (FEN) before and after each ply. Today nothing turns the text the player pastes (Chess.com HTML or a plain move list, in English or Portuguese notation) into that. F1 builds engines 1 (parser) and 2 (rules) as pure code in the `game` domain of `apps/web`, behind its public `index.ts`.

## Goals

- [ ] The reference game HTML (`fixtures/reference-game.chesscom.html`) becomes 144 legal plies, result `0-1`, ending in checkmate.
- [ ] Plain move lists in English and Portuguese notation, with annotations and HTML garbage, give the same plies as the equivalent clean list.
- [ ] Parsing + replaying 150 moves (300 plies) takes under 1 s (C-03).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| The Colar screen, its states and the board thumbnail | F3 |
| PGN import (tag pairs) | Out of the MVP (general.md 5.2); detected only to reject it |
| Material balance, mistake classification, key moments | F4 (analysis domain) |
| Games that do not start from the initial position (FEN setup) | Neither accepted format carries a start position |
| Short-game warning (< 6 moves) and size message copy | UI copy belongs to F3; F1 exposes the data (ply count, `too-large` outcome) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Detecting Chess.com HTML | Text contains an element with class `move-text` (after HTML parsing) | That is the move cell in the reference fixture; `data-figurine` alone is not enough | y (fixture) |
| Piece letters inside Chess.com HTML | Each `[data-figurine]` element is replaced by its attribute value (English letter) in document order inside its `move-text` | Reference fixture: `<span data-figurine="N"></span>c3` = `Nc3` | y (fixture) |
| Notation of a plain list (EN vs PT, D7 in risks) | Per game: if any piece letter is `N`, `Q` or `K` → English; else if any is `C`, `D` or `T` → Portuguese; else (only `R`/`B`) try English, and if replay fails try Portuguese; pick the one where every move is legal (English wins ties) | `R` is rook in English and king in Portuguese; legality is the deterministic tie-breaker | n |
| PGN | Text with at least one tag pair line (`[Name "value"]`) → `unrecognized` | step_01 AC: PGN shows "Formato não reconhecido" | y (PRD) |
| Text around the move list | Text before the first `1.` token and after the last move/result token is ignored; HTML tags in a plain list are stripped and entities decoded | "lixo de HTML" and partial pastes must not break the parser (8, robustness) | n |
| Annotations | `+`, `#`, `!`, `?` (and combinations), NAGs (`$n`), `{comments}`, `(variations)`, `e.p.` are ignored; `0-0`/`0-0-0` are read as castling | step_01 rule 5 + common copy/paste forms | n |
| Move numbers | Ignored for ordering (step_01 rule 5); plies are applied in text order from the initial position | A paste that starts mid-game fails as an illegal move at the first ply, which the UI already explains | n |
| Result | Read from the Chess.com `game-result-node` or a trailing `1-0`/`0-1`/`1/2-1/2`/`½-½`/`*` token; if the final position is checkmate or stalemate, the board decides the result and the termination | "Motores calculam": the rules engine is the source of truth | n |
| Size limit | UTF-8 size > 500 KB (512 000 bytes) → `too-large`, checked before any parsing | step_01 state "Colagem muito grande (> 500 KB)" | y (PRD) |
| Ply indexing | 1-based ply index; move number = `ceil(ply / 2)`; color `w` on odd plies | Matches "Lance N de M" counting in plies (glossary: ply) | n |
| Portuguese display | `toPortugueseSan` maps K→R, Q→D, R→T, B→B, N→C, keeps everything else | general.md 8: notation with R, D, T, B, C | y (PRD) |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Read a Chess.com move list ⭐ MVP

**User Story**: As a player, I want to paste the Chess.com move list HTML so that the system understands my game without me knowing what I copied.

**Acceptance Criteria**:

1. WHEN `parseGameText` receives the reference fixture THEN it SHALL return format `chesscom-html`, 144 move tokens (annotations stripped, GAME-07) whose first four are `d4`, `d5`, `Nc3`, `e6` and last is `Ra6`, and result `0-1`. <!-- GAME-01 -->
2. WHEN a Chess.com HTML paste has no `game-result-node` THEN the parser SHALL return the moves with result `null`. <!-- GAME-02 -->
3. WHEN the HTML is a fragment (starts or ends mid-element, has extra page text) THEN the parser SHALL still return every complete `move-text` in order. <!-- GAME-03 -->

**Independent Test**: unit tests over the real fixture and trimmed copies of it.

---

### P1: Read a plain move list ⭐ MVP

**User Story**: As a player, I want to paste "1.d4 d5 2.Cc3 …" in English or Portuguese notation so that I can use any move list I have.

**Acceptance Criteria**:

1. WHEN `parseGameText` receives `1.d4 d5 2.Nc3 e6 3.Nf3` THEN it SHALL return format `move-list` and tokens `d4 d5 Nc3 e6 Nf3`. <!-- GAME-04 -->
2. WHEN it receives `1.d4 d5 2.Cc3 e6 3.Cf3 Cc6 4.e3 Cf6 5.Bd3 Bd6 6.a3 O-O 7.b4 Te8` THEN it SHALL return the same English tokens as the English list (`Nc3`, `Nf3`, `Nc6`, `Nf6`, `Bd3`, `Bd6`, `O-O`, `Re8`). <!-- GAME-05 -->
3. WHEN a list uses only `R` and `B` piece letters and is legal in Portuguese but not in English THEN replay SHALL read it as Portuguese (`R` = king). <!-- GAME-06 -->
4. WHEN moves carry `+`, `#`, `!`, `?`, `!!`, `??`, `!?`, `?!`, NAGs, `{comments}` or `(variations)` THEN the parser SHALL return the same tokens as without them. <!-- GAME-07 -->
5. WHEN the list is wrapped in HTML tags or surrounded by other text THEN the parser SHALL return the moves from the first `1.` up to the last move or result token. <!-- GAME-08 -->
6. WHEN the list ends with `1-0`, `0-1`, `1/2-1/2`, `½-½` or `*` THEN the parser SHALL return that result (`*` and no token → `null`). <!-- GAME-09 -->
7. WHEN castling is written with zeros (`0-0`, `0-0-0`) THEN the parser SHALL read it as `O-O`/`O-O-O`. <!-- GAME-10 -->

---

### P1: Reject what is not a game ⭐ MVP

**Acceptance Criteria**:

1. IF the text is empty or only whitespace THEN `parseGameText` SHALL return outcome `empty`. <!-- GAME-11 -->
2. IF the text has no move list (e.g. prose, random HTML) THEN it SHALL return outcome `unrecognized`. <!-- GAME-12 -->
3. IF the text has a PGN tag pair line THEN it SHALL return outcome `unrecognized`, even when movetext follows. <!-- GAME-13 -->
4. IF the text is larger than 512 000 bytes (UTF-8) THEN it SHALL return outcome `too-large` without parsing it. <!-- GAME-14 -->

---

### P1: Replay and validate every move ⭐ MVP

**User Story**: As the analysis pipeline, I want every ply with its positions and flags so that later engines evaluate real positions.

**Acceptance Criteria**:

1. WHEN `replayGame` replays the reference game THEN it SHALL return 144 plies, each with ply index, move number, color, English SAN, from/to squares, moving piece, captured piece (if any), FEN before and after, and check/checkmate flags. <!-- GAME-15 -->
2. WHEN the reference game is replayed THEN ply 24 SHALL be `Bxa1` by black (move 12) capturing a rook, ply 44 SHALL be `Ra7` by black (move 22), and ply 144 SHALL be `Ra6#` with `isCheckmate` true. <!-- GAME-16 -->
3. WHEN the final position is checkmate THEN the game SHALL have termination `checkmate` and result `1-0`/`0-1` for the side that delivered mate, regardless of the pasted result. <!-- GAME-17 -->
4. WHEN the final position is stalemate THEN the game SHALL have termination `stalemate` and result `1/2-1/2`. <!-- GAME-18 -->
5. WHEN the final position is neither THEN termination SHALL be `null` and the result SHALL be the pasted result (or `null`). <!-- GAME-19 -->
6. IF a move is illegal in its position THEN `replayGame` SHALL stop and return an `illegal-move` error with that ply index, move number, color and the token exactly as written in the paste (e.g. `Txa1`), plus the plies replayed before it. <!-- GAME-20 -->
7. WHEN parse + replay run on a 150-move (300-ply) game THEN they SHALL finish in under 1000 ms in the test environment. <!-- GAME-21 -->

---

### P1: Show moves in Portuguese notation ⭐ MVP

**Acceptance Criteria**:

1. WHEN `toPortugueseSan` receives `Nf3`, `Qxd8`, `Rxa1`, `Kf2`, `Bxa1`, `e8=Q+`, `O-O` THEN it SHALL return `Cf3`, `Dxd8`, `Txa1`, `Rf2`, `Bxa1`, `e8=D+`, `O-O`. <!-- GAME-22 -->

---

### P1: Domain boundary ⭐ MVP

**Acceptance Criteria**:

1. The `game` domain SHALL expose `parseGameText`, `replayGame`, `toPortugueseSan` and their types only through `src/domains/game/index.ts`, and no file outside `src/domains/game/` SHALL import `chess.js`. <!-- GAME-23 -->
2. The parser and rules code SHALL live in `src/domains/game/model/` and SHALL NOT import React, XState or any network API. <!-- GAME-24 -->

---

## Edge Cases

- WHEN a promotion is written as `e8=Q`, `e8Q` or `e8=D` (Portuguese) THEN replay SHALL promote to a queen. <!-- GAME-25 -->
- WHEN a move list starts at move 1 with black's move only (`1...e5`) THEN replay SHALL fail at ply 1 as an illegal move (no start position is accepted). <!-- covered by GAME-20 -->

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | GAME-11..14 (empty, unrecognized, PGN, > 500 KB). |
| Failure / partial-failure states | GAME-20 returns plies replayed before the illegal move. |
| Idempotency / retry | N/A because the functions are pure; same input, same output. |
| Auth boundaries & rate limits | N/A because this is in-browser pure code. |
| Concurrency / ordering | GAME-15: plies keep text order. |
| Data lifecycle / expiry | N/A because nothing is stored (D2). |
| Observability | N/A for pure functions; metrics belong to the screen (F3). |
| External-dependency failure | N/A because `chess.js` is bundled; no network. |
| State-transition integrity | GAME-17..19 (termination and result). |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| GAME-01 | P1: Chess.com HTML | Design | Pending |
| GAME-02 | P1: Chess.com HTML | Design | Pending |
| GAME-03 | P1: Chess.com HTML | Design | Pending |
| GAME-04 | P1: Plain list | Design | Pending |
| GAME-05 | P1: Plain list | Design | Pending |
| GAME-06 | P1: Plain list | Design | Pending |
| GAME-07 | P1: Plain list | Design | Pending |
| GAME-08 | P1: Plain list | Design | Pending |
| GAME-09 | P1: Plain list | Design | Pending |
| GAME-10 | P1: Plain list | Design | Pending |
| GAME-11 | P1: Reject | Design | Pending |
| GAME-12 | P1: Reject | Design | Pending |
| GAME-13 | P1: Reject | Design | Pending |
| GAME-14 | P1: Reject | Design | Pending |
| GAME-15 | P1: Replay | Design | Pending |
| GAME-16 | P1: Replay | Design | Pending |
| GAME-17 | P1: Replay | Design | Pending |
| GAME-18 | P1: Replay | Design | Pending |
| GAME-19 | P1: Replay | Design | Pending |
| GAME-20 | P1: Replay | Design | Pending |
| GAME-21 | P1: Replay | Design | Pending |
| GAME-22 | P1: Portuguese display | Design | Pending |
| GAME-23 | P1: Boundary | Design | Pending |
| GAME-24 | P1: Boundary | Design | Pending |
| GAME-25 | Edge case | Design | Pending |

**Coverage:** 25 total, 0 mapped to tasks, 25 unmapped ⚠️ (mapped in Tasks)

---

## Success Criteria

- [ ] The reference game parses and replays to 144 legal plies ending in `Ra6#`, `0-1`, checkmate.
- [ ] `make check` passes with ≥ 90% coverage on `src/domains/game/model/**`.
