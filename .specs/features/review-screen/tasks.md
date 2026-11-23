# F7 · Resultado Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/review-screen/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

| Layer | Test type | Tool | Location |
| ----- | --------- | ---- | -------- |
| review/model | unit | Vitest | next to code |
| reviewMachine + app | unit (createActor + provide) | Vitest | next to code |
| components | component | Vitest + RTL | `review/components/*.test.tsx` |
| step_03 ACs | e2e | Playwright | `apps/web/e2e/review.spec.ts` |

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

### T1: Review model

**What**: material fields on mistakes, `review/model/review.ts`.
**Where**: `apps/web/src/domains/review/model/review.ts`
**Depends on**: None
**Reuses**: analysis summary, game helpers
**Requirement**: RV-02, RV-05, RV-07, RV-08, RV-09, RV-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Pure functions tested on the reference result

**Tests**: unit
**Gate**: quick

---

### T2: Review machine and app wiring

**What**: `reviewMachine`, app `review`/`training` states.
**Where**: `apps/web/src/domains/review/machines/reviewMachine.ts`
**Depends on**: T1
**Reuses**: explanation client
**Requirement**: RV-03, RV-06, RV-10, RV-12, RV-13, RV-16, RV-17, RV-19

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [x] Transitions tested

**Tests**: unit
**Gate**: quick

---

### T3: Board, chart and move list

**What**: `BoardPanel`, `MaterialChart`, `MoveList`.
**Where**: `apps/web/src/domains/review/components/BoardPanel.tsx`
**Depends on**: T2
**Reuses**: `Board`
**Requirement**: RV-05, RV-06, RV-07, RV-08, RV-09, RV-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Component tests by role/text

**Tests**: unit
**Gate**: quick

---

### T4: Summary, key moments, strengths, ask AI, footer

**What**: remaining components and `ReviewScreen`.
**Where**: `apps/web/src/domains/review/components/ReviewScreen.tsx`
**Depends on**: T3
**Reuses**: T1 model
**Requirement**: RV-01, RV-02, RV-03, RV-04, RV-11, RV-12, RV-13, RV-14, RV-15, RV-16, RV-17, RV-18, RV-19, RV-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Component tests by role/text

**Tests**: unit
**Gate**: quick

---

### T5: End-to-end and visual check

**What**: Playwright for step_03 ACs, visual comparison, docs.
**Where**: `apps/web/e2e/review.spec.ts`
**Depends on**: T4
**Reuses**: analysis e2e helper
**Requirement**: RV-05, RV-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `make check && make test-e2e` pass

**Tests**: e2e
**Gate**: full
