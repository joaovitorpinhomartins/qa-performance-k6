import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';
import { BASE_URL } from './config.js';
import { dataEmDias } from './datas.js';

const CABECALHOS_JSON = { 'Content-Type': 'application/json' };

// A tag "operacao" separa as métricas de cada operação e permite um limite para cada uma.
const comTag = (operacao, extra = {}) => ({ tags: { operacao }, ...extra });

export function consultarEstoque() {
  const res = http.get(`${BASE_URL}/fertilizantes`, comTag('consultar_estoque'));
  check(res, {
    'consultar estoque: status 200': (r) => r.status === 200,
    'consultar estoque: devolve uma lista': (r) => Array.isArray(r.json()),
  });
  return res;
}

export function consultarPedidos() {
  const res = http.get(`${BASE_URL}/pedidos`, comTag('consultar_pedidos'));
  check(res, {
    'consultar pedidos: status 200': (r) => r.status === 200,
    'consultar pedidos: devolve uma lista': (r) => Array.isArray(r.json()),
  });
  return res;
}

export function relatorioDemanda() {
  const res = http.get(`${BASE_URL}/relatorios/demanda`, comTag('relatorio_demanda'));
  check(res, {
    'relatório: status 200': (r) => r.status === 200,
    'relatório: devolve uma lista': (r) => Array.isArray(r.json()),
  });
  return res;
}

// Emite um pedido terrestre no primeiro pivô da fazenda do usuário virtual.
// Devolve o id do pedido, ou null se a emissão falhar.
export function emitirPedido(dados) {
  const fertilizante = dados.fertilizantes[Math.floor(Math.random() * dados.fertilizantes.length)];
  const fazenda = dados.fazendas[(exec.vu.idInTest - 1) % dados.fazendas.length];
  const corpo = {
    itens: [
      {
        fertilizanteId: fertilizante.id,
        fazendaId: fazenda.id,
        pivoId: fazenda.pivoId,
        quantidade: 1 + Math.floor(Math.random() * 5),
        tipoAplicacao: 'terrestre',
      },
    ],
  };
  const res = http.post(
    `${BASE_URL}/pedidos`,
    JSON.stringify(corpo),
    comTag('emitir_pedido', { headers: CABECALHOS_JSON }),
  );
  const ok = check(res, {
    'emitir pedido: status 201': (r) => r.status === 201,
    'emitir pedido: pedido pendente': (r) => r.status === 201 && r.json().status === 'pendente',
  });
  return ok ? res.json().id : null;
}

// Agenda a aplicação do pedido para daqui a 7 dias.
export function agendarPedido(pedidoId) {
  const res = http.post(
    `${BASE_URL}/pedidos/${pedidoId}/agendar`,
    JSON.stringify({ dataAplicacao: dataEmDias(7) }),
    comTag('agendar_pedido', { headers: CABECALHOS_JSON }),
  );
  return check(res, {
    'agendar pedido: status 200': (r) => r.status === 200,
    'agendar pedido: pedido agendado': (r) => r.status === 200 && r.json().status === 'agendado',
  });
}
