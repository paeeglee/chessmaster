# F4a · Analysis model Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/analysis-model/design.md`
**Status**: Done

---

## Test Coverage Matrix

| Layer | Test type | Tool | Location |
| ----- | --------- | ---- | -------- |
| `game/model/lines.ts` | unit | Vitest | `apps/web/src/domains/game/model/lines.test.ts` |
| `analysis/model` | unit | Vitest | `apps/web/src/domains/analysis/model/*.test.ts` |

## Gate Check Commands

- **quick**: `make lint-web typecheck-web test-web`
- **full**: `make check`

---

## Execution Plan

### Phase 1: Model

```
T1 → T2 → T3
```

---

## Task Breakdown

### T1: Line helpers in the game domain

**What**: `playCaptureLine`, `defendersOf`, `isAttackedBy`, `uciToSan` exported from `game/index.ts`.
**Where**: `apps/web/src/domains/game/model/lines.ts`
**Depends on**: None
**Reuses**: chess.js (AD-002)
**Requirement**: AN-19, AN-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Helpers tested on hand-made positions

**Tests**: unit
**Gate**: quick

---

### T2: Material and move classification

**What**: `material.ts`, `classify.ts`, `types.ts`, the engine evaluation fixture and its generator script.
**Where**: `apps/web/src/domains/analysis/model/classify.ts`
**Depends on**: T1
**Reuses**: `PositionEvaluation` type from `evaluation`
**Requirement**: AN-01, AN-02, AN-03, AN-04, AN-05, AN-06, AN-07, AN-08, AN-09, AN-10, AN-11, AN-12, AN-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Reference game yields exactly the five expected key moments

**Tests**: unit
**Gate**: quick

---

### T3: Selection, patterns, strengths, findings texts and boundary

**What**: `keyMoments.ts`, `findings.ts`, `analysis/index.ts`, boundary test.
**Where**: `apps/web/src/domains/analysis/model/keyMoments.ts`
**Depends on**: T2
**Reuses**: none
**Requirement**: AN-14, AN-15, AN-16, AN-17, AN-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `make check` passes with ≥ 90% on `analysis/model`

**Tests**: unit
**Gate**: full
