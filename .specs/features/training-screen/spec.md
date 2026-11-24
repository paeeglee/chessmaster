# F8 · Screen 4 "Treinar momento-chave" Specification

## Problem Statement

Each key moment must become a "find the move" exercise on the real position, where the player tries moves, gets the engine's refutation, asks for hints and finally finds or sees the solution (step_04 PRD). The analysis result (F4) and the Result screen's "Treinar" actions (F7) exist; the exercise does not.

## Goals

- [ ] For moment 1 of the reference game, 22...Te6 is refuted by 23.Txa1 ("ainda perde o bispo") and 22...Bd4+ and 22...Bb2 are accepted (step_04 ACs).
- [ ] The player can go through all key moments and gets a summary ("N de M de primeira").

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Extra exercise per repeated pattern (T-11) | Desirable; needs a second position of the same type, often absent |
| AI-written hints and feedback | step_04 §5 asks for AI texts; the MVP uses engine-backed templates first (no extra API route), logged as a follow-up |
| Drag and drop | Click-to-move and keyboard cover T-02 and §8; drag is a later enhancement |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Accepting an attempt (T-03) | The attempt is evaluated by the engine and classified with the key-moment rule (D3): accepted when it is **not** a mistake (it does not lose ≥ 2 points versus the best move's line) | Open question of step_04 resolved with the PRD proposal "não perder material segundo o motor" | n |
| Refutation (T-04) | The opponent's reply is the first move of the engine PV after the attempt; the board shows it for 1.2 s, then returns to the start position | step_04 states | n |
| Feedback texts | Templates from the engine facts: wrong → "{lance} ainda perde {o bispo}" + "Depois de {resposta}, {o bispo} some do tabuleiro."; game move → "Esse foi o lance jogado na partida." | No AI route for training in the MVP | n |
| Hints (T-06) | 1 pattern: "Olhe a casa {casa}: quem ataca {a peça}?" (hanging piece) / "Que peça protegia {a peça}?" (defender moved) / "Procure o lance que não entrega material." (other); 2 piece: "{A peça} pode sair dali ou ser protegida."; 3 solution: green destination + "A solução é {melhor lance}." | Order pattern → piece → solution (step_04 §5) | n |
| Success (T-07) | Shows the engine continuation after the correct move (up to 4 plies) and the principle: hanging piece "Antes de cada lance, confira quais peças suas estão atacadas."; defender moved "Antes de mover uma peça, veja se ela protege outra."; other "Antes de cada lance, pergunte o que o adversário ganha." | step_04 T-07 | n |
| Outcome per moment (T-10) | `first-try` (correct on attempt 1, no hint), `with-hint` (correct after a hint or a wrong attempt), `saw-solution` | step_04 T-10 | y (PRD) |
| Interaction | Click a piece of the side to move to select it (legal destinations highlighted), then a destination; keyboard: Tab to a square, Enter on origin and destination; promotions promote to a queen | step_04 T-02, §8 | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Load the exercise ⭐ MVP

1. WHEN training starts on a key moment THEN the board SHALL show the position before the mistake, from the player's side, with the player to move, and "Momento N de M" with progress dots. <!-- TR-01 -->
2. The statement SHALL show "Encontre o lance · tipo: {tipo}", a question that does not reveal the answer, and "Posição real da sua partida, antes do lance N. Na partida você jogou {lance}." <!-- TR-02 -->

### P1: Attempt a move ⭐ MVP

1. WHEN a piece of the side to move is selected THEN its legal destinations SHALL be highlighted; illegal targets SHALL be ignored. <!-- TR-03 -->
2. WHEN a move is played THEN it SHALL be evaluated by the engine and accepted if it is not a mistake by the D3 rule. <!-- TR-04 -->
3. IF the move is not accepted THEN the screen SHALL show "Tentativa N", "{lance} ainda perde {peça}", the engine reply on the board, and then return to the start position, without revealing the solution. <!-- TR-05 -->
4. IF the move repeats the game move THEN the feedback SHALL add "Esse foi o lance jogado na partida." <!-- TR-06 -->
5. WHEN the move is accepted THEN the screen SHALL confirm it, show the engine continuation (up to 4 plies) and the principle sentence, and show "Próximo momento". <!-- TR-07 -->

### P1: Hints and solution ⭐ MVP

1. "Dica" / "Outra dica" SHALL reveal hint levels in order pattern → piece; "Mostrar solução" SHALL show the solution with a green destination and "Próximo momento". <!-- TR-08 -->
2. "Desfazer" SHALL return to the start position keeping the attempt history. <!-- TR-09 -->

### P1: Progress ⭐ MVP

1. Each moment SHALL be recorded as first-try, with-hint or saw-solution. <!-- TR-10 -->
2. WHEN the last moment is done THEN the screen SHALL show "N de M de primeira" and "Voltar ao resultado", where M is the number of moments trained in this session (from the moment the training opened on to the last one) and N how many of them were solved on the first attempt without hints. <!-- TR-11 -->
3. "← Voltar ao resultado" SHALL return to the Result screen at any time. <!-- TR-12 -->
4. Feedback SHALL be announced with `role="status"`. <!-- TR-13 -->

---

## Edge Cases

- IF the engine fails to evaluate an attempt THEN the feedback SHALL say "Não foi possível conferir o lance. Tente de novo." and the position SHALL reset. <!-- TR-14 -->

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | TR-03: only legal moves. |
| Failure / partial-failure states | TR-14. |
| Idempotency / retry | TR-09. |
| Auth / rate limits | N/A. |
| Concurrency / ordering | Attempts are evaluated one at a time; the board is locked while checking. |
| Data lifecycle | N/A: in memory only (D2). |
| Observability | N/A in MVP. |
| External-dependency failure | TR-14 (engine). |
| State-transition integrity | TR-04..TR-11. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TR-01 | Load | Tasks | Done |
| TR-02 | Load | Tasks | Done |
| TR-03 | Attempt | Tasks | Done |
| TR-04 | Attempt | Tasks | Done |
| TR-05 | Attempt | Tasks | Done |
| TR-06 | Attempt | Tasks | Done |
| TR-07 | Attempt | Tasks | Done |
| TR-08 | Hints | Tasks | Done |
| TR-09 | Hints | Tasks | Done |
| TR-10 | Progress | Tasks | Done |
| TR-11 | Progress | Tasks | Done |
| TR-12 | Progress | Tasks | Done |
| TR-13 | Progress | Tasks | Done |
| TR-14 | Edge | Tasks | Done |

**Coverage:** 14 total, 14 mapped to tasks (T1–T4), 0 unmapped

---

## Success Criteria

- [ ] step_04 ACs pass in Playwright with the real engine.
