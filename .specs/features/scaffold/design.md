# F0 · Scaffolding Design

**Spec**: `.specs/features/scaffold/spec.md`
**Status**: Approved (user delegated decisions on 2026-11-22)

---

## Architecture Overview

Two independent apps wired only through the dev/preview proxy and the generated OpenAPI types. The root Makefile is the single entry point.

```mermaid
graph LR
  B[Browser] -->|5173 dev / 4173 preview\nCOOP+COEP| V[Vite]
  V -->|/api/* proxy| F[FastAPI :8000]
  F -->|app.openapi()| O[openapi.json]
  O -->|openapi-typescript| T[explanation/api/schema.gen.ts]
  M[Makefile] --> V
  M --> F
```

## Code Reuse Analysis

| Existing | Location | How to use |
| -------- | -------- | ---------- |
| `setup-env`, `design`, `help` targets | `Makefile` | Keep; extend `setup` and `help` |
| `.env.example` | `apps/api/.env.example` | Settings fields mirror it 1:1 |
| Mockup header values | `docs/design/step_01/Main.dc.html:20-25` | Shell header, exact values |
| Repeated colors/radii/shadows | all four mockups | Theme tokens |

## Components

### Web app (`apps/web`)
- `package.json`: `packageManager: pnpm@12.21.0`, `engines.node: ">=26 <27"`, scripts `dev`, `build`, `preview`, `lint`, `format`, `typecheck`, `test`, `test:e2e`, `generate:api-types`.
- `vite.config.ts`: `@vitejs/plugin-react`, `@tailwindcss/vite`; `server.port 5173` / `preview.port 4173`, both `strictPort`; `server.headers` and `preview.headers` = the shared `crossOriginIsolationHeaders` const; `server.proxy['/api'] → http://localhost:8000` (preview inherits `server.proxy` per Vite docs). Vitest config in the same file (`test` block): `jsdom`, `setupFiles: ['./vitest.setup.ts']`, coverage v8 with global 80% and `'src/domains/**/model/**': 90%`.
- `vitest.setup.ts`: `@testing-library/jest-dom/vitest`; MSW `server.listen({ onUnhandledFrame: "error" })`, `resetHandlers`, `close`.
- `src/shared/lib/testing/server.ts`: `setupServer()` with no handlers (domains add theirs with `server.use`).
- `src/app/theme.css`: `@import "tailwindcss"` + `@theme` tokens (below) + base body styles from the mockup helmet.
- `src/app/appMachine.ts`: `setup({ types: { context: {}, events: {} as never-ish } }).createMachine({ id: 'app', initial: 'gameInput', states: { gameInput: {} } })`.
- `src/app/AppMachineContext.ts`: `createActorContext(appMachine)`.
- `src/app/App.tsx`: Provider + `AppHeader` + `<main>` placeholder showing the current screen derived from `useSelector(s => s.value)`.
- `src/app/AppHeader.tsx`: brand mark, "Analisador de partidas", subtitle; nav shows only "Analisar partida" (D2 removes "Minhas partidas").
- `src/main.tsx`, `index.html` (`lang="pt-BR"`).
- `e2e/isolation.spec.ts`, `e2e/proxy.spec.ts`; `playwright.config.ts` with two `webServer`s: `pnpm build && pnpm preview` (4173) and the API (`uv run uvicorn … --port 8000`, cwd `../api`).
- `biome.json`: recommended rules, `files.includes: ["**", "!**/*.gen.ts", "!!**/dist", …]`, `vcs.useIgnoreFile: true`.

### API (`apps/api`)
- `pyproject.toml`: package `game-analyzer`, `requires-python = ">=3.14,<3.15"`, build backend `uv_build`; deps `fastapi`, `uvicorn[standard]`, `pydantic-settings`; dev group `pytest`, `pytest-cov`, `httpx`, `mypy`, `ruff`. Ruff: E, F, UP, B, SIM, I. Mypy: `strict = true`, `plugins = ["pydantic.mypy"]`. Pytest: `--strict-markers`, `-m "not llm"`, marker `llm`, `--cov=game_analyzer --cov-fail-under=80`.
- `src/game_analyzer/main.py`: `create_app() -> FastAPI` with `openapi_url="/api/openapi.json"`, `docs_url="/api/docs"`, `redoc_url=None`; mounts `health_router` under `/api`; module-level `app = create_app()`.
- `src/game_analyzer/shared/config.py`: `Settings(BaseSettings)` with `ai_provider: str = "openai"`, `ai_model: str = "gpt-5.1"`, `openai_api_key: SecretStr = SecretStr("")`; `env_file=".env"`; `get_settings()` cached.
- `src/game_analyzer/shared/health.py`: `APIRouter`, `GET /health` → `HealthResponse(status: Literal["ok"])`.
- `src/game_analyzer/export_openapi.py`: prints `create_app().openapi()` as JSON (no server).
- `tests/`: `test_health.py`, `test_config.py`, `test_openapi_export.py`.

### Makefile
- Per-app targets `<t>-web` / `<t>-api` for setup, dev, lint, format, typecheck, test; aggregates call both. `dev` = `$(MAKE) -j2 dev-web dev-api` (Ctrl+C stops the whole group). `check` = `lint typecheck test` as ordered prerequisites run serially. `test-e2e` = Playwright. `generate-api-types` = export → temp file → `openapi-typescript`.
- `setup-web`: installs pnpm with `npm install -g pnpm@<pinned>` only if `pnpm` is missing (Node 26 ships no corepack), then `pnpm install --frozen-lockfile` (falls back to plain install when no lockfile yet) and `pnpm exec playwright install chromium`.
- Every recipe that runs node first loads `.nvmrc` via `nvm use` when nvm exists, so the pinned Node is used.

## Theme tokens (`@theme`)

| Token | Value | Usage in mockups |
| ----- | ----- | ---------------- |
| `--color-ink` | `#1c2026` | main text |
| `--color-ink-muted` | `#4a525c` | secondary text |
| `--color-surface` | `#ffffff` | cards, header |
| `--color-canvas` | `#f3f2ee` | page background, chips |
| `--color-field` | `#faf9f6` | textarea background |
| `--color-line` | `#dcd9d0` | borders |
| `--color-line-strong` | `#c9c5ba` | input borders, step connectors |
| `--color-brand` | `#0d5f63` | primary, links |
| `--color-brand-hover` | `#0a4d50` | link hover |
| `--color-brand-soft` | `#e1efee` | selected backgrounds |
| `--color-danger` / `-soft` | `#a3231b` / `#fbe7e5` | "Erro" tags |
| `--color-success` / `-soft` | `#1c6b45` / `#e3f2ea` | "Bom" tags, checks |
| `--color-warning` / `-soft` | `#9a5b00` / `#fbf0dc` | amber feedback |
| `--font-serif` | `'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif` | headings |
| `--font-sans` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | body |
| `--font-mono` | `ui-monospace, 'SF Mono', Menlo, Consolas, monospace` | textarea |
| `--font-chess` | `'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', serif` | piece glyphs |
| `--radius-sm/md/lg/xl/brand` | `6px / 8px / 10px / 12px / 9px` | chips / buttons / nav / cards / logo |
| `--shadow-raised` | `0 1px 3px rgba(0,0,0,0.12)` | active nav pill |
| `--shadow-overlay` | `0 2px 10px rgba(0,0,0,0.18)` | popovers |

Board square and highlight colors are left to the board feature (first screen that draws a board).

## Error Handling Strategy

| Scenario | Handling | Impact |
| -------- | -------- | ------ |
| `OPENAI_API_KEY` empty | `SecretStr("")` default, no validation at startup | API starts; F6 validates when it needs the key |
| Backend down | Vite proxy returns 5xx; shell makes no API call | Shell still renders |
| Node < 26 in PATH | Makefile runs `nvm use` from `.nvmrc`; `engines` + `engine-strict` make pnpm refuse other majors | Clear error instead of silent drift |

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| ------- | -------- | ------ | ---------- |
| Node 26 ships without corepack, but `quality.md` says "ativada com `corepack enable`" | `docs/engineering/quality.md` | `make setup` would fail on a clean machine | `setup-web` installs the pinned pnpm with npm; pnpm then self-switches to `packageManager`. Update `quality.md`. |
| TypeScript 7 is `latest`, but `openapi-typescript@7` peers `typescript ^5` | `apps/web/package.json` | `generate-api-types` could break | Pin `typescript@5.9.3`; note in `quality.md`. |
| Per-layer 90% coverage for API `domain/` + `application/` cannot be enforced while those folders do not exist | `apps/api` | Threshold silently absent | F0 enforces 80% total; F6 adds `coverage report --include` checks when the layers appear (logged in `quality.md`). |
| Port 8000/5173 already in use | dev machine | `make dev`/e2e fail | `strictPort` gives a clear error; Playwright `reuseExistingServer` locally. |

## Tech Decisions

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| Vitest config location | `test` block in `vite.config.ts` | One config; Vitest reads it natively |
| Running both dev servers | `make -j2` | No extra dependency (no `concurrently`) |
| OpenAPI export | Python module printing `app.openapi()` | No running server needed (SCAF-23) |
| MSW default | `onUnhandledFrame: "error"` (MSW 3) | Enforces "no test calls the real network" |
