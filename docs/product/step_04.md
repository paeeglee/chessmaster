# PRD — Tela 4: Treinar momento-chave

| | |
|---|---|
| **Produto** | Analisador de partidas com IA |
| **Tela** | Treinar momento-chave |
| **Versão** | 0.2 (alinhada à visão geral 0.4) |
| **Plataforma** | Somente desktop |
| **Data** | 22/11/2026 |
| **PRD geral** | Analisador de partidas — visão geral |

---

## 1. Objetivo
Fazer o jogador encontrar, sozinho, o lance que deveria ter jogado nos momentos-chave da própria partida. Ler o erro ensina pouco; reencontrar a posição e achar a solução fixa o padrão ("peça atacada", "defensor saiu").

## 2. Escopo
- Treina **apenas posições da partida analisada**, enquanto a página estiver aberta (não há histórico no MVP).
- Não inclui o treinador de mates nem exercícios genéricos, que estão fora do MVP.

## 3. Estrutura da tela
1. **Barra superior:** "← Voltar ao resultado" e o progresso "Momento 1 de 5", com indicadores.
2. **Tabuleiro**, à esquerda:
   - a posição real, anterior ao erro, vista pelo lado do jogador;
   - é interativo: clicar ou arrastar;
   - abaixo, "Pretas jogam (você)" e a instrução de interação.
3. **Painel**, à direita:
   - **Enunciado:** o tipo do exercício ("Encontre o lance · tipo: peça atacada"), a pergunta e o contexto ("Na partida você jogou 22...Ta7").
   - **Feedback da tentativa:** o resultado do lance tentado e o que acontece em seguida.
   - **Dica:** aparece sob demanda, em níveis.
   - **Ações:** Desfazer, Outra dica, Mostrar solução.
   - **"Depois deste momento":** a ponte para os próximos momentos e a regra de reforço por padrão.

## 4. Requisitos funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| T-01 | Carregar a posição anterior ao lance errado, com a vez de quem jogou o erro | Obrigatório |
| T-02 | Validar lances com o motor de regras, mostrando os destinos possíveis ao selecionar uma peça | Obrigatório |
| T-03 | Aceitar como correto qualquer lance cuja avaliação, segundo o motor, fique dentro de uma margem do melhor (por exemplo, não perde material). Não aceitar só o lance exato | Obrigatório |
| T-04 | Lance errado: mostrar a resposta do adversário calculada pelo motor e explicar a consequência em 1 ou 2 frases, sem revelar a solução | Obrigatório |
| T-05 | Se o jogador repetir o lance da partida, avisar que foi o lance jogado na partida | Desejável |
| T-06 | Dicas em 3 níveis: (1) o padrão ("olhe a primeira fileira: quem ataca a1?"); (2) a peça ("o bispo pode fugir…"); (3) "Mostrar solução", que exibe uma seta e o lance | Obrigatório |
| T-07 | Acerto: confirmar, mostrar a continuação do motor (até 4 meios-lances) e reforçar o princípio em uma frase | Obrigatório |
| T-08 | "Desfazer" volta à posição inicial do exercício sem perder o histórico de tentativas | Obrigatório |
| T-09 | Avançar com "Próximo momento", que aparece após acertar ou após "Mostrar solução" | Obrigatório |
| T-10 | Registrar por momento: acertou de primeira, acertou com dica, ou viu a solução | Obrigatório |
| T-11 | Reforço por padrão: se o jogador errar dois momentos do mesmo tipo, oferecer ao final um exercício extra desse tipo, com outra posição da mesma partida, se houver | Desejável |
| T-12 | Ao terminar todos, mostrar um resumo ("3 de 5 de primeira") e voltar ao Resultado | Obrigatório |

## 5. Regras de conteúdo
- O enunciado nunca entrega a resposta. Ele diz o tipo de problema e a pergunta.
- O feedback de erro mostra **o que acontece** (a resposta do adversário), não "está errado".
- As dicas seguem a ordem padrão → peça → solução. Cada nível mostra menos do que o seguinte.
- Os textos vêm da camada de IA trocável (GPT-5.1 por padrão, D4 do PRD geral), a partir do JSON do motor (posição, melhor lance, refutação), com o mesmo contrato do PRD geral.

## 6. Estados

| Estado | Comportamento |
|---|---|
| Antes da primeira tentativa | Enunciado, tabuleiro livre e botão "Dica"; sem feedback |
| Tentativa errada | Feedback âmbar com o número da tentativa; o tabuleiro mostra a refutação e volta à posição inicial |
| Acerto | Feedback verde, continuação animada e "Próximo momento" |
| Solução mostrada | Seta na solução, explicação e "Próximo momento"; o momento fica marcado como "viu a solução" |
| Último momento concluído | Resumo do treino e "Voltar ao resultado" |

## 7. Critérios de aceite
- **Dado** o momento 1 da partida de referência, **quando** a tela abre, **então** vejo a posição anterior a 22...Ta7, com as pretas embaixo e a vez das pretas.
- **Dado** que joguei 22...Te6, **quando** o lance é feito, **então** vejo 23.Txa1 como resposta e o feedback "ainda perde o bispo", sem a solução.
- **Dado** que joguei 22...Bd4+, **quando** o lance é feito, **então** ele é aceito como correto e vejo a continuação e o princípio reforçado.
- **Dado** que existem outros lances que salvam o bispo sem perder material (por exemplo, 22...Bb2), **quando** jogo um deles, **então** ele também é aceito (T-03).

## 8. Acessibilidade
- O tabuleiro aceita jogar por teclado: Tab até a casa, depois Enter na origem e Enter no destino.
- O feedback é anunciado com `role="status"`.
- As dicas não dependem de cor (casas destacadas vêm acompanhadas de texto).

## 9. Métricas
- % de momentos acertados de primeira, com dica e com solução mostrada.
- Treinos concluídos por análise.

## 10. Questões em aberto
- Qual margem define "lance aceitável" para iniciantes em T-03? Proposta: não perder material segundo o motor.
