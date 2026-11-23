# F3 · Colar a partida Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/game-input-screen/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

| Layer | Test type | Tool | Location |
| ----- | --------- | ---- | -------- |
| `game/model/describe.ts`, `game-input/model` | unit | Vitest | next to the code |
| `shared/ui/Board` | component | Vitest + RTL | `apps/web/src/shared/ui/Board.test.tsx` |
| `gameInputMachine`, `appMachine` | unit (createActor + provide) | Vitest | next to the machines |
| Screen components | component | Vitest + RTL + user-event | `apps/web/src/domains/game-input/components/*.test.tsx` |
| step_01 acceptance criteria | e2e | Playwright | `apps/web/e2e/game-input.spec.ts` |

## Gate Check Commands

- **quick**: `make lint-web typecheck-web test-web`
- **full**: `make check && make test-e2e`

---

## Execution Plan

### Phase 1: Screen

```
T1 → T2 → T3 → T4 → T5
```

---

## Task Breakdown

### T1: Board component and position descriptions

**What**: Board tokens, `shared/ui/Board.tsx`, `game/model/describe.ts`.
**Where**: `apps/web/src/shared/ui/Board.tsx`
**Depends on**: None
**Reuses**: mockup `boardSquares` values
**Requirement**: IN-01, IN-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Board renders orientation, marks and label; descriptions tested

**Tests**: unit
**Gate**: quick

---

### T2: Game input model

**What**: types, `inspectGame`, `analyzeAvailability`, `estimateSeconds`, level storage.
**Where**: `apps/web/src/domains/game-input/model/inspectGame.ts`
**Depends on**: T1
**Reuses**: `game` domain index
**Requirement**: IN-05, IN-06, IN-07, IN-08, IN-15, IN-16, IN-18, IN-19, IN-20, IN-21, IN-24, IN-25

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Every rule tested with exact strings

**Tests**: unit
**Gate**: quick

---

### T3: Machines

**What**: `gameInputMachine` and `appMachine` states `gameInput` / `analyzing`.
**Where**: `apps/web/src/domains/game-input/machines/gameInputMachine.ts`
**Depends on**: T2
**Reuses**: XState setup patterns from F2
**Requirement**: IN-10, IN-11, IN-12, IN-13, IN-14, IN-16, IN-17, IN-22, IN-23

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [ ] Transitions and parent events tested with createActor

**Tests**: unit
**Gate**: quick

---

### T4: Screen components

**What**: `GameInputScreen` and its parts, wired into `App`.
**Where**: `apps/web/src/domains/game-input/components/GameInputScreen.tsx`
**Depends on**: T3
**Reuses**: `Board`, `EngineStatus`
**Requirement**: IN-01, IN-02, IN-03, IN-04, IN-09, IN-13, IN-15, IN-17, IN-18, IN-19, IN-20, IN-24

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Component tests by role/text pass

**Tests**: unit
**Gate**: quick

---

### T5: End-to-end acceptance and browser check

**What**: Playwright tests for the step_01 ACs; visual check against the mockup; docs.
**Where**: `apps/web/e2e/game-input.spec.ts`
**Depends on**: T4
**Reuses**: reference fixture
**Requirement**: IN-01, IN-14, IN-20, IN-22, IN-23

**Tools**:

- MCP: `playwright`
- Skill: NONE

**Done when**:

- [ ] `make check && make test-e2e` pass

**Tests**: e2e
**Gate**: full
