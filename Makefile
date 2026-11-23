DESIGN_DIR  := docs/design
DESIGN_PORT ?= 8080

# Todo .env.example dentro de apps/ gera um .env ao lado dele no setup
ENV_EXAMPLES := $(wildcard apps/*/.env.example)

.PHONY: help setup setup-env design

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

setup: setup-env ## Prepara o ambiente de desenvolvimento de todos os apps

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

design: ## Serve os mockups de docs/design (porta: DESIGN_PORT, padrão 8080)
	@echo "Mockups disponíveis em:"
	@echo "  1. Colar a partida:       http://localhost:$(DESIGN_PORT)/step_01/Main.dc.html"
	@echo "  2. Analisando:            http://localhost:$(DESIGN_PORT)/step_02/Analisando.dc.html"
	@echo "  3. Resultado:             http://localhost:$(DESIGN_PORT)/step_03/Resultado.dc.html"
	@echo "  4. Treinar momento-chave: http://localhost:$(DESIGN_PORT)/step_04/Treino.dc.html"
	@echo
	@python3 -m http.server $(DESIGN_PORT) --bind 127.0.0.1 -d $(DESIGN_DIR)
