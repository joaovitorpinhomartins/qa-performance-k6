import { sleep } from 'k6';
import { PAUSA_MIN, PAUSA_MAX } from './config.js';
import {
  consultarEstoque,
  consultarPedidos,
  relatorioDemanda,
  emitirPedido,
  agendarPedido,
} from './operacoes.js';

// Mistura de operações (pesos do plano de performance).
export const MIX = [
  ['consultar_estoque', 35],
  ['consultar_pedidos', 25],
  ['emitir_pedido', 25],
  ['agendar_pedido', 10],
  ['relatorio_demanda', 5],
];

const PESO_TOTAL = MIX.reduce((soma, [, peso]) => soma + peso, 0);

export function sortearOperacao(aleatorio = Math.random()) {
  let limite = aleatorio * PESO_TOTAL;
  for (const [operacao, peso] of MIX) {
    if (limite < peso) return operacao;
    limite -= peso;
  }
  return MIX[MIX.length - 1][0];
}

// Cada usuário virtual tem seu próprio estado: os pedidos que emitiu e ainda não agendou.
const pedidosPendentes = [];

// Executa uma operação sorteada. O agendamento só acontece se o usuário tiver um pedido
// pendente; caso contrário, ele emite um pedido no lugar.
export function executarOperacaoSorteada(dados, aleatorio = Math.random()) {
  const operacao = sortearOperacao(aleatorio);

  if (operacao === 'consultar_estoque') return consultarEstoque();
  if (operacao === 'consultar_pedidos') return consultarPedidos();
  if (operacao === 'relatorio_demanda') return relatorioDemanda();

  if (operacao === 'agendar_pedido' && pedidosPendentes.length > 0) {
    return agendarPedido(pedidosPendentes.shift());
  }

  const pedidoId = emitirPedido(dados);
  if (pedidoId) pedidosPendentes.push(pedidoId);
  return pedidoId;
}

// Pausa entre ações (tempo de reflexão do usuário), sorteada entre o mínimo e o máximo.
export function pausar(minimo = PAUSA_MIN, maximo = PAUSA_MAX) {
  sleep(minimo + Math.random() * (maximo - minimo));
}
