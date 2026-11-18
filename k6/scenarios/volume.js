// Volume: mede o efeito do acúmulo de pedidos na latência, SEM concorrência (1 usuário).
// Para cada nível (VOLUME_NIVEIS, padrão 0, 1000, 2000, 4000 e 8000 pedidos acumulados), o script
// cria os pedidos que faltam e mede VOLUME_AMOSTRAS vezes cada operação.
// Como não há concorrência, o resultado não depende da fila de requisições nem da carga do gerador:
// mostra o custo de cada operação conforme o volume de dados cresce.
import { prepararDados, semearPedidos } from '../lib/dados.js';
import { limitesP95 } from '../lib/thresholds.js';
import {
  consultarEstoque,
  consultarPedidos,
  relatorioDemanda,
  emitirPedido,
  agendarPedido,
  definirTags,
} from '../lib/operacoes.js';
import { VOLUME_NIVEIS, VOLUME_AMOSTRAS } from '../lib/config.js';

const rotulo = (pedidos) => `pedidos_${String(pedidos).padStart(5, '0')}`;

const thresholds = {
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
};

// Um limite por nível e por operação: mostra a partir de quantos pedidos cada operação passa do SLO.
for (const pedidos of VOLUME_NIVEIS) {
  const nivel = rotulo(pedidos);
  for (const [operacao, ms] of Object.entries(limitesP95)) {
    thresholds[`http_req_duration{nivel:${nivel},operacao:${operacao}}`] = [`p(95)<${ms}`];
  }
  thresholds[`bytes_lista_pedidos{nivel:${nivel}}`] = ['max>=0']; // só para exibir o tamanho da resposta
}

export const options = {
  scenarios: {
    volume: { executor: 'per-vu-iterations', vus: 1, iterations: 1, maxDuration: '20m' },
  },
  thresholds,
};

export function setup() {
  return prepararDados();
}

export default function (dados) {
  let acumulados = 0;

  for (const alvo of VOLUME_NIVEIS) {
    acumulados += semearPedidos(dados, alvo - acumulados);

    definirTags({ nivel: rotulo(alvo) });
    for (let i = 0; i < VOLUME_AMOSTRAS; i++) {
      consultarEstoque();
      consultarPedidos();
      relatorioDemanda();
      const pedidoId = emitirPedido(dados);
      if (pedidoId) {
        acumulados += 1;
        agendarPedido(pedidoId);
      }
    }
    definirTags({});
  }
}
