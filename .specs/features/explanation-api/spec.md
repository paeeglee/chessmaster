# F6 · AI explanation layer (engine 5) Specification

## Problem Statement

The Result and Training screens need plain-language Portuguese texts written from the engines' facts, never inventing numbers or moves (general.md 7.2, D4). The backend has only a health route. F6 builds the closed contract, the swappable provider layer (OpenAI GPT-5.1 by default), versioned prompts, the automatic verification of cited moves/squares/numbers, and the HTTP routes.

## Goals

- [ ] `POST /api/explanations` returns the explanation JSON for a game contract, verified against it.
- [ ] `POST /api/questions` answers free questions about the analysed game, refusing off-topic ones politely.
- [ ] Provider and model come from configuration; tests never call a real provider.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Training hints and attempt feedback texts | F8 adds its own route on the same layer |
| Calling the API from the frontend | F4b (stage 5) and F7 |
| Providers other than OpenAI and the fake one | D4 only requires swappability; adding one is a new adapter |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| JSON naming | snake_case fields | Pydantic default; TS types are generated | n |
| Contract content | level, priorities, player_color, result, termination, outcome_for_player, total_moves, moves (ply, label, san_pt), material_timeline, advantage_started_at, key_moments (ply, move_label, mistake_type, lost_piece, best_move, loss), opponent_mistakes, strengths, patterns | general.md 7.2 plus what step_03 texts need | n |
| Response schema | verdict, patterns_sentence, key_moments[{ply, summary, explanation}], strengths[{ply, text}], next_game_habit | step_03 section 5 | n |
| Verification | Every move label/SAN, square (a1–h8) and integer cited must exist in the contract's allowed sets; verdict ≤ 30 words; key_moments plies equal the contract's; on failure retry once with the violations listed, then answer 502 `explanation_unverified` | 7.2 "bloqueia ou corrige"; blocking + one retry keeps it simple and safe | n |
| Provider failure | 503 `ai_unavailable` | step_02: Result opens without AI texts and offers retry | n |
| Fake provider | `AI_PROVIDER=fake` returns deterministic template texts built only from the contract | Lets the whole app run and be tested without an API key | n |
| Question scope | The provider returns `in_scope`; off-topic → answer "Só consigo falar sobre esta partida. Que tal perguntar …" with suggestions | R-11 | n |
| Coverage | `domain/` and `application/` of `explanation` ≥ 90% checked in `make test-api` | quality.md | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Explain a game ⭐ MVP

1. WHEN `POST /api/explanations` receives a valid contract THEN it SHALL return 200 with `verdict`, `patterns_sentence`, one `key_moments` item per contract key moment (same plies, same order), `strengths` for the contract strengths and `next_game_habit`. <!-- EXP-01 -->
2. IF the body does not match the contract THEN it SHALL return 422. <!-- EXP-02 -->
3. The prompt SHALL be loaded from a versioned file in `domains/explanation/prompts/` and SHALL include the level tone rules and the contract JSON. <!-- EXP-03 -->
4. IF the provider raises THEN the route SHALL return 503 with `{"detail": "ai_unavailable"}`. <!-- EXP-04 -->

### P1: Verify the texts ⭐ MVP

1. WHEN a text cites a move (e.g. `22...Ta7`, `Bd4+`) that is not in the contract THEN verification SHALL report it. <!-- EXP-05 -->
2. WHEN a text cites a square not present in the contract's moves or pieces THEN verification SHALL report it. <!-- EXP-06 -->
3. WHEN a text cites an integer not in the contract's allowed numbers (move numbers, plies, counts, losses, gains, material values) THEN verification SHALL report it. <!-- EXP-07 -->
4. IF the verdict has more than 30 words or the key-moment plies differ from the contract THEN verification SHALL report it. <!-- EXP-08 -->
5. WHEN the first answer fails verification THEN the use case SHALL call the provider once more with the violations; IF the second also fails THEN the route SHALL return 502 `{"detail": "explanation_unverified"}`. <!-- EXP-09 -->

### P1: Ask the AI ⭐ MVP

1. WHEN `POST /api/questions` receives the contract and a question (1–500 chars) THEN it SHALL return `{answer, in_scope}` verified like the explanation. <!-- EXP-10 -->
2. WHEN the provider says the question is off-topic THEN the answer SHALL start with "Só consigo falar sobre esta partida." <!-- EXP-11 -->

### P1: Swappable provider ⭐ MVP

1. `AI_PROVIDER=openai` SHALL use the LangChain OpenAI adapter with `AI_MODEL` and `OPENAI_API_KEY`; `AI_PROVIDER=fake` SHALL use the fake adapter; any other value SHALL fail at startup of the route with a clear error. <!-- EXP-12 -->
2. IF `AI_PROVIDER=openai` and the key is empty THEN the routes SHALL return 503 `ai_unavailable` (the health route keeps working). <!-- EXP-13 -->
3. The `domain/` package SHALL NOT import FastAPI or LangChain, and `application/` SHALL depend only on `domain/` and its own ports. <!-- EXP-14 -->

---

## Edge Cases

- WHEN the contract has no key moments THEN `key_moments` SHALL be empty and the verdict positive (fake provider) and verification SHALL accept it. <!-- EXP-15 -->

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | EXP-02, EXP-10 (question length). |
| Failure / partial-failure states | EXP-04, EXP-09, EXP-13. |
| Idempotency / retry | EXP-09 single retry. |
| Auth boundaries & rate limits | N/A in the MVP (no accounts); provider rate limits surface as 503. |
| Concurrency / ordering | N/A: stateless requests. |
| Data lifecycle / expiry | N/A: nothing stored (privacy). |
| Observability | Log provider failures and verification violations (no game content). |
| External-dependency failure | EXP-04, EXP-13. |
| State-transition integrity | N/A. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| EXP-01 | Explain | Design | Pending |
| EXP-02 | Explain | Design | Pending |
| EXP-03 | Explain | Design | Pending |
| EXP-04 | Explain | Design | Pending |
| EXP-05 | Verify | Design | Pending |
| EXP-06 | Verify | Design | Pending |
| EXP-07 | Verify | Design | Pending |
| EXP-08 | Verify | Design | Pending |
| EXP-09 | Verify | Design | Pending |
| EXP-10 | Ask | Design | Pending |
| EXP-11 | Ask | Design | Pending |
| EXP-12 | Provider | Design | Pending |
| EXP-13 | Provider | Design | Pending |
| EXP-14 | Provider | Design | Pending |
| EXP-15 | Edge | Design | Pending |

**Coverage:** 15 total, 0 mapped to tasks, 15 unmapped ⚠️ (mapped in Tasks)

---

## Success Criteria

- [ ] With `AI_PROVIDER=fake`, the reference-game contract gets a verified explanation through the API.
