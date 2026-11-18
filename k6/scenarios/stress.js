// Stress: encontra o ponto em que o sistema deixa de atender aos limites.
// Cada nível de usuários roda em uma etapa própria (STRESS_NIVEIS, padrão 20,50,100,200,300),
// com a mesma mistura de operações do load e pausas mais curtas.
// Cada etapa recebe a tag "nivel", então o resumo mostra latência, falhas, vazão e pedidos
// acumulados POR NÍVEL. É esperado que os limites sejam violados nos níveis mais altos:
// o objetivo é descobrir em qual.
import { prepararDados } from '../lib/dados.js';
import { executarOperacaoSorteada, pausar } from '../lib/jornada.js';
import {
  STRESS_NIVEIS,
  STRESS_PASSO_S,
  STRESS_PAUSA_MIN,
  STRESS_PAUSA_MAX,
} from '../lib/config.js';

const FOLGA_S = 5; // intervalo entre etapas, para as iterações em andamento terminarem
const rotulo = (vus) => `vus_${String(vus).padStart(3, '0')}`;

const scenarios = {};
const thresholds = {
  // Válvula de segurança: se mais da metade das requisições falhar, não adianta continuar.
  http_req_failed: [{ threshold: 'rate<0.5', abortOnFail: true, delayAbortEval: '10s' }],
};

STRESS_NIVEIS.forEach((vus, i) => {
  const nivel = rotulo(vus);
  scenarios[nivel] = {
    executor: 'constant-vus',
    vus,
    duration: `${STRESS_PASSO_S}s`,
    startTime: `${i * (STRESS_PASSO_S + FOLGA_S)}s`,
    gracefulStop: `${FOLGA_S}s`,
    tags: { nivel },
  };
  // Limites por nível (todas as operações juntas). São os que dizem onde o sistema quebra.
  thresholds[`http_req_duration{nivel:${nivel}}`] = ['p(95)<500'];
  thresholds[`http_req_failed{nivel:${nivel}}`] = ['rate<0.01'];
  // Limites que sempre passam: servem só para o k6 exibir estas métricas por nível.
  thresholds[`http_reqs{nivel:${nivel}}`] = ['count>=0'];
  thresholds[`pedidos_listados{nivel:${nivel}}`] = ['max>=0'];
});

export const options = { scenarios, thresholds };

export function setup() {
  return prepararDados();
}

export default function (dados) {
  executarOperacaoSorteada(dados);
  pausar(STRESS_PAUSA_MIN, STRESS_PAUSA_MAX);
}
