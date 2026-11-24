# F9 · Revisão lance a lance Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/move-review/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

| Layer | Test type | Tool | Location |
| ----- | --------- | ---- | -------- |
| moveQuality, moveFacts, moveReview, enPrisePieces | unit | Vitest | next to code |
| API move route, use case, verification | unit | pytest | `explanation/tests` |
| reviewMachine coach region | unit | Vitest | next to code |
| CoachPanel, EvalBar, MoveList | component | Vitest + RTL | next to code |
| Reference game review | e2e | Playwright | `apps/web/e2e/review.spec.ts` |

## Gate Check Commands

- **quick**: `make lint typecheck test`
- **full**: `make check && make test-e2e`

---

## Execution Plan

### Phase 1: Engine facts, AI and screen

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

---

## Task Breakdown

### T1: Engine time 500 ms

**What**: `MOVETIME_MS = 500`, estimate on screen 1, D1/metric docs.
**Where**: `apps/web/src/domains/evaluation/model/searchPlan.ts`
**Depends on**: None
**Reuses**: estimateSeconds
**Requirement**: MR-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Estimate test follows 500 ms

**Tests**: unit
**Gate**: quick

---

### T2: Move quality (win chance and classification)

**What**: `moveQuality.ts`.
**Where**: `apps/web/src/domains/analysis/model/moveQuality.ts`
**Depends on**: T1
**Reuses**: EngineScore
**Requirement**: MR-01, MR-02, MR-03, MR-04, MR-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Band boundaries, mate scores, miss rule tested

**Tests**: unit
**Gate**: quick

---

### T3: Move facts

**What**: `enPrisePieces`, `moveFacts.ts`.
**Where**: `apps/web/src/domains/analysis/model/moveFacts.ts`
**Depends on**: T2
**Reuses**: playCaptureLine, defendersOf, uciToSan
**Requirement**: MR-05, MR-06, MR-07, MR-08, MR-19

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 22...Ta7: best 22...Bd4+, bishop a1 left undefended, reasons check + saves piece

**Tests**: unit
**Gate**: quick

---

### T4: Move reviews in the analysis result

**What**: `reviewMoves`, `AnalysisResult.moveReviews`, fixtures.
**Where**: `apps/web/src/domains/analysis/model/moveReview.ts`
**Depends on**: T3
**Reuses**: summarizeAnalysis
**Requirement**: MR-01, MR-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Reference fixture: one review per ply

**Tests**: unit
**Gate**: quick

---

### T5: Move explanation API

**What**: move contract, use case, route, prompt, fake provider; regenerate web API types.
**Where**: `apps/api/src/game_analyzer/domains/explanation/`
**Depends on**: T4
**Reuses**: ExplainGame, verification
**Requirement**: MR-13, MR-14

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [ ] Route returns verified text; 502 after two rejections; 422 on bad body

**Tests**: unit
**Gate**: quick

---

### T6: Coach region in the review machine

**What**: `buildMoveContract`, `requestMoveExplanation`, `coach` region with cache and retry.
**Where**: `apps/web/src/domains/review/machines/reviewMachine.ts`
**Depends on**: T5
**Reuses**: askQuestion pattern
**Requirement**: MR-13, MR-15, MR-16

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [ ] Request on first selection, cache hit, failure + retry tested

**Tests**: unit
**Gate**: quick

---

### T7: Coach panel, eval bar and move icons

**What**: `CoachPanel`, `EvalBar`, classification icons in `MoveList`.
**Where**: `apps/web/src/domains/review/components/CoachPanel.tsx`
**Depends on**: T6
**Reuses**: Result screen tokens
**Requirement**: MR-09, MR-10, MR-11, MR-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Component tests by role and text

**Tests**: unit
**Gate**: quick

---

### T8: End-to-end, visual check and docs

**What**: e2e on the reference game, screenshot check, PRD/overview/glossary updates.
**Where**: `apps/web/e2e/review.spec.ts`
**Depends on**: T7
**Reuses**: reference helpers
**Requirement**: MR-10, MR-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `make check && make test-e2e` pass

**Tests**: e2e
**Gate**: full
