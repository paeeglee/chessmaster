# Glossário do domínio

Linguagem ubíqua do projeto. A coluna "Docs / interface" é o termo usado nos PRDs e
nos textos mostrados ao jogador. A coluna "Código" é o nome que deve ser usado em
identificadores, pastas, arquivos e tipos.

Se um conceito novo aparecer, adicione-o aqui antes de usá-lo no código.

| Docs / interface (pt-BR) | Código (inglês) | Definição |
| ------------------------ | --------------- | --------- |
| Partida | game | A partida colada pelo jogador. |
| Lance | move | Um lance de um dos lados. |
| Meio-lance | ply | Um lance de um único lado; a unidade de contagem do motor. |
| Posição | position | Estado do tabuleiro, representado em FEN. |
| Cor do jogador | player color | Brancas ou pretas, sempre escolhida pelo jogador (D5). |
| Nível | level | Iniciante, Intermediário ou Avançado; muda só o tom do texto da IA. |
| Prioridades | priorities | O que o jogador quer que a análise destaque. |
| Leitor | parser | Motor 1: transforma o texto colado em lances. |
| Motor de regras | rules engine | Motor 2: posições, legalidade, xeque, mate, afogamento. |
| Motor de avaliação | evaluation engine | Motor 3: Stockfish; avaliação e melhor lance de cada posição. |
| Tabela de finais | endgame tablebase | Motor 4: resultado exato de posições com poucas peças. |
| Explicação da IA | AI explanation | Motor 5: textos gerados a partir do JSON dos motores. |
| Avaliação | evaluation | Valor numérico da posição calculado pelo motor. |
| Melhor lance | best move | O lance recomendado pelo motor. |
| Vantagem de material | material advantage | Saldo de material do ponto de vista do jogador. |
| Momento-chave | key moment | Lance do jogador que perde 2 pontos de material ou mais, confirmado pelo motor (D3). |
| Tipo de erro | mistake type | Classificação de um momento-chave. |
| Peça atacada | hanging piece | A peça perdida já estava atacada antes do lance e não foi movida nem protegida. |
| Defensor saiu | defender moved | O lance moveu a única peça que protegia a peça perdida. |
| Outro | other | Erro que as regras determinísticas não classificam; descrito pela IA. |
| Afogamento | stalemate | Empate por falta de lances legais sem estar em xeque. |
| Já encontrado | findings so far | Achados mostrados durante a tela Analisando. |
| Manchete / veredito | verdict | Frase de resumo da partida na tela Resultado. |
| Padrões | patterns | Erros do mesmo tipo agrupados. |
| O que você fez bem | strengths | Lances com ganho real calculado pelo motor. |
| Hábito para a próxima partida | next-game habit | Uma frase acionável ligada aos padrões. |
| Pergunte à IA | ask the AI | Perguntas livres sobre a partida analisada. |
| Treinar momento-chave | key moment training | Exercício a partir de um momento-chave. |
| Encontre o lance | find the move | O formato do exercício de treino. |
| Tentativa | attempt | Um lance tentado pelo jogador no treino. |
| Dica | hint | Ajuda em níveis: padrão, peça, solução. |
| Refutação | refutation | Resposta do adversário que mostra por que o lance falha. |
