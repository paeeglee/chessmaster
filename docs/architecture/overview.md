# Arquitetura técnica

Visão técnica do produto descrito em `docs/product/general.md`. Quando os dois
divergirem, o PRD vale.

## Princípio central: os motores calculam, a IA só explica

- Avaliações, melhores lances, saldo de material, resultados e classificação dos
  erros sempre vêm de motores determinísticos.
- A IA só transforma esses números em texto para o nível do jogador. Ela nunca
  calcula nem inventa uma avaliação, um lance ou um número.
- A IA recebe um contrato JSON fechado: lances, posições, avaliações, momentos-chave
  com tipo de erro e melhor lance, resultado, cor do jogador, nível e prioridades.
  Ela só pode afirmar o que está nesse JSON ou o que deriva dele de forma trivial.
- Uma verificação automática compara os lances e números citados no texto da IA
  com o JSON e bloqueia ou corrige divergências.
- Textos que não precisam de IA (por exemplo, os itens de "Já encontrado") são
  gerados por template.

## Os cinco motores

| # | Motor | Entrada | Saída | Onde roda |
| - | ----- | ------- | ----- | --------- |
| 1 | Leitor | Texto colado | Lances em notação algébrica, resultado, metadados | Navegador (`apps/web`) |
| 2 | Regras | Lances | Todas as posições (FEN), legalidade, xeque, mate, afogamento | Navegador (`apps/web`) |
| 3 | Avaliação | Posições | Avaliação, melhor lance e perda de cada lance jogado | Navegador, Web Worker (Stockfish NNUE em WebAssembly) |
| 4 | Tabela de finais | Posições com poucas peças | Resultado exato e distância até o mate | Navegador, calculada localmente por retroanálise |
| 5 | IA | Saída estruturada dos motores 2 a 4, nível, prioridades | Resumo, textos dos momentos-chave, dicas, respostas | Backend (`apps/api`), pela camada de IA trocável |

## Decisões técnicas do MVP

- **Stockfish no navegador (D1):** Stockfish completo, com a rede NNUE completa,
  compilado para WebAssembly, rodando num Web Worker com
  `navigator.hardwareConcurrency - 1` threads. Tem cerca de 94 MB, começa a baixar
  quando a página carrega, mostra o progresso sem bloquear o jogador e fica no cache
  do navegador. Cerca de 200 ms por posição, profundidade mínima 12.
- **Isolamento de origem:** todas as páginas são servidas com
  `Cross-Origin-Opener-Policy: same-origin` e
  `Cross-Origin-Embedder-Policy: require-corp`, para habilitar o
  `SharedArrayBuffer`. Isso vale também para o servidor de desenvolvimento do Vite.
  Todo recurso de outra origem (fontes, imagens, scripts) precisa de CORS ou
  `Cross-Origin-Resource-Policy`; prefira servir da própria origem. Sem isolamento
  (`crossOriginIsolated === false`), usar a versão de uma thread.
- **Motor de regras com `chess.js`:** o motor 2 (posições em FEN, legalidade,
  xeque, mate e afogamento) usa a biblioteca `chess.js`, com versão exata fixada no
  `package.json`. Ela fica atrás do ponto de entrada do domínio `game`: os outros
  domínios nunca importam `chess.js` direto. O Leitor (motor 1) é nosso: ele lê o
  HTML do Chess.com e a lista simples de lances (notação inglesa ou portuguesa) e
  entrega os lances em SAN inglês ao `chess.js`.
- **A interface nunca trava:** os motores sempre rodam em Web Workers.
- **IA trocável (D4):** padrão OpenAI GPT-5.1 com saída estruturada (JSON Schema).
  Provedor e modelo vêm de configuração, sem mudar telas nem motores. Uma camada
  única recebe o contrato dos motores e sempre devolve o mesmo JSON Schema; cada
  provedor tem seu adaptador (autenticação, formato da chamada, saída estruturada).
- **Limiar de momento-chave (D3):** perda de 2 pontos de material ou mais,
  confirmada pelo motor. No máximo 5 momentos, em ordem cronológica.
- **Tipos de erro** (determinísticos sempre que possível): peça atacada, defensor
  saiu, outro (descrito pela IA).
- **Como a perda é medida (domínio `analysis`):** para cada lance, o motor avalia a
  posição antes e depois. A "linha de capturas" é o lance seguido das capturas da
  variante principal enquanto ela só captura (até 8 meios-lances). É momento-chave
  quando o material do jogador cai 2 pontos ou mais em relação a antes do lance **e**
  em relação à linha do melhor lance. A peça perdida é a primeira do jogador
  capturada nessa linha. "Defensor saiu": o lance tirou o único defensor dela; "peça
  atacada": ela já estava atacada e ficou no lugar; senão, "outro". A mesma regra nos
  lances do adversário gera a tag "Adversário"; ganhos de 2 pontos ou mais do
  jogador viram "O que você fez bem". Na partida de referência isso dá 22...Ta7,
  27...Tb7, 41...Ta1, 43...Te6 e 56...Ta8 (fixture de avaliações em
  `domains/analysis/fixtures/`, gerado por `scripts/evaluate-fixture.mjs`).
- **Nada é salvo (D2):** a análise existe só enquanto a página está aberta. Só o
  nível escolhido fica no armazenamento local.
- **Cor do jogador (D5):** sempre escolhida pelo jogador, sem valor padrão.

## Estado do frontend: XState 5

O estado da aplicação no frontend é controlado com **XState 5** (`xstate` e
`@xstate/react`). O fluxo do produto já é uma máquina de estados (Colar →
Analisando → Resultado ⇄ Treino, com cancelamento, falhas e novas tentativas), e as
máquinas deixam esses estados e transições explícitos e testáveis.

- **Máquina raiz (`app/`):** decide a tela atual e carrega os dados entre as telas
  (a partida lida, a cor, o nível, as prioridades, o resultado da análise). A tela
  mostrada é derivada do estado dessa máquina. Não há roteador de URL no MVP.
- **Tela Colar (F3):** o `appMachine` invoca o `gameInputMachine` (domínio
  `game-input`) no estado `gameInput`, passando o rascunho salvo (texto, cor, nível,
  prioridades). A cada mudança o filho envia `GAME_INPUT.DRAFT_SAVED` ao pai, e ao
  analisar envia `ANALYSIS.REQUESTED` com a partida reproduzida e as escolhas. Por
  isso, cancelar a análise volta à tela com tudo preenchido. O que a tela mostra
  (formato, lances legais, resultado) é derivado do texto por funções puras
  (`inspectGame`), sem guardar cópia na máquina.
- **Máquinas de domínio (`domains/<domínio>/machines/`):** cada fluxo com estados
  próprios tem sua máquina, por exemplo:
  - carregamento do motor (baixando com porcentagem, pronto, falhou, tentar de
    novo), que começa ao abrir a página (D1);
  - tela Colar (vazio, reconhecida, formato não reconhecido, lance ilegal) e as
    condições do botão "Analisar partida";
  - pipeline da análise (as cinco etapas, cada uma aguardando, em andamento,
    concluída ou com falha; cancelamento; resultado parcial);
  - sessão de treino (tentativas, níveis de dica, solução, próximo momento).
- **Como escrever:** cada máquina é criada com `setup({ types, actions, guards,
  actors }).createMachine(...)`, com `context`, eventos e `input` tipados em
  `types`. Ações, guards e atores são referenciados pelo nome declarado no
  `setup`.
- **Efeitos colaterais ficam em atores:** Web Workers (Stockfish, tabela de finais)
  viram atores `fromCallback`, que repassam as mensagens do worker como eventos e
  encerram o worker quando o ator para (assim "Cancelar análise" só precisa parar
  o ator). Chamadas à API (`/api/...`) viram atores `fromPromise`. O
  armazenamento local do nível fica numa ação ou ator próprio.
- **Regras de negócio fora das máquinas:** guards e ações chamam funções puras de
  `model/`. A máquina orquestra; ela não calcula material, momento-chave nem tipo
  de erro.
- **React:** a máquina raiz é exposta com `createActorContext` do `@xstate/react`.
  Os componentes leem só a fatia de que precisam com seletores e mudam o estado
  enviando eventos. Não use `useState`, `useReducer`, Context próprio nem outra
  biblioteca de estado para estado de fluxo; `useState` serve só para detalhes
  visuais locais de um componente (hover, menu aberto).
- **Testes:** as máquinas são testadas sem React, com `createActor` e
  `machine.provide()` para trocar workers, rede e armazenamento por versões falsas
  (ver `docs/engineering/quality.md`).

## Privacidade

- A partida não sai do navegador, exceto o JSON enviado à IA.
- Nada é armazenado no servidor no MVP. O backend não tem estado: sem banco de
  dados, sem contas, sem armazenamento de partidas.

## Contrato entre frontend e backend

- **Fonte única de verdade:** os modelos Pydantic do backend definem o contrato
  (requisição com o JSON dos motores e resposta com os textos). O FastAPI gera o
  OpenAPI a partir deles.
- **Tipos do frontend gerados, nunca escritos à mão:** os tipos TypeScript do
  cliente da API são gerados a partir do OpenAPI com `openapi-typescript` e ficam
  em `apps/web/src/domains/explanation/api/schema.gen.ts`. O
  `make generate-api-types` exporta o schema sem subir o servidor
  (`python -m game_analyzer.export_openapi`) e gera o arquivo. Arquivos gerados não são editados à mão; quando o contrato muda,
  gere de novo e faça o commit junto com a mudança do backend.
- **Rotas:** todas sob o prefixo `/api`. Sem versionamento na URL no MVP.
- **Portas de desenvolvimento:** frontend (Vite) em `5173`, backend (FastAPI) em
  `8000`. O `vite preview` (usado nos testes Playwright) roda em `4173`, com os
  mesmos cabeçalhos de isolamento e o mesmo proxy de `/api`.
- **OpenAPI e documentação:** o schema fica em `/api/openapi.json` e o Swagger UI
  em `/api/docs`.
- **Mesma origem no desenvolvimento:** o Vite faz proxy de `/api` para o backend.
  O frontend sempre chama caminhos relativos (`/api/...`). Isso evita CORS e não
  conflita com o isolamento de origem (COEP).
- **Validação nas duas pontas:** o backend valida a entrada e a saída da IA com os
  modelos Pydantic; o frontend trata a resposta como o tipo gerado.

## Variáveis de ambiente

- Cada app que precisa de configuração tem um `.env.example` com todas as
  variáveis, valores padrão seguros e um comentário para cada uma. O `.env` real
  nunca vai para o repositório (está no `.gitignore`).
- `make setup` copia o `.env.example` para `.env` quando o `.env` ainda não existe.
  Nunca sobrescreve um `.env` existente.
- Ao adicionar uma variável, adicione-a também no `.env.example`.
- Backend: `AI_PROVIDER`, `AI_MODEL` e a chave do provedor (`OPENAI_API_KEY`). As
  configurações são lidas com `pydantic-settings`.
- Frontend: só variáveis com prefixo `VITE_`, e nunca segredos (tudo com `VITE_`
  vai para o navegador).

## Stockfish: distribuição e licença

- **Origem:** o build WebAssembly oficial do pacote npm `stockfish` (Stockfish.js),
  com a versão exata fixada no `package.json`. Não baixar binários de fontes
  avulsas.
- **Sem binários no git:** os arquivos do motor (`.js` e `.wasm`) são copiados do
  `node_modules` para `apps/web/public/engine/` pelo `apps/web/scripts/copy-engine.mjs`,
  que roda no `make setup-web` e antes do `dev` e do `build` (só copia o que mudou).
  Essa pasta fica no `.gitignore`.
- **Dois builds:** o completo multi-thread (`stockfish-<versão>-mt.js/.wasm`) e o
  completo de uma thread (`stockfish-<versão>-st.js/.wasm`), para o fallback sem
  isolamento de origem. A escolha fica em `chooseEngineBuild` (domínio `evaluation`).
- **Progresso do download:** a página cria um `MessageChannel` e envia uma das portas
  ao worker como `{ progressPort }`; o stockfish.js publica nela
  `{ percent, loaded, total }` enquanto baixa o `.wasm`.
- **Carregamento:** a máquina `engineLoaderMachine` é invocada na raiz do
  `appMachine` (id `engine`), então o download começa ao abrir a página. Estados:
  `loading` (com porcentagem), `ready` (com o `EngineClient`) e `failed` (com
  "Tentar de novo").
- **Busca:** `position fen …` + `go movetime 200`; se a profundidade final ficar
  abaixo de 12, roda `go depth 12` na mesma posição. A pontuação é guardada sempre do
  ponto de vista das brancas.
- **Cache:** o nome dos arquivos inclui a versão do motor, para que o navegador
  possa guardar o arquivo por muito tempo (`Cache-Control: immutable`) e baixar de
  novo só quando a versão mudar.
- **Comunicação:** o app fala com o motor só por mensagens UCI, através do Web
  Worker. Nenhum código do app é misturado ao código do motor.
- **Licença GPL-3.0:** o motor fica como arquivo separado. A aplicação publica o
  arquivo de licença e um link para o código-fonte da versão exata usada (por
  exemplo, no rodapé "Motores usados"). Validar com o jurídico antes do lançamento.

## Camada de IA no backend (domínio `explanation`)

- **Rotas:** `POST /api/explanations` recebe o contrato (`GameContract`) e devolve o
  `GameExplanation` (manchete, frase de padrões, textos dos momentos-chave, pontos
  fortes, hábito). `POST /api/questions` recebe `{ game, question }` e devolve
  `{ answer, in_scope }`.
- **Erros:** provedor indisponível ou sem chave → 503 `ai_unavailable`; texto que cita
  lance, casa ou número fora do contrato duas vezes seguidas → 502
  `explanation_unverified`; corpo fora do contrato → 422.
- **Verificação automática:** lances (com ou sem número), casas e números inteiros
  citados precisam existir no contrato; manchete com no máximo 30 palavras; um texto
  por momento-chave, na mesma ordem. Na primeira reprovação, o caso de uso chama o
  provedor de novo com a lista de problemas.
- **Provedores:** `AI_PROVIDER=openai` usa o `ChatOpenAI` do LangChain com saída
  estruturada (`json_schema`, `strict`); `AI_PROVIDER=fake` gera textos por template
  só com fatos do contrato, útil para rodar o app sem chave.

## Prompts da IA

- Os prompts ficam como arquivos versionados dentro do domínio `explanation` do
  backend, não como texto solto no meio do código.
- Mudanças de prompt seguem o mesmo fluxo de qualquer código: PR, revisão e testes.
- **Partidas de referência:** um conjunto de partidas reais (incluindo a partida de
  72 lances do `general.md`) com o JSON dos motores. Antes de trocar o provedor, o
  modelo ou um prompt, rode esse conjunto e compare os textos gerados: eles
  precisam passar na verificação automática e manter a qualidade.
