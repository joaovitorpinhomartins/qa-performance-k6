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
// Perfil do teste de load: usuários simultâneos, tempo de subida e tempo de platô.
export const LOAD_VUS = Number(__ENV.LOAD_VUS || 20);
export const LOAD_RAMPA = __ENV.LOAD_RAMPA || '1m';
export const LOAD_DURACAO = __ENV.LOAD_DURACAO || '5m';

// Perfil do teste de stress: níveis de usuários (cada um vira uma etapa), duração de cada etapa
// em segundos e pausa entre ações (mais curta que no load, para pressionar o sistema).
export const STRESS_NIVEIS = (__ENV.STRESS_NIVEIS || '20,50,100,200,300').split(',').map(Number);
export const STRESS_PASSO_S = Number(__ENV.STRESS_PASSO_S || 60);
export const STRESS_PAUSA_MIN = Number(__ENV.STRESS_PAUSA_MIN || 0.3);
export const STRESS_PAUSA_MAX = Number(__ENV.STRESS_PAUSA_MAX || 0.8);

// Tempo máximo de espera por uma resposta. Passou disso, a requisição conta como falha.
export const HTTP_TIMEOUT = __ENV.HTTP_TIMEOUT || '10s';

// Experimento de volume: quantidade de pedidos acumulados em cada etapa (1 usuário) e amostras por operação.
export const VOLUME_NIVEIS = (__ENV.VOLUME_NIVEIS || '0,1000,2000,4000,8000').split(',').map(Number);
export const VOLUME_AMOSTRAS = Number(__ENV.VOLUME_AMOSTRAS || 100);

// A lista de pedidos pode chegar a 1 MB. Para o k6 não gastar CPU lendo a lista inteira a cada consulta,
// ela só é interpretada em 1 a cada LISTAGEM_AMOSTRA consultas (o tamanho da resposta é medido sempre).
export const LISTAGEM_AMOSTRA = Number(__ENV.LISTAGEM_AMOSTRA || 25);

export const PAUSA_MIN = Number(__ENV.PAUSA_MIN || 1);
export const PAUSA_MAX = Number(__ENV.PAUSA_MAX || 3);
