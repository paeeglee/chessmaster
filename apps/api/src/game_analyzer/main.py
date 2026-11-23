from fastapi import FastAPI

from game_analyzer.domains.explanation import router as explanation_router
from game_analyzer.shared.health import router as health_router

API_PREFIX = "/api"


def create_app() -> FastAPI:
    """Cria o app e monta os routers. Todas as rotas ficam sob /api."""
    app = FastAPI(
        title="Analisador de partidas",
        openapi_url=f"{API_PREFIX}/openapi.json",
        docs_url=f"{API_PREFIX}/docs",
        redoc_url=None,
    )
    app.include_router(health_router, prefix=API_PREFIX)
    app.include_router(explanation_router, prefix=API_PREFIX)
    return app


app = create_app()
