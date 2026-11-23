import type { ReactNode } from "react";
import type { PlayerColor } from "../../game";
import type { Availability } from "../model/analyzeAvailability";
import { LEVELS, type Level, PRIORITIES, type Priority } from "../model/types";

type PlayerChoicesProps = {
  playerColor: PlayerColor | null;
  level: Level;
  priorities: Priority[];
  availability: Availability;
  estimateSeconds: number;
  engineStatus: ReactNode;
  onColor: (color: PlayerColor) => void;
  onLevel: (level: Level) => void;
  onPriority: (priority: Priority) => void;
  onAnalyze: () => void;
};

const COLORS: { value: PlayerColor; glyph: string; label: string }[] = [
  { value: "w", glyph: "♔︎", label: "Brancas" },
  { value: "b", glyph: "♚︎", label: "Pretas" },
];

export function PlayerChoices({
  playerColor,
  level,
  priorities,
  availability,
  estimateSeconds,
  engineStatus,
  onColor,
  onLevel,
  onPriority,
  onAnalyze,
}: PlayerChoicesProps) {
  return (
    <section className="flex flex-col gap-[18px] rounded-xl border border-line bg-surface p-[22px]">
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 font-bold text-[15px]">Você jogou com</legend>
        <div className="flex overflow-hidden rounded-lg border border-line-strong">
          {COLORS.map((color) => {
            const pressed = playerColor === color.value;
            return (
              <button
                key={color.value}
                type="button"
                aria-pressed={pressed}
                onClick={() => onColor(color.value)}
                className={`min-h-11 flex-1 border-0 font-semibold ${
                  pressed ? "bg-ink text-surface" : "bg-surface text-ink-muted"
                }`}
              >
                <span aria-hidden="true">{color.glyph} </span>
                {color.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="nivel" className="font-bold text-[15px]">
          Seu nível
        </label>
        <select
          id="nivel"
          value={level}
          onChange={(event) => onLevel(event.target.value as Level)}
          className="min-h-11 rounded-md border border-line-strong bg-surface px-3 text-[15px] text-ink"
        >
          {LEVELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 font-bold text-[15px]">O que priorizar</legend>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((option) => {
            const pressed = priorities.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={pressed}
                onClick={() => onPriority(option.value)}
                className={`min-h-10 rounded-full border px-3.5 py-2 font-semibold text-sm ${
                  pressed
                    ? "border-brand-line bg-brand-soft text-brand"
                    : "border-line bg-surface text-ink-muted"
                }`}
              >
                {pressed && <span aria-hidden="true">✓ </span>}
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {engineStatus}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!availability.enabled}
          onClick={onAnalyze}
          className={`flex min-h-[52px] items-center justify-center gap-2 rounded-lg border-0 font-bold text-[17px] ${
            availability.enabled
              ? "bg-brand text-surface"
              : "cursor-not-allowed bg-line text-ink-muted"
          }`}
        >
          {availability.label}
        </button>
        {availability.hint && (
          <span className="text-center font-semibold text-[13px] text-ink">
            {availability.hint}
          </span>
        )}
        <span className="text-center text-[13px] text-ink-muted">
          Leva cerca de {estimateSeconds} segundos. A partida fica só neste navegador.
        </span>
      </div>
    </section>
  );
}
