DESIGN_DIR  := docs/design
DESIGN_PORT ?= 8080

WEB_DIR := apps/web
API_DIR := apps/api

# Todo .env.example dentro de apps/ gera um .env ao lado dele no setup
ENV_EXAMPLES := $(wildcard apps/*/.env.example)

# Ativa a versão do Node fixada no .nvmrc quando o nvm está instalado. O Node 26 não
# traz o corepack, então o pnpm da versão de `packageManager` é instalado pelo npm.
NVM_USE := if [ -s "$$HOME/.nvm/nvm.sh" ]; then . "$$HOME/.nvm/nvm.sh" >/dev/null && nvm use >/dev/null; fi;
NODE := $(NVM_USE) cd $(WEB_DIR) &&
PY := cd $(API_DIR) &&

API_TYPES := src/domains/explanation/api/schema.gen.ts

.PHONY: help setup setup-env setup-web setup-api dev dev-web dev-api lint lint-web lint-api \
	format format-web format-api typecheck typecheck-web typecheck-api test test-web test-api \
	test-e2e check generate-api-types design

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Setup -------------------------------------------------------------------

setup: setup-env setup-web setup-api ## Prepara o ambiente de desenvolvimento de todos os apps

setup-env: ## Cria os .env a partir dos .env.example, sem sobrescrever os existentes
	@for example in $(ENV_EXAMPLES); do \
		env_file="$$(dirname $$example)/.env"; \
		if [ -f "$$env_file" ]; then \
			echo "$$env_file já existe, mantido"; \
		else \
			cp "$$example" "$$env_file"; \
			echo "$$env_file criado a partir de $$example"; \
		fi; \
	done

setup-web: ## Instala o Node do .nvmrc (via nvm), o pnpm, as dependências do web e o Chromium do Playwright
	@if [ -s "$$HOME/.nvm/nvm.sh" ]; then . "$$HOME/.nvm/nvm.sh" >/dev/null && nvm install >/dev/null; fi
	@$(NVM_USE) node -e 'const [major] = process.versions.node.split("."); const wanted = require("fs").readFileSync(".nvmrc", "utf8").trim(); if (major !== wanted) { console.error(`Node $${wanted} é obrigatório (encontrado $${process.version}). Instale com: nvm install`); process.exit(1); }'
	@$(NODE) pnpm_version=$$(node -p 'require("./package.json").packageManager.split("@")[1]'); \
		if ! command -v pnpm >/dev/null 2>&1; then \
			echo "Instalando pnpm@$$pnpm_version"; \
			npm install -g "pnpm@$$pnpm_version"; \
		fi
	@$(NODE) pnpm install --frozen-lockfile
	@$(NODE) pnpm exec playwright install chromium

setup-api: ## Instala as dependências do api com o uv (Python do .python-version)
	@$(PY) uv sync --locked

# --- Desenvolvimento ---------------------------------------------------------

dev: ## Sobe o web (5173) e o api (8000) juntos; Ctrl+C para os dois
	@$(MAKE) -j2 dev-web dev-api

dev-web: ## Sobe o Vite em http://localhost:5173 (com proxy de /api)
	@$(NODE) pnpm dev

dev-api: ## Sobe o FastAPI em http://localhost:8000
	@$(PY) uv run uvicorn game_analyzer.main:app --reload --port 8000

# --- Qualidade ---------------------------------------------------------------

lint: lint-web lint-api ## Roda Biome e Ruff

lint-web: ## Roda o Biome (lint e formatação, sem corrigir)
	@$(NODE) pnpm lint

lint-api: ## Roda o Ruff (lint e checagem de formatação)
	@$(PY) uv run ruff check . && uv run ruff format --check .

format: format-web format-api ## Formata o código com Biome e Ruff

format-web: ## Formata e corrige o web com o Biome
	@$(NODE) pnpm format

format-api: ## Formata e corrige o api com o Ruff
	@$(PY) uv run ruff check --fix . && uv run ruff format .

typecheck: typecheck-web typecheck-api ## Roda tsc --noEmit e mypy

typecheck-web: ## Roda o tsc --noEmit
	@$(NODE) pnpm typecheck

typecheck-api: ## Roda o mypy em modo strict
	@$(PY) uv run mypy

test: test-web test-api ## Roda Vitest e pytest, com cobertura mínima

test-web: ## Roda o Vitest com cobertura
	@$(NODE) pnpm test

test-api: ## Roda o pytest com cobertura (pula os testes marcados com llm)
	@$(PY) uv run pytest

test-e2e: ## Roda os testes Playwright contra o build (vite preview) com isolamento de origem
	@$(NODE) pnpm test:e2e

check: lint typecheck test ## lint + typecheck + test; obrigatório antes de qualquer commit

# --- Contrato frontend ↔ backend ---------------------------------------------

generate-api-types: ## Gera os tipos TypeScript do api a partir do OpenAPI do backend
	@schema="$$(mktemp -t openapi).json"; \
		(cd $(API_DIR) && uv run python -m game_analyzer.export_openapi > "$$schema") && \
		$(NVM_USE) cd $(WEB_DIR) && pnpm exec openapi-typescript "$$schema" -o $(API_TYPES); \
		status=$$?; rm -f "$$schema"; exit $$status

# --- Design ------------------------------------------------------------------

design: ## Serve os mockups de docs/design (porta: DESIGN_PORT, padrão 8080)
	@echo "Mockups disponíveis em:"
	@echo "  1. Colar a partida:       http://localhost:$(DESIGN_PORT)/step_01/Main.dc.html"
	@echo "  2. Analisando:            http://localhost:$(DESIGN_PORT)/step_02/Analisando.dc.html"
	@echo "  3. Resultado:             http://localhost:$(DESIGN_PORT)/step_03/Resultado.dc.html"
	@echo "  4. Treinar momento-chave: http://localhost:$(DESIGN_PORT)/step_04/Treino.dc.html"
	@echo
	@python3 -m http.server $(DESIGN_PORT) --bind 127.0.0.1 -d $(DESIGN_DIR)
