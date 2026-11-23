# F4a · Analysis model: material, key moments and mistake types Specification

## Problem Statement

general.md 7.1 and D3 define how the product decides what went wrong: a key moment is a player move that loses 2 or more points of material, confirmed by the engine, classified as hanging piece, defender moved or other. Screens 2–4 and the AI contract all depend on this classification. It must be pure, deterministic code fed by the engine evaluations (F2) and the replayed game (F1).

## Goals

- [ ] For the reference game (player = Black) the key moments are exactly 22...Ta7, 27...Tb7, 41...Ta1, 43...Te6 and 56...Ta8 (step_03 AC), with 12.Ce2 reported as an opponent mistake.
- [ ] Classification, findings texts and timelines are pure functions with ≥ 90% coverage.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Running the engine over the game, progress, cancellation, the Analisando screen | F4b |
| Endgame tablebase | F5 |
| AI texts (verdict, explanations) | F6 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Piece values | P 1, N 3, B 3, R 5, Q 9, K 0 | Standard values; D3 speaks in "points of material" | n |
| "Confirmed by the engine" (7.1) | Material of a line = play the first move, then follow the engine's principal variation **only while its moves are captures or promotions** (max 8 plies). Played line = played move + PV of the position after it; best line = engine best move + rest of the PV before it | Measures the immediate tactical consequence the engine calculated; long PVs mix in later trades and created noise (prototype on the reference game) | n |
| Key moment (D3) | Player move where `materialBefore − playedLine ≥ 2` **and** `bestLine − playedLine ≥ 2` (the loss was avoidable) | "perde 2 pontos… em relação ao melhor lance" | n |
| Opponent mistake ("Adversário") | Same rule applied to the opponent's moves | step_02 rule: opponent error that favored the player | n |
| Strength ("O que você fez bem") | Player move whose played line gains ≥ 2 (`playedLine − materialBefore ≥ 2`) and is not a key moment; top 3 by gain, chronological | R-10: only real gains calculated by the engine | n |
| Lost piece | The first player piece captured in the played line (square and type); none → type `other` | Needed for mistake type and texts | n |
| Mistake type | `defender-moved` if the moved piece was the only defender of the lost piece's square before the move; else `hanging-piece` if the lost piece was already attacked before the move, was not the moved piece and was not protected by the move (glossary); else `other` | Glossary definitions; "defender moved" names the cause when both apply | n |
| Key moment cap | At most 5: the 5 with the largest loss, shown in chronological order; ties by earlier move | general.md 7.1 / step_03 state "Mais de 5 candidatos" | y (PRD) |
| Material timeline | Material balance after every ply from the player's point of view (index 0 = initial position) | R-06 chart | y (PRD) |
| Findings texts | Template, no AI, exact strings in AN-15 (the move label is shown next to the text by the screen) | step_02: findings are template text | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Material ⭐ MVP

1. `materialBalance(fen, color)` SHALL return the sum of piece values of `color` minus the opponent's (P1 N3 B3 R5 Q9 K0). <!-- AN-01 -->
2. `materialTimeline(game, playerColor)` SHALL return plies + 1 values, the balance after each ply from the player's point of view, starting with 0 for the initial position. <!-- AN-02 -->

### P1: Classify every move ⭐ MVP

1. WHEN a player move's played line loses ≥ 2 versus the material before the move and versus the best line THEN `classifyMove` SHALL return kind `mistake` with `loss` = best line − played line. <!-- AN-03 -->
2. WHEN an opponent move satisfies the same rule for the opponent THEN it SHALL return kind `opponent-mistake`. <!-- AN-04 -->
3. WHEN a player move gains ≥ 2 in its played line and is not a mistake THEN it SHALL return kind `strength` with `gain`. <!-- AN-05 -->
4. WHEN the played move equals the engine best move THEN it SHALL never be a mistake. <!-- AN-06 -->
5. Every non-`none` verdict SHALL carry the move label in Portuguese notation (e.g. `22...Ta7`), the best move in Portuguese SAN (e.g. `Bd4+`) and the lost or won piece (type + square) when there is one. <!-- AN-07 -->

### P1: Mistake types ⭐ MVP

1. IF the moved piece was the only defender of the lost piece THEN the type SHALL be `defender-moved`. <!-- AN-08 -->
2. IF the lost piece was attacked before the move, was not moved and the move did not protect it THEN the type SHALL be `hanging-piece`. <!-- AN-09 -->
3. IF neither applies (or no piece is lost in the line) THEN the type SHALL be `other`. <!-- AN-10 -->

### P1: Reference game ⭐ MVP

1. WHEN the reference game is classified with its engine fixture and player color Black THEN the key moments SHALL be 22...Ta7, 27...Tb7, 41...Ta1, 43...Te6, 56...Ta8 in that order. <!-- AN-11 -->
2. 22...Ta7 SHALL be `hanging-piece` with lost piece bishop on a1 and best move `Bd4+`. <!-- AN-12 -->
3. 12.Ce2 SHALL be an opponent mistake that gave the player a rook (on a1). <!-- AN-13 -->

### P1: Selection and texts ⭐ MVP

1. WHEN there are more than 5 mistakes THEN `selectKeyMoments` SHALL keep the 5 with the largest loss and return them in chronological order. <!-- AN-14 -->
2. `findingText(verdict)` SHALL return: mistake → "deixou {o/a} {peça} em {casa} ser capturad{o/a}"; opponent mistake → "o adversário deixou {o/a} {peça} em {casa} ser capturad{o/a}"; strength → "ganhou {o/a} {peça} em {casa}"; with the generic "perdeu material" / "ganhou material" when no piece is identified. <!-- AN-15 -->
3. `groupPatterns(keyMoments)` SHALL group key moments by mistake type with counts, ordered by count then first occurrence. <!-- AN-16 -->
4. `selectStrengths` SHALL keep up to 3 strengths with the largest gain, in chronological order. <!-- AN-17 -->

### P1: Boundary ⭐ MVP

1. All of the above SHALL live in `src/domains/analysis/model/` with no React, XState, Worker or network imports; chess rules come only through the `game` domain entry point. <!-- AN-18 -->

---

## Edge Cases

- WHEN the PV is empty (mate or stalemate) THEN the line SHALL be just the first move. <!-- AN-19 -->
- WHEN a PV move is illegal in the replayed line (stale PV) THEN the line SHALL stop before it. <!-- AN-20 -->

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | AN-19, AN-20. |
| Failure / partial-failure states | AN-20 (stale PV); partial analyses are F4b. |
| Idempotency / retry | N/A: pure functions. |
| Auth / rate limits | N/A. |
| Concurrency / ordering | AN-11, AN-14: chronological ordering. |
| Data lifecycle | N/A. |
| Observability | N/A. |
| External-dependency failure | N/A: engine output is input. |
| State-transition integrity | N/A: no state. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AN-01 | Material | Tasks | Implementing |
| AN-02 | Material | Tasks | Implementing |
| AN-03 | Classify | Tasks | Implementing |
| AN-04 | Classify | Tasks | Implementing |
| AN-05 | Classify | Tasks | Implementing |
| AN-06 | Classify | Tasks | Implementing |
| AN-07 | Classify | Tasks | Implementing |
| AN-08 | Types | Tasks | Implementing |
| AN-09 | Types | Tasks | Implementing |
| AN-10 | Types | Tasks | Implementing |
| AN-11 | Reference | Tasks | Implementing |
| AN-12 | Reference | Tasks | Implementing |
| AN-13 | Reference | Tasks | Implementing |
| AN-14 | Selection | Tasks | Implementing |
| AN-15 | Selection | Tasks | Implementing |
| AN-16 | Selection | Tasks | Implementing |
| AN-17 | Selection | Tasks | Implementing |
| AN-18 | Boundary | Tasks | Implementing |
| AN-19 | Edge | Tasks | Implementing |
| AN-20 | Edge | Tasks | Implementing |

**Coverage:** 20 total, 20 mapped to tasks (T1–T3), 0 unmapped

---

## Success Criteria

- [ ] AN-11..13 pass on the depth-18 engine fixture `analysis/fixtures/reference-game.evaluations.json`.
