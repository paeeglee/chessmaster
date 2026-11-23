# F4a · Analysis model Design

**Spec**: `.specs/features/analysis-model/spec.md`
**Status**: Approved (decisions delegated by the user on 2026-11-22)

## Architecture Overview

```mermaid
graph LR
  G[game index: playCaptureLine, defendersOf, isAttackedBy, uciToSan] --> C[analysis/model/classify.ts]
  E[PositionEvaluation[] from evaluation] --> C
  C --> K[keyMoments.ts: selectKeyMoments, selectStrengths, groupPatterns]
  C --> F[findings.ts: findingText]
  M[material.ts: materialBalance, materialTimeline] --> C
```

## Components

| File | Responsibility |
| ---- | -------------- |
| `game/model/lines.ts` | `playCaptureLine(fen, firstUci, continuationUci, maxPlies = 8)` → `{ fen, captures: {square, piece, color}[] }`; `defendersOf(fen, square, color)`; `isAttackedBy(fen, square, color)`; `uciToSan(fen, uci)` (chess.js, stays in `game`) |
| `analysis/model/material.ts` | `PIECE_VALUES`, `materialBalance`, `materialTimeline` |
| `analysis/model/classify.ts` | `classifyMove({ ply, before, after, playerColor }) → MoveVerdict`; `classifyGame(game, evaluations, playerColor) → MoveVerdict[]` |
| `analysis/model/keyMoments.ts` | `selectKeyMoments`, `selectStrengths`, `groupPatterns` |
| `analysis/model/findings.ts` | `findingText(verdict)`, piece names with gender |
| `analysis/model/types.ts` | `MistakeType`, `MoveVerdict`, `PieceOnSquare`, `Pattern` |

## Data Models

```ts
type MistakeType = "hanging-piece" | "defender-moved" | "other";
type PieceOnSquare = { type: "p" | "n" | "b" | "r" | "q" | "k"; square: string };
type MoveVerdict =
  | { kind: "none"; ply: number }
  | { kind: "mistake" | "opponent-mistake"; ply: number; moveLabel: string; loss: number; bestMoveSan: string | null; mistakeType: MistakeType; lostPiece: PieceOnSquare | null }
  | { kind: "strength"; ply: number; moveLabel: string; gain: number; wonPiece: PieceOnSquare | null };
```

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| ------- | -------- | ------ | ---------- |
| Engine PVs differ between depth/time runs | classification | Key moments may vary slightly in the browser (200 ms) vs fixture (depth 18) | The rule only uses the immediate capture sequence, which is stable across depths; F4b e2e checks the reference game in the real browser |
| Stale or illegal PV moves | `playCaptureLine` | Exceptions | Stop the line at the first illegal move (AN-20) |
