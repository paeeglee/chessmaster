"""Caso de uso: explicar a partida analisada (tela Resultado)."""

from game_analyzer.domains.explanation.application.ports import LLMProvider
from game_analyzer.domains.explanation.application.prompts import render_prompt
from game_analyzer.domains.explanation.domain.contract import GameContract, GameExplanation
from game_analyzer.domains.explanation.domain.verification import verify_explanation

PROMPT_NAME = "explain_game"
MAX_ATTEMPTS = 2


class ExplanationUnverifiedError(Exception):
    """O texto da IA citou algo fora do contrato mesmo depois da nova tentativa."""

    def __init__(self, violations: list[str]) -> None:
        super().__init__("; ".join(violations))
        self.violations = violations


class ExplainGame:
    def __init__(self, provider: LLMProvider) -> None:
        self._provider = provider

    def __call__(self, contract: GameContract) -> GameExplanation:
        violations: list[str] = []
        for _ in range(MAX_ATTEMPTS):
            prompt = render_prompt(PROMPT_NAME, contract, feedback="\n".join(violations))
            explanation = self._provider.generate(prompt.system, prompt.user, GameExplanation)
            violations = verify_explanation(explanation, contract)
            if not violations:
                return explanation
        raise ExplanationUnverifiedError(violations)
