# F3 · Colar a partida Design

**Spec**: `.specs/features/game-input-screen/spec.md`
**Status**: Approved (decisions delegated by the user on 2026-11-22)

## Architecture Overview

```mermaid
graph TD
  App[appMachine] -->|state gameInput: invoke id gameInput, input = context.draft| GI[gameInputMachine]
  GI -->|sendParent DRAFT.SAVED| App
  GI -->|sendParent ANALYSIS.REQUESTED with AnalysisRequest| App
  App -->|state analyzing, context.request| AP[Analisando placeholder]
  AP -->|ANALYSIS.CANCELLED| App
  Screen[GameInputScreen] -->|useSelector| GI
  Screen -->|engine child status| Engine[engineLoader]
  Screen -->|inspectGame(text) memo| Model[game-input/model]
  Model --> Game[game domain index]
```

## Components

| File | Responsibility |
| ---- | -------------- |
| `app/theme.css` | Board tokens: `board-light #ebe5d5`, `board-dark #87a07c`, marks red/green/last light+dark, piece colors, coordinate colors, `line-soft #ebe8e0`, `brand-line #9cc2c0` |
| `shared/ui/Board.tsx` | 8×8 board from a FEN: orientation, marks, optional coordinates, `role="img"` + label; glyphs ♚♛♜♝♞♟ with U+FE0E |
| `game/model/describe.ts` | `formatMoveLabel(ply)` ("72...Ta6#"), `listPieces(fen)`, `describePieces(fen)` (aria), `summarizeMaterial(fen)` (visible) |
| `game-input/model/types.ts` | `Level`, `Priority`, `GameInputDraft`, `AnalysisRequest` |
| `game-input/model/inspectGame.ts` | `inspectGame(text) → Inspection` (empty / too-large / unrecognized / illegal / valid with game, warnings) |
| `game-input/model/analyzeAvailability.ts` | `analyzeAvailability(inspection, color, engine)` → `{ enabled, label, hint }` |
| `game-input/model/estimate.ts` | `estimateSeconds(plies)` |
| `game-input/model/levelStorage.ts` | `loadLevel(storage)`, `saveLevel(storage, level)` with try/catch |
| `game-input/machines/gameInputMachine.ts` | Draft state; actors `readClipboard` (fromPromise), actions `persistLevel`, `saveDraft` (sendParent) |
| `game-input/components/*` | `GameInputScreen`, `GameField`, `FindingsPanel`, `FindingItem`, `PlayerChoices` (holds the analyze button) |
| `app/appMachine.ts` | States `gameInput` (invokes gameInput) and `analyzing` (placeholder, cancel back); context `draft`, `request` |

## Data Models

```ts
type Level = "beginner" | "intermediate" | "advanced";
type Priority = "lost-pieces" | "endgames" | "opening" | "plan";
type GameInputDraft = { text: string; playerColor: PlayerColor | null; level: Level; priorities: Priority[] };
type AnalysisRequest = { game: Game; playerColor: PlayerColor; level: Level; priorities: Priority[] };
type Inspection =
  | { kind: "empty" } | { kind: "too-large" } | { kind: "unrecognized" }
  | { kind: "illegal"; error: IllegalMoveError }
  | { kind: "valid"; game: Game; format: GameFormat; shortGame: boolean };
```

## Error Handling Strategy

| Scenario | Handling | User impact |
| -------- | -------- | ----------- |
| Clipboard denied / unavailable | `readClipboard` rejects → `clipboardDenied: true` | Ctrl/Cmd+V notice |
| `localStorage` throws | `loadLevel`/`saveLevel` catch | Level falls back to Iniciante |
| Engine failed | Button disabled + hint; retry in status line | Clear next step |

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| ------- | -------- | ------ | ---------- |
| Re-parsing on every keystroke | `GameInputScreen` | Typing lag on huge pastes | `useMemo` by text; parse < 100 ms for 300 plies; > 500 KB rejected before parsing |
| `sendParent` couples child to parent event names | `gameInputMachine` | Breaks if parent renames events | Event types exported from `game-input` and used by `appMachine` |

## Tech Decisions

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| Derived data | Not stored in the machine; `inspectGame(text)` is a pure memoized function | Single source of truth (text); no stale derived state |
| Board in `shared/ui` | Yes, no chess.js | Used by 4 screens; FEN placement parsing is trivial |
