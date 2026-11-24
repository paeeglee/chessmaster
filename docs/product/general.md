# PRD — Analisador de partidas (visão geral)

| | |
|---|---|
| **Produto** | Analisador de partidas com IA |
| **Versão do documento** | 0.6 (download do motor ao carregar a página) |
| **Data** | 22/11/2026 |
| **Status** | Em definição |
| **Telas cobertas** | Colar a partida · Analisando · Resultado · Treinar momento-chave |
| **PRDs relacionados** | Colar a partida · Analisando · Resultado · Treinar momento-chave |

---

## 1. Resumo

O Analisador de partidas recebe uma partida de xadrez colada pelo jogador e devolve uma análise em português simples. A análise mostra onde a partida foi decidida, quais erros se repetem e o que treinar. Cada erro importante vira um exercício "encontre o lance", montado com a posição real da partida.

O produto segue um princípio: **os motores calculam e a IA só explica**. Avaliações, melhores lances e resultados vêm de motores determinísticos. A IA transforma esses números em texto para o nível do jogador e nunca inventa uma avaliação.

## 2. Problema

Jogadores iniciantes terminam partidas sem saber por que ganharam ou perderam, ou por que a vitória demorou tanto. As análises automáticas das plataformas mostram números ("+2,3", "imprecisão") e linhas de lances que o iniciante não sabe interpretar. Faltam três coisas:

1. **Tradução**: explicar o erro em linguagem de quem está aprendendo ("o bispo estava atacado e ficou no lugar").
2. **Padrão**: agrupar erros parecidos, para o jogador ver o hábito por trás deles, e não só lances soltos.
3. **Prática**: transformar os próprios erros em treino, em vez de apenas lê-los.

**Caso de referência:** uma partida real de 72 lances, vencida com as pretas. Ela estava ganha desde o lance 12, mas o jogador devolveu material cinco vezes. Os erros seguiram dois padrões: deixar uma peça atacada no lugar e mover a peça que protegia outra.

## 3. Público

- **Principal:** jogadores iniciantes, aproximadamente até 1200 de rating, que jogam online (Chess.com em primeiro lugar) e querem melhorar sem estudar teoria.
- **Secundário:** professores que querem uma primeira leitura rápida da partida de um aluno.
- **Idioma:** português do Brasil.

## 4. Objetivos e métricas

As metas abaixo são hipóteses iniciais e precisam ser validadas com usuários.

| Objetivo | Métrica | Meta inicial (hipótese) |
|---|---|---|
| O jogador consegue colar e analisar sem ajuda | % de colagens que chegam ao Resultado | ≥ 85% |
| A análise é rápida o bastante | Tempo entre "Analisar" e o Resultado, para 70 lances | ≤ 75 s no p50 (era ≤ 30 s; mudou com a revisão lance a lance, 2026-11-24) |
| A explicação é entendida | "Entendi por que errei" (pergunta de 1 clique no Resultado) | ≥ 70% de "sim" |
| O jogador pratica | % de análises em que o jogador abre o Treino | ≥ 40% |
| Confiança | Erros de avaliação reportados pelo jogador | Acompanhar; meta a definir |

## 5. Escopo

### 5.1 No MVP
- Colar a partida **somente** como HTML da lista de lances do Chess.com ou como lista simples de lances (por exemplo, "1.d4 d5 2.Cc3 e6 …").
- Validação completa dos lances e reconstrução de todas as posições.
- Avaliação de cada posição por um motor.
- Tabela de finais exata para posições com poucas peças.
- Resumo da partida, gráfico de vantagem, lista de lances anotada, momentos-chave, "o que você fez bem" e hábito sugerido.
- Revisão lance a lance (estilo Game Review do Chess.com): classificação de cada lance, painel do treinador com o melhor lance e o porquê, o que ficou descoberto e a explicação da IA sob demanda.
- Exercício "encontre o lance" para cada momento-chave.
- Perguntas livres à IA sobre a partida analisada.
- Uso em computador (desktop).
- Dados apenas no navegador do jogador.

### 5.2 Fora do MVP
- Qualquer treino que não venha de uma partida do próprio jogador.
- Importação de PGN.
- Versão para celular e tablet (layout responsivo).
- Salvar partidas e a página "Minhas partidas" (histórico).
- Contas, login e sincronização entre dispositivos.
- Importação automática por nome de usuário ou link do Chess.com/Lichess.
- Análise de várias partidas juntas (tendências).
- Outros idiomas.

## 6. Fluxo principal

```
Colar a partida ──► Analisando ──► Resultado ──► Treinar momento-chave
      ▲                                │                   │
      └──── "Analisar outra partida" ◄─┘◄── "Voltar ao resultado"
```

1. **Colar a partida:** o download do motor de avaliação já começou ao carregar a página, com um indicador de progresso que não bloqueia nada. O jogador cola o texto e o sistema reconhece o formato e valida os lances. O jogador **seleciona** com qual cor jogou (o sistema não sugere nem deduz), o nível e as prioridades. Sem a cor selecionada ou com o motor ainda carregando, não é possível avançar.
2. **Analisando:** os motores rodam em sequência, com progresso visível e os erros aparecendo à medida que são encontrados.
3. **Resultado:** traz o resumo da IA, os dados da partida e os momentos-chave.
4. **Treinar momento-chave:** a posição real da partida é carregada, o jogador tenta achar o lance certo e recebe feedback e dicas.

## 7. Arquitetura funcional: os cinco motores

| # | Motor | Entrada | Saída | Observações |
|---|---|---|---|---|
| 1 | **Leitor** | Texto colado | Lista de lances em notação algébrica, resultado e metadados | Reconhece o HTML do Chess.com (`data-figurine` + `move-text`) e a lista simples de lances |
| 2 | **Regras** | Lista de lances | Todas as posições (FEN), legalidade de cada lance, xeque, mate e afogamento | Determinístico; um lance ilegal interrompe a análise com erro claro |
| 3 | **Avaliação** | Posições | Avaliação de cada posição, melhor lance, perda de cada lance jogado | Stockfish completo (NNUE) em WebAssembly, multi-thread, num Web Worker do navegador (decisão D1) |
| 4 | **Tabela de finais** | Posições com poucas peças | Resultado exato (vitória, empate ou derrota) e distância até o mate | Calculada localmente por retroanálise; começa com rei e dama contra rei e com rei e torre contra rei |
| 5 | **IA (explicação)** | Saídas estruturadas dos motores 2 a 4, nível e prioridades | Resumo, textos dos momentos-chave, dicas e respostas | Padrão: OpenAI GPT-5.1; provedor e modelo trocáveis por configuração (decisão D4). Nunca calcula avaliações; só cita números fornecidos pelos motores |

### 7.1 Regras de classificação (antes da IA)
O motor de avaliação classifica cada lance. A IA só redige os textos.
- **Material perdido**: o saldo de material do jogador cai em relação ao melhor lance, e a queda se confirma na sequência calculada pelo motor.
- **Momento-chave**: um lance do jogador que perde **2 pontos de material ou mais**, com a perda confirmada pelo motor (decisão D3). O MVP mostra no máximo 5 momentos, em ordem cronológica.
- **Classificação de cada lance** (revisão lance a lance, decisão de 2026-11-24): a perda de chance de vitória de quem jogou, calculada a partir da avaliação do motor antes e depois do lance (fórmula do Lichess), define a classe na escala do Chess.com: **Melhor** (só o lance do motor), **Excelente** (< 2 pontos percentuais, inclusive outro lance sem perda), **Bom** (< 5), **Imprecisão** (< 10), **Erro** (< 20), **Capivarada** (≥ 20) e **Perdeu a chance** (o adversário acabou de errar, perdendo 10 ou mais, e o lance devolve 10 ou mais). **Piso de material:** um lance que perde 2 pontos de material ou mais pela regra do momento-chave é no mínimo Erro, e Capivarada a partir de 5, porque com vantagem grande a chance de vitória quase não muda quando uma peça cai.
- **Fatos de cada lance**, do motor de regras e da variante do motor: o melhor lance e sua linha; as peças que o lance deixou descobertas (atacadas sem defesa, ou atacadas por peça mais barata); as que já estavam assim e continuaram; o material que o melhor lance ganharia a mais; e o porquê do melhor lance (xeque, mate em N, material ganho, peça salva).
- **Tipo de erro** (deterministicamente, sempre que possível):
  - *Peça atacada*: a peça perdida já estava atacada antes do lance do jogador.
  - *Defensor saiu*: o lance moveu a única peça que protegia a peça perdida.
  - *Outro*: a IA descreve, marcado como explicação.

### 7.2 Contrato motor → IA
A IA recebe um JSON fechado. Ela só pode afirmar o que está nesse JSON e o que deriva dele de forma trivial, como "o bispo estava em a1". O JSON traz:
- lances, posições e avaliações;
- os momentos-chave, com o tipo de erro e o melhor lance;
- o resultado e a cor do jogador.

Uma verificação automática compara lances e números citados no texto com o JSON e bloqueia ou corrige divergências.

Na revisão lance a lance, cada lance tem um contrato próprio, menor, enviado só quando o jogador abre o lance: o lance, de quem é, a classificação, o melhor lance com sua linha, as peças descobertas ou que continuaram atacadas, o material deixado de ganhar e os motivos do melhor lance. A mesma verificação vale para esse texto.

## 8. Requisitos não funcionais

- **Privacidade:** a partida não sai do navegador, exceto o JSON enviado à IA. Isso deve estar explícito na tela de colar. Nada é armazenado no servidor no MVP.
- **Plataforma:** somente desktop, nas versões atuais de Chrome, Edge, Firefox e Safari. Celular e tablet ficam fora do MVP.
- **Isolamento de origem:** todas as páginas são servidas com `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp`, para habilitar o motor multi-thread (D1). Todo recurso de outra origem (fontes, imagens, scripts) precisa vir com CORS ou `Cross-Origin-Resource-Policy`, senão o navegador o bloqueia.
- **Desempenho:** Resultado em até 30 s para 70 lances num notebook comum (hipótese). A interface não trava durante a análise, porque os motores rodam em Web Worker.
- **Acessibilidade:**
  - o tabuleiro é navegável por teclado e cada casa tem rótulo;
  - contraste mínimo de 4,5:1;
  - nenhuma informação é transmitida só por cor (tags de texto como "Erro" e "Peça atacada");
  - alvos clicáveis com pelo menos 44 px.
- **IA trocável:** o provedor e o modelo são definidos por configuração, sem mudar código de tela nem dos motores. Uma camada única de integração recebe o contrato da seção 7.2 (o JSON dos motores, o nível e as prioridades) e devolve os textos sempre no mesmo JSON Schema, seja qual for o provedor. Cada provedor tem um adaptador próprio, que lida com autenticação, formato de chamada e saída estruturada.
- **Idioma e notação:** português; notação algébrica com letras em português (R, D, T, B, C).
- **Robustez:** colagens parciais, lixo de HTML e lances com "+", "#" ou anotações não quebram o leitor.

## 9. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| A IA "explica" algo que o motor não disse | Perda de confiança | Contrato fechado (7.2) e verificação automática do texto |
| O Chess.com muda o HTML da lista de lances | O leitor falha | Leitor tolerante, lista simples de lances como alternativa e mensagem de erro com instruções |
| Motor lento em computadores mais fracos | Abandono na tela Analisando | Multi-thread (D1), tempo fixo por posição, profundidade adaptativa e resultado parcial com aviso |
| Download de cerca de 94 MB do motor completo | Primeira análise demora a começar, sobretudo em conexões lentas | Começar o download ao carregar a página, mostrar o progresso sem bloquear o jogador, habilitar "Analisar partida" só com o motor pronto e manter o arquivo no cache do navegador |
| Os cabeçalhos de isolamento bloqueiam recursos de terceiros | Fontes, imagens ou scripts externos deixam de carregar | Servir os recursos da própria origem ou exigir CORS/CORP; testar todas as telas com o isolamento ativo |
| Navegador sem isolamento de origem | O motor roda numa thread só, mais devagar | Detectar o isolamento e usar a versão de uma thread automaticamente; registrar o caso nas métricas |
| Licença GPL-3.0 do Stockfish | Obrigações de distribuição do código-fonte | Manter o motor como arquivo separado, publicar o código-fonte do motor junto com o produto e validar com o jurídico (D1) |
| Troca de provedor ou modelo muda a qualidade dos textos | Explicações piores ou fora do contrato | Mesmo JSON Schema e mesma verificação automática para todos os provedores; antes de trocar, rodar um conjunto de partidas de referência e comparar os textos |
| Classificação de erro errada | Treino irrelevante | Regras determinísticas primeiro; "outro" quando houver dúvida |

## 10. Decisões do MVP

| # | Tema | Decisão |
|---|---|---|
| D1 | Motor de avaliação | **Stockfish, versão completa (rede NNUE completa), compilado para WebAssembly e rodando em várias threads** num Web Worker do navegador. É o motor livre mais forte e funciona sem servidor, o que mantém a partida no computador do jogador. **Multi-thread:** o motor usa `navigator.hardwareConcurrency − 1` threads, deixando um núcleo livre para a interface. Isso exige que a página seja *cross-origin isolated*: o servidor envia os cabeçalhos `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp`, que liberam o `SharedArrayBuffer`. Se o navegador não estiver isolado, o sistema usa a versão completa de uma thread, com o mesmo resultado e mais lentidão. **Tamanho e carregamento:** a versão completa tem cerca de 94 MB. O download começa **assim que a página é carregada**, sem esperar a partida ser colada, e o arquivo fica no cache do navegador para as visitas seguintes. Durante o download, um indicador mostra que o motor está sendo carregado, com a porcentagem, **sem bloquear o jogador**: ele pode colar a partida e fazer as escolhas normalmente. O botão "Analisar partida" também verifica o estado do download: só fica habilitado com o motor pronto, além da partida válida e da cor selecionada. Enquanto isso, mostra "Carregando o motor… N%". Se o download falhar, o indicador mostra o erro e oferece "Tentar de novo". **Configuração:** tempo fixo de cerca de 500 ms por posição, com profundidade mínima de 12, o que dá cerca de 75 s para 72 lances (145 posições). Era 200 ms (meta de 30 s); subiu em 2026-11-24 para a revisão lance a lance classificar cada lance com avaliações mais estáveis. Com várias threads, o motor chega mais fundo no mesmo tempo; o tempo por posição deve ser recalibrado depois de medir. **Licença:** GPL-3.0. O motor fica como arquivo separado, que conversa com o app só por mensagens UCI, e o código-fonte do motor é publicado junto. Validar esse arranjo com o jurídico antes do lançamento. |
| D2 | Salvar partidas | **Não há** "Salvar em Minhas partidas" no MVP. A análise existe só enquanto a página está aberta. O botão sai do design da tela Resultado. |
| D3 | Limiar de momento-chave | Perda de **2 pontos de material ou mais**, confirmada pelo motor (proposta aprovada). |
| D4 | Provedor e modelo de IA | **Padrão: OpenAI, modelo GPT-5.1**, seguindo o padrão da API: saída estruturada com JSON Schema para os textos da análise e o mesmo contrato da seção 7.2 nas perguntas livres. **Provedor e modelo precisam ser trocáveis** por configuração, sem mudar o restante do sistema (ver 8 e 9). |
| D5 | Cor do jogador | O jogador **seleciona** a cor; o sistema não sugere. Sem cor selecionada, o botão "Analisar partida" fica desabilitado. |

## 11. Glossário

- **Momento-chave:** um lance do jogador que mudou a avaliação de forma relevante.
- **Peça atacada:** a peça já estava ameaçada e não foi movida nem protegida.
- **Defensor saiu:** a peça movida era a que protegia outra.
- **Tabela de finais:** o resultado exato de posições com poucas peças, calculado de trás para frente a partir dos mates.
