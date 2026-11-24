# PRD — Tela 2: Analisando

| | |
|---|---|
| **Produto** | Analisador de partidas com IA |
| **Tela** | Analisando (passo 2 de 3) |
| **Versão** | 0.4 (alinhada à visão geral 0.6) |
| **Plataforma** | Somente desktop |
| **Data** | 22/11/2026 |
| **PRD geral** | Analisador de partidas — visão geral |

---

## 1. Objetivo
Transformar a espera em parte da experiência. O jogador vê que cada etapa faz uma coisa, entende que a IA só entra no fim e já começa a ver os primeiros achados antes do resultado completo.

## 2. Estrutura da tela
1. **Cabeçalho e indicador de passos**, com "Analisar" como passo atual.
2. **Tabuleiro "Repassando a partida"**, à esquerda: acompanha o lance que o motor de avaliação está processando e mostra "Lance N de M" e o último lance jogado.
3. **Etapas da análise**, à direita: uma lista ordenada de quatro etapas, cada uma com estado, descrição curta e tempo:
   1. Leitura dos lances
   2. Motor de regras
   3. Motor de avaliação (com barra de progresso, "lance N de M" e tempo restante)
   4. Explicação da IA

   A tabela de finais (motor 4) não tem etapa própria nesta tela (decisão de 2026-11-24): ela roda por trás, logo depois do motor de avaliação, e o resultado dela aparece só na tela Resultado.
4. **"Já encontrado"**: os achados aparecem à medida que o motor avança, com uma tag de tipo (Bom, Erro, Adversário).
5. **Ação secundária:** "Cancelar análise".

## 3. Requisitos funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| A-01 | Rodar os motores em Web Worker; a interface nunca trava | Obrigatório |
| A-02 | Cada etapa tem um estado visível: aguardando, em andamento, concluída ou com falha | Obrigatório |
| A-03 | A etapa 3 roda o Stockfish completo (WebAssembly) em várias threads, com cerca de 500 ms por posição e profundidade mínima de 12 (D1 da visão geral). Sem isolamento de origem, usa a versão de uma thread. Mostra o progresso real (lances processados ÷ total) e uma estimativa de tempo restante, atualizada a cada lance | Obrigatório |
| A-04 | O tabuleiro acompanha o lance avaliado, sem animação longa (no máximo 150 ms por lance) | Desejável |
| A-05 | "Já encontrado" lista os momentos assim que o motor os confirma, em ordem cronológica, com no máximo 6 itens visíveis | Desejável |
| A-06 | A tabela de finais roda por trás, sem etapa na tela, só se houver posições cobertas por ela | Obrigatório |
| A-07 | A etapa da IA só começa depois do motor de regras, do motor de avaliação e da tabela de finais e recebe apenas o JSON estruturado (contrato 7.2 do PRD geral). A chamada passa pela camada de IA trocável, com GPT-5.1 por padrão (D4) | Obrigatório |
| A-08 | Ao concluir, vai para o Resultado automaticamente, sem clique extra | Obrigatório |
| A-09 | "Cancelar análise" interrompe os workers e volta à tela Colar com o texto preservado | Obrigatório |
| A-10 | Se a análise passar de 60 s, oferecer "Ver resultado parcial" com uma profundidade menor | Desejável |
| A-11 | A análise só começa com o motor já carregado: o download começa ao abrir a página e o botão "Analisar partida" da tela Colar só é habilitado com o motor pronto (D1). Por isso, esta tela não tem etapa de download | Obrigatório |

## 4. Regras de negócio
- **Tag "Adversário":** um erro do adversário que favoreceu o jogador (exemplo: 12.Ce2?, que abriu a diagonal para 12...Bxa1). Aparece em "Já encontrado" para mostrar o lado positivo, mas não entra nos momentos-chave do jogador.
- **Tag "Erro":** um lance do jogador que perde 2 pontos de material ou mais, com a perda confirmada pelo motor, e que entrará nos momentos-chave (regra 7.1 e D3 do PRD geral).
- **Textos de "Já encontrado":** gerados por template a partir dos dados do motor, sem IA (exemplo: "deixou o bispo em a1 ser capturado"). A IA só entra na etapa 5.

## 5. Estados

| Estado | Comportamento |
|---|---|
| Normal | Como no design |
| Falha no motor de avaliação | A etapa 3 fica vermelha com "Tentar de novo" e "Analisar com profundidade menor" |
| Falha na IA | O Resultado abre sem os textos da IA, com dados, gráfico e lista de lances, e com o aviso "A explicação não pôde ser gerada" e o botão "Tentar de novo" |
| Aba em segundo plano | A análise continua; ao voltar, a tela mostra o estado atual |
| Computador lento | A estimativa de tempo se ajusta; depois de 60 s, aplica-se A-10 |

## 6. Critérios de aceite
- **Dado** uma partida válida de 72 lances, **quando** a análise começa, **então** as etapas 1 e 2 aparecem como concluídas em menos de 1 s e a etapa 3 mostra o progresso real.
- **Dado** que o motor confirmou um erro do jogador no lance 22, **quando** a confirmação acontece, **então** "22...Ta7?" aparece em "Já encontrado" sem esperar o fim da análise.
- **Dado** que cliquei em "Cancelar análise", **quando** volto à tela Colar, **então** o texto colado e as escolhas continuam lá.
- **Dado** que a IA falhou, **quando** as outras etapas terminam, **então** vou para o Resultado com os dados dos motores e o aviso de falha.

## 7. Acessibilidade
- As barras de progresso usam `role="progressbar"` com valores.
- As mudanças de etapa são anunciadas por `aria-live="polite"`, de forma resumida, sem anunciar cada lance.
- O tabuleiro animado é decorativo para leitores de tela; o texto "Lance N de M" é o que vale.
- Com `prefers-reduced-motion`, o tabuleiro não anima.

## 8. Métricas
- Tempo de cada etapa (p50/p90), por navegador e sistema operacional.
- Taxa de cancelamento e em que etapa ele acontece.
- Taxa de falha por motor.
- % de análises rodando em várias threads × em uma thread, e o tempo de cada caso.
- Tempo de download do motor e quanto tempo o jogador esperou por ele com a partida pronta (medido na tela Colar).

## 9. Questões em aberto
- Mostrar também os bons lances em "Já encontrado", ou só erros e presentes do adversário?
- O tabuleiro deve acompanhar a análise ou repassar a partida em velocidade fixa? Acompanhar é mais honesto; repassar é mais agradável.
