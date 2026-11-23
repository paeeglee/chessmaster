# CLAUDE.md

This file tells Claude Code how to work in this repository. It holds the rules
that always apply; details live in `docs/` (in Brazilian Portuguese) and are
imported or linked below.

## Product

**Analisador de partidas** is an AI-powered chess game analyzer for beginner
players (rated up to about 1200) who play online, mainly on Chess.com. The player
pastes a game and gets a plain-language analysis in Brazilian Portuguese: where
the game was decided, which mistakes repeat, and what to practice. Each key
mistake becomes a "find the move" exercise built from the real position.

**Core principle: engines calculate, the AI only explains.** Evaluations, best
moves, material and mistake classification always come from deterministic
engines. The AI only writes text from a closed JSON contract and never makes up a
number or a move. Engines 1–4 run in the browser (`apps/web`); the AI layer runs
in the backend (`apps/api`). See `docs/architecture/overview.md`.

`docs/` is the source of truth. When this file and `docs/` disagree, `docs/` wins.

## Mandatory: check current docs in Context7 before writing code

This rule applies to every coding agent working in this repository, including
subagents.

- Before writing or changing code that uses a library, framework or tool (React,
  Vite, Tailwind CSS, XState, FastAPI, LangChain, Pydantic, Stockfish, Vitest, Playwright,
  pytest, Biome, Ruff, mypy, pnpm, uv and any other), look up its current
  documentation and best practices in [Context7](https://context7.com/) (the
  Context7 MCP server: resolve the library ID, then fetch the docs for the topic).
- Do this for every library the change touches, not only the main one. Do it
  again when the task moves to a different library or a different part of the
  same one.
- Follow what the docs say for the installed version. Do not rely on memory.
- In your summary of the work, list the libraries and topics you looked up.
- **Code written without this lookup is invalid.** It must be thrown away and
  written again after the lookup. When reviewing, reject a change that does not
  show the lookup was done.
- If Context7 is unavailable (not connected, not authenticated or returning
  errors), stop and tell the user before writing code. Do not skip the lookup.

## Documentation index

Always loaded:

- @docs/product/glossary.md
- @docs/architecture/code-structure.md
- @docs/engineering/quality.md

Read when the task needs it:

| File | What it covers | When to read it |
| ---- | -------------- | --------------- |
| [`docs/product/general.md`](docs/product/general.md) | Product PRD overview: problem, audience, goals, MVP scope (in and out), main flow, the five engines, classification rules, engine → AI contract, non-functional requirements, risks, MVP decisions (D1–D5). | Before any task that touches product behavior, scope or architecture. |
| [`docs/architecture/overview.md`](docs/architecture/overview.md) | Technical architecture: where each engine runs, MVP technical decisions, frontend state with XState, cross-origin isolation, privacy, frontend ↔ backend contract, ports and proxy, environment variables, Stockfish distribution and license, AI prompts and reference games. | Before any code that crosses apps, touches engines, the AI layer, configuration or the build. |
| [`docs/product/step_01.md`](docs/product/step_01.md) | Screen 1 PRD, "Paste the game": parsing and validation of the Chess.com HTML and plain move lists, color/level/priorities, engine download indicator. | Before working on the game input screen. |
| [`docs/product/step_02.md`](docs/product/step_02.md) | Screen 2 PRD, "Analyzing": the five stages, Web Worker / Stockfish pipeline, findings so far, cancellation, partial results, handoff to the AI. | Before working on the analysis pipeline or progress screen. |
| [`docs/product/step_03.md`](docs/product/step_03.md) | Screen 3 PRD, "Result": verdict, patterns, stat cards, board, chart, move list, key moments, strengths, next-game habit, "Ask the AI", content rules for the AI. | Before working on the result screen or AI-written text. |
| [`docs/product/step_04.md`](docs/product/step_04.md) | Screen 4 PRD, "Train key moment": find the move, attempt checking, feedback, hints, navigation between key moments. | Before working on the training screen. |

Every PRD's acceptance criteria are how the work is verified.

### Design references

Each screen has an HTML mockup in `docs/design/step_0N/`. It is the visual base
for that screen and must be followed.

| Screen | Design |
| ------ | ------ |
| 1. Paste the game | [`docs/design/step_01/Main.dc.html`](docs/design/step_01/Main.dc.html) |
| 2. Analyzing | [`docs/design/step_02/Analisando.dc.html`](docs/design/step_02/Analisando.dc.html) |
| 3. Result | [`docs/design/step_03/Resultado.dc.html`](docs/design/step_03/Resultado.dc.html) |
| 4. Train key moment | [`docs/design/step_04/Treino.dc.html`](docs/design/step_04/Treino.dc.html) |

- Read both the PRD and the design of a screen before working on it. The PRD
  defines behavior; the design defines how it looks.
- The mockups are **reference designs, not production code**. Do not copy the
  markup or runtime into `apps/`. Rebuild each screen as React components styled
  with Tailwind, replicating the exact values (colors, fonts, sizes, spacing,
  radii, shadows, layout) from the inline `style="…"` attributes and the
  `<helmet><style>` block. `support.js` and `vendor/` are only the mockup runtime.
- Visual tokens repeat across screens: define them once in the Tailwind theme.
- View the mockups with `make design`. Do not open them over `file://`.
- When the design and the PRD disagree, the PRD wins. The "Minhas partidas" nav
  item and the "Salvar em Minhas partidas" button are out of the MVP (D2).

## Repository structure

```
.
├── apps/
│   ├── web/        # Frontend: React + Vite + Tailwind CSS + TypeScript + XState (UI and engines 1–4)
│   └── api/        # Backend: Python + FastAPI + LangChain + Pydantic (AI layer, engine 5)
├── docs/
│   ├── product/    # PRDs (general.md, step_0N.md) and glossary
│   ├── architecture/  # Technical architecture and code structure
│   ├── engineering/   # Versions, lint, tests
│   └── design/     # HTML design references, one folder per screen
├── Makefile        # Single Makefile for the whole repo
├── .nvmrc          # Node.js version
├── .python-version # Python version
└── CLAUDE.md
```

- Never put application code outside `apps/`. New apps go in a new folder there.
- All project documentation lives in `docs/`, in Brazilian Portuguese, in Markdown.
  Keep it up to date when a change affects what it describes, and add new files
  to the index above.

## Tech stack

- **Frontend (`apps/web`):** React, Vite, Tailwind CSS, TypeScript (strict),
  XState 5 (`xstate` + `@xstate/react`). Package manager:
  [pnpm](https://pnpm.io/) only (no npm or yarn). Commit `pnpm-lock.yaml`.
- **Frontend state:** application and flow state (current screen, game input,
  engine loading, analysis pipeline, training session) lives in XState 5
  machines, not in `useState`/`useReducer`, React Context stores or another state
  library. Build machines with `setup({ types, actions, guards, actors })`, keep
  side effects (Web Workers, `fetch`, `localStorage`) in actors so tests can swap
  them with `machine.provide()`, and keep business rules in pure `model/` code
  that guards and actions call. `useState` is fine only for purely visual,
  component-local state (hover, an open dropdown). Details in
  `docs/architecture/overview.md`.
- **Backend (`apps/api`):** Python, FastAPI, LangChain, Pydantic. Package manager:
  [uv](https://docs.astral.sh/uv/) only (no pip, poetry or `requirements.txt`).
  Dependencies in `pyproject.toml`; use `uv sync`, `uv add <package>` and
  `uv run <command>`. Commit `uv.lock`.
- The backend is stateless: no database, no accounts, no game storage.
- Never commit secrets. Configuration comes from `.env` files (see
  `docs/architecture/overview.md`).

## Development environment

- Docker is not used. Everything runs on the local machine.
- There is a single `Makefile`, at the repository root. Do not create a `Makefile`
  inside `apps/`.
- Every app has its own targets, named `<target>-<app>` (for example,
  `setup-web`, `dev-api`, `test-web`), plus aggregate targets that run the step
  for every app:

| Target | What it does |
| ------ | ------------ |
| `make setup` | Install dependencies and prepare every app. Copies each `.env.example` to `.env` when `.env` does not exist yet (never overwrites). |
| `make dev` | Start every app in development mode. |
| `make lint` | Run Biome and Ruff. |
| `make format` | Format the code with Biome and Ruff. |
| `make typecheck` | Run `tsc --noEmit` and mypy. |
| `make test` | Run Vitest and pytest. |
| `make test-e2e` | Run the Playwright tests. |
| `make check` | `lint` + `typecheck` + `test`. Must pass before any commit. |
| `make generate-api-types` | Regenerate the frontend API types from the backend OpenAPI. |
| `make design` | Serve the design mockups from `docs/design/`. |
| `make help` | List the available targets. |

- When you add an app, a dependency, a tool or a setup step, update the matching
  targets in the root `Makefile` and this table.
- Every aggregate target has per-app variants (`setup-web`, `setup-api`,
  `lint-web`, `test-api`, …); `make help` lists them all.
- Recipes that run Node load the version in `.nvmrc` through nvm when it is
  installed. Node 26 ships without corepack, so `make setup` installs the pnpm
  version pinned in `packageManager` with npm when `pnpm` is missing.
- `make test-e2e` builds the web app, serves it with `vite preview` on `4173`
  (isolation headers on) and starts the API on `8000` for the proxy tests.

## Language conventions

| What | Language |
| ---- | -------- |
| Code comments | Brazilian Portuguese |
| Project documentation (`docs/`) | Brazilian Portuguese |
| User-facing text (UI copy, error messages shown to the user, AI explanations) | Brazilian Portuguese |
| Everything else (identifiers, file names, commit messages, logs, API routes, this file) | English |

- Use English terms a native speaker would actually use. Do not translate
  Portuguese words literally (bad: `realizeLogin`, `atualizeCadastro`; good:
  `logIn`, `updateProfile`).
- Use the code names from the glossary for product terms and standard chess
  vocabulary (`move`, `board`, `piece`, `capture`, `check`, `checkmate`,
  `castling`, `en passant`, `promotion`).

## Git workflow

- **Every task runs in its own git worktree**, on its own branch created from an
  up-to-date `main`:
  ```
  git fetch origin
  git worktree add .worktrees/<branch> -b <branch> origin/main
  ```
- Branch name: `<type>/<short-description>`, using the Conventional Commit types
  (for example, `feat/paste-game-parser`, `fix/key-moment-threshold`).
- A new worktree does not share installed dependencies or `.env` files: run
  `make setup` in it, and copy the `.env` files from the main checkout if you need
  real keys.
- When the task is done: push the branch and open a pull request against `main`
  (`gh pr create --base main`).
- **Never merge into `main` directly, and never push to `main`.** Changes reach
  `main` only through a pull request. Do not merge the pull request yourself
  unless the user asks.
- After the pull request is merged, remove the worktree
  (`git worktree remove .worktrees/<branch>`).

## Commits

- Follow [Conventional Commits](https://www.conventionalcommits.org/), in English:
  `<type>(<optional scope>): <description>`.
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
  `chore`.
- Use the app name as the scope when the change is limited to one app
  (`feat(web): add board component`, `fix(api): handle invalid move payload`).
- Imperative mood, lowercase, no trailing period.
- Do not add `Co-Authored-By` trailers or any other AI attribution (such as
  "Generated with Claude Code") to commit messages or pull request descriptions.

## Definition of done

A task is only done when every item below is true. Report each one in your
summary.

1. You read the PRD and the design of every screen the task touches, plus the
   relevant `docs/` files.
2. You looked up the current docs in Context7 for every library you used, and
   listed them.
3. The code follows the DDD structure in `docs/architecture/code-structure.md`.
4. The acceptance criteria of the PRD items you implemented are met.
5. New or changed behavior has tests, following `docs/engineering/quality.md`.
6. `make check` passes (lint, types and tests). Run `make test-e2e` when the
   change affects a user flow.
7. UI changes were checked in the browser against the design, with cross-origin
   isolation active.
8. User-facing text is in Brazilian Portuguese; identifiers are natural English.
9. `docs/`, `.env.example` files, the `Makefile` and this file are updated when
   the change affects them.
10. The work is committed on its own branch in its own worktree, pushed, and has
    a pull request open against `main`.
