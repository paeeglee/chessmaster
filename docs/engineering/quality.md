# Qualidade: versões, linguagem, lint e testes

## Versões

- **Node.js:** a LTS ativa mais recente, fixada em `.nvmrc` na raiz. Hoje é a 26.
- **Python:** fixado em `.python-version` na raiz (o uv lê esse arquivo). Python não
  tem LTS; usamos a versão estável mais recente que já tenha suporte das nossas
  dependências. Hoje é a 3.14.
- **pnpm:** versão exata no campo `packageManager` do `package.json` (ativada com
  `corepack enable`).
- `package.json` (`engines`) e `pyproject.toml` (`requires-python`) devem bater com
  essas versões.
- Ao subir uma versão, atualize os arquivos acima e este documento no mesmo PR.

## Linguagem

- O frontend é escrito em **TypeScript** com `strict: true`. Não use `any`; quando
  o tipo é realmente desconhecido, use `unknown` e faça a checagem.
- O backend usa type hints em todo código, checados pelo mypy em modo `strict`.

## Lint, formatação e tipos

| | Frontend (`apps/web`) | Backend (`apps/api`) |
| - | --------------------- | -------------------- |
| Lint | Biome | Ruff |
| Formatação | Biome | Ruff (`ruff format`) |
| Tipos | `tsc --noEmit` | mypy (`strict`) |

- Não desligue regras com comentários (`biome-ignore`, `noqa`, `type: ignore`) sem
  um motivo escrito no próprio comentário.
- Código gerado (`*.gen.ts`) fica fora do lint e da formatação.

## Testes

### Frontend

- **Vitest** para testes unitários e de componentes, com **React Testing Library**,
  `@testing-library/user-event` e ambiente `jsdom`.
- **MSW** para simular a API do backend nos testes. Nenhum teste chama a rede de
  verdade.
- **Playwright** para os testes de ponta a ponta do fluxo principal (colar →
  analisando → resultado → treino), rodando com os cabeçalhos de isolamento de
  origem ativos. Os critérios de aceite dos PRDs são a base desses testes.
- Testes de componentes buscam elementos pelo papel e pelo texto acessível
  (`getByRole`, `getByLabelText`), como o usuário vê, e não por classes CSS.

### Backend

- **pytest**, com `pytest-cov` para cobertura.
- Testes de rotas com o `TestClient` do FastAPI (ou `httpx.AsyncClient`).
- Os provedores de IA são substituídos por um adaptador falso nos testes. Nenhum
  teste comum chama um provedor de verdade.
- Os testes com provedor real (partidas de referência) ficam marcados com
  `@pytest.mark.llm` e só rodam quando pedidos explicitamente.

### O que é obrigatório testar

- As regras de negócio puras: classificação dos lances, limiar de momento-chave,
  tipos de erro, montagem do contrato motor → IA.
- O leitor: HTML real do Chess.com, lista simples de lances (notação inglesa e
  portuguesa), colagens parciais, lixo de HTML e anotações (`+`, `#`, `!`, `?`).
- A verificação automática que compara os números e lances citados pela IA com o
  JSON dos motores.
- Cada bug corrigido ganha um teste que falharia sem a correção.
- **Cobertura mínima:** 90% nas camadas de domínio (`model/` no frontend, `domain/`
  e `application/` no backend); 80% no total de cada app.

### Dados de teste

- Use partidas reais como fixtures, guardadas no domínio que as usa (`fixtures/`).
- A partida de 72 lances do `general.md` é a partida de referência principal.
