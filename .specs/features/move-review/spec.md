# F9 · Revisão lance a lance (estilo Game Review do Chess.com) Specification

## Problem Statement

The app only highlights moves that lose 2+ points of material (D3). It does not review each move in its position: how good it was, what the player let pass, what the best move was and why, and what the move left undefended. Players compare it with Chess.com's Game Review and find it is not a coach yet. The engine already evaluates every position (score, best move, principal variation); the review layer on top of it is missing.

## Goals

- [ ] Every move of the game (both sides) gets a classification from the engine, on the Chess.com scale.
- [ ] Selecting any move on the Result screen shows a coach panel: classification, what was missed, the best move with its line and why, what the move left undefended, and an AI-written explanation fetched on demand.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Brilhante / Ótimo lance / Livro (opening book) / Forçado categories | Need sacrifice detection and an opening book; follow-up |
| Accuracy % per player | Desirable; follow-up once the classification is validated |
| Pre-generating AI texts for all moves | User chose on-demand only (2026-11-24) |
| Changing key moments (D3) and training | They stay material-based; the review is an additional layer |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Classification scale | Melhor, Excelente, Bom, Imprecisão, Erro, Capivarada, Perdeu a chance | User choice (2026-11-24): Chess.com scale | y |
| Classification metric | Win chance of the mover (Lichess formula, 0–100) before vs after the move: loss = win(before) − win(after). Melhor: played = engine best move or loss ≤ 0; Excelente < 2; Bom < 5; Imprecisão < 10; Erro < 20; Capivarada ≥ 20 (Chess.com expected-points bands 0.02/0.05/0.10/0.20) | Published Chess.com bands; win% is the open approximation of expected points | n |
| Material floor (found while testing the reference game) | A move that loses 2+ points of material by the key-moment rule (D3) is at least Erro; 5+ points is Capivarada; "Perdeu a chance" is kept | With a big advantage, win chance barely moves when a piece is lost (22...Ta7: 98.3 → 96.6 = "Excelente"); a coach must never call a lost piece excellent, and the review must agree with the key moments | n |
| Perdeu a chance | The opponent's previous move was an Erro or Capivarada (loss ≥ 10) and the player's move gives back ≥ 10 of win chance | Chess.com "Miss" = failing to punish the opponent's error | n |
| Engine time | ~500 ms per position, minimum depth 12 (≈ 75 s for 72 moves) | User choice (2026-11-24); changes D1 and the ≤ 30 s metric | y |
| AI text | On demand only: requested when a move is selected, cached for the session | User choice (2026-11-24) | y |
| Where | Inside the Result screen: icons in the move list, coach panel and evaluation bar next to the board | User choice (2026-11-24) | y |
| Deterministic facts per move | Best move + engine line (≤ 6 plies); "deixou descoberto" = player's pieces attacked and undefended (or attacked by a cheaper piece) after the move; "deixou passar" = material the best line wins that the played line doesn't, and pieces already en prise before the move that stay en prise; "por quê" = check, mate in N, material gained by the best line, or saving a piece en prise | Facts computable from the rules engine and the PV; the AI only words them | n |
| No mockup for the coach panel | Built with the existing step_03 tokens (cards, tags, colors) | No design file exists for this panel | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Classify every move ⭐ MVP

1. WHEN the evaluation ends THEN every ply SHALL get a classification from the win-chance loss of its mover, on the scale above. <!-- MR-01 -->
2. The played move equal to the engine's best move SHALL be "Melhor". <!-- MR-02 -->
3. Mate scores SHALL map to win chance 100 (mover mates) or 0 (mover gets mated). <!-- MR-03 -->
4. "Perdeu a chance" SHALL replace the classification when the opponent's previous move lost ≥ 10 and this move loses ≥ 10. <!-- MR-04 -->
5. A move that loses 2+ points of material by the key-moment rule (D3, player or opponent) SHALL be classified at least Erro, and Capivarada from 5 points, unless it is "Perdeu a chance". <!-- MR-20 -->

### P1: Facts per move ⭐ MVP

1. Each ply SHALL carry: best move (Portuguese SAN with number), engine line (≤ 6 plies), whether the played move was best. <!-- MR-05 -->
2. Each ply SHALL list the mover's pieces left undefended after the move (attacked and not defended, or attacked by a cheaper piece). <!-- MR-06 -->
3. Each ply SHALL say what it let pass: material the best line wins over the played line (≥ 1 point), and pieces en prise before the move that are still en prise after it. <!-- MR-07 -->
4. Each ply SHALL say why the best move is best, from: gives check, mates in N, wins N points of material, saves a piece en prise. <!-- MR-08 -->

### P1: Coach panel on the Result screen ⭐ MVP

1. The move list SHALL show each move's classification as an icon with an accessible name. <!-- MR-09 -->
2. Selecting a move (list, arrows, chart, key moment) SHALL show the coach panel for the move that led to the board position: classification tag, "Melhor era …" (unless it was the best move), the facts of MR-06..MR-08, and "Ver a linha do motor". <!-- MR-10 -->
3. An evaluation bar next to the board SHALL show the engine evaluation of the shown position from White's side (clamped at ±10, mate shown as "M N"). <!-- MR-11 -->
4. At the initial position the panel SHALL invite the player to pick a move. <!-- MR-12 -->

### P1: AI explanation on demand ⭐ MVP

1. WHEN a move is selected for the first time THEN the app SHALL request its explanation from `POST /api/move-explanations` with a closed move contract (facts of MR-01..MR-08, level, player color) and show "Pensando…". <!-- MR-13 -->
2. The text SHALL be verified like the other AI texts (only moves, squares and numbers of the contract); one retry, then an error with "Tentar de novo". <!-- MR-14 -->
3. Explanations SHALL be cached per ply for the session; selecting the move again SHALL not call the API. <!-- MR-15 -->
4. IF the AI is unavailable THEN the panel SHALL keep the engine facts and show "Explicação indisponível" with "Tentar de novo". <!-- MR-16 -->

### P1: Engine depth ⭐ MVP

1. The evaluation SHALL search about 500 ms per position with minimum depth 12, and the time estimate on screen 1 SHALL follow it. <!-- MR-17 -->

---

## Edge Cases

- WHEN a move ends the game (mate or stalemate) THEN its after-evaluation SHALL come from the result (mate = win 100 for the mover; stalemate = 50). <!-- MR-18 -->
- WHEN the engine has no best move (no legal moves) THEN the facts SHALL omit the best move. <!-- MR-19 -->

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | Move contract validated by Pydantic; ply must exist (422). |
| Failure / partial-failure states | MR-14, MR-16. |
| Idempotency / retry | MR-15 cache; retry button re-requests. |
| Auth / rate limits | N/A (stateless backend). |
| Concurrency / ordering | One request per ply; switching moves while loading keeps each result in its own cache slot. |
| Data lifecycle | Session memory only (D2). |
| Observability | Rejected texts log their violations (existing). |
| External-dependency failure | MR-16. |
| State-transition integrity | Coach region states tested in the review machine. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| MR-01 | Classify | Design | Pending |
| MR-02 | Classify | Design | Pending |
| MR-03 | Classify | Design | Pending |
| MR-04 | Classify | Design | Pending |
| MR-05 | Facts | Design | Pending |
| MR-06 | Facts | Design | Pending |
| MR-07 | Facts | Design | Pending |
| MR-08 | Facts | Design | Pending |
| MR-09 | Coach panel | Design | Pending |
| MR-10 | Coach panel | Design | Pending |
| MR-11 | Coach panel | Design | Pending |
| MR-12 | Coach panel | Design | Pending |
| MR-13 | AI on demand | Design | Pending |
| MR-14 | AI on demand | Design | Pending |
| MR-15 | AI on demand | Design | Pending |
| MR-16 | AI on demand | Design | Pending |
| MR-17 | Engine | Design | Pending |
| MR-18 | Edge | Design | Pending |
| MR-19 | Edge | Design | Pending |
| MR-20 | Classify | Design | Pending |

**Coverage:** 20 total, 0 mapped to tasks, 20 unmapped ⚠️ (mapped in Tasks)

---

## Success Criteria

- [ ] In the reference game, 22...Ta7 is classified Erro with "Melhor era 22...Bd4+", the panel says the bishop on a1 was left undefended, and the AI text (fake provider in e2e) appears on demand.
