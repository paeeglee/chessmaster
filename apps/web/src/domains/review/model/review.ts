import {
  type AnalysisResult,
  findingText,
  MISTAKE_TYPE_LABEL,
  type MistakeVerdict,
  type MoveVerdict,
} from "../../analysis";
import { formatMoveLabel, type Game, type PlayerColor, toPortugueseSan } from "../../game";
import type { AnalysisRequest } from "../../game-input";

export type Tone = "win" | "loss" | "neutral";

/** "Vitória · 0-1" / "Derrota · 1-0" / "Empate · ½-½" / "Sem resultado". */
export function resultTag(game: Game, playerColor: PlayerColor): { label: string; tone: Tone } {
  if (game.result === null) return { label: "Sem resultado", tone: "neutral" };
  if (game.result === "1/2-1/2") return { label: "Empate · ½-½", tone: "neutral" };
  const won = (game.result === "1-0") === (playerColor === "w");
  return won
    ? { label: `Vitória · ${game.result}`, tone: "win" }
    : { label: `Derrota · ${game.result}`, tone: "loss" };
}

/** "Você: pretas · 72 lances · xeque-mate". */
export function contextLine(request: AnalysisRequest): string {
  const { game, playerColor } = request;
  const parts = [
    `Você: ${playerColor === "w" ? "brancas" : "pretas"}`,
    `${Math.ceil(game.plies.length / 2)} lances`,
  ];
  if (game.termination === "checkmate") parts.push("xeque-mate");
  if (game.termination === "stalemate") parts.push("afogamento");
  return parts.join(" · ");
}

export function formatAdvantage(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

export type StatCard = { value: string; label: string };

/** Cartões de números (step_03 §3): só fatos dos motores. */
export function statCards(result: AnalysisResult): StatCard[] {
  const cards: StatCard[] = [
    {
      value: String(result.keyMoments.length),
      label: "momentos em que você perdeu material",
    },
  ];
  const best = [...result.strengths].sort((a, b) => b.gain - a.gain || a.ply - b.ply)[0];
  if (best) cards.push({ value: `${best.moveLabel}!`, label: "seu melhor lance" });
  cards.push({
    value: formatAdvantage(Math.max(0, ...result.materialTimeline)),
    label: "sua maior vantagem (pontos de material)",
  });
  return cards;
}

/** `??` perda ≥ 5, `?` momento-chave, `!` ponto forte; só nos lances do jogador. */
export function annotationOf(verdict: MoveVerdict | undefined): "" | "?" | "??" | "!" {
  if (!verdict) return "";
  if (verdict.kind === "mistake") return verdict.loss >= 5 ? "??" : "?";
  if (verdict.kind === "strength") return "!";
  return "";
}

/** Tom do lance na lista: erro ("?", "??"), bom lance ("!") ou comum. */
export type MoveTone = "mistake" | "good" | "plain";
export type MoveCell = { ply: number; text: string; tone: MoveTone };

function toneOf(annotation: ReturnType<typeof annotationOf>): MoveTone {
  if (annotation === "!") return "good";
  return annotation === "" ? "plain" : "mistake";
}
export type MoveRow = { number: number; white: MoveCell | null; black: MoveCell | null };

/** Lista de lances em duas colunas, em notação portuguesa e anotada. */
export function moveRows(game: Game, verdicts: readonly MoveVerdict[]): MoveRow[] {
  const byPly = new Map(verdicts.map((verdict) => [verdict.ply, verdict]));
  const rows: MoveRow[] = [];
  for (const ply of game.plies) {
    const annotation = annotationOf(byPly.get(ply.index));
    const cell = {
      ply: ply.index,
      text: `${toPortugueseSan(ply.san)}${annotation}`,
      tone: toneOf(annotation),
    };
    if (ply.color === "w") {
      rows.push({ number: ply.moveNumber, white: cell, black: null });
    } else {
      const last = rows.at(-1);
      if (last && last.number === ply.moveNumber && last.black === null) last.black = cell;
      else rows.push({ number: ply.moveNumber, white: null, black: cell });
    }
  }
  return rows;
}

/** R-04: posição antes do primeiro momento-chave; sem momentos, a posição final. */
export function initialPosition(result: AnalysisResult): number {
  const first = result.keyMoments[0];
  return first ? first.ply - 1 : result.request.game.plies.length;
}

/** FEN da posição k (0 = inicial, k = depois do meio-lance k). */
export function positionFen(game: Game, position: number): string {
  return position === 0 ? game.initialFen : (game.plies[position - 1]?.fenAfter ?? game.initialFen);
}

/** O momento-chave que acontece a partir desta posição (o lance seguinte). */
export function momentAt(result: AnalysisResult, position: number): MistakeVerdict | undefined {
  return result.keyMoments.find((moment) => moment.ply === position + 1);
}

export type BoardMarks = {
  marks: Partial<Record<string, "red" | "green" | "last">>;
  bestMoveSan: string | null;
};

/** Peça perdida em vermelho e destino do lance sugerido em verde; senão, o último lance. */
export function boardMarks(result: AnalysisResult, position: number): BoardMarks {
  const moment = momentAt(result, position);
  if (moment) {
    const marks: BoardMarks["marks"] = {};
    if (moment.lostPiece) marks[moment.lostPiece.square] = "red";
    const best = result.evaluations[position]?.bestMove;
    if (best) marks[best.slice(2, 4)] = "green";
    return { marks, bestMoveSan: moment.bestMoveSan };
  }
  const last = result.request.game.plies[position - 1];
  return { marks: last ? { [last.from]: "last", [last.to]: "last" } : {}, bestMoveSan: null };
}

export const CHART = { width: 740, height: 170, left: 30, right: 710, top: 30, zero: 140 };

export type ChartGeometry = {
  points: string;
  area: string;
  maxLabel: string;
  zeroY: number;
  topY: number;
  marks: { number: number; ply: number; x: number; y: number }[];
  ticks: { label: string; x: number }[];
};

/** Geometria do gráfico de vantagem de material (R-06), no espaço 740×170 do mockup. */
export function chartGeometry(result: AnalysisResult): ChartGeometry {
  const values = result.materialTimeline;
  const scale = Math.max(10, ...values.map((value) => Math.abs(value)));
  const lastIndex = Math.max(1, values.length - 1);
  const x = (index: number) => CHART.left + ((CHART.right - CHART.left) * index) / lastIndex;
  const y = (value: number) => CHART.zero - ((CHART.zero - CHART.top) * value) / scale;
  const coords = values.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`);
  const totalMoves = Math.ceil((values.length - 1) / 2);
  return {
    points: coords.join(" "),
    area: `${CHART.left},${CHART.zero} ${coords.join(" ")} ${x(lastIndex).toFixed(1)},${CHART.zero}`,
    maxLabel: formatAdvantage(scale),
    zeroY: CHART.zero,
    topY: CHART.top,
    marks: result.keyMoments.map((moment, index) => ({
      number: index + 1,
      ply: moment.ply,
      x: x(moment.ply),
      y: y(values[moment.ply] ?? 0),
    })),
    ticks: [
      { label: "1", x: CHART.left },
      { label: String(Math.max(1, Math.round(totalMoves / 2))), x: x(lastIndex / 2) },
      { label: String(Math.max(1, totalMoves)), x: x(lastIndex) - 20 },
    ],
  };
}

/** Texto do momento: o da IA quando existe, senão o do template dos motores. */
export function momentTexts(
  result: AnalysisResult,
  moment: MistakeVerdict,
): { summary: string; explanation: string } {
  const ai = result.explanation?.key_moments.find((item) => item.ply === moment.ply);
  if (ai) return { summary: ai.summary, explanation: ai.explanation };
  const base = findingText(moment) ?? "";
  const summary = `${base.charAt(0).toUpperCase()}${base.slice(1)}.`;
  return { summary, explanation: `${MISTAKE_TYPE_LABEL[moment.mistakeType]}.` };
}

/** "Vantagem: +9 → +6". */
export function materialChange(moment: MistakeVerdict): string {
  return `Vantagem: ${formatAdvantage(moment.materialBefore)} → ${formatAdvantage(moment.materialAfter)}`;
}

/** Chips de "Pergunte à IA" montados com fatos da partida. */
export function suggestionChips(result: AnalysisResult): string[] {
  const chips: string[] = [];
  const best = [...result.strengths].sort((a, b) => b.gain - a.gain)[0];
  if (best) chips.push(`Por que ${best.moveLabel} foi bom?`);
  const first = result.keyMoments[0];
  if (first) chips.push(`O que eu devia ter jogado em ${first.moveLabel}?`);
  if (result.keyMoments.length > 0) chips.push("Qual padrão de erro mais se repetiu?");
  chips.push("Como posso melhorar no final?");
  return chips.slice(0, 3);
}

/** Rótulo "Antes de 22...Ta7?" da posição em que o tabuleiro está. */
export function positionCaption(result: AnalysisResult, position: number): string {
  const moment = momentAt(result, position);
  if (moment) return `Antes de ${moment.moveLabel}?`;
  const ply = result.request.game.plies[position - 1];
  return ply ? `Depois de ${formatMoveLabel(ply)}` : "Posição inicial";
}

/** "Pretas jogam" / "Brancas jogam" na posição dada. */
export function sideToMoveLabel(game: Game, position: number): string {
  return positionFen(game, position).split(" ")[1] === "b" ? "Pretas jogam" : "Brancas jogam";
}
