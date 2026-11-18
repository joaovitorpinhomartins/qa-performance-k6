// Load: a carga esperada. Sobe até LOAD_VUS usuários (padrão 20), mantém por LOAD_DURACAO
// (padrão 5 minutos) e desce. Cada usuário sorteia as operações conforme o mix do plano.
// Critério de aprovação: os limites (SLOs) de k6/lib/thresholds.js.
import { prepararDados } from '../lib/dados.js';
import { slos } from '../lib/thresholds.js';
import { executarOperacaoSorteada, pausar } from '../lib/jornada.js';
import { LOAD_VUS, LOAD_RAMPA, LOAD_DURACAO } from '../lib/config.js';

export const options = {
  scenarios: {
    carga: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: LOAD_RAMPA, target: LOAD_VUS },
        { duration: LOAD_DURACAO, target: LOAD_VUS },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: slos,
};

export function setup() {
  return prepararDados();
}

export default function (dados) {
  executarOperacaoSorteada(dados);
  pausar();
}
