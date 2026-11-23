# F3 · Colar a partida Validation

**Date**: 2026-11-23 (round 2, after test commit `64c7e94`)
**Spec**: `.specs/features/game-input-screen/spec.md`
**Diff range**: `e937395..64c7e94` (spec `313389b`; code `b99c7a1`, `33176bc`, `3e56667`, `1226480`; e2e `249a603`; round-1 report `bd12c83`; fix tests `64c7e94`)
**Verifier**: independent sub-agent (author ≠ verifier)
**Verdict**: PASS

Round 2: `64c7e94` is test-only, plus file-name fixes in `design.md`. It adds the screen-level clipboard tests (IN-11, IN-12), the level round trip after cancel (IN-23) and `estimateSeconds(37) === 10` (IN-24). M14, M19 and M20 are now killed in a fresh scratch worktree, together with the other 20 mutants and a new M24 (paste button wiring). Round 1 had failed on those three surviving mutants.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Board and position descriptions | ✅ Done | - |
| T2 Game input model | ✅ Done | Estimate gap (M20) closed by `64c7e94` |
| T3 Machines | ✅ Done | Machine tests live in `src/app/appMachine.test.ts`, not next to the machine (cosmetic) |
| T4 Screen components | ✅ Done | Clipboard gap (M14) closed by `64c7e94` |
| T5 E2E and browser check | ✅ Done | Gates pass. The verifier compared mockup values in the code; no separate visual check in a browser |

---

## Spec-Anchored Acceptance Criteria

Paths are relative to `apps/web/`.

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| IN-01 | "Lista de lances do Chess.com", "144 lances, todos legais", "Resultado 0-1, por xeque-mate", "Última jogada: 72...Ta6#", thumbnail | `src/domains/game-input/components/GameInputScreen.test.tsx:62-73`: `getByText(...)` for each exact string + `getByRole("img", { name: "Posição final: rei branco em a8, … xeque-mate" })`; `e2e/game-input.spec.ts:19-22` in under 1 s | ✅ PASS |
| IN-02 | "Lista de lances", same count rules | `src/domains/game-input/components/GameInputScreen.test.tsx:79-81`: `"Lista de lances"`, `"12 lances, todos legais"`, `"Resultado 1-0"` | ✅ PASS |
| IN-03 | "Cole uma partida para começar" | `src/domains/game-input/components/GameInputScreen.test.tsx:56` | ✅ PASS |
| IN-04 | Unrecognized message, both formats, help expanded (PGN included) | `src/domains/game-input/components/GameInputScreen.test.tsx:87-93`: message, both chips, `closest("details")` `toHaveAttribute("open")`, disabled; `e2e/game-input.spec.ts:28-33` | ✅ PASS |
| IN-05 | "O lance N (X) não é possível nesta posição" with move number, blocked | `src/domains/game-input/components/GameInputScreen.test.tsx:99-100`: `"O lance 3 (Txa1) não é possível nesta posição"` (ply 5 ≠ move 3), `toBeDisabled()`; `src/domains/game-input/model/model.test.ts:30-33` | ✅ PASS |
| IN-06 | Neutral "Partida sem resultado registrado", allowed | `src/domains/game-input/components/GameInputScreen.test.tsx:107,109` | ✅ PASS |
| IN-07 | "Cole só a lista de lances: o texto passou de 500 KB." | `src/domains/game-input/components/GameInputScreen.test.tsx:115-117`; `src/domains/game-input/model/model.test.ts:24-26` | ✅ PASS |
| IN-08 | < 12 plies → "Partida curta: há pouco a analisar.", allowed | `src/domains/game-input/components/GameInputScreen.test.tsx:124,126`; boundary `src/domains/game-input/model/model.test.ts:39-40` (11 vs 12 plies) | ✅ PASS |
| IN-09 | `aria-live="polite"` | `src/domains/game-input/components/GameInputScreen.test.tsx:135`: `toHaveAttribute("aria-live", "polite")` | ✅ PASS |
| IN-10 | Field and panel emptied | `src/domains/game-input/components/GameInputScreen.test.tsx:162-163`; `src/app/appMachine.test.ts:58-60` | ✅ PASS |
| IN-11 | Clipboard text replaces the field | `src/domains/game-input/components/GameInputScreen.test.tsx:143`: click "Colar da área de transferência" → `findByDisplayValue("1.e4 e5 2.Nf3")`; `src/app/appMachine.test.ts:67-68` | ✅ PASS |
| IN-12 | The Ctrl/Cmd+V notice is shown | `src/domains/game-input/components/GameInputScreen.test.tsx:146-155`: rejected clipboard → `findByText("Não conseguimos ler a área de transferência. Clique no campo e use Ctrl+V (Cmd+V no Mac).")`; `src/app/appMachine.test.ts:78-83` | ✅ PASS |
| IN-13 | Neither color pressed | `src/domains/game-input/components/GameInputScreen.test.tsx:171-172`; `src/app/appMachine.test.ts:40-46`; `e2e/game-input.spec.ts:42-49` | ✅ PASS |
| IN-14 | Chosen pressed, other not; thumbnail from that side, White before a choice | `src/domains/game-input/components/GameInputScreen.test.tsx:174-180`: first square `a8` → `h1`; `e2e/game-input.spec.ts:53-61` | ✅ PASS |
| IN-15 | Three exact options; stored level or Iniciante | `src/domains/game-input/components/GameInputScreen.test.tsx:186-191`; `src/app/appMachine.test.ts:51`; `e2e/game-input.spec.ts:85` | ✅ PASS |
| IN-16 | Only the level in `localStorage` | `src/app/appMachine.test.ts:100`: `expect({ ...localStorage }).toEqual({ "analisador.level": "advanced" })`; `e2e/game-input.spec.ts:85-89` | ✅ PASS |
| IN-17 | Defaults Peças perdidas + Finais; clicks toggle | `src/domains/game-input/components/GameInputScreen.test.tsx:200-213` | ✅ PASS |
| IN-18 | Disabled, "Cole uma partida válida" | `src/domains/game-input/components/GameInputScreen.test.tsx:220-221`; `src/domains/game-input/model/model.test.ts:48-52` | ✅ PASS |
| IN-19 | Disabled, "Selecione com qual cor você jogou" | `src/domains/game-input/components/GameInputScreen.test.tsx:227-228`; `e2e/game-input.spec.ts:50-51` | ✅ PASS |
| IN-20 | "Carregando o motor… N%" disabled → "Analisar partida →" enabled | `src/domains/game-input/components/GameInputScreen.test.tsx:236-238`; `e2e/game-input.spec.ts:101-103` (real engine) | ✅ PASS |
| IN-21 | Disabled, "O motor não carregou. Tente de novo acima." | `src/domains/game-input/components/GameInputScreen.test.tsx:246-247`; `src/domains/game-input/model/model.test.ts:72-76` | ✅ PASS |
| IN-22 | Analisando with replayed game, color, level, priorities | `src/app/appMachine.test.ts:126-140`: `analyzing`, SANs, `toMatchObject({ playerColor: "b", level: "intermediate", priorities })`; `src/domains/game-input/components/GameInputScreen.test.tsx:258` | ✅ PASS |
| IN-23 | Back with the same text and choices (color, level, priorities) | `src/domains/game-input/components/GameInputScreen.test.tsx:260-263`: text, "Pretas" and "Plano" pressed, `getByLabelText("Seu nível")` `toHaveValue("intermediate")`; `src/app/appMachine.test.ts:153-158` incl. `level: "intermediate"` | ✅ PASS |
| IN-24 | N = max(5, round((plies + 1) × 0.2 / 5) × 5), 30 before a game; privacy text | `src/domains/game-input/model/model.test.ts:90-98` incl. `estimateSeconds(37)` `toBe(10)` (only true with `+ 1`); `src/domains/game-input/components/GameInputScreen.test.tsx:268-274` | ✅ PASS |
| IN-25 | Storage throws → Iniciante, keeps working | `src/domains/game-input/model/model.test.ts:139-140` | ✅ PASS |

### step_01 PRD acceptance criteria (section 7)

| PRD AC | Evidence | Result |
| ------ | -------- | ------ |
| Reference HTML → 144 lances / 0-1 por xeque-mate / thumbnail in ≤ 1 s | `e2e/game-input.spec.ts:19-22` | ✅ |
| Text without moves → unrecognized, button disabled | `e2e/game-input.spec.ts:28-29` | ✅ |
| Valid game, no color → none marked, disabled, color hint | `e2e/game-input.spec.ts:42-51` | ✅ |
| Click "Pretas" → marked, thumbnail from Black, enabled | `e2e/game-input.spec.ts:52-62` | ✅ |
| "Analisar partida" → Analisando with the choices | `e2e/game-input.spec.ts:70-71` + `src/app/appMachine.test.ts:136-140` | ✅ |
| "Intermediário" remembered, no color on reopen | `e2e/game-input.spec.ts:85-89` | ✅ |
| Engine loading: paste/choose without waiting, label with %, enables on its own | `e2e/game-input.spec.ts:101-103`; exact 40% at `src/domains/game-input/components/GameInputScreen.test.tsx:236` | ✅ |
| PGN → unrecognized with both formats | `e2e/game-input.spec.ts:30-33` | ✅ |

**Status**: ✅ All 25 criteria are covered with spec-exact assertions. No spec-precision gaps.

---

## Discrimination Sensor

Round 2 used a fresh scratch at `64c7e94`: `git worktree add <scratchpad>/f3-sensor HEAD`, `pnpm install --frozen-lockfile`, `node scripts/copy-engine.mjs`. Every mutant ran `pnpm vitest run` (210 tests) and was reverted. Afterwards I ran `git worktree remove --force` and `git worktree prune`; `git status --porcelain` of the real tree matches the pre-sensor baseline (empty).

| # | File:line | Mutation | Round 1 | Round 2 |
| - | --------- | -------- | ------- | ------- |
| M1 | `src/app/appMachine.ts:33` | Color preselected `"w"` | Killed | ✅ Killed (4) |
| M2 | `src/domains/game-input/model/analyzeAvailability.ts:25-27` | Color check removed (engine first) | Killed | ✅ Killed (3) |
| M3 | `src/domains/game-input/model/analyzeAvailability.ts:36` | Percent dropped from the label | Killed | ✅ Killed (2) |
| M4 | `src/domains/game-input/model/types.ts:19` | Default priorities wrong | Killed | ✅ Killed (5) |
| M5 | `src/domains/game-input/machines/gameInputMachine.ts:94` | `persistLevel` removed | Killed | ✅ Killed (2) |
| M6 | `src/domains/game-input/machines/gameInputMachine.ts:89` | Color written to `localStorage` | Killed | ✅ Killed (1) |
| M7 | `src/domains/game-input/components/FindingsPanel.tsx:118` | Illegal message uses `ply` | Killed | ✅ Killed (1) |
| M8 | `src/domains/game-input/model/inspectGame.ts:21` | Short game `<` → `<=` | Killed | ✅ Killed (1) |
| M9 | `src/domains/game-input/components/FindingsPanel.tsx:144` | Orientation always `"w"` | Killed | ✅ Killed (1) |
| M10 | `src/domains/game-input/machines/gameInputMachine.ts:81` | `saveDraft` removed on text change | Killed | ✅ Killed (1) |
| M11 | `src/domains/game-input/machines/gameInputMachine.ts:69` | Guard treats the engine as ready | Killed | ✅ Killed (1) |
| M12 | `src/domains/game-input/components/GameField.tsx:64` | Help never opens on its own | Killed | ✅ Killed (1) |
| M13 | `src/domains/game-input/model/estimate.ts:11` | `round` → `floor` | Killed | ✅ Killed (1) |
| M14 | `src/domains/game-input/components/GameField.tsx:49` | Clipboard notice never rendered | Survived | ✅ **Killed (1)** |
| M15 | `src/domains/game-input/machines/gameInputMachine.ts:73` | Input level ignored | Killed | ✅ Killed (3) |
| M16 | `src/domains/game-input/machines/gameInputMachine.ts:85` | CLEAR keeps the text | Killed | ✅ Killed (2) |
| M17 | `src/domains/game-input/components/FindingsPanel.tsx:93` | `aria-live` removed | Killed | ✅ Killed (1) |
| M18 | `src/domains/game-input/components/FindingsPanel.tsx:110` | 500 KB message swapped | Killed | ✅ Killed (1) |
| M19 | `src/domains/game-input/machines/gameInputMachine.ts:27` | `draftOf` drops the level (cancel loses it) | Survived | ✅ **Killed (2)** |
| M20 | `src/domains/game-input/model/estimate.ts:10` | `(plies + 1)` → `plies` | Survived | ✅ **Killed (1)** |
| M21 | `src/domains/game-input/components/FindingsPanel.tsx:144` | Orientation before a choice `"b"` | Killed | ✅ Killed (1) |
| M22 | `src/domains/game-input/machines/gameInputMachine.ts:124` | Denied clipboard leaves the flag false | Killed | ✅ Killed (2) |
| M23 | `src/domains/game-input/components/FindingsPanel.tsx:134` | Positions = plies | Killed | ✅ Killed (1) |
| M24 | `src/domains/game-input/components/GameField.tsx:30` | Paste button not wired to `PASTE` (new, IN-11) | - | ✅ Killed (2) |

**Sensor depth**: lightweight+ (24 manual mutants over every new rule)
**Result**: 24/24 killed - ✅ PASS

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ Round 2 changed tests and `design.md` only |
| No scope creep | ✅ No "PGN" chip, no suggested color, no "Minhas partidas" (PRD-driven) |
| Matches patterns | ✅ DDD `game-input/{model,machines,components}`; `app` uses only the domain `index.ts`; `model/` has no `xstate` |
| Spec-anchored outcome check | ✅ |
| Per-layer coverage | ✅ Domain 1:1; screen happy + edge + error paths (clipboard, engine failure, illegal move) |
| Every test maps to a requirement | ✅ |
| Guidelines: `docs/engineering/quality.md` | ✅ Role/text queries, actors swapped with `provide()`, strict TS, Biome clean, coverage thresholds met |

`design.md` now names `analyzeAvailability.ts` and puts the action in `PlayerChoices`, so the round-1 drift is fixed.

Mockup check (values in code vs `docs/design/step_01/Main.dc.html` inline styles): card radius 12px and padding 24/22px; textarea 13px mono, line-height 1.55, `#faf9f6`; chips 999px, min-height 40px, pressed `#e1efee`/`#0d5f63`/`#9cc2c0`; color toggle radius 10px, min-height 44px, pressed `#1c2026`; button 52px, radius 10px, 17px bold; thumbnail 112px, radius 6px, overlay shadow; H1 serif 36px. All match.

---

## Edge Cases

- [x] IN-25 `localStorage` throws → Iniciante (`src/domains/game-input/model/model.test.ts:139-140`)
- [x] Short-game boundary at exactly 12 plies (`src/domains/game-input/model/model.test.ts:39-40`)
- [x] Engine finishes while the player is choosing (`e2e/game-input.spec.ts:101-103`)

---

## Gate Check

- **Gate command**: `make check && make test-e2e`
- **make check**: exit 0. Lint, tsc and mypy are clean. Vitest: 19 files, **210 passed** (round 1 had 208; +2), 0 skipped, 99.19% statements. pytest: 9 passed.
- **make test-e2e**: exit 0, **11 passed**, 0 skipped. Ports 4173/8000 were free before and after.
- **Test count delta**: no test was removed. Feature total: Vitest +~58 over `e937395`, e2e +6.
- **Skipped tests**: none

---

## Fix Plans

None open. Round-1 Fixes 1–3 landed in `64c7e94` and were confirmed by M14, M19 and M20 being killed.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| IN-01..IN-25 | Implementing | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 25/25 criteria matched the spec outcome, plus 8/8 PRD ACs
**Sensor**: 24/24 mutations killed
**Gate**: make check 210 + 9 passed; e2e 11 passed

**Remaining notes (non-blocking)**: the machine tests live in `src/app/appMachine.test.ts` rather than next to `gameInputMachine.ts`. The visual check in a browser against the mockup is the author's responsibility (DoD item 7); the verifier compared the values in the code only.
