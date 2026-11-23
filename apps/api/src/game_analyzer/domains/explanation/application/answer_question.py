"""Caso de uso: "Pergunte à IA" sobre a partida analisada (R-11)."""

from game_analyzer.domains.explanation.application.explain_game import (
    MAX_ATTEMPTS,
    ExplanationUnverifiedError,
)
from game_analyzer.domains.explanation.application.ports import LLMProvider
from game_analyzer.domains.explanation.application.prompts import render_prompt
from game_analyzer.domains.explanation.domain.contract import QuestionAnswer, QuestionRequest
from game_analyzer.domains.explanation.domain.verification import allowed_facts, verify_text

PROMPT_NAME = "answer_question"
OFF_TOPIC_PREFIX = "Só consigo falar sobre esta partida."


class AnswerQuestion:
    def __init__(self, provider: LLMProvider) -> None:
        self._provider = provider

    def __call__(self, request: QuestionRequest) -> QuestionAnswer:
        facts = allowed_facts(request.game)
        violations: list[str] = []
        for _ in range(MAX_ATTEMPTS):
            prompt = render_prompt(
                PROMPT_NAME,
                request.game,
                feedback="\n".join(violations),
                question=request.question,
            )
            answer = self._provider.generate(prompt.system, prompt.user, QuestionAnswer)
            violations = verify_text(answer.answer, facts)
            if not violations:
                return _with_scope_notice(answer)
        raise ExplanationUnverifiedError(violations)


def _with_scope_notice(answer: QuestionAnswer) -> QuestionAnswer:
    if answer.in_scope or answer.answer.startswith(OFF_TOPIC_PREFIX):
        return answer
    return answer.model_copy(update={"answer": f"{OFF_TOPIC_PREFIX} {answer.answer}"})
