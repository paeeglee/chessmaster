# F5 · Endgame tablebase (engine 4) Specification

## Problem Statement

general.md lists engine 4, "Tabela de finais": the exact result and distance to mate of positions with few pieces, computed locally by retroanalysis, starting with king and queen versus king (KQK) and king and rook versus king (KRK). Today stage 4 always shows "não necessária", the Result footer says the tablebase is not available, and the 4th stat card of the mockup ("7 lances para o mate de torre no final") is missing.

## Goals

- [ ] Exact result and distance to mate for every legal KQK and KRK position, computed in the browser.
- [ ] When a game reaches one of these endings, stage 4 runs and the Result screen shows how many moves the player took to mate versus the optimal number.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Endings with pawns or more pieces (KPK, KBNK, …) | general.md: "começa com" KQK and KRK |
| Sending tablebase facts to the AI contract | Needs a backend schema change; follow-up |
| Persisting the generated table | D2: nothing is saved; generation takes about a second |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Where it runs | Pure TypeScript generator in `evaluation/model/tablebase`, run in a Web Worker only when needed | Keeps the UI responsive; D1 (no server engines) | n |
| Distance metric | Depth to mate (DTM) in plies, reported in moves of the strong side (`ceil(plies / 2)`) | "distância até o mate" in general.md | n |
| Which position is probed | The first position in the game where the material is exactly K+Q vs K or K+R vs K | That is where the ending starts | n |
| Stat card | Only when the player is the strong side and the game ended in checkmate: value "{N} lances", label "para o mate de {dama/torre} no final"; the optimal number is shown in the card's caption "o mais rápido era {M}" | Mockup step_03 card 4 | n |
| Footer | "✓ Tabela de finais" when used; "– Tabela de finais (não necessária)" otherwise | step_03 §6 status per engine | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Tablebase ⭐ MVP

1. The generator SHALL produce, for KQK and KRK, the result (win for the strong side, draw) and DTM of every legal position with either side to move. <!-- TB-01 -->
2. Checkmates SHALL have DTM 0; stalemates and positions where the lone king can capture the undefended piece SHALL be draws. <!-- TB-02 -->
3. Probing a FEN with KQK or KRK material (either color as the strong side) SHALL return the result and DTM; other material SHALL return null. <!-- TB-03 -->

### P1: Analysis stage 4 ⭐ MVP

1. WHEN the analysed game never reaches KQK or KRK THEN no table SHALL be generated. (Until 2026-11-24 stage 4 also showed "não necessária"; since then the tablebase has no stage on the Analisando screen, by product decision.) <!-- TB-04 -->
2. WHEN it does THEN stage 4 SHALL run after the evaluation, probe the first such position and store `endgame` in the result (kind, ply, strong side, optimal moves, moves actually played until mate or null). <!-- TB-05 -->
3. IF the tablebase fails THEN the analysis SHALL continue without `endgame` and stage 4 SHALL show "falhou". <!-- TB-06 -->

### P1: Result screen ⭐ MVP

1. WHEN `endgame` exists, the player is the strong side and the game ended in mate THEN the 4th stat card SHALL show "{N} lances" / "para o mate de {dama|torre} no final" and "o mais rápido era {M}". <!-- TB-07 -->
2. The footer SHALL show "✓ Tabela de finais" when the tablebase was used, "✕ Tabela de finais: falhou" when it failed (step_03 R-12) and "– Tabela de finais (não necessária)" otherwise. <!-- TB-08 -->

---

## Edge Cases

- Positions with the side not to move in check, adjacent kings or overlapping pieces are illegal and are not stored. <!-- TB-09 -->

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | TB-03, TB-09. |
| Failure / partial-failure states | TB-06. |
| Idempotency / retry | Generation is deterministic; the worker caches tables per session. |
| Auth / rate limits | N/A. |
| Concurrency / ordering | Stage 4 runs after stage 3, one table at a time. |
| Data lifecycle | In memory only (D2). |
| Observability | N/A. |
| External-dependency failure | TB-06. |
| State-transition integrity | TB-04..TB-06. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TB-01 | Tablebase | Tasks | Done |
| TB-02 | Tablebase | Tasks | Done |
| TB-03 | Tablebase | Tasks | Done |
| TB-04 | Stage 4 | Tasks | Done |
| TB-05 | Stage 4 | Tasks | Done |
| TB-06 | Stage 4 | Tasks | Done |
| TB-07 | Result | Tasks | Done |
| TB-08 | Result | Tasks | Done |
| TB-09 | Edge | Tasks | Done |

**Coverage:** 9 total, 9 mapped to tasks (T1–T3), 0 unmapped

---

## Success Criteria

- [ ] The longest wins match the published values: KQK mate in 10 moves, KRK mate in 16 moves (strong side to move).
