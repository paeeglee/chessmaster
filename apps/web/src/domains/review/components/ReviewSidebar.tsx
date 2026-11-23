import { type FormEvent, useState } from "react";
import { findingText } from "../../analysis";
import type { ReviewContext, ReviewEvent } from "../machines/reviewMachine";
import { suggestionChips } from "../model/review";

type Props = { context: ReviewContext; send: (event: ReviewEvent) => void };

/** "O que você fez bem" (R-10): texto da IA quando existe, senão o do motor. */
export function StrengthsList({ context }: Pick<Props, "context">) {
  const { result } = context;
  if (result.strengths.length === 0) return null;
  return (
    <section
      aria-labelledby="strengths-title"
      className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-[22px]"
    >
      <h2 id="strengths-title" className="m-0 font-semibold font-serif text-[20px]">
        O que você fez bem
      </h2>
      <ul className="m-0 flex flex-col gap-1.5 pl-5">
        {result.strengths.map((strength) => {
          const ai = result.explanation?.strengths.find((item) => item.ply === strength.ply);
          return (
            <li key={strength.ply}>
              {ai ? (
                ai.text
              ) : (
                <>
                  <strong>{strength.moveLabel}!</strong> — {findingText(strength)}.
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** "Hábito para a próxima partida" (texto da IA). */
export function NextGameHabit({ context }: Pick<Props, "context">) {
  const habit = context.result.explanation?.next_game_habit;
  if (!habit) return null;
  return (
    <section className="flex flex-col gap-1.5 rounded-xl border border-brand-line bg-brand-soft p-[22px]">
      <p className="m-0 font-bold text-brand text-xs uppercase tracking-[0.08em]">
        Hábito para a próxima partida
      </p>
      <p className="m-0 text-base text-ink">{habit}</p>
    </section>
  );
}

/** "Pergunte à IA" (R-11). */
export function AskAi({ context, send, asking }: Props & { asking: boolean }) {
  // Texto do campo enquanto o jogador digita: estado visual local.
  const [draft, setDraft] = useState("");
  if (!context.result.explanation) return null;
  const ask = (question: string) => {
    send({ type: "QUESTION.ASK", question });
    setDraft("");
  };
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (draft.trim()) ask(draft);
  };
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-[22px]">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label htmlFor="pergunta" className="font-bold text-[15px]">
          Pergunte à IA sobre esta partida
        </label>
        <div className="flex flex-wrap gap-2">
          {suggestionChips(context.result).map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={asking}
              onClick={() => ask(chip)}
              className="min-h-10 rounded-full border border-line bg-surface px-3.5 py-2 font-semibold text-ink-muted text-sm"
            >
              {chip}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="pergunta"
            type="text"
            maxLength={500}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ex.: o que eu devia ter jogado no lance 41?"
            className="min-h-11 flex-1 rounded-md border border-line-strong px-3 text-[15px]"
          />
          <button
            type="submit"
            disabled={asking}
            className="min-h-11 rounded-md border-0 bg-brand px-4 font-semibold text-surface"
          >
            Perguntar
          </button>
        </div>
      </form>
      <ul aria-live="polite" className="m-0 flex list-none flex-col gap-2.5 p-0">
        {context.questions.map((question) => (
          <li key={question.id} className="flex flex-col gap-1 rounded-md bg-canvas p-3">
            <span className="font-semibold text-sm">{question.question}</span>
            <span className="text-[15px]">
              {question.status === "pending" && "Pensando…"}
              {question.status === "answered" && question.answer}
              {question.status === "failed" && "Não foi possível responder agora. Tente de novo."}
            </span>
          </li>
        ))}
      </ul>
      <span className="text-[13px] text-ink-muted">
        Respostas usam as avaliações dos motores desta partida.
      </span>
    </section>
  );
}

/** Rodapé "Motores usados" (R-12). */
export function EnginesFooter({ context }: Pick<Props, "context">) {
  const aiFailed = context.result.aiFailed;
  return (
    <footer className="flex flex-wrap gap-4 border-line border-t pt-4 text-ink-muted text-sm">
      <span className="font-bold text-ink">Motores usados</span>
      <span>✓ Regras</span>
      <span>✓ Avaliação</span>
      <span>✓ Tabela de finais (quando sobram poucas peças)</span>
      <span>{aiFailed ? "✕ IA: falhou" : "✓ IA: só explica, não calcula"}</span>
    </footer>
  );
}
