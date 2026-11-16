// Smoke: 1 usuário percorrendo todas as operações.
// Valida que o script e a aplicação funcionam antes de aplicar carga.
import { sleep } from 'k6';
import { prepararDados } from '../lib/dados.js';
import { slos } from '../lib/thresholds.js';
import {
  consultarEstoque,
  consultarPedidos,
  relatorioDemanda,
  emitirPedido,
  agendarPedido,
} from '../lib/operacoes.js';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: slos,
};

export function setup() {
  return prepararDados();
}

export default function (dados) {
  consultarEstoque();
  const pedidoId = emitirPedido(dados);
  consultarPedidos();
  if (pedidoId) agendarPedido(pedidoId);
  relatorioDemanda();
  sleep(1);
}
