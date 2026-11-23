# F5 · Endgame tablebase Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/endgame-tablebase/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

| Layer | Test type | Tool | Location |
| ----- | --------- | ---- | -------- |
| tablebase generate/probe | unit | Vitest | next to code |
| analysis endgame model, machine | unit | Vitest | next to code |
| review stat card, footer | unit/component | Vitest + RTL | next to code |

## Gate Check Commands

- **quick**: `make lint-web typecheck-web test-web`
- **full**: `make check && make test-e2e`

---

## Execution Plan

### Phase 1: Engine 4

```
T1 → T2 → T3
```

---

## Task Breakdown

### T1: Tablebase generator and probe

**What**: retrograde generator for KQK/KRK and FEN probe.
**Where**: `apps/web/src/domains/evaluation/model/tablebase/`
**Depends on**: None
**Reuses**: None
**Requirement**: TB-01, TB-02, TB-03, TB-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Max DTM: KQK 10 moves, KRK 16 moves; known mates and stalemates

**Tests**: unit
**Gate**: quick

---

### T2: Worker, client and analysis stage 4

**What**: worker + client, `analysis/model/endgame.ts`, `endgame` state.
**Where**: `apps/web/src/domains/analysis/machines/analysisMachine.ts`
**Depends on**: T1
**Reuses**: fromPromise actor pattern
**Requirement**: TB-04, TB-05, TB-06

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [ ] Machine transitions tested with a fake probe

**Tests**: unit
**Gate**: quick

---

### T3: Result card, footer and docs

**What**: 4th stat card, footer status, docs.
**Where**: `apps/web/src/domains/review/model/review.ts`
**Depends on**: T2
**Reuses**: statCards
**Requirement**: TB-07, TB-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `make check && make test-e2e` pass

**Tests**: unit
**Gate**: full
