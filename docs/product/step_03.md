# PRD — Tela 3: Resultado

| | |
|---|---|
| **Produto** | Analisador de partidas com IA |
| **Tela** | Resultado (passo 3 de 3) |
| **Versão** | 0.2 (alinhada à visão geral 0.4) |
| **Plataforma** | Somente desktop |
| **Data** | 22/11/2026 |
| **PRD geral** | Analisador de partidas — visão geral |

---

## 1. Objetivo
Responder em poucos segundos à pergunta "o que aconteceu nesta partida?" e levar o jogador a uma ação: entender um momento-chave, treiná-lo ou perguntar à IA.

## 2. Hierarquia da informação
1. **Veredito em uma frase**: a manchete da IA.
2. **Padrões**: o que se repetiu.
3. **Números de apoio**: momentos, melhor lance, vantagem máxima e o final.
4. **Exploração**: tabuleiro com barra de avaliação, revisão lance a lance, gráfico e lista de lances.
5. **Ação**: momentos-chave com "Treinar", o hábito sugerido e as perguntas à IA.

## 3. Estrutura da tela
1. **Barra superior:** indicador de passos ("Revisar e treinar") e a ação "Analisar outra partida". Não há opção de salvar: a análise existe só enquanto a página está aberta (D2 do PRD geral).
2. **Faixa de resumo** (fundo escuro):
   - tag de resultado ("Vitória · 0-1");
   - contexto ("Você: pretas · 72 lances · xeque-mate");
   - **manchete** de uma frase e uma frase de padrões.
3. **Cartões de números** (4):
   - momentos em que o jogador perdeu material;
   - melhor lance;
   - maior vantagem;
   - lances até o mate no final (quando houver).
4. **Coluna esquerda:**
   - **Tabuleiro**: posição do momento selecionado, vista pelo lado do jogador; controles de início, anterior, próximo, fim e girar; legenda das marcações (peça atacada em vermelho, lance sugerido em verde). Ao lado, a **barra de avaliação** do motor para a posição mostrada (ponto de vista das brancas).
   - **Revisão do lance** (painel do treinador, estilo Game Review do Chess.com): só para os lances do jogador: o lance da posição mostrada, quando é do jogador, ou o lance que o jogador fez a partir dela ("Seu lance a seguir"), quando a posição vem depois de um lance do adversário, a classificação, de quem é o lance, "Melhor era …" com o porquê, o que o lance deixou descoberto ou deixou passar, a linha do motor com "Ver a linha do motor" e a explicação da IA, pedida só quando o lance é aberto.
   - **Gráfico "Vantagem de material"**: curva ao longo dos lances, com os momentos-chave marcados por círculos numerados e clicáveis.
   - **Lista de lances**: em colunas, com os lances do jogador anotados (`?`, `??`, `!`), o ícone da classificação de cada lance do jogador e o lance selecionado destacado.
5. **Coluna direita:**
   - **Momentos-chave:** lista em ordem cronológica; um item fica expandido por vez, com explicação, melhor lance, variação de vantagem, "Treinar este momento" e "Ver a linha no tabuleiro".
   - **"O que você fez bem":** de 1 a 3 itens.
   - **Hábito para a próxima partida:** uma frase acionável, ligada aos padrões encontrados.
   - **Pergunte à IA:** chips de sugestão e campo livre.
6. **Rodapé "Motores usados":** status de cada motor e o lembrete de que a IA só explica.

## 4. Requisitos funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| R-01 | A manchete cita apenas fatos do JSON dos motores (o lance em que a vantagem começou, o número de devoluções de material etc.) | Obrigatório |
| R-02 | Agrupar os momentos-chave por tipo de erro (Peça atacada, Defensor saiu, Outro) e mostrar o tipo como tag de texto | Obrigatório |
| R-03 | Clicar num momento (na lista, no gráfico ou na lista de lances) sincroniza os três: tabuleiro, item expandido e destaque | Obrigatório |
| R-04 | O tabuleiro abre na posição anterior ao primeiro momento-chave | Obrigatório |
| R-05 | Navegar pelos lances com os botões e com as setas do teclado (← →, Home, End) | Obrigatório |
| R-06 | O gráfico mostra o saldo de material do ponto de vista do jogador; se houver avaliação do motor, oferecer a alternância "Material \| Avaliação" | Obrigatório / Desejável |
| R-07 | Cada momento expandido mostra: o que aconteceu, o melhor lance (calculado pelo motor), a variação de vantagem e as ações | Obrigatório |
| R-08 | "Treinar este momento" abre a tela de Treino nesse momento; "Treinar os N momentos" abre o primeiro | Obrigatório |
| R-09 | "Ver a linha no tabuleiro" anima a sequência do motor a partir do momento (até 6 meios-lances) | Desejável |
| R-10 | "O que você fez bem" cita só lances com ganho real calculado pelo motor | Obrigatório |
| R-11 | Pergunte à IA: as respostas usam o mesmo contrato da análise; perguntas fora da partida recebem um aviso educado | Obrigatório |
| R-12 | O rodapé mostra quais motores rodaram e se algum falhou | Obrigatório |
| R-13 | "Analisar outra partida" volta à tela Colar com o campo vazio; como não há salvamento, pedir confirmação antes de descartar a análise atual | Obrigatório |
| R-14 | Revisão lance a lance: todo lance do jogador recebe uma classificação do motor (os lances do adversário não são revisados na tela) na escala do Chess.com: Melhor, Excelente, Bom, Imprecisão, Erro, Capivarada e Perdeu a chance (regras em 7.1 do PRD geral) | Obrigatório |
| R-15 | O painel "Revisão do lance" mostra, para o lance do jogador da posição (ou o lance a seguir dele, depois de um lance do adversário): classificação, de quem é o lance, o melhor lance e o porquê (xeque, mate em N, material ganho, peça salva), o que ficou descoberto, o que continuou atacado e o material deixado de ganhar | Obrigatório |
| R-16 | A explicação da IA de cada lance é pedida só quando o jogador abre o lance, fica guardada na sessão e, se falhar, o painel mantém os fatos dos motores e oferece "Tentar de novo" | Obrigatório |
| R-17 | A barra de avaliação mostra a avaliação do motor da posição mostrada, do ponto de vista das brancas (limite de ±10, mate como "M N") | Obrigatório |

## 5. Regras de conteúdo (para a IA)
Os textos vêm da camada de IA trocável (GPT-5.1 por padrão, D4 do PRD geral), sempre no JSON Schema do contrato.

- **Manchete:** no máximo 30 palavras. Diz o estado da partida e por que ela foi decidida ou demorou.
- **Frase de padrões:** cita no máximo 2 padrões.
- **Momentos:** 1 frase curta na lista; até 3 frases quando expandidos. Sempre com casas e lances concretos.
- **Tom por nível:**
  - *Iniciante*: sem jargão (ou com o jargão explicado);
  - *Intermediário*: termos táticos permitidos;
  - *Avançado*: pode citar linhas mais longas.
- **Nunca:** inventar avaliações, falar em "precisão %" se o motor não calculou ou culpar o jogador. O tom é de professor.

## 6. Estados

| Estado | Comportamento |
|---|---|
| Sem momentos-chave | Manchete positiva; a lista vira "Nenhuma perda de material importante"; mostra "O que você fez bem" com destaque |
| Mais de 5 candidatos (perdas de 2 pontos ou mais) | Mostra os 5 de maior impacto, em ordem cronológica, e o link "ver todos os lances anotados" |
| IA indisponível | Esconde manchete, momentos, hábito e "Pergunte à IA"; mostra os dados dos motores e "Tentar de novo" |
| Partida perdida | Mesmo layout; a tag fica neutra ("Derrota · 1-0") e o tom é encorajador |
| Partida curta (< 15 lances) | Esconde o gráfico; mantém os momentos |

## 7. Critérios de aceite
- **Dado** a partida de referência, **quando** o Resultado abre, **então**:
  - a manchete diz que a vantagem começou no lance 12 e que o material voltou 5 vezes;
  - há 5 momentos-chave, nos lances 22, 27, 41, 43 e 56;
  - o tabuleiro está na posição anterior a 22...Ta7, com as pretas embaixo.
- **Dado** que clico no círculo "43" do gráfico, **quando** o clique acontece, **então** o tabuleiro vai para a posição anterior a 43...Te6, o momento 4 se expande e o lance fica destacado na lista.
- **Dado** que faço uma pergunta sobre outro assunto, **quando** envio, **então** a IA responde que só fala desta partida e sugere perguntas.
- **Dado** que a IA falhou, **quando** a tela abre, **então** vejo tabuleiro, gráfico e lista anotada pelos motores, além do aviso de falha.
- **Dado** a partida de referência, **quando** o Resultado abre, **então** o painel "Revisão do lance" mostra 22...Ta7 como Erro (ou Capivarada), "Melhor era 22...Bd4+", que o bispo em a1 continuou atacado e sem defesa, e a explicação da IA desse lance.
- **Dado** que escolho 12...Bxa1 na lista, **quando** o clique acontece, **então** o painel mostra "Melhor" e "Este foi o lance do motor.".

## 8. Acessibilidade
- O tabuleiro funciona por teclado e cada casa tem rótulo ("a1, bispo preto, atacado").
- O gráfico tem uma descrição textual e, ao lado, os momentos em lista.
- Anotações (`?`, `??`, `!`) e tags nunca dependem só de cor.
- A lista de momentos usa `ol` e o item expandido usa `aria-expanded`.

## 9. Plataforma
- Somente desktop. O layout em duas colunas é pensado para janelas largas; em janelas estreitas, as colunas empilham (tabuleiro → momentos → gráfico → lista de lances).
- Versão para celular fora do MVP.

## 10. Métricas
- % de jogadores que expandem pelo menos um momento.
- % de jogadores que clicam em "Treinar".
- Resposta à pergunta "Entendi por que errei" (sim/não), mostrada depois do primeiro momento expandido.
- Perguntas à IA por análise e taxa de respostas recusadas por estarem fora de escopo.

## 11. Questões em aberto
- O gráfico padrão deve ser o de material (mais intuitivo para iniciantes) ou o de avaliação do motor (mais preciso)?
