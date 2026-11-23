import type { PlayerColor } from "../../game";
import type { Inspection } from "./types";

export type EngineState = { status: "loading" | "ready" | "failed"; percent: number };

export type Availability = {
  enabled: boolean;
  /** Texto do botão. */
  label: string;
  /** O que falta, mostrado ao lado do botão; null quando nada falta. */
  hint: string | null;
};

const READY_LABEL = "Analisar partida →";

/** C-10: o botão só habilita com partida válida, cor escolhida e motor pronto. */
export function analyzeAvailability(
  inspection: Inspection,
  playerColor: PlayerColor | null,
  engine: EngineState,
): Availability {
  if (inspection.kind !== "valid") {
    return { enabled: false, label: READY_LABEL, hint: "Cole uma partida válida" };
  }
  if (playerColor === null) {
    return { enabled: false, label: READY_LABEL, hint: "Selecione com qual cor você jogou" };
  }
  if (engine.status === "failed") {
    return {
      enabled: false,
      label: READY_LABEL,
      hint: "O motor não carregou. Tente de novo acima.",
    };
  }
  if (engine.status === "loading") {
    return { enabled: false, label: `Carregando o motor… ${engine.percent}%`, hint: null };
  }
  return { enabled: true, label: READY_LABEL, hint: null };
}
