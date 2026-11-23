import pytest

from game_analyzer.domains.explanation.application.answer_question import AnswerQuestion
from game_analyzer.domains.explanation.application.explain_game import (
    ExplainGame,
    ExplanationUnverifiedError,
)
from game_analyzer.domains.explanation.application.ports import ProviderError
from game_analyzer.domains.explanation.application.prompts import load_prompt, render_prompt
from game_analyzer.domains.explanation.domain.contract import (
    GameContract,
    GameExplanation,
    KeyMomentText,
    QuestionAnswer,
    QuestionRequest,
    StrengthText,
)
from game_analyzer.domains.explanation.tests.scripted_provider import ScriptedProvider


def valid_explanation() -> GameExplanation:
    return GameExplanation(
        verdict="Você venceu: a vantagem começou em 12...Bxa1 e o material voltou 2 vezes.",
        patterns_sentence="Duas vezes uma peça atacada ficou no lugar.",
        key_moments=[
            KeyMomentText(ply=44, summary="22...Ta7 deixou o bispo em a1.", explanation="Bd4+."),
            KeyMomentText(ply=54, summary="27...Tb7 deixou o bispo em g4.", explanation="Be2."),
        ],
        strengths=[StrengthText(ply=24, text="12...Bxa1 ganhou a torre.")],
        next_game_habit="Antes de mover, confira as peças atacadas.",
    )


def invalid_explanation() -> GameExplanation:
    return valid_explanation().model_copy(update={"next_game_habit": "Jogue Cf3."})


def test_prompt_files_are_versioned_and_split_in_system_and_user() -> None:
    system, user = load_prompt("explain_game", 1)
    assert "Não invente" in system
    assert "{{contract_json}}" in user


def test_rendered_prompt_has_level_rules_and_contract(contract: GameContract) -> None:
    prompt = render_prompt("explain_game", contract)
    assert "Nível Iniciante: sem jargão" in prompt.system
    assert '"move_label": "22...Ta7"' in prompt.user
    assert "Nenhuma." in prompt.user


def test_explain_returns_the_first_verified_answer(contract: GameContract) -> None:
    provider = ScriptedProvider([valid_explanation()])
    assert ExplainGame(provider)(contract) == valid_explanation()
    assert len(provider.calls) == 1


def test_explain_retries_once_with_the_violations(contract: GameContract) -> None:
    provider = ScriptedProvider([invalid_explanation(), valid_explanation()])
    assert ExplainGame(provider)(contract) == valid_explanation()
    assert len(provider.calls) == 2
    assert "lance Cf3 não está no contrato" in provider.calls[1][1]


def test_explain_gives_up_after_two_unverified_answers(contract: GameContract) -> None:
    provider = ScriptedProvider([invalid_explanation(), invalid_explanation()])
    with pytest.raises(ExplanationUnverifiedError) as error:
        ExplainGame(provider)(contract)
    assert error.value.violations == ["lance Cf3 não está no contrato"]
    assert len(provider.calls) == 2


def test_explain_lets_provider_errors_through(contract: GameContract) -> None:
    provider = ScriptedProvider([ProviderError("sem rede")])
    with pytest.raises(ProviderError):
        ExplainGame(provider)(contract)


def test_answer_question_is_verified(contract: GameContract) -> None:
    provider = ScriptedProvider(
        [
            QuestionAnswer(answer="Em h3 havia outra peça.", in_scope=True),
            QuestionAnswer(answer="Em 22...Ta7 o bispo em a1 ficou atacado.", in_scope=True),
        ]
    )
    request = QuestionRequest(game=contract, question="Por que perdi o bispo?")
    answer = AnswerQuestion(provider)(request)
    assert answer.answer == "Em 22...Ta7 o bispo em a1 ficou atacado."
    assert "Por que perdi o bispo?" in provider.calls[0][1]


def test_off_topic_answer_starts_with_the_notice(contract: GameContract) -> None:
    provider = ScriptedProvider([QuestionAnswer(answer="Pergunte sobre 22...Ta7.", in_scope=False)])
    answer = AnswerQuestion(provider)(QuestionRequest(game=contract, question="Qual a capital?"))
    assert answer == QuestionAnswer(
        answer="Só consigo falar sobre esta partida. Pergunte sobre 22...Ta7.", in_scope=False
    )


def test_off_topic_answer_keeps_an_existing_notice(contract: GameContract) -> None:
    notice = "Só consigo falar sobre esta partida. Que tal perguntar sobre 22...Ta7?"
    provider = ScriptedProvider([QuestionAnswer(answer=notice, in_scope=False)])
    answer = AnswerQuestion(provider)(QuestionRequest(game=contract, question="Clima?"))
    assert answer.answer == notice


def test_answer_question_gives_up_after_two_unverified_answers(contract: GameContract) -> None:
    bad = QuestionAnswer(answer="Cf3 era melhor.", in_scope=True)
    provider = ScriptedProvider([bad, bad])
    with pytest.raises(ExplanationUnverifiedError):
        AnswerQuestion(provider)(QuestionRequest(game=contract, question="E aí?"))
