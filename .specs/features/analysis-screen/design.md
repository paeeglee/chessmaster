# F4b · Analysis pipeline and screen Design

**Spec**: `.specs/features/analysis-screen/spec.md`
**Status**: Approved (decisions delegated by the user on 2026-11-22)

## Architecture Overview

```mermaid
graph TD
  App[appMachine.analyzing] -->|invoke id analysis, input request + engine| AM[analysisMachine]
  AM -->|fromCallback evaluatePositions| EC[EngineClient.evaluate x (plies+1)]
  EC -->|POSITION.EVALUATED| AM
  AM -->|classifyMove per ply| F[findings]
  AM -->|fromPromise explainGame| API[POST /api/explanations]
  AM -->|output AnalysisResult| App
  App -->|state review, context.result| R[Result placeholder until F7]
  Screen[AnalyzingScreen] -->|useSelector| AM
```

## Components

| File | Responsibility |
| ---- | -------------- |
| `evaluation/engine/EngineClient.ts` | `cancel()`: sends `stop`, rejects queued work ("Análise cancelada") |
| `analysis/model/result.ts` | `AnalysisResult` type, `summarizeAnalysis(request, evaluations)` (verdicts, key moments, strengths, patterns, timeline, opponent mistakes) |
| `analysis/model/progress.ts` | `progressOf(evaluated, total, elapsedMs)` → percent, current move number, remaining seconds |
| `analysis/model/findings.ts` | Finding item (`tag`, `label`, `text`) from verdicts; defender-moved phrasing |
| `explanation/model/contract.ts` | `buildContract(request, result)` → generated `GameContract` type |
| `explanation/client/explanationClient.ts` | `requestExplanation(contract)` via `fetch('/api/explanations')`, throws on non-2xx |
| `analysis/machines/analysisMachine.ts` | States `evaluating` (with `failed`), `explaining`, final `done`; output `AnalysisResult` |
| `analysis/components/AnalyzingScreen.tsx` | Stages list, live board, findings, cancel |
| `app/appMachine.ts` | `analyzing` invokes analysis (input from request + engine child snapshot), `onDone` → `review` |

## Data Models

```ts
type AnalysisResult = {
  request: AnalysisRequest;
  evaluations: PositionEvaluation[];
  verdicts: MoveVerdict[];
  keyMoments: MistakeVerdict[];
  opponentMistakes: MistakeVerdict[];
  strengths: StrengthVerdict[];
  patterns: Pattern[];
  materialTimeline: number[];
  explanation: GameExplanation | null;
  aiFailed: boolean;
};
```

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| ------- | -------- | ------ | ---------- |
| `stop` arrives while no search runs | EngineClient.cancel | Harmless UCI no-op | Always send `stop`; queue reset |
| Engine child not ready when analysis starts | appMachine | Should not happen (Colar guards) | Guard on ANALYSIS.REQUESTED reads engine; tests cover |
