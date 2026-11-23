# F0 · Scaffolding Specification

## Problem Statement

The repository has docs, designs and a Makefile with only `setup`, `design` and `help`. No app exists, so no feature (parser, engine, AI layer, screens) can be built or verified. F0 creates both apps with the exact toolchain the docs require, so every later feature starts from a working `make check` and a cross-origin-isolated dev server.

## Goals

- [ ] `make setup && make check` passes on a clean clone (lint, types and tests for both apps).
- [ ] `make dev` serves the frontend on `5173` with `crossOriginIsolated === true`, and `/api/*` reaches the backend on `8000` through the Vite proxy.
- [ ] Every Makefile target listed in `CLAUDE.md` exists and works.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Stockfish package, engine copy script, `public/engine/` | F2 (evaluation domain) |
| `chess.js` and the parser | F1 (game domain) |
| LangChain, AI providers, prompts, the explanation contract | F6 (API explanation) |
| Real screens (Colar, Analisando, Resultado, Treino) and their machines | F3, F4, F7, F8 |
| Domain folders with no code yet | Created lazily by the feature that needs them |
| CI pipeline, git hooks, production hosting/deploy headers | No remote or hosting decided yet |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Base branch | F0 branches from `origin/main` | PR #1 (XState and chess.js docs) is merged | y |
| Backend Python package name | `game_analyzer` (`apps/api/src/game_analyzer/`) | Natural English name for "Analisador de partidas"; docs show `<package>` as a placeholder | y |
| What the frontend shows in F0 | An app shell: the header from the step_01 mockup (brand "Analisador de partidas") and a placeholder main area, rendered by the root XState machine in its single initial state | Proves Tailwind tokens, React and XState are wired without building any PRD screen | y |
| Health endpoint | `GET /api/health` → `200 {"status": "ok"}` | Gives the proxy, the OpenAPI type generation and the backend tests a real route; not a product feature | y |
| Where generated API types live | `apps/web/src/domains/explanation/api/schema.gen.ts` | `overview.md` puts the generated types in the `explanation` domain in a `*.gen.ts` file | y |
| Design tokens scope | All colors, font stacks, radii and shadows that repeat across the four mockups go into the Tailwind theme now | `CLAUDE.md`: tokens repeat across screens, define them once; every later screen needs them | y |
| Fonts | System font stacks only, exactly as in the mockups (serif `Iowan Old Style…`, sans `system-ui…`, mono `ui-monospace…`) | The mockups use no web fonts, so COEP blocks nothing | y (from designs) |
| Library versions | Latest stable of each tool at implementation time, exact versions pinned; Node 26 (`.nvmrc`), Python 3.14 (`.python-version`) | `quality.md` | y (from docs) |
| Coverage thresholds | Enforced now: 80% total per app; 90% for `src/domains/**/model/**` (web) and `domain/`, `application/` (api) | `quality.md`; enforcing from day one avoids retrofitting | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Frontend app runs cross-origin isolated ⭐ MVP

**User Story**: As a developer, I want `apps/web` (React, Vite, TypeScript strict, Tailwind, XState 5) running with COOP/COEP so that the multi-thread Stockfish (D1) can work in every later feature.

**Why P1**: Without isolation `SharedArrayBuffer` is unavailable and D1 cannot be verified; every screen depends on this shell.

**Acceptance Criteria**:

1. WHEN the Vite dev server serves any page THEN it SHALL send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. <!-- SCAF-01 -->
2. WHEN the Vite preview server (`vite preview`, used by Playwright) serves any page THEN it SHALL send the same two headers. <!-- SCAF-02 -->
3. WHEN the app loads in Chromium through the dev or preview server THEN `window.crossOriginIsolated` SHALL be `true`. <!-- SCAF-03 -->
4. WHEN the app loads THEN the page SHALL show a banner landmark containing the text "Analisador de partidas" and SHALL have `lang="pt-BR"` on `<html>`. <!-- SCAF-04 -->
5. The root XState machine in `apps/web/src/app/` SHALL be created with `setup({ types })` and provided to React with `createActorContext`; the shell SHALL read its state through that context. <!-- SCAF-05 -->
6. The Tailwind theme SHALL define the repeated mockup tokens (colors, the three font stacks, radii, shadows) once, and the shell SHALL use them instead of literal values. <!-- SCAF-06 -->
7. The TypeScript config SHALL have `strict: true`. <!-- SCAF-07 -->

**Independent Test**: `make dev`, open `http://localhost:5173`, see the header; Playwright asserts `crossOriginIsolated === true` and the two response headers.

---

### P1: Backend app runs and answers through the proxy ⭐ MVP

**User Story**: As a developer, I want `apps/api` (FastAPI, Pydantic, pydantic-settings, uv) running on `8000`, reachable from the frontend at `/api`, so that F6 can add the AI layer without touching the wiring.

**Why P1**: The frontend ↔ backend contract and same-origin proxy are architecture rules every API feature relies on.

**Acceptance Criteria**:

1. WHEN a client sends `GET /api/health` to the backend THEN it SHALL respond `200` with body `{"status": "ok"}`. <!-- SCAF-08 -->
2. WHEN the frontend dev server receives a request under `/api/` THEN it SHALL proxy it to `http://localhost:8000` so that `GET http://localhost:5173/api/health` returns the backend's `200 {"status": "ok"}`. <!-- SCAF-09 -->
3. The backend SHALL read `AI_PROVIDER`, `AI_MODEL` and `OPENAI_API_KEY` with `pydantic-settings` from the environment and `apps/api/.env`, with defaults `openai` and `gpt-5.1` for the first two. <!-- SCAF-10 -->
4. IF `OPENAI_API_KEY` is empty THEN the backend SHALL still start and answer `/api/health` (the key is only required by the AI layer in F6). <!-- SCAF-11 -->
5. The backend SHALL follow the DDD layout in `code-structure.md`: `src/game_analyzer/main.py` creates the app and mounts routers, and config lives in `src/game_analyzer/shared/`. <!-- SCAF-12 -->
6. The backend SHALL expose its OpenAPI schema at `/api/openapi.json`. <!-- SCAF-13 -->

**Independent Test**: `make dev-api`, `curl localhost:8000/api/health`; with both apps up, `curl localhost:5173/api/health` returns the same body.

---

### P1: Quality toolchain and Makefile contract ⭐ MVP

**User Story**: As a developer, I want every Makefile target from `CLAUDE.md` working for both apps so that `make check` is the single gate before any commit.

**Why P1**: `CLAUDE.md` makes `make check` mandatory before every commit; later features cannot meet the definition of done without it.

**Acceptance Criteria**:

1. WHEN `make setup` runs on a clean clone THEN it SHALL install web dependencies with pnpm (version pinned in `packageManager`), sync api dependencies with uv, install the Playwright Chromium browser, and copy each missing `.env` from its `.env.example` without overwriting an existing one. <!-- SCAF-14 -->
2. WHEN `make dev` runs THEN it SHALL start the Vite dev server on `5173` and uvicorn on `8000` together, and stopping it (Ctrl+C) SHALL stop both. <!-- SCAF-15 -->
3. WHEN `make lint` runs THEN it SHALL run Biome on `apps/web` and Ruff on `apps/api`, excluding `*.gen.ts`, and exit non-zero on any violation. <!-- SCAF-16 -->
4. WHEN `make format` runs THEN it SHALL format `apps/web` with Biome and `apps/api` with `ruff format`. <!-- SCAF-17 -->
5. WHEN `make typecheck` runs THEN it SHALL run `tsc --noEmit` and `mypy --strict` and exit non-zero on any error. <!-- SCAF-18 -->
6. WHEN `make test` runs THEN it SHALL run Vitest (jsdom, React Testing Library, user-event, MSW available) and pytest with `pytest-cov`, and SHALL fail if coverage is below the thresholds in the Assumptions table. <!-- SCAF-19 -->
7. WHEN `make test` runs THEN pytest SHALL skip tests marked `@pytest.mark.llm` unless explicitly selected. <!-- SCAF-20 -->
8. WHEN `make test-e2e` runs THEN it SHALL build the web app, serve it with `vite preview` (isolation headers on), and run Playwright against it. <!-- SCAF-21 -->
9. WHEN `make check` runs THEN it SHALL run `lint`, `typecheck` and `test` in that order and stop at the first failure. <!-- SCAF-22 -->
10. WHEN `make generate-api-types` runs THEN it SHALL export the backend OpenAPI schema without starting a server and generate `apps/web/src/domains/explanation/api/schema.gen.ts` with `openapi-typescript`. <!-- SCAF-23 -->
11. Every aggregate target SHALL have per-app variants named `<target>-web` and `<target>-api`, and `make help` SHALL list all targets. <!-- SCAF-24 -->
12. `apps/web/package.json` `engines.node` SHALL match `.nvmrc` (26) and `apps/api/pyproject.toml` `requires-python` SHALL match `.python-version` (3.14). <!-- SCAF-25 -->

**Independent Test**: on a fresh worktree, `make setup && make check && make test-e2e` all exit 0; introducing a lint error or a type error makes `make check` exit non-zero.

---

## Edge Cases

- IF `.env` already exists in an app THEN `make setup` SHALL keep it unchanged. <!-- covered by SCAF-14 -->
- IF port `8000` is down while the frontend calls `/api/health` THEN the proxy SHALL return a 5xx and the shell SHALL still render (the shell does not depend on the backend). <!-- SCAF-26 -->
- IF a file matches `*.gen.ts` THEN Biome lint and format SHALL ignore it. <!-- covered by SCAF-16 -->

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | N/A because the only route takes no input. |
| Failure / partial-failure states | SCAF-11 (missing key), SCAF-26 (backend down). |
| Idempotency / retry | SCAF-14: `make setup` is safe to re-run. |
| Auth boundaries & rate limits | N/A because the MVP has no accounts and the only route is a health check. |
| Concurrency / ordering | SCAF-15: both servers start and stop together; SCAF-22: check order. |
| Data lifecycle / expiry | N/A because nothing is stored (stateless backend, D2). |
| Observability | N/A for F0; engine/AI metrics belong to F2–F6. |
| External-dependency failure | SCAF-26. |
| State-transition integrity | N/A because the root machine has one state in F0; transitions arrive with the screens. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| SCAF-01 | P1: Frontend isolated | Tasks | Implementing |
| SCAF-02 | P1: Frontend isolated | Tasks | Implementing |
| SCAF-03 | P1: Frontend isolated | Tasks | Implementing |
| SCAF-04 | P1: Frontend isolated | Tasks | Implementing |
| SCAF-05 | P1: Frontend isolated | Tasks | Implementing |
| SCAF-06 | P1: Frontend isolated | Tasks | Implementing |
| SCAF-07 | P1: Frontend isolated | Tasks | Implementing |
| SCAF-08 | P1: Backend + proxy | Tasks | Implementing |
| SCAF-09 | P1: Backend + proxy | Tasks | Implementing |
| SCAF-10 | P1: Backend + proxy | Tasks | Implementing |
| SCAF-11 | P1: Backend + proxy | Tasks | Implementing |
| SCAF-12 | P1: Backend + proxy | Tasks | Implementing |
| SCAF-13 | P1: Backend + proxy | Tasks | Implementing |
| SCAF-14 | P1: Toolchain | Tasks | Implementing |
| SCAF-15 | P1: Toolchain | Tasks | Implementing |
| SCAF-16 | P1: Toolchain | Tasks | Implementing |
| SCAF-17 | P1: Toolchain | Tasks | Implementing |
| SCAF-18 | P1: Toolchain | Tasks | Implementing |
| SCAF-19 | P1: Toolchain | Tasks | Implementing |
| SCAF-20 | P1: Toolchain | Tasks | Implementing |
| SCAF-21 | P1: Toolchain | Tasks | Implementing |
| SCAF-22 | P1: Toolchain | Tasks | Implementing |
| SCAF-23 | P1: Toolchain | Tasks | Implementing |
| SCAF-24 | P1: Toolchain | Tasks | Implementing |
| SCAF-25 | P1: Toolchain | Tasks | Implementing |
| SCAF-26 | Edge case | Tasks | Implementing |

**Coverage:** 26 total, 26 mapped to tasks (T1–T7), 0 unmapped

---

## Success Criteria

- [ ] On a fresh worktree, `make setup && make check && make test-e2e` exit 0 with no manual step.
- [ ] Playwright proves `crossOriginIsolated === true` on the preview server.
- [ ] `make generate-api-types` produces a `schema.gen.ts` that type-checks and contains the `/api/health` path.
