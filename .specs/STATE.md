# STATE

## Decisions

### AD-001
- **Decision**: Frontend application and flow state is managed with XState 5 (`xstate` + `@xstate/react`): a root machine in `app/` drives the current screen, and each domain with its own flow owns its machines in `machines/`.
- **Reason**: The product flow is already a state machine (paste → analyzing → result ⇄ training, with cancel, failures and retries); explicit states make the PRD state tables directly testable, and workers/API calls become actors that tests swap with `machine.provide()`.
- **Trade-off**: Extra dependency and learning curve over plain React state; no URL router in the MVP (screen is derived from machine state).
- **Scope**: `apps/web` — all flow state; business rules stay in pure `model/` code.
- **Date**: 2026-11-22
- **Status**: active

## Handoff
