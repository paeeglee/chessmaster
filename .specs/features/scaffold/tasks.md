# F0 · Scaffolding Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/scaffold/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

| Layer | Test type | Tool | Location |
| ----- | --------- | ---- | -------- |
| Web app shell / machine | unit + component | Vitest + RTL | `apps/web/src/app/*.test.ts(x)` |
| Web headers, isolation, proxy | e2e | Playwright | `apps/web/e2e/*.spec.ts` |
| API routes, settings, export | unit + integration | pytest + TestClient | `apps/api/tests/` |
| Makefile contract | command run | make | n/a (gate) |

## Gate Check Commands

- **quick-web**: `cd apps/web && pnpm lint && pnpm typecheck && pnpm test`
- **quick-api**: `cd apps/api && uv run ruff check && uv run mypy && uv run pytest`
- **full**: `make check`
- **e2e**: `make test-e2e`

---

## Execution Plan

### Phase 1: Apps

```
T1 → T2 → T3
T4
```

### Phase 2: Integration

```
T3 → T5
T4 → T5
T5 → T6 → T7
```

---

## Task Breakdown

### T1: Scaffold the web app toolchain

**What**: `apps/web` with React, Vite, TS strict, Biome, Vitest (jsdom, RTL, jest-dom, user-event), MSW server, and a minimal `App` that renders.
**Where**: `apps/web/`
**Depends on**: None
**Reuses**: none
**Requirement**: SCAF-07, SCAF-25

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` pass
- [x] `strict: true` and `engines.node` match `.nvmrc`

**Tests**: unit
**Gate**: quick-web

---

### T2: Theme tokens, root machine and app shell

**What**: `@theme` tokens, `appMachine` + `createActorContext`, `AppHeader`, `lang="pt-BR"`.
**Where**: `apps/web/src/app/`, `apps/web/index.html`
**Depends on**: T1
**Reuses**: `docs/design/step_01/Main.dc.html:20-25`
**Requirement**: SCAF-04, SCAF-05, SCAF-06, SCAF-26

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [ ] Header banner with "Analisador de partidas" renders from the machine context
- [ ] Machine test with `createActor` passes
- [ ] No literal mockup colors in components

**Tests**: unit
**Gate**: quick-web

---

### T3: Cross-origin isolation, proxy and Playwright

**What**: COOP/COEP on dev and preview, `/api` proxy, Playwright config and isolation e2e test.
**Where**: `apps/web/vite.config.ts`, `apps/web/playwright.config.ts`, `apps/web/e2e/isolation.spec.ts`
**Depends on**: T2
**Reuses**: none
**Requirement**: SCAF-01, SCAF-02, SCAF-03

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [ ] e2e asserts both headers and `crossOriginIsolated === true` on preview
- [ ] dev server headers checked manually

**Tests**: e2e
**Gate**: e2e

---

### T4: Scaffold the API

**What**: `apps/api` with uv, FastAPI health route, settings, OpenAPI export, Ruff, mypy strict, pytest-cov, `llm` marker.
**Where**: `apps/api/`
**Depends on**: None
**Reuses**: `apps/api/.env.example`
**Requirement**: SCAF-08, SCAF-10, SCAF-11, SCAF-12, SCAF-13, SCAF-20, SCAF-25

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [ ] quick-api gate passes with coverage ≥ 80%

**Tests**: unit, integration
**Gate**: quick-api

---

### T5: Makefile contract

**What**: All targets from `CLAUDE.md` with `-web`/`-api` variants, nvm-aware, pnpm bootstrap.
**Where**: `Makefile`
**Depends on**: T3, T4
**Reuses**: existing `setup-env`, `design`, `help`
**Requirement**: SCAF-14, SCAF-15, SCAF-16, SCAF-17, SCAF-18, SCAF-19, SCAF-22, SCAF-24

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `make setup && make check` pass; a lint error makes `make check` fail

**Tests**: none (command run)
**Gate**: full

---

### T6: Proxy e2e and API type generation

**What**: e2e test for `/api/health` through the preview proxy (API as a second webServer), `make test-e2e`, `make generate-api-types` producing `schema.gen.ts`.
**Where**: `apps/web/e2e/proxy.spec.ts`, `apps/web/src/domains/explanation/api/schema.gen.ts`, `Makefile`
**Depends on**: T5
**Reuses**: `game_analyzer.export_openapi`
**Requirement**: SCAF-09, SCAF-21, SCAF-23

**Tools**:

- MCP: `context7`
- Skill: NONE

**Done when**:

- [ ] `make test-e2e` passes
- [ ] `schema.gen.ts` contains `/api/health` and type-checks

**Tests**: e2e
**Gate**: e2e

---

### T7: Docs update

**What**: Update `CLAUDE.md` (Makefile section), `quality.md` (pnpm without corepack, TS pin, API per-layer coverage note), `overview.md` (preview port 4173).
**Where**: `CLAUDE.md`, `docs/`
**Depends on**: T6
**Reuses**: none
**Requirement**: SCAF-14, SCAF-24

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Docs match the implemented toolchain; `make check` still passes

**Tests**: none
**Gate**: full
