# F4b · Analysis pipeline and screen Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/analysis-screen/design.md`
**Status**: Done

---

## Test Coverage Matrix

| Layer | Test type | Tool | Location |
| ----- | --------- | ---- | -------- |
| analysis/explanation models | unit | Vitest | next to code |
| EngineClient.cancel | unit (fake worker) | Vitest | `evaluation/engine/EngineClient.test.ts` |
| analysisMachine + appMachine | unit (createActor + provide) | Vitest | next to machines |
| AnalyzingScreen | component | Vitest + RTL | `analysis/components/*.test.tsx` |
| full flow | e2e | Playwright (real engine, fake AI) | `apps/web/e2e/analysis.spec.ts` |

## Gate Check Commands

- **quick**: `make lint-web typecheck-web test-web`
- **full**: `make check && make test-e2e`

---

## Execution Plan

### Phase 1: Pipeline

```
T1 → T2 → T3 → T4 → T5
```

---

## Task Breakdown

### T1: Engine cancel and analysis summary models

**What**: `EngineClient.cancel`, `analysis/model/result.ts`, `progress.ts`, finding items.
**Where**: `apps/web/src/domains/analysis/model/result.ts`
**Depends on**: None
**Reuses**: F4a classification
**Requirement**: AS-03, AS-10, AS-12, AS-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Summary of the reference game matches F4a results; progress math tested

**Tests**: unit
**Gate**: quick

---

### T2: Contract builder and explanation client

**What**: `buildContract` (analysis domain, to avoid a cycle) and `requestExplanation`/`askQuestion` (explanation domain, MSW-tested).
**Where**: `apps/web/src/domains/analysis/model/contract.ts`
**Depends on**: T1
**Reuses**: generated `schema.gen.ts`
**Requirement**: AS-14, AS-15

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [x] Reference contract asserted field by field

**Tests**: unit
**Gate**: quick

---

### T3: Analysis machine and app wiring

**What**: `analysisMachine`, app states `analyzing`/`review`, cancel.
**Where**: `apps/web/src/domains/analysis/machines/analysisMachine.ts`
**Depends on**: T2
**Reuses**: XState patterns from F2/F3
**Requirement**: AS-01, AS-02, AS-04, AS-05, AS-06, AS-07, AS-08

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [x] Every transition tested with fake engine and fake API

**Tests**: unit
**Gate**: quick

---

### T4: Analisando screen

**What**: `AnalyzingScreen` and parts, result placeholder.
**Where**: `apps/web/src/domains/analysis/components/AnalyzingScreen.tsx`
**Depends on**: T3
**Reuses**: `Board`, `StepIndicator`
**Requirement**: AS-09, AS-10, AS-11, AS-12, AS-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Component tests by role/text

**Tests**: unit
**Gate**: quick

---

### T5: End-to-end flow and docs

**What**: Playwright run of the reference game; visual check; docs.
**Where**: `apps/web/e2e/analysis.spec.ts`
**Depends on**: T4
**Reuses**: Playwright config (API with `AI_PROVIDER=fake`)
**Requirement**: AS-05, AS-08, AS-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `make check && make test-e2e` pass

**Tests**: e2e
**Gate**: full
