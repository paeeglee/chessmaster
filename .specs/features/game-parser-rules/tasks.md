# F1 · Game domain Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/game-parser-rules/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

| Layer | Test type | Tool | Location |
| ----- | --------- | ---- | -------- |
| `game/model` (pure) | unit | Vitest | `apps/web/src/domains/game/model/*.test.ts` |
| `game/index.ts` boundary | unit (static import check) | Vitest | `apps/web/src/domains/game/index.test.ts` |

## Gate Check Commands

- **quick**: `make lint-web typecheck-web test-web`
- **full**: `make check`

---

## Execution Plan

### Phase 1: Model

```
T1 → T2 → T3 → T4 → T5
```

---

## Task Breakdown

### T1: Types and Portuguese notation

**What**: `model/types.ts` and `model/notation.ts` (`toPortugueseSan`, `portugueseToEnglishSan`, `detectNotation`).
**Where**: `apps/web/src/domains/game/model/notation.ts`
**Depends on**: None
**Reuses**: none
**Requirement**: GAME-22

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [x] GAME-22 mapping table tested both ways

**Tests**: unit
**Gate**: quick

---

### T2: Move text tokenizer and plain list parsing

**What**: `model/moveText.ts` tokenizer (annotations, comments, variations, NAGs, numbers, castling zeros, result).
**Where**: `apps/web/src/domains/game/model/moveText.ts`
**Depends on**: T1
**Reuses**: `notation.ts`
**Requirement**: GAME-04, GAME-05, GAME-07, GAME-08, GAME-09, GAME-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Each AC has a test with the exact expected tokens

**Tests**: unit
**Gate**: quick

---

### T3: Chess.com HTML reader and parseGameText

**What**: `model/chesscomHtml.ts` and `model/parseGameText.ts` (empty, too-large, PGN, unrecognized, format detection).
**Where**: `apps/web/src/domains/game/model/parseGameText.ts`
**Depends on**: T2
**Reuses**: `moveText.ts`, `fixtures/reference-game.chesscom.html`
**Requirement**: GAME-01, GAME-02, GAME-03, GAME-11, GAME-12, GAME-13, GAME-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Fixture parses to 144 tokens and `0-1`; rejections return their outcomes

**Tests**: unit
**Gate**: quick

---

### T4: Replay with chess.js

**What**: `model/replay.ts` (`replayGame`), notation fallback, termination/result, illegal-move error, promotion forms, performance budget.
**Where**: `apps/web/src/domains/game/model/replay.ts`
**Depends on**: T3
**Reuses**: `chess.js` (AD-002)
**Requirement**: GAME-06, GAME-15, GAME-16, GAME-17, GAME-18, GAME-19, GAME-20, GAME-21, GAME-25

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [ ] Reference game replays to 144 plies with the asserted plies 24, 44 and 144

**Tests**: unit
**Gate**: quick

---

### T5: Public entry point, boundary checks and docs

**What**: `src/domains/game/index.ts`, boundary test (no `chess.js`/React/XState imports where forbidden), glossary entry for termination.
**Where**: `apps/web/src/domains/game/index.ts`
**Depends on**: T4
**Reuses**: none
**Requirement**: GAME-23, GAME-24

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `make check` passes with ≥ 90% coverage on `src/domains/game/model/**`

**Tests**: unit
**Gate**: full
