# F6 · AI explanation layer Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/explanation-api/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

| Layer | Test type | Tool | Location |
| ----- | --------- | ---- | -------- |
| domain | unit | pytest | `apps/api/src/game_analyzer/domains/explanation/tests/` |
| application | unit (fake provider) | pytest | same |
| infrastructure | unit (fake LangChain model) | pytest | same |
| api | route tests | pytest + TestClient | same |

## Gate Check Commands

- **quick**: `make lint-api typecheck-api test-api`
- **full**: `make check`

---

## Execution Plan

### Phase 1: Layer

```
T1 → T2 → T3 → T4
```

---

## Task Breakdown

### T1: Contract and verification

**What**: `domain/contract.py`, `domain/verification.py`.
**Where**: `apps/api/src/game_analyzer/domains/explanation/domain/verification.py`
**Depends on**: None
**Reuses**: Pydantic
**Requirement**: EXP-05, EXP-06, EXP-07, EXP-08, EXP-15

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [x] Verification rules tested with exact violations

**Tests**: unit
**Gate**: quick

---

### T2: Use cases, port and prompts

**What**: `application/*`, `prompts/*.v1.md`.
**Where**: `apps/api/src/game_analyzer/domains/explanation/application/explain_game.py`
**Depends on**: T1
**Reuses**: contract
**Requirement**: EXP-03, EXP-09, EXP-11, EXP-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Retry flow tested with scripted providers

**Tests**: unit
**Gate**: quick

---

### T3: Providers

**What**: OpenAI (LangChain) and fake adapters, factory from settings.
**Where**: `apps/api/src/game_analyzer/domains/explanation/infrastructure/openai_provider.py`
**Depends on**: T2
**Reuses**: `shared/config.py`
**Requirement**: EXP-12, EXP-13, EXP-15

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [ ] Adapters tested without network

**Tests**: unit
**Gate**: quick

---

### T4: Routes, coverage gate, types and docs

**What**: router, wiring in `main.py`, per-layer coverage check, regenerated TS types, `.env.example`/docs.
**Where**: `apps/api/src/game_analyzer/domains/explanation/api/router.py`
**Depends on**: T3
**Reuses**: health router pattern
**Requirement**: EXP-01, EXP-02, EXP-04, EXP-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `make check` passes and `make generate-api-types` updates `schema.gen.ts`

**Tests**: integration
**Gate**: full
