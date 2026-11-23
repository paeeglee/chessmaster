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
- **A interface nunca trava:** os motores sempre rodam em Web Workers.
- **IA trocável (D4):** padrão OpenAI GPT-5.1 com saída estruturada (JSON Schema).
  Provedor e modelo vêm de configuração, sem mudar telas nem motores. Uma camada
  única recebe o contrato dos motores e sempre devolve o mesmo JSON Schema; cada
  provedor tem seu adaptador (autenticação, formato da chamada, saída estruturada).
- **Limiar de momento-chave (D3):** perda de 2 pontos de material ou mais,
  confirmada pelo motor. No máximo 5 momentos, em ordem cronológica.
- **Tipos de erro** (determinísticos sempre que possível): peça atacada, defensor
  saiu, outro (descrito pela IA).
- **Nada é salvo (D2):** a análise existe só enquanto a página está aberta. Só o
  nível escolhido fica no armazenamento local.
- **Cor do jogador (D5):** sempre escolhida pelo jogador, sem valor padrão.

## Privacidade

- A partida não sai do navegador, exceto o JSON enviado à IA.
- Nada é armazenado no servidor no MVP. O backend não tem estado: sem banco de
  dados, sem contas, sem armazenamento de partidas.

## Contrato entre frontend e backend

- **Fonte única de verdade:** os modelos Pydantic do backend definem o contrato
  (requisição com o JSON dos motores e resposta com os textos). O FastAPI gera o
  OpenAPI a partir deles.
- **Tipos do frontend gerados, nunca escritos à mão:** os tipos TypeScript do
  cliente da API são gerados a partir do OpenAPI (por exemplo, com
  `openapi-typescript`) e ficam no domínio `explanation` do frontend, num arquivo
  `*.gen.ts`. Arquivos gerados não são editados à mão; quando o contrato muda,
  gere de novo e faça o commit junto com a mudança do backend.
- **Rotas:** todas sob o prefixo `/api`. Sem versionamento na URL no MVP.
- **Portas de desenvolvimento:** frontend (Vite) em `5173`, backend (FastAPI) em
  `8000`.
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
  `node_modules` para `apps/web/public/engine/` por um script de setup. Essa pasta
  fica no `.gitignore`.
- **Dois builds:** o completo multi-thread e o completo de uma thread, para o
  fallback sem isolamento de origem.
- **Cache:** o nome dos arquivos inclui a versão do motor, para que o navegador
  possa guardar o arquivo por muito tempo (`Cache-Control: immutable`) e baixar de
  novo só quando a versão mudar.
- **Comunicação:** o app fala com o motor só por mensagens UCI, através do Web
  Worker. Nenhum código do app é misturado ao código do motor.
- **Licença GPL-3.0:** o motor fica como arquivo separado. A aplicação publica o
  arquivo de licença e um link para o código-fonte da versão exata usada (por
  exemplo, no rodapé "Motores usados"). Validar com o jurídico antes do lançamento.

## Prompts da IA

- Os prompts ficam como arquivos versionados dentro do domínio `explanation` do
  backend, não como texto solto no meio do código.
- Mudanças de prompt seguem o mesmo fluxo de qualquer código: PR, revisão e testes.
- **Partidas de referência:** um conjunto de partidas reais (incluindo a partida de
  72 lances do `general.md`) com o JSON dos motores. Antes de trocar o provedor, o
  modelo ou um prompt, rode esse conjunto e compare os textos gerados: eles
  precisam passar na verificação automática e manter a qualidade.
