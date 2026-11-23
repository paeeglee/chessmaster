# STATE

## Decisions

### AD-001
- **Decision**: Frontend application and flow state is managed with XState 5 (`xstate` + `@xstate/react`): a root machine in `app/` drives the current screen, and each domain with its own flow owns its machines in `machines/`.
- **Reason**: The product flow is already a state machine (paste → analyzing → result ⇄ training, with cancel, failures and retries); explicit states make the PRD state tables directly testable, and workers/API calls become actors that tests swap with `machine.provide()`.
- **Trade-off**: Extra dependency and learning curve over plain React state; no URL router in the MVP (screen is derived from machine state).
- **Scope**: `apps/web` — all flow state; business rules stay in pure `model/` code.
- **Date**: 2026-11-22
- **Status**: active

### AD-002
- **Decision**: The rules engine (engine 2) uses `chess.js`, wrapped behind the `game` domain's public entry point; the parser (engine 1) is written in-house and feeds English SAN to it.
- **Reason**: Move legality, FEN, check, checkmate and stalemate are a solved, well-tested problem; writing our own adds risk without product value.
- **Trade-off**: External dependency in a core engine; Portuguese notation must be translated by our parser before reaching `chess.js`.
- **Scope**: `apps/web` `game` domain (F1) and every domain that needs positions or legal moves (through `game`).
- **Date**: 2026-11-22
- **Status**: active

## Handoff
