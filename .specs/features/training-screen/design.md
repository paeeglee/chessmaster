# F8 · Treinar momento-chave Design

**Spec**: `.specs/features/training-screen/spec.md`
**Status**: Approved (decisions delegated by the user on 2026-11-22)

## Architecture Overview

```mermaid
graph TD
  App[appMachine.training] -->|invoke id training, input result + ply + engine| TM[trainingMachine]
  TM -->|fromPromise evaluateAttempt| EC[EngineClient.evaluate(fen after attempt)]
  TM -->|model| TMod[training/model: evaluateAttempt, hints, feedback, outcome]
  TMod --> A[analysis.classifyMove (D3)]
  TMod --> G[game: legalDestinations, playMove, positionsAlongLine]
  TS[TrainingScreen] -->|useSelector| TM
  TS --> B[shared/ui/Board interactive]
  TM -->|sendParent TRAINING.BACK| App
```

## Components

| File | Responsibility |
| ---- | -------------- |
| `game/model/moves.ts` | `legalDestinations(fen, square)`, `playMove(fen, from, to)` → `{ fen, san, uci } \| null` (queen promotion) |
| `shared/ui/Board.tsx` | Optional `onSquareClick`, `selected`/`target` marks, squares become buttons with labels ("a1, bispo preto") |
| `training/model/exercise.ts` | `exerciseFor(result, ply)`, `checkAttempt(...)` (uses `classifyMove`), `hintText(level, moment)`, `principleFor(type)`, `feedbackFor(...)`, `outcomeOf(...)`, `summaryText(outcomes)` |
| `training/machines/trainingMachine.ts` | States `playing`, `checking`, `refuting`, `solved`, `solutionShown`, `finished`; actors `evaluate` (engine) |
| `training/components/TrainingScreen.tsx` | Top bar, board, statement, feedback (`role="status"`), hints, actions, "Depois deste momento", summary |
| `app/appMachine.ts` | `training` invokes the machine; `TRAINING.BACK` from the child or the screen |

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| ------- | -------- | ------ | ---------- |
| Engine time per attempt | checkAttempt | ~200 ms–1 s wait | Board locked with "Conferindo o lance…" |
| Attempt evaluated at different depth than the original analysis | checkAttempt | Rare disagreement | Same D3 rule and same search plan as the analysis |
