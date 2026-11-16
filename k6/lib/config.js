// Configuração dos testes. Todos os valores podem ser trocados por variável de ambiente:
//   k6 run -e BASE_URL=http://localhost:3000 -e FAZENDAS=50 k6/scenarios/smoke.js
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Quantidade de fazendas criadas na preparação (cada usuário virtual usa uma delas).
export const FAZENDAS = Number(__ENV.FAZENDAS || 20);

// Estoque inicial de cada fertilizante, alto o bastante para não acabar durante o teste.
export const ESTOQUE_INICIAL = Number(__ENV.ESTOQUE_INICIAL || 1000000);

// A preparação reinicia os dados da aplicação (POST /test/reset).
// Use -e RESETAR_DADOS=false para não reiniciar.
export const RESETAR_DADOS = (__ENV.RESETAR_DADOS || 'true') !== 'false';

// Pausa entre ações de um usuário virtual (segundos), sorteada entre mínimo e máximo.
export const PAUSA_MIN = Number(__ENV.PAUSA_MIN || 1);
export const PAUSA_MAX = Number(__ENV.PAUSA_MAX || 3);
