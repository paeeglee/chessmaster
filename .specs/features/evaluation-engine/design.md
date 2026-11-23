# F2 · Evaluation engine Design

**Spec**: `.specs/features/evaluation-engine/spec.md`
**Status**: Approved (decisions delegated by the user on 2026-11-22)

## Architecture Overview

```mermaid
graph LR
  A[appMachine root] -->|invoke id: engine| L[engineLoaderMachine]
  L -->|fromCallback loadEngine| C[EngineClient]
  C -->|new Worker| W[public/engine/stockfish-19.0.1-mt.js]
  C -->|MessageChannel port| P[progress {percent}]
  C -->|UCI lines| M[model/uci.ts pure parsing]
  S[EngineStatus component] -.props.- A
```

## Components

| File | Responsibility |
| ---- | -------------- |
| `apps/web/scripts/copy-engine.mjs` | Copies both full builds + `Copying.txt` from `node_modules/stockfish` into `public/engine/` with versioned names; run by `postinstall` |
| `evaluation/model/engineBuild.ts` | `ENGINE_VERSION`, `chooseEngineBuild({ crossOriginIsolated, hardwareConcurrency })` |
| `evaluation/model/uci.ts` | `parseInfoLine`, `parseBestMove`, `toWhitePerspective(score, sideToMove)`, `sideToMoveOf(fen)` |
| `evaluation/model/searchPlan.ts` | `MOVETIME_MS = 200`, `MIN_DEPTH = 12`, `needsDeeperSearch(depth)` |
| `evaluation/model/types.ts` | `EngineScore`, `PositionEvaluation`, `EngineBuild`, `DownloadProgress` |
| `evaluation/engine/EngineClient.ts` | Owns one worker: `start({ threads, onProgress, timeoutMs })`, `evaluate(fen)` (serialized queue), `terminate()` |
| `evaluation/machines/engineLoaderMachine.ts` | `loading` → `ready` / `failed`; `RETRY`; context `{ percent, engine, build }`; actor `loadEngine` (fromCallback) replaceable in tests |
| `evaluation/components/EngineStatus.tsx` | Status line (props only, no context) with `aria-live="polite"` and "Tentar de novo" |
| `evaluation/index.ts` | Public API |
| `app/appMachine.ts` | Root-level `invoke` of the loader with `id: "engine"` (lives for the whole session, starts on page open) |
| `app/App.tsx` | Renders `EngineStatus` from the `engine` child snapshot |

## Data Models

```ts
type EngineScore = { kind: "cp"; value: number } | { kind: "mate"; value: number };
type PositionEvaluation = { fen: string; depth: number; score: EngineScore; bestMove: string | null; pv: string[] };
type EngineBuild = { variant: "multi-thread" | "single-thread"; scriptUrl: string; threads: number };
type WorkerLike = { postMessage(message: unknown, transfer?: Transferable[]): void; terminate(): void; onmessage: ((event: MessageEvent) => void) | null; onerror: ((event: ErrorEvent) => void) | null };
```

## Error Handling Strategy

| Scenario | Handling | User impact |
| -------- | -------- | ----------- |
| `.wasm` 404 / network error | Worker `error` event → `start()` rejects → `ENGINE.FAILED` | "Não foi possível carregar o motor" + retry |
| No `uciok` in 120 s | Timer rejects `start()` | Same |
| Retry | Loader re-enters `loading`; XState stops the old callback actor, whose cleanup terminates the worker | Download restarts at 0% |
| `terminate()` with pending evaluations | Pending promises reject with "Motor encerrado" | F4 handles cancellation |

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| ------- | -------- | ------ | ---------- |
| 94 MB file in dev served without long cache | Vite dev/preview | Re-download on reload in dev only | Versioned file names allow `immutable` caching when hosting is defined |
| Worker cannot run in jsdom | tests | No real engine in unit tests | `WorkerLike` factory injected; fake worker scripts UCI; Playwright covers the real engine |
| Engine progress protocol is package-internal | `EngineClient` | Breaks if stockfish.js changes it | Version pinned exactly; the e2e test fails if loading breaks |
