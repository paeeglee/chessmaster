# F3 · Colar a partida Validation

**Date**: 2026-11-23 (round 1)
**Spec**: `.specs/features/game-input-screen/spec.md`
**Diff range**: `e937395..249a603` (spec `313389b`; code `b99c7a1`, `33176bc`, `3e56667`, `1226480`; e2e `249a603`)
**Verifier**: independent sub-agent (author ≠ verifier)
**Verdict**: FAIL

The behavior is implemented and both gates pass, but 3 of 23 behavior mutants survive (IN-12, IN-23, IN-24). The tests for those criteria do not discriminate, so the feature is not done until the fixes below land.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Board and position descriptions | ✅ Done | - |
| T2 Game input model | ✅ Done | The estimate formula test does not discriminate `plies + 1` (M20) |
| T3 Machines | ✅ Done | Machine tests live in `src/app/appMachine.test.ts`, not "next to the machines" as the matrix says |
| T4 Screen components | ⚠️ Partial | The clipboard-denied notice and the paste button are not covered at the screen level (M14) |
| T5 E2E and browser check | ✅ Done | Gates pass. The verifier compared mockup values in the code; no separate visual check in a browser |

---

## Spec-Anchored Acceptance Criteria

Paths are relative to `apps/web/`. `GIS` = `src/domains/game-input/components/GameInputScreen.test.tsx`, `APP` = `src/app/appMachine.test.ts`, `MODEL` = `src/domains/game-input/model/model.test.ts`, `E2E` = `e2e/game-input.spec.ts`.

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| IN-01 | "Lista de lances do Chess.com", "144 lances, todos legais", "Resultado 0-1, por xeque-mate", "Última jogada: 72...Ta6#", thumbnail | `src/domains/game-input/components/GameInputScreen.test.tsx:58-69`: `getByText(...)` for each exact string + `getByRole("img", { name: "Posição final: rei branco em a8, … xeque-mate" })`; `e2e/game-input.spec.ts:19-22` same strings in under 1 s with a real browser | ✅ PASS |
| IN-02 | Format "Lista de lances", same count rules | `src/domains/game-input/components/GameInputScreen.test.tsx:75-77`: `getByText("Lista de lances")`, `"12 lances, todos legais"`, `"Resultado 1-0"` | ✅ PASS |
| IN-03 | "Cole uma partida para começar" | `src/domains/game-input/components/GameInputScreen.test.tsx:52`: `getByText("Cole uma partida para começar")` | ✅ PASS |
| IN-04 | Unrecognized message, both formats, help expanded (PGN included) | `src/domains/game-input/components/GameInputScreen.test.tsx:83-89`: message, both chips, `closest("details")` `toHaveAttribute("open")`, button disabled; `e2e/game-input.spec.ts:28-33` for plain text and PGN | ✅ PASS |
| IN-05 | "O lance N (X) não é possível nesta posição" with move number, blocked | `src/domains/game-input/components/GameInputScreen.test.tsx:95-96`: `getByText("O lance 3 (Txa1) não é possível nesta posição")` (ply 5 ≠ move 3, so it discriminates), `toBeDisabled()`; `src/domains/game-input/model/model.test.ts:30-33` | ✅ PASS |
| IN-06 | Neutral "Partida sem resultado registrado", analysis allowed | `src/domains/game-input/components/GameInputScreen.test.tsx:103,105`: text + `toBeEnabled()` | ✅ PASS |
| IN-07 | "Cole só a lista de lances: o texto passou de 500 KB." | `src/domains/game-input/components/GameInputScreen.test.tsx:111-113`: exact text; `src/domains/game-input/model/model.test.ts:24-26` kind `too-large` | ✅ PASS |
| IN-08 | < 12 plies → "Partida curta: há pouco a analisar.", allowed | `src/domains/game-input/components/GameInputScreen.test.tsx:120,122`; boundary at `src/domains/game-input/model/model.test.ts:39-40` (11 plies short, 12 not) | ✅ PASS |
| IN-09 | `aria-live="polite"` region | `src/domains/game-input/components/GameInputScreen.test.tsx:131`: `toHaveAttribute("aria-live", "polite")` | ✅ PASS |
| IN-10 | Field and panel emptied | `src/domains/game-input/components/GameInputScreen.test.tsx:140-141`: `toHaveValue("")` + empty-state text; `src/app/appMachine.test.ts:58-60` | ✅ PASS |
| IN-11 | Clipboard text replaces the field | `src/app/appMachine.test.ts:67-68`: `context.text` and parent `draft.text` `toBe(GAME)` (machine only, the button is never clicked) | ⚠️ Partial (machine level only) |
| IN-12 | The Ctrl/Cmd+V notice is shown | `src/app/appMachine.test.ts:78-83`: only `clipboardDenied: true`; the notice text is never asserted. **M14 survived** | ❌ GAP |
| IN-13 | Neither color pressed (`aria-pressed="false"`) | `src/domains/game-input/components/GameInputScreen.test.tsx:149-150`; `src/app/appMachine.test.ts:40-46` `playerColor: null`; `e2e/game-input.spec.ts:42-49` | ✅ PASS |
| IN-14 | Chosen pressed, other not; thumbnail from that side, White before a choice | `src/domains/game-input/components/GameInputScreen.test.tsx:152-158`: first square `a8` before, `h1` after "Pretas"; `e2e/game-input.spec.ts:53-61` | ✅ PASS |
| IN-15 | Three exact options, starting at the stored level or Iniciante | `src/domains/game-input/components/GameInputScreen.test.tsx:164-169`: `toEqual([...3 labels])`, `toHaveValue("beginner")`; `src/app/appMachine.test.ts:51` stored `intermediate`; `e2e/game-input.spec.ts:85` | ✅ PASS |
| IN-16 | Only the level in `localStorage` | `src/app/appMachine.test.ts:100`: `expect({ ...localStorage }).toEqual({ "analisador.level": "advanced" })` after text + color; `e2e/game-input.spec.ts:85-89` | ✅ PASS |
| IN-17 | Peças perdidas + Finais pressed, others not, clicks toggle | `src/domains/game-input/components/GameInputScreen.test.tsx:178-191`: `toEqual(["true","true","false","false"])` then `["true","false","true","false"]` | ✅ PASS |
| IN-18 | Disabled, "Cole uma partida válida" | `src/domains/game-input/components/GameInputScreen.test.tsx:198-199`; `src/domains/game-input/model/model.test.ts:48-52` | ✅ PASS |
| IN-19 | Disabled, "Selecione com qual cor você jogou" | `src/domains/game-input/components/GameInputScreen.test.tsx:205-206`; `src/domains/game-input/model/model.test.ts:56-60`; `e2e/game-input.spec.ts:50-51` | ✅ PASS |
| IN-20 | "Carregando o motor… N%" disabled, then "Analisar partida →" enabled | `src/domains/game-input/components/GameInputScreen.test.tsx:214-216`: `getByRole("button", { name: "Carregando o motor… 40%" })` disabled, then enabled; `e2e/game-input.spec.ts:101-103` with the real engine | ✅ PASS |
| IN-21 | Disabled, "O motor não carregou. Tente de novo acima." | `src/domains/game-input/components/GameInputScreen.test.tsx:224-225`; `src/domains/game-input/model/model.test.ts:72-76` | ✅ PASS |
| IN-22 | Analisando with replayed game, color, level, priorities | `src/app/appMachine.test.ts:126-140`: state `analyzing`, SANs, `toMatchObject({ playerColor: "b", level: "intermediate", priorities: [...] })`; `src/domains/game-input/components/GameInputScreen.test.tsx:235` | ✅ PASS |
| IN-23 | Back to Colar with the same text **and choices** (color, level, priorities) | `src/app/appMachine.test.ts:150-156` and `src/domains/game-input/components/GameInputScreen.test.tsx:237-239`: text, color and priorities only; the level is never asserted after cancel. **M19 survived** (unit and e2e) | ❌ GAP |
| IN-24 | Estimate N = max(5, round((plies + 1) × 0.2 / 5) × 5), 30 before a game; privacy text | `src/domains/game-input/model/model.test.ts:90-96` (144→30, 300→60, 4→5) and `src/domains/game-input/components/GameInputScreen.test.tsx:244-250`. None of these inputs depends on the `+ 1`. **M20 survived** | ❌ GAP |
| IN-25 | Storage throws → Iniciante, screen keeps working | `src/domains/game-input/model/model.test.ts:137-138`: `loadLevel(broken)` `toBe("beginner")`, `saveLevel` `not.toThrow()` | ✅ PASS |

### step_01 PRD acceptance criteria (section 7)

| PRD AC | Evidence | Result |
| ------ | -------- | ------ |
| Reference HTML → "144 lances, todos legais", "Resultado 0-1, por xeque-mate", thumbnail in ≤ 1 s | `e2e/game-input.spec.ts:19-22` (`Date.now() - started < 1000`) | ✅ |
| Text without moves → "Formato não reconhecido", button disabled | `e2e/game-input.spec.ts:28-29` | ✅ |
| Valid game, no color → none marked, disabled, "Selecione com qual cor você jogou" | `e2e/game-input.spec.ts:42-51` | ✅ |
| Click "Pretas" → marked, thumbnail from Black, enabled | `e2e/game-input.spec.ts:52-62` | ✅ |
| Click "Analisar partida" → Analisando with those choices | `e2e/game-input.spec.ts:70-71` + `src/app/appMachine.test.ts:136-140` | ✅ |
| "Intermediário" remembered, no color selected on reopen | `e2e/game-input.spec.ts:85-89` | ✅ |
| Engine at 40%: paste and choose without waiting, label with %, enables on its own | `e2e/game-input.spec.ts:101-103` (real engine, `\d+%`); exact 40% at `src/domains/game-input/components/GameInputScreen.test.tsx:214` | ✅ |
| PGN → "Formato não reconhecido" with both formats | `e2e/game-input.spec.ts:30-33` | ✅ |

**Status**: ❌ 3 gaps (IN-12, IN-23, IN-24) and 1 partial (IN-11). No spec-precision gaps: every criterion has an exact string or value.

---

## Discrimination Sensor

Scratch: `git worktree add <scratchpad>/f3-sensor HEAD`, `pnpm install --frozen-lockfile`, `node scripts/copy-engine.mjs`. Every mutant ran `pnpm vitest run` (208 tests) and was reverted with `git checkout`. M19 also ran `make test-e2e`. Afterwards the scratch was removed with `git worktree remove --force`; `git status --porcelain` of the real tree matches the empty baseline.

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| M1 | `src/app/appMachine.ts:33` | `playerColor: null` → `"w"` (color preselected) | ✅ Killed (4) |
| M2 | `src/domains/game-input/model/analyzeAvailability.ts:25-27` | Color check removed, so the engine check comes first | ✅ Killed (3) |
| M3 | `src/domains/game-input/model/analyzeAvailability.ts:36` | Percent dropped from the label | ✅ Killed (2) |
| M4 | `src/domains/game-input/model/types.ts:19` | Default priorities `endgames` → `opening` | ✅ Killed (5) |
| M5 | `src/domains/game-input/machines/gameInputMachine.ts:94` | `persistLevel` removed | ✅ Killed (2) |
| M6 | `src/domains/game-input/machines/gameInputMachine.ts:89` | Color also written to `localStorage` | ✅ Killed (1) |
| M7 | `src/domains/game-input/components/FindingsPanel.tsx:118` | Illegal message uses `ply` instead of `moveNumber` | ✅ Killed (1) |
| M8 | `src/domains/game-input/model/inspectGame.ts:21` | `<` → `<=` on 12 plies | ✅ Killed (1) |
| M9 | `src/domains/game-input/components/FindingsPanel.tsx:144` | Orientation always `"w"` | ✅ Killed (1) |
| M10 | `src/domains/game-input/machines/gameInputMachine.ts:81` | `saveDraft` removed on text change (cancel would lose the text) | ✅ Killed (1) |
| M11 | `src/domains/game-input/machines/gameInputMachine.ts:69` | Guard treats the engine as always ready | ✅ Killed (1) |
| M12 | `src/domains/game-input/components/GameField.tsx:64` | Help never opens on its own | ✅ Killed (1) |
| M13 | `src/domains/game-input/model/estimate.ts:11` | `Math.round` → `Math.floor` | ✅ Killed (1) |
| M14 | `src/domains/game-input/components/GameField.tsx:49` | Clipboard-denied notice never rendered | ❌ **Survived** |
| M15 | `src/domains/game-input/machines/gameInputMachine.ts:73` | Input level ignored (always beginner) | ✅ Killed (1) |
| M16 | `src/domains/game-input/machines/gameInputMachine.ts:85` | CLEAR does not empty the text | ✅ Killed (2) |
| M17 | `src/domains/game-input/components/FindingsPanel.tsx:93` | `aria-live` removed | ✅ Killed (1) |
| M18 | `src/domains/game-input/components/FindingsPanel.tsx:110` | 500 KB message replaced by the unrecognized message | ✅ Killed (1) |
| M19 | `src/domains/game-input/machines/gameInputMachine.ts:27` | `draftOf` saves `level: "beginner"` (cancel loses the level) | ❌ **Survived** (unit 208/208, e2e 11/11) |
| M20 | `src/domains/game-input/model/estimate.ts:10` | `(plies + 1)` → `plies` | ❌ **Survived** |
| M21 | `src/domains/game-input/components/FindingsPanel.tsx:144` | Orientation before a choice → `"b"` | ✅ Killed (1) |
| M22 | `src/domains/game-input/machines/gameInputMachine.ts:124` | Denied clipboard leaves `clipboardDenied: false` | ✅ Killed (1) |
| M23 | `src/domains/game-input/components/FindingsPanel.tsx:134` | Positions = plies (not plies + 1) | ✅ Killed (1) |

**Sensor depth**: lightweight+ (23 manual mutants over every new rule)
**Result**: 20/23 killed - ❌ FAIL

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ (`docs/architecture/overview.md` updated for the status line placement) |
| No scope creep | ✅ (no "PGN" chip, no suggested color, no "Minhas partidas", as the spec says) |
| Matches patterns | ✅ DDD: domain `game-input` with `model/`, `machines/`, `components/`; `app` uses only `domains/game-input/index.ts`; `model/` is pure |
| Spec-anchored outcome check | ❌ IN-12, IN-23, IN-24 (see sensor) |
| Per-layer coverage (domain 1:1, screen happy + edge + error) | ⚠️ The clipboard error path has no screen test |
| Every test maps to a requirement | ✅ Test names cite IN-xx; Board/describe tests map to T1 |
| Guidelines followed: `docs/engineering/quality.md` | ✅ Tests by role and accessible text, no network, strict TS, Biome clean; domain coverage ≥ 90% |

Documentation drift (minor): `design.md` names `analyzeBlocker.ts` and an `AnalyzeAction` component. The code has `analyzeAvailability.ts`, and the action lives in `PlayerChoices.tsx`.

Mockup check (values in code vs `docs/design/step_01/Main.dc.html` inline styles): card radius 12px / padding 24px and 22px, gaps 24/16/14/12/10px, textarea 13px mono / line-height 1.55 / padding 14px / `#faf9f6`, chips radius 999px / min-height 40px / padding 8px 14px, pressed chip `#e1efee` / `#0d5f63` / `#9cc2c0`, color toggle radius 10px / min-height 44px / pressed `#1c2026`, button min-height 52px / radius 10px / 17px bold, thumbnail 112px / radius 6px / overlay shadow, H1 serif 36px / -0.01em. All match the theme tokens and classes. The intentional differences follow the PRD.

---

## Edge Cases

- [x] IN-25 `localStorage` throws → Iniciante (`src/domains/game-input/model/model.test.ts:137-138`)
- [x] Short game boundary at exactly 12 plies (`src/domains/game-input/model/model.test.ts:39-40`)
- [x] Engine finishes while the player is choosing (`e2e/game-input.spec.ts:101-103`)

---

## Gate Check

- **Gate command**: `make check && make test-e2e` (full)
- **make check**: exit 0. Biome and Ruff are clean, `tsc` and mypy are clean. Vitest: 19 files, **208 passed**, 0 failed, 0 skipped (coverage 98.98% statements / 91.56% branches). pytest: 9 passed (94.29%).
- **make test-e2e**: exit 0. **11 passed** (6 new in `e2e/game-input.spec.ts`), 0 skipped. Ports 4173/8000 were free before and after.
- **Test count delta**: no test was removed. `src/app/appMachine.test.ts` went from 1 to 11 tests, `src/domains/game/index.test.ts` from 3 to 3. New files: GameInputScreen (19), model (15 declarations), Board (6), describe (4), e2e (6).
- **Skipped tests**: none

---

## Fix Plans

### Fix 1: The clipboard notice is never asserted on screen (IN-12, IN-11) - Major

- **Root cause**: IN-11 and IN-12 are tested only on `gameInputMachine`. The "Colar da área de transferência" button and the notice in `src/domains/game-input/components/GameField.tsx:49-53` are never exercised.
- **Fix task**: In `GameInputScreen.test.tsx`, render `App` with `gameInput: gameInputMachine.provide({ actors: { readClipboard: fromPromise(async () => { throw new Error("NotAllowedError") }) } })`. Click "Colar da área de transferência" and assert `findByText("Não conseguimos ler a área de transferência. Clique no campo e use Ctrl+V (Cmd+V no Mac).")`. Add a second case that resolves to a game and asserts `toHaveValue(game)`.
- **Done when**: M14 is killed.

### Fix 2: The level is not asserted after cancel (IN-23) - Major

- **Root cause**: `src/app/appMachine.test.ts:152-156` and `src/domains/game-input/components/GameInputScreen.test.tsx:237-239` check text, color and priorities, but not the level.
- **Fix task**: In the cancel test, choose "Intermediário" before analyzing. After "Cancelar análise", assert `expect(screen.getByLabelText("Seu nível")).toHaveValue("intermediate")`, and add `level: "intermediate"` to the `toMatchObject` at `src/app/appMachine.test.ts:152`.
- **Done when**: M19 is killed.

### Fix 3: The estimate test does not discriminate `plies + 1` (IN-24) - Minor

- **Root cause**: 144, 300 and 4 plies give the same rounded value with or without the `+ 1`.
- **Fix task**: Add `expect(estimateSeconds(37)).toBe(10)` to `src/domains/game-input/model/model.test.ts` (38 × 0.2 = 7.6 → 10; with 37 × 0.2 = 7.4 → 5).
- **Done when**: M20 is killed.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| IN-01..IN-10, IN-13..IN-22, IN-25 | Implementing | ✅ Verified |
| IN-11 | Implementing | ⚠️ Verified at machine level (Fix 1) |
| IN-12 | Implementing | ❌ Needs Fix (Fix 1) |
| IN-23 | Implementing | ❌ Needs Fix (Fix 2) |
| IN-24 | Implementing | ❌ Needs Fix (Fix 3) |

---

## Summary

**Overall**: ❌ Not Ready (test-only fixes; no application defect was found)

**Spec-anchored check**: 21/25 matched, 3 gaps, 1 partial, 0 spec-precision gaps
**Sensor**: 20/23 mutations killed
**Gate**: make check 208 + 9 passed; e2e 11 passed

**What works**: parsing feedback, illegal-move message by move number, short-game boundary, color/level/priority rules, availability order, engine percent, level-only persistence, draft round trip for text, color and priorities, and every PRD AC in Playwright with the real engine.

**Next steps**: implement Fixes 1–3 (tests only), then re-verify (round 2 of a maximum of 3).
