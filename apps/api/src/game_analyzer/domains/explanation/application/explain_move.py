"""Caso de uso: explicar um lance no painel do treinador (revisão lance a lance, F9)."""

from game_analyzer.domains.explanation.application.explain_game import (
    MAX_ATTEMPTS,
    ExplanationUnverifiedError,
)
from game_analyzer.domains.explanation.application.ports import LLMProvider
from game_analyzer.domains.explanation.application.prompts import render_prompt
from game_analyzer.domains.explanation.domain.contract import MoveContract, MoveExplanation
from game_analyzer.domains.explanation.domain.verification import verify_move_explanation

PROMPT_NAME = "explain_move"


class ExplainMove:
    def __init__(self, provider: LLMProvider) -> None:
        self._provider = provider

    def __call__(self, contract: MoveContract) -> MoveExplanation:
        violations: list[str] = []
        for _ in range(MAX_ATTEMPTS):
            prompt = render_prompt(PROMPT_NAME, contract, feedback="\n".join(violations))
            explanation = self._provider.generate(prompt.system, prompt.user, MoveExplanation)
            violations = verify_move_explanation(explanation, contract)
            if not violations:
                return explanation
        raise ExplanationUnverifiedError(violations)
