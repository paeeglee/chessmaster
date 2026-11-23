import { describe, expect, it } from "vitest";
import type { PositionEvaluation } from "../../evaluation";
import { playMove } from "../../game";
import { referenceResult } from "../../review/fixtures/referenceResult";
import {
  attemptLabel,
  checkAttempt,
  exerciseFor,
  exerciseMarks,
  hintText,
  outcomeOf,
  principleFor,
  refutationFen,
  solutionLabel,
  squareClick,
  statementFor,
  summaryText,
  wrongFeedback,
} from "./exercise";

const result = referenceResult();
const exercise = exerciseFor(result, 44);
const fen = exercise.ply.fenBefore;

function evaluation(afterFen: string, pv: string[]): PositionEvaluation {
  return { fen: afterFen, depth: 18, score: { kind: "cp", value: 0 }, bestMove: pv[0] ?? null, pv };
}

function attempt(from: string, to: string) {
  const move = playMove(fen, from, to);
  if (!move) throw new Error(`lance ilegal ${from}${to}`);
  return move;
}

describe("exercício do momento 1 (22...Ta7)", () => {
  it("mostra a posição anterior com as pretas a jogar (TR-01)", () => {
    expect(fen.split(" ")[1]).toBe("b");
    expect(exercise.playerColor).toBe("b");
  });

  it("monta o enunciado sem entregar a resposta (TR-02)", () => {
    expect(statementFor(exercise)).toEqual({
      kicker: "Encontre o lance · tipo: peça atacada",
      question: "Uma das suas peças está em perigo. O que fazer?",
      context: "Posição real da sua partida, antes do lance 22. Na partida você jogou 22...Ta7.",
    });
  });

  it("recusa 22...Te6 e mostra 23.Txa1 (TR-05)", () => {
    const move = attempt("e8", "e6");
    const checked = checkAttempt(exercise, move, evaluation(move.fen, ["h1a1", "e6e2", "f2e2"]));
    expect(checked).toMatchObject({
      accepted: false,
      label: "22...Te6",
      replyLabel: "23.Txa1",
      lostPiece: { type: "b", square: "a1" },
      repeatedGameMove: false,
    });
    expect(wrongFeedback(checked)).toEqual({
      title: "22...Te6 ainda perde o bispo",
      text: "Depois de 23.Txa1, o bispo some do tabuleiro.",
    });
  });

  it("aceita 22...Bd4+ (melhor lance) e mostra a continuação (TR-07)", () => {
    const move = attempt("a1", "d4");
    expect(move.san).toBe("Bd4+");
    const checked = checkAttempt(
      exercise,
      move,
      evaluation(move.fen, ["d2e3", "d4e3", "f2e3", "a8d8", "h1c1"]),
    );
    expect(checked.accepted).toBe(true);
    expect(checked.continuation).toHaveLength(4);
  });

  it("aceita outro lance que salva o bispo, como 22...Bb2 (T-03)", () => {
    const move = attempt("a1", "b2");
    const checked = checkAttempt(exercise, move, evaluation(move.fen, ["h1b1", "b2a3", "b1b8"]));
    expect(checked.accepted).toBe(true);
  });

  it("avisa quando o lance é o mesmo da partida (TR-06)", () => {
    const move = attempt("a8", "a7");
    const checked = checkAttempt(exercise, move, evaluation(move.fen, ["h1a1", "a7d7"]));
    expect(checked.repeatedGameMove).toBe(true);
    expect(wrongFeedback(checked).text).toBe(
      "Depois de 23.Txa1, o bispo some do tabuleiro. Esse foi o lance jogado na partida.",
    );
  });

  it("dá as dicas do padrão à peça e a solução (TR-08)", () => {
    expect(hintText(exercise, 1)).toBe("Olhe a casa a1: quem ataca o bispo?");
    expect(hintText(exercise, 2)).toBe("O bispo pode sair dali ou ser protegido.");
    expect(solutionLabel(exercise)).toBe("22...Bd4+");
    expect(attemptLabel(exercise, "Bd4+")).toBe("22...Bd4+");
  });
});

describe("textos por tipo e progresso", () => {
  it("reforça o princípio de cada tipo", () => {
    expect(principleFor("hanging-piece")).toBe(
      "Antes de cada lance, confira quais peças suas estão atacadas.",
    );
    expect(principleFor("defender-moved")).toBe(
      "Antes de mover uma peça, veja se ela protege outra.",
    );
    expect(principleFor("other")).toBe("Antes de cada lance, pergunte o que o adversário ganha.");
  });

  it("usa a dica de defensor e o texto sem peça", () => {
    const defender = exerciseFor(result, 82);
    expect(defender.moment.mistakeType).toBe("defender-moved");
    expect(hintText(defender, 1)).toBe("Que peça protegia o cavalo em c3?");
    const noPiece = {
      ...exercise,
      moment: { ...exercise.moment, lostPiece: null, mistakeType: "other" as const },
    };
    expect(hintText(noPiece, 1)).toBe("Procure o lance que não entrega material.");
    expect(hintText(noPiece, 2)).toBe("Compare o que cada lance deixa desprotegido.");
    expect(
      wrongFeedback({
        accepted: false,
        label: "22...h6",
        repeatedGameMove: false,
        replyLabel: null,
        replyUci: null,
        lostPiece: null,
        continuation: [],
      }),
    ).toEqual({
      title: "22...h6 ainda perde material",
      text: "Depois da resposta, o adversário ganha material.",
    });
  });

  it("registra o resultado de cada momento (TR-10) e resume (TR-11)", () => {
    expect(outcomeOf(1, 0, false)).toBe("first-try");
    expect(outcomeOf(2, 0, false)).toBe("with-hint");
    expect(outcomeOf(1, 1, false)).toBe("with-hint");
    expect(outcomeOf(3, 2, true)).toBe("saw-solution");
    expect(summaryText(["first-try", "with-hint", "first-try", "saw-solution", "first-try"])).toBe(
      "3 de 5 de primeira",
    );
  });

  it("falha com momento inexistente", () => {
    expect(() => exerciseFor(result, 1)).toThrow("Momento-chave 1 não encontrado");
  });
});

describe("exerciseMarks", () => {
  const base = { exercise, atStart: true, selected: null, lastMove: null, showSolution: false };

  it("marca a peça em perigo na posição do exercício", () => {
    expect(exerciseMarks(base)).toEqual({ a1: "red" });
    expect(exerciseMarks({ ...base, atStart: false })).toEqual({});
  });

  it("marca a seleção, o último lance e a solução", () => {
    expect(exerciseMarks({ ...base, selected: "a1" })).toEqual({ a1: "selected" });
    expect(exerciseMarks({ ...base, atStart: false, lastMove: { from: "h1", to: "a1" } })).toEqual({
      h1: "last",
      a1: "last",
    });
    expect(exerciseMarks({ ...base, showSolution: true })).toEqual({ a1: "green", d4: "green" });
  });
});

describe("squareClick (T-02)", () => {
  it("seleciona, troca a seleção, joga e limpa", () => {
    expect(squareClick(fen, null, "a1")).toMatchObject({ kind: "select", square: "a1" });
    expect(squareClick(fen, "a1", "e8")).toMatchObject({ kind: "select", square: "e8" });
    expect(squareClick(fen, "a1", "d4")).toMatchObject({ kind: "move", move: { san: "Bd4+" } });
    expect(squareClick(fen, "a1", "a1")).toEqual({ kind: "clear" });
    expect(squareClick(fen, null, "e5")).toEqual({ kind: "clear" });
    // Peça do adversário não é selecionada; destino ilegal com seleção limpa.
    expect(squareClick(fen, null, "h1")).toEqual({ kind: "clear" });
    expect(squareClick(fen, "a1", "a3")).toEqual({ kind: "clear" });
  });
});

describe("casos de borda do motor", () => {
  it("sem variante: aceita e não mostra resposta nem refutação", () => {
    const move = attempt("a1", "b2");
    const checked = checkAttempt(exercise, move, evaluation(move.fen, []));
    expect(checked).toMatchObject({
      accepted: true,
      replyLabel: null,
      replyUci: null,
      continuation: [],
    });
    expect(refutationFen(checked, move.fen)).toBeNull();
  });

  it("refutação ilegal não muda o tabuleiro", () => {
    const move = attempt("e8", "e6");
    const checked = checkAttempt(exercise, move, evaluation(move.fen, ["h1a1"]));
    expect(refutationFen(checked, move.fen)).toMatch(
      /^r7\/5kpp\/p1p1rn2\/8\/1Pp1pPbP\/P5N1\/3B1KP1\/R7 b/,
    );
    expect(refutationFen({ ...checked, replyUci: "a1a8" }, move.fen)).toBeNull();
  });

  it("sem melhor lance (ou ilegal) não há solução", () => {
    expect(
      solutionLabel({ ...exercise, before: { ...exercise.before, bestMove: null } }),
    ).toBeNull();
    expect(
      solutionLabel({ ...exercise, before: { ...exercise.before, bestMove: "a1a8" } }),
    ).toBeNull();
  });

  it("promoção vira o lance do exercício com a peça promovida", () => {
    // Exercício artificial: peão branco em e7 a promover.
    const promoFen = "8/4P3/8/8/8/8/k7/4K3 w - - 0 1";
    const promo = {
      ...exercise,
      playerColor: "w" as const,
      ply: { ...exercise.ply, color: "w" as const, fenBefore: promoFen },
      before: evaluation(promoFen, ["e7e8q"]),
    };
    const move = playMove(promoFen, "e7", "e8");
    if (!move) throw new Error("promoção ilegal");
    const checked = checkAttempt(promo, move, evaluation(move.fen, ["a2b3"]));
    expect(checked).toMatchObject({ accepted: true, label: "22.e8=D" });
  });

  it("dica de peça no feminino", () => {
    const rook = exerciseFor(result, 86);
    expect(hintText(rook, 2)).toBe("A torre pode sair dali ou ser protegida.");
  });
});
