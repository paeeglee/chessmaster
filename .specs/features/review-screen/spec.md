# F7 · Screen 3 "Resultado" Specification

## Problem Statement

After the analysis, the player must understand in seconds what happened, explore the game on the board, chart and move list, and act: train a key moment or ask the AI (step_03 PRD). The analysis result (F4b) and the AI texts (F6) exist; the screen does not.

## Goals

- [ ] The reference game result shows the verdict, 5 key moments (22, 27, 41, 43, 56), synchronized board/chart/move list, strengths, habit and "Pergunte à IA".
- [ ] Without AI texts (AI failure) the engines' data still renders with "A explicação não pôde ser gerada" and "Tentar de novo".

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| The training screen | F8 (F7 sends the "train" event; F8 renders it) |
| "Salvar em Minhas partidas" | Out of the MVP (D2) |
| "Material \| Avaliação" chart toggle (R-06 desirable part) | Desirable; material chart only |
| "Entendi por que errei" metric question | No analytics backend in the MVP |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Stat cards | (1) number of key moments, "momentos em que você perdeu material"; (2) best move = strength with the largest gain, "seu melhor lance"; (3) max material advantage "+N", "sua maior vantagem (pontos de material)"; (4) "N lances" "para o mate no final" only when the game ends in checkmate delivered by the player and a tablebase/engine mate distance exists, else hidden | Mockup values; R-01 only facts | n |
| Result tag | "Vitória · 0-1" / "Derrota · 1-0" (neutral) / "Empate · ½-½" / "Sem resultado" | step_03 states | y (PRD) |
| Context line | "Você: pretas · 72 lances · xeque-mate" | Mockup | y (design) |
| Move list annotations | `??` loss ≥ 5, `?` key moment or loss ≥ 2, `!` strength | step_03 R-02/§3 "anotados (?, ??, !)" with D3 threshold | n |
| Board initial position | Position before the first key moment (R-04); with none, the final position | R-04 | y (PRD) |
| Board marks | Lost piece square red ("peça atacada"), best move destination green ("lance sugerido (X)") on key-moment positions | Mockup legend | y (design) |
| "Ver a linha no tabuleiro" | Plays the engine PV from the position after the key moment, up to 6 plies, one every 600 ms (no animation with reduced motion) | R-09 | n |
| Ask the AI | 3 suggestion chips built from the contract (best move, a key moment, patterns); answers appended below; uses `/api/questions` | R-11 | n |
| "Analisar outra partida" | Asks for confirmation with an in-page dialog (no `window.confirm`) before discarding | R-13 | n |
| Short game (< 15 moves) | Chart hidden | step_03 states | y (PRD) |
| More than 5 candidates | "ver todos os lances anotados" link scrolls to the move list | step_03 states | y (PRD) |
| Strength gain (refines F4a AN-05) | A strength's gain is measured from the position before the opponent's previous move, so recapturing in a trade (e.g. 16...Txd8 after 16.Dxd8) is not a gain | R-10: only real gains; found with the real engine data | n |
| AI unavailable | Verdict band shows the result tag and context line; verdict replaced by "A explicação não pôde ser gerada." + "Tentar de novo" (re-calls `/api/explanations`); key moments show template texts from the engines; habit and "Pergunte à IA" hidden | step_03 state "IA indisponível" | y (PRD) |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Summary ⭐ MVP

1. The summary band SHALL show the result tag, the context line, the AI verdict and the patterns sentence. <!-- RV-01 -->
2. The stat cards SHALL show the number of key moments, the best move (largest strength) and the largest material advantage, computed from the engines. <!-- RV-02 -->
3. IF the AI failed THEN the band SHALL show "A explicação não pôde ser gerada." with a "Tentar de novo" button, and habit/ask-AI SHALL be hidden. <!-- RV-03 -->
4. WHEN there are no key moments THEN the list SHALL read "Nenhuma perda de material importante". <!-- RV-04 -->

### P1: Explore ⭐ MVP

1. WHEN the screen opens THEN the board SHALL show the position before the first key moment, from the player's side (R-04). <!-- RV-05 -->
2. The board SHALL move with "Início", "Lance anterior", "Próximo lance", "Fim" buttons and with ←, →, Home, End; "Girar" SHALL flip it. <!-- RV-06 -->
3. On a key-moment position the board SHALL mark the lost piece square in red and the best move destination in green, with the legend "peça atacada" / "lance sugerido (X)". <!-- RV-07 -->
4. The material chart SHALL plot the player's material after every ply and mark each key moment with a numbered clickable circle; it SHALL be hidden for games under 15 moves. <!-- RV-08 -->
5. The move list SHALL show moves in two columns with `??` (loss ≥ 5), `?` (key moment) and `!` (strength) annotations and highlight the selected move. <!-- RV-09 -->
6. WHEN a key moment is chosen in the list, the chart or the move list THEN the board, the expanded item and the move highlight SHALL all sync to it (R-03). <!-- RV-10 -->

### P1: Key moments and actions ⭐ MVP

1. Key moments SHALL be an ordered list, chronological, one expanded at a time (`aria-expanded`), each with its type tag ("Peça atacada", "Defensor saiu", "Outro"), summary, explanation, best move and material change "Vantagem: +A → +B". <!-- RV-11 -->
2. "Treinar este momento" SHALL send the app to training on that moment; "Treinar os N momentos" SHALL start at the first. <!-- RV-12 -->
3. "Ver a linha no tabuleiro" SHALL play the engine line after the key moment on the board, up to 6 plies. <!-- RV-13 -->
4. "O que você fez bem" SHALL list the strengths texts (AI) or template texts. <!-- RV-14 -->
5. "Hábito para a próxima partida" SHALL show the AI habit sentence. <!-- RV-15 -->

### P1: Ask the AI ⭐ MVP

1. WHEN a suggestion chip or the typed question is sent THEN the app SHALL call `/api/questions` with the contract and show the answer; while waiting it SHALL show "Pensando…". <!-- RV-16 -->
2. IF the question call fails THEN it SHALL show "Não foi possível responder agora. Tente de novo." <!-- RV-17 -->

### P1: Footer and new game ⭐ MVP

1. The footer "Motores usados" SHALL list rules, evaluation, endgame tablebase and AI with their status (✓ or "falhou"). <!-- RV-18 -->
2. WHEN "Analisar outra partida" is clicked THEN a confirmation dialog SHALL appear; confirming SHALL return to Colar with the field empty; cancelling SHALL keep the result. <!-- RV-19 -->

---

## Edge Cases

- WHEN the player lost THEN the tag SHALL be neutral "Derrota · 1-0". <!-- RV-20 -->

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | RV-16: question length 1–500 enforced by the input. |
| Failure / partial-failure states | RV-03, RV-17. |
| Idempotency / retry | RV-03 retry. |
| Auth / rate limits | N/A. |
| Concurrency / ordering | RV-16: answers appended in order. |
| Data lifecycle | N/A (D2: nothing saved). |
| Observability | N/A. |
| External-dependency failure | RV-03, RV-17. |
| State-transition integrity | RV-10, RV-19. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| RV-01 | Summary | Design | Pending |
| RV-02 | Summary | Design | Pending |
| RV-03 | Summary | Design | Pending |
| RV-04 | Summary | Design | Pending |
| RV-05 | Explore | Design | Pending |
| RV-06 | Explore | Design | Pending |
| RV-07 | Explore | Design | Pending |
| RV-08 | Explore | Design | Pending |
| RV-09 | Explore | Design | Pending |
| RV-10 | Explore | Design | Pending |
| RV-11 | Moments | Design | Pending |
| RV-12 | Moments | Design | Pending |
| RV-13 | Moments | Design | Pending |
| RV-14 | Moments | Design | Pending |
| RV-15 | Moments | Design | Pending |
| RV-16 | Ask | Design | Pending |
| RV-17 | Ask | Design | Pending |
| RV-18 | Footer | Design | Pending |
| RV-19 | Footer | Design | Pending |
| RV-20 | Edge | Design | Pending |

**Coverage:** 20 total, 0 mapped to tasks, 20 unmapped ⚠️ (mapped in Tasks)

---

## Success Criteria

- [ ] step_03 ACs pass in Playwright for the reference game (key moments 22, 27, 41, 43, 56; board before 22...Ta7 with Black at the bottom; clicking circle 4 goes to before 43...Te6).
