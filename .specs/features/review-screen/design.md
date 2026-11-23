# F7 · Resultado Design

**Spec**: `.specs/features/review-screen/spec.md`
**Status**: Approved (decisions delegated by the user on 2026-11-22)

## Architecture Overview

```mermaid
graph TD
  App[appMachine.review] -->|invoke id review, input result| RM[reviewMachine]
  RM -->|sendParent REVIEW.NEW_GAME / TRAINING.REQUESTED| App
  RM -->|fromPromise askQuestion| API[/api/questions]
  RM -->|fromPromise retryExplanation| API2[/api/explanations]
  RM -->|after 600 ms| Line[line playback]
  Screen[ReviewScreen] -->|useSelector| RM
  Screen --> Model[review/model: stats, annotations, chart, board state]
```

## Components

| File | Responsibility |
| ---- | -------------- |
| `analysis/model/classify.ts` | `MistakeVerdict` gains `materialBefore`/`materialAfter` (player's point of view, capture line) for "Vantagem: +A → +B" |
| `review/model/review.ts` | `resultTag`, `contextLine`, `statCards`, `annotationOf`, `moveRows`, `initialPosition`, `boardMarks`, `chartGeometry`, `suggestionChips`, `momentText` (AI or template) |
| `review/machines/reviewMachine.ts` | Selected position, orientation, expanded moment, line playback, questions, AI retry, new-game confirmation, training request |
| `review/components/*` | `ReviewScreen`, `SummaryBand`, `StatCards`, `BoardPanel`, `MaterialChart`, `MoveList`, `KeyMomentsList`, `StrengthsList`, `AskAi`, `EnginesFooter`, `ConfirmNewGame` |
| `app/appMachine.ts` | `review` invokes `reviewMachine`; `training` placeholder state (F8) |

## Data Models

```ts
// Índice de posição: 0 = inicial, k = depois do meio-lance k.
type ReviewContext = {
  result: AnalysisResult;
  position: number;
  orientation: "w" | "b";
  expandedPly: number | null;
  linePlayback: { fens: string[]; step: number } | null;
  questions: { id: number; question: string; status: "pending" | "answered" | "failed"; answer?: string }[];
  confirmingNewGame: boolean;
  explanation: GameExplanation | null;
  aiFailed: boolean;
};
```

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| ------- | -------- | ------ | ---------- |
| Keyboard shortcuts conflicting with the question input | BoardPanel | Arrow keys move the board while typing | Keys handled only when focus is on the board panel |
| Long move lists | MoveList | Scroll | Fixed-height scroll container, selected move scrolled into view |
