# PRD — Tela 1: Colar a partida

| | |
|---|---|
| **Produto** | Analisador de partidas com IA |
| **Tela** | Colar a partida (passo 1 de 3) |
| **Versão** | 0.5 (alinhada à visão geral 0.6) |
| **Plataforma** | Somente desktop |
| **Data** | 22/11/2026 |
| **PRD geral** | Analisador de partidas — visão geral |

---

## 1. Objetivo
Levar o jogador do texto copiado a uma análise confirmada com o mínimo de esforço. Antes de gastar processamento, a tela garante três coisas: que a partida foi entendida, que os lances são legais e que o jogador informou com qual cor jogou.

## 2. Usuário e momento
O jogador acabou de terminar uma partida no Chess.com, copiou a lista de lances (HTML do Chess.com ou lista simples) e quer saber o que aconteceu. Muitas vezes não sabe o nome técnico do que copiou.

## 3. Estrutura da tela
1. **Cabeçalho** com a marca "Analisador de partidas" e o menu.
2. **Indicador de passos:** Colar (atual) → Analisar → Revisar e treinar.
3. **Título e subtítulo:** "Analise sua partida" e uma frase sobre o princípio (os motores calculam, a IA explica).
4. **Bloco "Partida"**, à esquerda:
   - campo de texto grande, em fonte monoespaçada;
   - os botões "Colar da área de transferência" e "Limpar";
   - os formatos aceitos;
   - a ajuda expansível "Onde copio isso no Chess.com?".
5. **Coluna lateral**, à direita:
   - **"O que encontramos":** checagens de formato, número de lances e resultado, além de uma miniatura da posição final;
   - **Escolhas do jogador:** "Você jogou com" (Brancas | Pretas, obrigatório e sem opção marcada), "Seu nível" (lista), "O que priorizar" (chips);
   - **Ação principal:** "Analisar partida →", com a estimativa de tempo e o aviso de privacidade.

## 4. Requisitos funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| C-01 | Aceitar **somente** o HTML da lista de lances do Chess.com e a lista simples de lances ("1.d4 d5 2.Cc3…", em notação inglesa ou portuguesa) | Obrigatório |
| C-02 | Detectar o formato automaticamente ao colar, sem botão de "processar" | Obrigatório |
| C-03 | Rodar os motores Leitor e Regras logo após colar (em até 1 s para 150 lances) e preencher "O que encontramos" | Obrigatório |
| C-04 | Mostrar o número de lances e confirmar que todos são legais | Obrigatório |
| C-05 | Mostrar o resultado (1-0, 0-1, ½-½ ou sem resultado) e o motivo, quando houver (xeque-mate, último lance) | Obrigatório |
| C-06 | Mostrar a miniatura da posição final, vista pelo lado das brancas até o jogador escolher a cor e, depois, pelo lado escolhido | Desejável |
| C-07 | O jogador **seleciona** a cor num seletor com estado claro. Nenhuma opção vem marcada e o sistema não sugere nem deduz a cor | Obrigatório |
| C-08 | Nível: Iniciante (padrão), Intermediário ou Avançado. Muda só o tom e a profundidade do texto da IA | Obrigatório |
| C-09 | Prioridades em chips de múltipla escolha: Peças perdidas e Finais vêm marcados; Abertura e Plano não | Desejável |
| C-10 | O botão "Analisar partida" fica desabilitado até haver uma partida válida, a cor selecionada **e** o motor de avaliação carregado; ao lado, um texto diz o que falta. Se só faltar o motor, o botão mostra "Carregando o motor… N%" | Obrigatório |
| C-11 | "Colar da área de transferência" usa a API do navegador; se for negada, orienta a usar Ctrl/Cmd+V | Desejável |
| C-12 | "Limpar" esvazia o campo e o painel "O que encontramos" | Obrigatório |
| C-13 | O texto do campo é preservado se o jogador voltar a esta tela | Desejável |
| C-14 | Começar o download do motor de avaliação (cerca de 94 MB, D1) assim que a página é carregada. Mostrar um indicador discreto ("Carregando o motor de análise… N%") que não bloqueia o campo de texto nem as escolhas. Ao terminar, o indicador vira "Motor pronto" | Obrigatório |
| C-15 | Lembrar o nível escolhido entre análises no mesmo navegador (armazenamento local) e trazê-lo selecionado na próxima vez. Só o nível é lembrado: a partida e a cor não são guardadas (D2 e D5 da visão geral) | Obrigatório |

## 5. Regras de negócio
- **Cor do jogador (D5 da visão geral):** o jogador sempre escolhe. Não há sugestão nem valor padrão; sem a cor, a análise não começa.
- **Lances com anotações** ("+", "#", "!", "?") e números de lance são ignorados na leitura.
- **Nível lembrado:** na primeira visita, o nível começa em "Iniciante". Nas seguintes, começa no último nível usado neste navegador. Se o armazenamento local não estiver disponível, volta para "Iniciante" sem erro.
- **Partida curta:** com menos de 6 lances, avisamos que há pouco a analisar, mas permitimos continuar.

## 6. Estados

| Estado | O que o jogador vê |
|---|---|
| Vazio | Campo vazio com placeholder de exemplo; painel lateral com "Cole uma partida para começar" |
| Reconhecida | As checagens em verde, como no design |
| Formato não reconhecido | Mensagem: "Não reconhecemos este texto como uma partida", com os formatos aceitos e a ajuda expandida |
| Lance ilegal | "O lance 23 (Txa1) não é possível nesta posição". O lance é destacado e a análise fica bloqueada |
| Sem resultado | Aviso neutro: "Partida sem resultado registrado". A análise continua |
| Cor não selecionada | Partida reconhecida, botão "Analisar partida" desabilitado e o texto "Selecione com qual cor você jogou" |
| Motor carregando | Indicador com a porcentagem; o jogador cola e escolhe normalmente; se o resto estiver pronto, o botão mostra "Carregando o motor… N%" e é habilitado sozinho ao terminar |
| Falha no download do motor | O indicador mostra "Não foi possível carregar o motor" e o botão "Tentar de novo"; "Analisar partida" continua desabilitado |
| Colagem muito grande (> 500 KB) | Pede para colar só a lista de lances |

## 7. Critérios de aceite
- **Dado** que colei o HTML da lista de lances do Chess.com de uma partida de 72 lances terminada em mate, **quando** o texto entra no campo, **então** vejo "144 lances, todos legais", "Resultado 0-1, por xeque-mate" e a miniatura da posição final em até 1 s.
- **Dado** um texto sem lances, **quando** colo, **então** vejo o estado "Formato não reconhecido" e o botão "Analisar" desabilitado.
- **Dado** uma partida válida e nenhuma cor selecionada, **quando** olho a coluna lateral, **então** nenhuma cor aparece marcada, o botão "Analisar partida" está desabilitado e vejo "Selecione com qual cor você jogou".
- **Dado** que nenhuma cor está selecionada, **quando** clico em "Pretas", **então** a escolha fica marcada, a miniatura passa a ser vista pelas pretas e o botão é habilitado.
- **Dado** uma partida válida e a cor selecionada, **quando** clico em "Analisar partida", **então** vou para a tela Analisando com essas escolhas.
- **Dado** que escolhi "Intermediário" numa análise anterior neste navegador, **quando** abro a tela Colar de novo, **então** o nível já aparece como "Intermediário", e nenhuma cor está selecionada.
- **Dado** que a página acabou de abrir e o motor está em 40%, **quando** colo uma partida válida e seleciono a cor, **então** consigo fazer tudo sem esperar e o botão mostra "Carregando o motor… 40%", sendo habilitado sozinho quando o download termina.
- **Dado** um texto em formato PGN, **quando** colo, **então** vejo o estado "Formato não reconhecido", com os dois formatos aceitos.

## 8. Acessibilidade
- O campo de texto tem um rótulo visível ("Partida").
- O seletor de cor usa botões com `aria-pressed`.
- As mensagens de erro são lidas por leitores de tela, com `aria-live`.
- A miniatura do tabuleiro tem uma descrição textual da posição.

## 9. Métricas
- % de colagens reconhecidas na primeira tentativa.
- Distribuição dos formatos colados (HTML ou lista simples).
- Tempo entre colar e clicar em "Analisar".

## 10. Fora do escopo
- Importar PGN.
- Sugerir ou deduzir a cor do jogador.
- Importar por link ou por nome de usuário.
- Editar lances dentro do campo com assistência (autocompletar).

## 11. Decisões desta tela
- **Nível lembrado:** sim. O nível escolhido é lembrado entre análises no mesmo navegador (C-15).
