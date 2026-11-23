# F2 · Evaluation engine Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/evaluation-engine/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

| Layer | Test type | Tool | Location |
| ----- | --------- | ---- | -------- |
| `evaluation/model` | unit | Vitest | `apps/web/src/domains/evaluation/model/*.test.ts` |
| `EngineClient` | unit (fake worker) | Vitest | `apps/web/src/domains/evaluation/engine/*.test.ts` |
| loader machine | unit (createActor + provide) | Vitest | `apps/web/src/domains/evaluation/machines/*.test.ts` |
| status component + app wiring | component | Vitest + RTL | `apps/web/src/domains/evaluation/components/*.test.tsx`, `apps/web/src/app/App.test.tsx` |
| real engine in browser | e2e | Playwright | `apps/web/e2e/engine.spec.ts` |

## Gate Check Commands

- **quick**: `make lint-web typecheck-web test-web`
- **full**: `make check && make test-e2e`

---

## Execution Plan

### Phase 1: Engine

```
T1 → T2 → T3 → T4 → T5
```

---

## Task Breakdown

### T1: Engine files and build choice

**What**: `stockfish@19.0.1`, `scripts/copy-engine.mjs` + `postinstall`, `model/engineBuild.ts`.
**Where**: `apps/web/src/domains/evaluation/model/engineBuild.ts`
**Depends on**: None
**Reuses**: none
**Requirement**: EVAL-01, EVAL-02, EVAL-03, EVAL-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Files present after install; build choice tested

**Tests**: unit
**Gate**: quick

---

### T2: UCI parsing and score orientation

**What**: `model/uci.ts`, `model/searchPlan.ts`, `model/types.ts`.
**Where**: `apps/web/src/domains/evaluation/model/uci.ts`
**Depends on**: T1
**Reuses**: none
**Requirement**: EVAL-14, EVAL-19, EVAL-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Parser and orientation tested with real Stockfish output lines

**Tests**: unit
**Gate**: quick

---

### T3: EngineClient

**What**: worker wrapper with handshake, progress port, evaluate queue, deeper search, terminate.
**Where**: `apps/web/src/domains/evaluation/engine/EngineClient.ts`
**Depends on**: T2
**Reuses**: `model/uci.ts`
**Requirement**: EVAL-12, EVAL-13, EVAL-15, EVAL-16, EVAL-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Fake-worker tests assert exact UCI commands and resolved values

**Tests**: unit
**Gate**: quick

---

### T4: Loader machine, status component and app wiring

**What**: `engineLoaderMachine`, `EngineStatus`, root `invoke` in `appMachine`, `index.ts`.
**Where**: `apps/web/src/domains/evaluation/machines/engineLoaderMachine.ts`
**Depends on**: T3
**Reuses**: `EngineClient`, `AppMachineContext`
**Requirement**: EVAL-05, EVAL-06, EVAL-07, EVAL-08, EVAL-09, EVAL-10, EVAL-18

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [ ] Machine transitions tested with a fake loader actor; component texts tested

**Tests**: unit
**Gate**: quick

---

### T5: Real engine e2e and docs

**What**: Playwright test reaching "Motor pronto" with the multi-thread build; docs (Makefile/overview).
**Where**: `apps/web/e2e/engine.spec.ts`
**Depends on**: T4
**Reuses**: Playwright config
**Requirement**: EVAL-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `make check && make test-e2e` pass

**Tests**: e2e
**Gate**: full
