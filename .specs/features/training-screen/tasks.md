# F8 · Treinar momento-chave Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/training-screen/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

| Layer | Test type | Tool | Location |
| ----- | --------- | ---- | -------- |
| game/model/moves, training/model | unit | Vitest | next to code |
| trainingMachine, app | unit (createActor + provide) | Vitest | next to code |
| TrainingScreen, interactive Board | component | Vitest + RTL | next to code |
| step_04 ACs | e2e | Playwright | `apps/web/e2e/training.spec.ts` |

## Gate Check Commands

- **quick**: `make lint-web typecheck-web test-web`
- **full**: `make check && make test-e2e`

---

## Execution Plan

### Phase 1: Training

```
T1 → T2 → T3 → T4
```

---

## Task Breakdown

### T1: Move helpers and exercise model

**What**: `game/model/moves.ts`, `training/model/exercise.ts`.
**Where**: `apps/web/src/domains/training/model/exercise.ts`
**Depends on**: None
**Reuses**: `classifyMove`, `positionsAlongLine`
**Requirement**: TR-02, TR-04, TR-05, TR-06, TR-07, TR-08, TR-10, TR-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 22...Te6 refuted, 22...Bd4+ and 22...Bb2 accepted with fixture evaluations

**Tests**: unit
**Gate**: quick

---

### T2: Training machine and app wiring

**What**: `trainingMachine`, app `training` state.
**Where**: `apps/web/src/domains/training/machines/trainingMachine.ts`
**Depends on**: T1
**Reuses**: XState patterns
**Requirement**: TR-01, TR-04, TR-05, TR-08, TR-09, TR-10, TR-11, TR-12, TR-14

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [x] Transitions tested with a fake engine

**Tests**: unit
**Gate**: quick

---

### T3: Interactive board and screen

**What**: interactive `Board`, `TrainingScreen`.
**Where**: `apps/web/src/domains/training/components/TrainingScreen.tsx`
**Depends on**: T2
**Reuses**: `Board`
**Requirement**: TR-01, TR-02, TR-03, TR-05, TR-07, TR-08, TR-11, TR-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Component tests by role/text, keyboard play

**Tests**: unit
**Gate**: quick

---

### T4: End-to-end and docs

**What**: Playwright for step_04 ACs; visual check; docs.
**Where**: `apps/web/e2e/training.spec.ts`
**Depends on**: T3
**Reuses**: analysis e2e helper
**Requirement**: TR-04, TR-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `make check && make test-e2e` pass

**Tests**: e2e
**Gate**: full
