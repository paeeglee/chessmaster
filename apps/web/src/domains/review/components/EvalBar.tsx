import type { EngineScore } from "../../evaluation";
import { evaluationLabel, whiteShare } from "../model/coach";

type EvalBarProps = {
  score: EngineScore | null;
  /** Lado que fica embaixo no tabuleiro. */
  orientation: "w" | "b";
};

/** MR-11: barra de avaliação da posição mostrada, do ponto de vista das brancas. */
export function EvalBar({ score, orientation }: EvalBarProps) {
  if (!score) return null;
  const white = whiteShare(score);
  const label = evaluationLabel(score);
  const whiteBottom = orientation === "w";
  return (
    <div
      role="img"
      aria-label={`Avaliação do motor: ${label} para as brancas`}
      className={`relative flex w-5 shrink-0 overflow-hidden rounded-sm bg-eval-black ${whiteBottom ? "flex-col-reverse" : "flex-col"}`}
    >
      <div
        className="bg-eval-white transition-[height] duration-150"
        style={{ height: `${white}%` }}
      />
      <span
        className={`absolute inset-x-0 text-center font-bold text-[9px] ${
          white >= 50
            ? `${whiteBottom ? "bottom-1" : "top-1"} text-eval-black`
            : `${whiteBottom ? "top-1" : "bottom-1"} text-eval-white`
        }`}
      >
        {label}
      </span>
    </div>
  );
}
