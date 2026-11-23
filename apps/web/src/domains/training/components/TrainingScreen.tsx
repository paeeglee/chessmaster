import { useSelector } from "@xstate/react";
import type { ActorRefFrom } from "xstate";
import { Board } from "../../../shared/ui/Board";
import { MISTAKE_TYPE_LABEL } from "../../analysis";
import type { TrainingContext, trainingMachine } from "../machines/trainingMachine";
import {
  exerciseMarks,
  hintText,
  principleFor,
  solutionLabel,
  statementFor,
  summaryText,
  wrongFeedback,
} from "../model/exercise";

type TrainingRef = ActorRefFrom<typeof trainingMachine>;

const SECONDARY_BUTTON =
  "min-h-11 rounded-md border border-line bg-surface px-4 py-2.5 font-semibold text-[15px] text-ink disabled:cursor-not-allowed disabled:opacity-50";
const PRIMARY_BUTTON =
  "min-h-11 rounded-md border border-brand bg-brand px-4 py-2.5 font-semibold text-[15px] text-surface";

function colorName(color: "w" | "b") {
  return color === "w" ? "Brancas" : "Pretas";
}

function Progress({ context }: { context: TrainingContext }) {
  const total = context.moments.length;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-ink-muted text-sm">
        Momento {context.index + 1} de {total}
      </span>
      <div className="flex gap-1.5">
        {context.moments.map((ply, index) => (
          <span
            key={ply}
            aria-hidden="true"
            className={`h-2 w-[34px] rounded-full ${index <= context.index ? "bg-brand" : "bg-line"}`}
          />
        ))}
      </div>
    </div>
  );
}

function FeedbackCard({ context, checking }: { context: TrainingContext; checking: boolean }) {
  const { feedback, exercise } = context;
  if (checking) {
    return <p className="m-0 text-[15px] text-ink-muted">Conferindo o lance…</p>;
  }
  if (!feedback) return null;
  if (feedback.kind === "error") {
    return (
      <div className="flex flex-col gap-1.5 rounded-xl bg-warning-soft px-5 py-[18px]">
        <strong>Não foi possível conferir o lance. Tente de novo.</strong>
      </div>
    );
  }
  if (feedback.kind === "wrong") {
    const text = wrongFeedback(feedback.result);
    return (
      <div className="flex flex-col gap-1.5 rounded-xl bg-warning-soft px-5 py-[18px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[5px] bg-surface px-2 py-0.5 font-bold text-warning text-xs uppercase tracking-[0.06em]">
            Tentativa {feedback.attempt}
          </span>
          <strong>{text.title}</strong>
        </div>
        <p className="m-0 text-[15px] leading-[1.55]">{text.text}</p>
      </div>
    );
  }
  const principle = principleFor(exercise.moment.mistakeType);
  if (feedback.kind === "correct") {
    const line = feedback.result.continuation.join(" ");
    return (
      <div className="flex flex-col gap-1.5 rounded-xl bg-success-soft px-5 py-[18px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[5px] bg-surface px-2 py-0.5 font-bold text-success text-xs uppercase tracking-[0.06em]">
            Acertou
          </span>
          <strong>{feedback.result.label} resolve o problema.</strong>
        </div>
        {line && <p className="m-0 text-[15px] leading-[1.55]">Continuação do motor: {line}</p>}
        <p className="m-0 text-[15px] leading-[1.55]">{principle}</p>
      </div>
    );
  }
  const solution = solutionLabel(exercise);
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-brand-soft px-5 py-[18px]">
      <strong>{solution ? `A solução é ${solution}.` : "O motor não indicou um lance."}</strong>
      <p className="m-0 text-[15px] leading-[1.55]">{principle}</p>
    </div>
  );
}

function NextMomentCard({ context }: { context: TrainingContext }) {
  const nextPly = context.moments[context.index + 1];
  const next = context.result.keyMoments.find((moment) => moment.ply === nextPly);
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface px-5 py-[18px]">
      <span className="font-bold">Depois deste momento</span>
      <p className="m-0 text-[15px] text-ink-muted leading-normal">
        {next
          ? `O momento ${context.index + 2} é ${next.moveLabel}, do tipo ${MISTAKE_TYPE_LABEL[next.mistakeType].toLowerCase()}.`
          : "Este é o último momento. Depois dele você vê quantos acertou de primeira."}
      </p>
    </div>
  );
}

function Summary({ context, onBack }: { context: TrainingContext; onBack: () => void }) {
  const outcomes = context.moments.flatMap((ply) => {
    const outcome = context.outcomes[ply];
    return outcome ? [outcome] : [];
  });
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-6">
      <p className="m-0 font-bold text-brand text-xs uppercase tracking-[0.08em]">
        Treino concluído
      </p>
      <h1 className="m-0 font-semibold font-serif text-[30px] leading-[1.2]">
        {summaryText(outcomes)}
      </h1>
      <p className="m-0 text-base text-ink-muted leading-[1.55]">
        Repita o treino na próxima partida para ver se o padrão diminuiu.
      </p>
      <div>
        <button type="button" onClick={onBack} className={PRIMARY_BUTTON}>
          Voltar ao resultado
        </button>
      </div>
    </div>
  );
}

/** Tela 4, "Treinar momento-chave" (step_04). */
export function TrainingScreen({ trainingRef }: { trainingRef: TrainingRef }) {
  const snapshot = useSelector(trainingRef, (state) => state);
  const { context } = snapshot;
  const send = trainingRef.send;
  const back = () => send({ type: "TRAINING.BACK" });

  const playing = snapshot.matches("playing");
  const checking = snapshot.matches("checking");
  const done = snapshot.matches("solved") || snapshot.matches("solutionShown");
  const finished = snapshot.matches("finished");
  const { exercise } = context;
  const statement = statementFor(exercise);
  const color = exercise.playerColor;
  const atStart = context.fen === exercise.ply.fenBefore;
  const isLast = context.index === context.moments.length - 1;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          className="min-h-11 border-0 bg-transparent p-0 font-semibold text-[15px] text-brand"
        >
          ← Voltar ao resultado
        </button>
        {!finished && <Progress context={context} />}
      </div>
      {finished ? (
        <Summary context={context} onBack={back} />
      ) : (
        <div className="flex flex-wrap items-start gap-7">
          <section className="flex min-w-0 flex-[1_1_480px] flex-col gap-2.5">
            <Board
              fen={context.fen}
              orientation={color}
              coordinates
              label={`Posição antes de ${exercise.moment.moveLabel}, vista pelas ${colorName(color).toLowerCase()}.`}
              marks={exerciseMarks({
                exercise,
                atStart,
                selected: context.selected,
                lastMove: context.lastMove,
                showSolution: snapshot.matches("solutionShown"),
              })}
              destinations={context.destinations}
              onSquareClick={(square) => send({ type: "SQUARE.CLICK", square })}
              disabled={!playing}
            />
            <div className="flex flex-wrap justify-between gap-2 text-[15px]">
              <span className="inline-flex items-center gap-2 font-semibold">
                <span
                  aria-hidden="true"
                  className={`inline-block size-3.5 rounded-full ${color === "w" ? "border border-line-strong bg-surface" : "bg-ink"}`}
                />
                {colorName(color)} jogam (você)
              </span>
              <span className="text-ink-muted">Clique na peça e depois na casa de destino</span>
            </div>
          </section>
          <section className="flex min-w-0 flex-[999_1_440px] flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-6">
              <p className="m-0 font-bold text-brand text-xs uppercase tracking-[0.08em]">
                {statement.kicker}
              </p>
              <h1 className="m-0 font-semibold font-serif text-[30px] leading-[1.2]">
                {statement.question}
              </h1>
              <p className="m-0 text-base text-ink-muted leading-[1.55]">{statement.context}</p>
            </div>
            <div role="status" className="empty:hidden">
              <FeedbackCard context={context} checking={checking} />
            </div>
            {context.hintLevel > 0 && !done && (
              <div className="flex flex-col gap-1 rounded-xl bg-hint-soft px-5 py-4 text-[15px] text-hint leading-[1.55]">
                <p className="m-0">
                  <strong>Dica:</strong> {hintText(exercise, 1)}
                </p>
                {context.hintLevel > 1 && <p className="m-0">{hintText(exercise, 2)}</p>}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {done ? (
                <button
                  type="button"
                  onClick={() => send({ type: "MOMENT.NEXT" })}
                  className={PRIMARY_BUTTON}
                >
                  {isLast ? "Ver resumo do treino" : "Próximo momento →"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => send({ type: "UNDO" })}
                    disabled={checking || (atStart && !context.selected)}
                    className={SECONDARY_BUTTON}
                  >
                    Desfazer
                  </button>
                  <button
                    type="button"
                    onClick={() => send({ type: "HINT.REQUEST" })}
                    disabled={!playing || context.hintLevel >= 2}
                    className={SECONDARY_BUTTON}
                  >
                    {context.hintLevel === 0 ? "Dica" : "Outra dica"}
                  </button>
                  <button
                    type="button"
                    onClick={() => send({ type: "SOLUTION.SHOW" })}
                    disabled={!playing}
                    className={SECONDARY_BUTTON}
                  >
                    Mostrar solução
                  </button>
                </>
              )}
            </div>
            <NextMomentCard context={context} />
          </section>
        </div>
      )}
    </>
  );
}
