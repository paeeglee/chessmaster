# Estrutura do código: DDD com colocação

Os dois apps seguem Domain-Driven Design. O código é agrupado por **domínio**, não
por tipo técnico: tudo o que um domínio precisa (tipos, regras, componentes, hooks,
workers, rotas, testes) fica junto, na pasta desse domínio. Não crie pastas de topo
como `components/`, `hooks/`, `services/` ou `models/` misturando vários domínios.

## Regras gerais (frontend e backend)

- **Linguagem ubíqua:** nomes de domínios, pastas, arquivos e tipos vêm do
  glossário (`docs/product/glossary.md`). Um conceito novo entra no glossário antes.
- **Colocação:** arquivos que mudam juntos ficam juntos. Os testes ficam ao lado do
  código que testam.
- **Fronteiras entre domínios:** um domínio só usa outro pelo ponto de entrada
  público (`index.ts` no frontend, o `__init__.py` do pacote no backend). Nunca
  importe arquivos internos de outro domínio.
- **Regras de negócio puras:** classificação dos lances, limiar de momento-chave,
  tipos de erro e o contrato motor → IA ficam em código puro, sem depender de React,
  FastAPI, LangChain, workers ou rede. Assim são fáceis de testar.
- **Dependências apontam para dentro:** interface, framework e infraestrutura
  dependem do domínio, nunca o contrário.
- **`shared/` só para código usado por dois ou mais domínios** e sem significado de
  negócio (componentes genéricos de interface, utilitários). Na dúvida, mantenha no
  domínio; mova para `shared/` só quando um segundo domínio precisar.

## Frontend (`apps/web`)

Domínios iniciais (ajuste conforme o código crescer e atualize este arquivo):

```
apps/web/src/
├── app/                  # Inicialização, rotas, providers globais, tema do Tailwind
├── domains/
│   ├── game/             # Partida colada: leitor e regras (motores 1–2), posições, notação
│   ├── evaluation/       # Worker do Stockfish e tabela de finais (motores 3–4), carregamento do motor
│   ├── analysis/         # Fluxo da análise, classificação dos lances, momentos-chave, tela Analisando
│   ├── explanation/      # Cliente da camada de IA (apps/api), tipos gerados do contrato
│   ├── game-input/       # Tela Colar a partida (passo 1)
│   ├── review/           # Tela Resultado (passo 3)
│   └── training/         # Tela Treinar momento-chave (passo 4)
└── shared/
    ├── ui/               # Componentes genéricos (botões, chips, tags, desenho do tabuleiro)
    └── lib/              # Utilitários genéricos
```

Dentro de um domínio, separe por papel só quando ajudar:

```
domains/analysis/
├── index.ts              # Ponto de entrada público do domínio
├── model/                # Tipos e regras puras (classificação, momentos-chave)
├── workers/              # Web Workers deste domínio
├── hooks/                # Hooks React deste domínio
├── components/           # Componentes React deste domínio
├── fixtures/             # Dados de teste deste domínio (ex.: HTML real do Chess.com)
└── *.test.ts(x)          # Testes ao lado do código
```

Os testes de ponta a ponta (Playwright) ficam em `apps/web/e2e/`, porque cobrem o
fluxo entre domínios.

## Backend (`apps/api`)

Cada domínio segue as camadas clássicas do DDD:

```
apps/api/
├── pyproject.toml
└── src/<package>/
    ├── main.py                   # App FastAPI: cria o app e monta os routers dos domínios
    ├── domains/
    │   └── explanation/          # Camada de IA: resumo, textos dos momentos-chave, dicas, "Pergunte à IA"
    │       ├── __init__.py       # Ponto de entrada público do domínio
    │       ├── domain/           # Entidades, value objects, regras: contrato, schema de saída, verificação
    │       ├── application/      # Casos de uso (explicar partida, responder pergunta) e portas (interfaces)
    │       ├── infrastructure/   # Adaptadores: provedores de IA via LangChain, configurações
    │       ├── prompts/          # Prompts versionados
    │       ├── api/              # Router FastAPI e schemas de requisição/resposta
    │       └── tests/            # Testes deste domínio
    └── shared/                   # Código sem significado de negócio (config, logging, erros)
```

- `domain/` não importa nada de `application/`, `infrastructure/` ou `api/`, nem de
  FastAPI ou LangChain.
- `application/` define as portas (por exemplo, um `Protocol` `LLMProvider`) e
  depende só de `domain/`.
- `infrastructure/` implementa as portas. Cada provedor de IA é um adaptador
  próprio, o que mantém provedor e modelo trocáveis (D4).
- `api/` traduz HTTP em chamadas de casos de uso. Nada de regra de negócio nos
  routers.
