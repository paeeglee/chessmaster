# F3 · Screen 1 "Colar a partida" Specification

## Problem Statement

The player needs to paste a game, see that it was understood, choose their color, level and priorities, and start the analysis only when the game is valid, the color is chosen and the engine is ready (step_01 PRD). Engines 1–2 (F1) and the engine loader (F2) exist; the screen does not.

## Goals

- [ ] Pasting the reference game shows "144 lances, todos legais", "Resultado 0-1, por xeque-mate" and the final position thumbnail in under 1 s.
- [ ] "Analisar partida" is enabled only with a valid game, a selected color and a ready engine, and leads to the Analisando step with the choices.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| The Analisando screen content (stages, findings) | F4; F3 lands on a placeholder with "Cancelar análise" |
| PGN import | Out of the MVP (general.md 5.2) |
| Metrics (section 9 of the PRD) | No analytics backend in the MVP; logged as a follow-up |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Design vs PRD: accepted formats | Show only "HTML do Chess.com" and "Lista de lances (1.d4 d5 …)" | C-01 and AC "PGN → não reconhecido"; PRD wins over the mockup's "PGN" chip | y (CLAUDE.md rule) |
| Design vs PRD: color | No color pressed initially and no "Sugerido…" text; hint "Selecione com qual cor você jogou" until chosen | D5 / C-07 | y (PRD) |
| Help text | "Abra a partida no Chess.com, clique com o botão direito na lista de lances, escolha "Inspecionar" e copie o elemento. Também funciona colar a lista de lances (1.d4 d5 2.Cc3 …)." | The mockup mentions PGN, which is not accepted | n |
| Move count wording | "N lances, todos legais" counts plies (the reference game shows 144), positions = plies + 1 | step_01 AC and mockup | y (PRD) |
| Where the state lives | `gameInputMachine` (domain `game-input`) holds the draft (text, color, level, priorities, clipboard notice); it is invoked by `appMachine` in state `gameInput` with the last saved draft and saves every change to the parent | C-13 and A-09: text and choices survive leaving the screen | n |
| Parsing trigger | Parse + replay run synchronously on every text change, memoized by text | C-03 budget 1 s; F1 measured < 100 ms for 300 plies | n |
| Engine status on this screen | The F2 status line moves into the action card, above "Analisar partida" | C-14 asks for a discreet indicator; the mockup has no slot | n |
| Time estimate | "Leva cerca de N segundos." with N = max(5, round((plies + 1) × 0.2 / 5) × 5); before a game is recognized, N = 30 | D1: ~200 ms per position | n |
| Final position description | Visible: "Brancas: …. Pretas: …." (piece list in Portuguese); `aria-label`: "Posição final: rei branco em a8, …" plus ", xeque-mate"/", afogamento" | C-06 + accessibility "descrição textual da posição" | n |
| Level storage | `localStorage` key `analisador.level` with `beginner`/`intermediate`/`advanced`; any read/write error falls back to beginner silently | C-15 | y (PRD) |
| Clipboard denied | Notice: "Não conseguimos ler a área de transferência. Clique no campo e use Ctrl+V (Cmd+V no Mac)." | C-11 | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Paste and see what was found ⭐ MVP

1. WHEN the reference Chess.com HTML is put in the "Partida" field THEN "O que encontramos" SHALL show "Lista de lances do Chess.com", "144 lances, todos legais", "Resultado 0-1, por xeque-mate", "Última jogada: 72...Ta6#" and the final position thumbnail. <!-- IN-01 -->
2. WHEN a valid plain move list is put in the field THEN the format line SHALL read "Lista de lances" and the counts SHALL follow the same rules. <!-- IN-02 -->
3. WHEN the field is empty THEN the panel SHALL show "Cole uma partida para começar". <!-- IN-03 -->
4. IF the text is not recognized (including PGN) THEN the panel SHALL show "Não reconhecemos este texto como uma partida", the two accepted formats, and the help "Onde copio isso no Chess.com?" SHALL be expanded. <!-- IN-04 -->
5. IF a move is illegal THEN the panel SHALL show "O lance N (X) não é possível nesta posição" with the move number and the move as written, and analysis SHALL stay blocked. <!-- IN-05 -->
6. IF the game has no result and does not end in checkmate or stalemate THEN the panel SHALL show the neutral notice "Partida sem resultado registrado" and analysis SHALL be allowed. <!-- IN-06 -->
7. IF the paste is larger than 500 KB THEN the panel SHALL ask "Cole só a lista de lances: o texto passou de 500 KB." <!-- IN-07 -->
8. IF the game has fewer than 6 moves (12 plies) THEN the panel SHALL warn "Partida curta: há pouco a analisar." and analysis SHALL be allowed. <!-- IN-08 -->
9. WHEN errors or results change THEN the panel SHALL announce them with `aria-live="polite"`. <!-- IN-09 -->

### P1: Field actions ⭐ MVP

1. WHEN "Limpar" is clicked THEN the field and the panel SHALL be emptied. <!-- IN-10 -->
2. WHEN "Colar da área de transferência" is clicked and the browser allows it THEN the clipboard text SHALL replace the field content. <!-- IN-11 -->
3. IF clipboard reading is denied THEN the screen SHALL show the Ctrl/Cmd+V notice. <!-- IN-12 -->

### P1: Player choices ⭐ MVP

1. The color selector SHALL start with neither "Brancas" nor "Pretas" pressed (`aria-pressed="false"`). <!-- IN-13 -->
2. WHEN a color is clicked THEN it SHALL be pressed, the other SHALL not, and the thumbnail SHALL be oriented from that side (White's side before any choice). <!-- IN-14 -->
3. The level select SHALL offer "Iniciante — explique sem jargão", "Intermediário", "Avançado", starting at the level stored in this browser or "Iniciante". <!-- IN-15 -->
4. WHEN the level changes THEN it SHALL be stored in `localStorage` and only the level SHALL be stored (not text, not color). <!-- IN-16 -->
5. The priority chips SHALL start with "Peças perdidas" and "Finais" pressed and "Abertura" and "Plano" not pressed, and each click SHALL toggle its chip. <!-- IN-17 -->

### P1: Start the analysis ⭐ MVP

1. WHILE the game is not valid the button SHALL be disabled with the hint "Cole uma partida válida". <!-- IN-18 -->
2. WHILE the game is valid and no color is chosen the button SHALL be disabled with the hint "Selecione com qual cor você jogou". <!-- IN-19 -->
3. WHILE only the engine is missing the button SHALL be disabled and read "Carregando o motor… N%", and it SHALL become "Analisar partida →" and enabled as soon as the engine is ready. <!-- IN-20 -->
4. IF the engine failed to load THEN the button SHALL be disabled with the hint "O motor não carregou. Tente de novo acima." <!-- IN-21 -->
5. WHEN the enabled button is clicked THEN the app SHALL go to the Analisando step with the replayed game, the color, the level and the priorities. <!-- IN-22 -->
6. WHEN the player cancels on the Analisando step THEN the Colar screen SHALL come back with the same text and choices. <!-- IN-23 -->
7. The action card SHALL show the time estimate and "A partida fica só neste navegador." <!-- IN-24 -->

---

## Edge Cases

- IF `localStorage` throws on read or write THEN the level SHALL start at "Iniciante" and the screen SHALL keep working. <!-- IN-25 -->

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | IN-04, IN-05, IN-07. |
| Failure / partial-failure states | IN-12, IN-21, IN-25. |
| Idempotency / retry | N/A: parsing is pure and re-runs on every change. |
| Auth boundaries & rate limits | N/A: no backend call on this screen. |
| Concurrency / ordering | IN-20: button reacts to the engine finishing while the player types. |
| Data lifecycle / expiry | IN-16: only the level persists. |
| Observability | Metrics deferred (Out of Scope). |
| External-dependency failure | IN-12 (clipboard), IN-21 (engine). |
| State-transition integrity | IN-18..IN-23. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| IN-01 | Paste | Tasks | Implementing |
| IN-02 | Paste | Tasks | Implementing |
| IN-03 | Paste | Tasks | Implementing |
| IN-04 | Paste | Tasks | Implementing |
| IN-05 | Paste | Tasks | Implementing |
| IN-06 | Paste | Tasks | Implementing |
| IN-07 | Paste | Tasks | Implementing |
| IN-08 | Paste | Tasks | Implementing |
| IN-09 | Paste | Tasks | Implementing |
| IN-10 | Field | Tasks | Implementing |
| IN-11 | Field | Tasks | Implementing |
| IN-12 | Field | Tasks | Implementing |
| IN-13 | Choices | Tasks | Implementing |
| IN-14 | Choices | Tasks | Implementing |
| IN-15 | Choices | Tasks | Implementing |
| IN-16 | Choices | Tasks | Implementing |
| IN-17 | Choices | Tasks | Implementing |
| IN-18 | Start | Tasks | Implementing |
| IN-19 | Start | Tasks | Implementing |
| IN-20 | Start | Tasks | Implementing |
| IN-21 | Start | Tasks | Implementing |
| IN-22 | Start | Tasks | Implementing |
| IN-23 | Start | Tasks | Implementing |
| IN-24 | Start | Tasks | Implementing |
| IN-25 | Edge case | Tasks | Implementing |

**Coverage:** 25 total, 25 mapped to tasks (T1–T5), 0 unmapped

---

## Success Criteria

- [ ] The step_01 acceptance criteria pass in Playwright with the real engine.
- [ ] The screen matches the mockup values (except the PRD-driven differences above) when checked in the browser with isolation on.
