import { setupServer } from "msw/node";

// Servidor MSW compartilhado pelos testes. Sem handlers por padrão: cada teste
// registra os seus com `server.use(...)`, e qualquer requisição sem handler falha.
export const server = setupServer();
