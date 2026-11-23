# F4b · Analysis pipeline and screen 2 "Analisando" Specification

## Problem Statement

After "Analisar partida", the app must evaluate every position with the loaded engine, show the five stages with real progress, list findings as they are confirmed, call the AI layer at the end with the closed contract, and hand everything to the Result step — or cancel back to the Colar screen (step_02 PRD). The pure classification (F4a), the engine (F2) and the API (F6) exist; the pipeline and the screen do not.

## Goals

- [ ] The reference game goes from "Analisar partida" to the Result step in the real browser, with the five key moments found and the AI texts (fake provider in e2e).
- [ ] Cancelling at any time stops the engine search and returns to Colar with text and choices intact.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| The Result screen content | F7 (F4b shows a minimal placeholder with the key moments) |
| Endgame tablebase computation | F5; stage 4 shows "não necessária" until then |
| "Ver resultado parcial" after 60 s (A-10) and "Analisar com profundidade menor" | Desirable items; logged as follow-ups |
| Metrics (section 8) | No analytics backend in the MVP |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| "Lance N de M" | Full moves: N = move number of the last evaluated position shown on the board (the same move as the label next to it), M = total moves (72 for the reference game) | step_02 mockup pairs "Lance 44 de 72" with "44...Texe3+" | y (design) |
| Progress | `evaluated positions ÷ (plies + 1)`, integer percent; remaining time = remaining positions × average time per evaluated position, shown as "~N s restantes" | A-03 | y (PRD) |
| Stages 1–2 | Shown as completed with the counts already known ("Extrai os N lances…", "Reconstrói e valida cada posição…"), **without** the per-stage time of the mockup ("0,2 s") | Parsing/replay happened on the Colar screen (C-03); re-timing it here would show a number unrelated to this screen. Deliberate narrowing of step_02 §2 | n |
| Contract without positions/scores | The contract carries moves, verdicts and the material timeline but not FENs or engine scores | step_03 §5: the AI must not cite evaluations; material facts are enough for the texts. Deliberate narrowing of general.md 7.2 | n |
| Stage 4 | "não necessária" | Tablebase arrives in F5 | n |
| Findings | Added as soon as both positions around a ply are evaluated; tags "Erro" (player mistake), "Adversário" (opponent mistake); max 6 visible, chronological; text from `findingText`, with "defensor saiu" phrased "tirou a proteção de {peça}" | step_02 A-05 and mockup | n |
| Cancel | Stops the pipeline actor; the engine receives `stop`; pending evaluations reject; app returns to `gameInput` with the saved draft | A-09 | y (PRD) |
| Engine failure | Stage 3 failed with "Tentar de novo" (restarts the evaluation) | step_02 states | y (PRD) |
| AI call | `POST /api/explanations` with the contract built from the analysis; on any error the Result opens without AI texts and with `aiFailed: true` | A-07, step_02 "Falha na IA" | y (PRD) |
| Contract fields | `advantage_started_at` = first ply whose material balance for the player is ≥ +2; `outcome_for_player` from result + color | general.md 7.2 / step_03 R-01 | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Run the pipeline ⭐ MVP

1. WHEN the analysis starts THEN stages 1 and 2 SHALL be completed immediately and stage 3 SHALL be in progress. <!-- AS-01 -->
2. WHILE stage 3 runs the pipeline SHALL evaluate the positions one by one (plies + 1 positions) with the ready engine and SHALL update the progress after each one. <!-- AS-02 -->
3. WHEN a ply's two surrounding positions are evaluated THEN its verdict SHALL be classified and, if it is a player mistake or an opponent mistake, a finding SHALL be added immediately. <!-- AS-03 -->
4. WHEN all positions are evaluated THEN stage 3 SHALL be completed, stage 4 SHALL show "não necessária" and stage 5 SHALL start with the contract. <!-- AS-04 -->
5. WHEN the AI answers THEN the app SHALL go to the Result step automatically with the analysis and the explanation. <!-- AS-05 -->
6. IF the AI call fails THEN the app SHALL still go to the Result step with the analysis and `aiFailed: true`. <!-- AS-06 -->
7. IF an evaluation fails THEN stage 3 SHALL be failed with a "Tentar de novo" button that restarts the evaluation. <!-- AS-07 -->
8. WHEN "Cancelar análise" is clicked THEN the engine SHALL receive `stop`, the pipeline SHALL stop and the app SHALL return to Colar with the same text and choices. <!-- AS-08 -->

### P1: Screen ⭐ MVP

1. The screen SHALL show the step indicator at step 2, the title "Analisando sua partida…", and the five stages in order with their state (aguardando, em andamento, concluída, falhou or não necessária). <!-- AS-09 -->
2. Stage 3 SHALL show "lance N de M · ~S s restantes" and a `role="progressbar"` with `aria-valuenow` = percent. <!-- AS-10 -->
3. The live board SHALL show the position being evaluated, from the player's side, with the last move highlighted, and the caption "Lance N de M" plus the last move label. <!-- AS-11 -->
4. "Já encontrado" SHALL list the findings with their tag and text, at most 6 visible, chronological. <!-- AS-12 -->
5. Stage changes SHALL be announced with `aria-live="polite"` without announcing every position. <!-- AS-13 -->

### P1: Contract ⭐ MVP

1. `buildContract(request, analysis)` SHALL fill every field of the API contract from the engines' data (moves in Portuguese notation, key moments with type, lost piece and best move, strengths, opponent mistakes, patterns, material timeline, advantage start, outcome). <!-- AS-14 -->
2. For the reference game as Black, the contract SHALL have 5 key moments (22...Ta7, 27...Tb7, 41...Ta1, 43...Te6, 56...Ta8), `outcome_for_player` "win" and `advantage_started_at` 12...Bxa1. <!-- AS-15 -->

---

## Edge Cases

- WHEN the game has no key moments THEN the pipeline SHALL still reach the Result step. <!-- AS-16 -->

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | Request is already validated by Colar (F3). |
| Failure / partial-failure states | AS-06, AS-07. |
| Idempotency / retry | AS-07 restarts evaluation from the first position. |
| Auth / rate limits | N/A. |
| Concurrency / ordering | AS-02: one position at a time; AS-08 stops the in-flight search. |
| Data lifecycle | N/A: analysis lives only in memory (D2). |
| Observability | N/A in MVP. |
| External-dependency failure | AS-06 (API), AS-07 (engine). |
| State-transition integrity | AS-01..AS-08. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AS-01 | Pipeline | Tasks | Implementing |
| AS-02 | Pipeline | Tasks | Implementing |
| AS-03 | Pipeline | Tasks | Implementing |
| AS-04 | Pipeline | Tasks | Implementing |
| AS-05 | Pipeline | Tasks | Implementing |
| AS-06 | Pipeline | Tasks | Implementing |
| AS-07 | Pipeline | Tasks | Implementing |
| AS-08 | Pipeline | Tasks | Implementing |
| AS-09 | Screen | Tasks | Implementing |
| AS-10 | Screen | Tasks | Implementing |
| AS-11 | Screen | Tasks | Implementing |
| AS-12 | Screen | Tasks | Implementing |
| AS-13 | Screen | Tasks | Implementing |
| AS-14 | Contract | Tasks | Implementing |
| AS-15 | Contract | Tasks | Implementing |
| AS-16 | Edge | Tasks | Implementing |

**Coverage:** 16 total, 16 mapped to tasks (T1–T5), 0 unmapped

---

## Success Criteria

- [ ] Playwright runs the reference game end to end with the real engine and the fake AI provider.
