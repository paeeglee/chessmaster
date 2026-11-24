"""Rotas da camada de IA. Só traduzem HTTP em casos de uso."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from game_analyzer.domains.explanation.application.answer_question import AnswerQuestion
from game_analyzer.domains.explanation.application.explain_game import (
    ExplainGame,
    ExplanationUnverifiedError,
)
from game_analyzer.domains.explanation.application.explain_move import ExplainMove
from game_analyzer.domains.explanation.application.ports import LLMProvider, ProviderError
from game_analyzer.domains.explanation.domain.contract import (
    GameContract,
    GameExplanation,
    MoveContract,
    MoveExplanation,
    QuestionAnswer,
    QuestionRequest,
)
from game_analyzer.domains.explanation.infrastructure.provider_factory import (
    UnknownProviderError,
    build_provider,
)
from game_analyzer.shared.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["explanation"])


def get_provider() -> LLMProvider:
    try:
        return build_provider(get_settings())
    except UnknownProviderError as error:
        logger.error("configuração de IA inválida: %s", error)
        raise HTTPException(status_code=503, detail="ai_unavailable") from error


Provider = Annotated[LLMProvider, Depends(get_provider)]

_ERRORS = {
    503: {"description": "A IA está indisponível (provedor, chave ou rede)."},
    502: {"description": "A IA citou algo fora do contrato mesmo depois de nova tentativa."},
}


@router.post("/explanations", responses=_ERRORS)  # type: ignore[arg-type]  # dict de respostas
def explain_game(contract: GameContract, provider: Provider) -> GameExplanation:
    try:
        return ExplainGame(provider)(contract)
    except ProviderError as error:
        logger.warning("provedor de IA indisponível: %s", error)
        raise HTTPException(status_code=503, detail="ai_unavailable") from error
    except ExplanationUnverifiedError as error:
        logger.warning(
            "explicação reprovada na verificação (%d problemas): %s",
            len(error.violations),
            "; ".join(error.violations),
        )
        raise HTTPException(status_code=502, detail="explanation_unverified") from error


@router.post("/questions", responses=_ERRORS)  # type: ignore[arg-type]  # dict de respostas
def answer_question(request: QuestionRequest, provider: Provider) -> QuestionAnswer:
    try:
        return AnswerQuestion(provider)(request)
    except ProviderError as error:
        logger.warning("provedor de IA indisponível: %s", error)
        raise HTTPException(status_code=503, detail="ai_unavailable") from error
    except ExplanationUnverifiedError as error:
        logger.warning(
            "resposta reprovada na verificação (%d problemas): %s",
            len(error.violations),
            "; ".join(error.violations),
        )
        raise HTTPException(status_code=502, detail="explanation_unverified") from error


@router.post("/move-explanations", responses=_ERRORS)  # type: ignore[arg-type]  # dict de respostas
def explain_move(contract: MoveContract, provider: Provider) -> MoveExplanation:
    """Revisão lance a lance (F9): explica um lance quando o jogador o abre."""
    try:
        return ExplainMove(provider)(contract)
    except ProviderError as error:
        logger.warning("provedor de IA indisponível: %s", error)
        raise HTTPException(status_code=503, detail="ai_unavailable") from error
    except ExplanationUnverifiedError as error:
        logger.warning(
            "explicação do lance reprovada na verificação (%d problemas): %s",
            len(error.violations),
            "; ".join(error.violations),
        )
        raise HTTPException(status_code=502, detail="explanation_unverified") from error
