import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import exec from 'k6/execution';
import { BASE_URL, HTTP_TIMEOUT, LISTAGEM_AMOSTRA } from './config.js';
import { dataEmDias } from './datas.js';

const CABECALHOS_JSON = { 'Content-Type': 'application/json' };

// Métricas próprias, usadas para relacionar a latência com o volume de pedidos acumulados
// e para entender os tipos de falha.
const pedidosEmitidos = new Counter('pedidos_emitidos');
const pedidosListados = new Trend('pedidos_listados'); // quantos pedidos a listagem devolveu (amostrado)
const bytesListaPedidos = new Trend('bytes_lista_pedidos'); // tamanho da resposta, em bytes
const falhasSemResposta = new Counter('falhas_sem_resposta'); // tempo esgotado ou conexão recusada/interrompida
const falhasHttp = new Counter('falhas_http'); // respostas 4xx e 5xx
const emissoesSemConfirmacao = new Counter('emissoes_sem_confirmacao'); // pedido enviado, resposta não recebida

// Tags extras aplicadas a todas as requisições seguintes (por exemplo, o nível do experimento).
let tagsExtras = {};
export function definirTags(tags) {
  tagsExtras = tags;
}

// A tag "operacao" separa as métricas de cada operação e permite um limite para cada uma.
const comTag = (operacao, extra = {}) => ({
  tags: { operacao, ...tagsExtras },
  timeout: HTTP_TIMEOUT,
  ...extra,
});

function registrarFalha(res) {
  if (res.status === 0) falhasSemResposta.add(1);
  else if (res.status >= 400) falhasHttp.add(1);
}

export function consultarEstoque() {
  const res = http.get(`${BASE_URL}/fertilizantes`, comTag('consultar_estoque'));
  registrarFalha(res);
  check(res, {
    'consultar estoque: status 200': (r) => r.status === 200,
    'consultar estoque: devolve uma lista': (r) => r.status === 200 && r.body.charAt(0) === '[',
  });
  return res;
}

let consultasDeListagem = 0;

export function consultarPedidos() {
  const res = http.get(`${BASE_URL}/pedidos`, comTag('consultar_pedidos'));
  registrarFalha(res);
  const ehLista = res.status === 200 && res.body.charAt(0) === '[';
  check(res, {
    'consultar pedidos: status 200': (r) => r.status === 200,
    'consultar pedidos: devolve uma lista': () => ehLista,
  });
  if (ehLista) {
    bytesListaPedidos.add(res.body.length);
    // Interpretar a lista inteira é caro (chega a 1 MB), então só 1 a cada LISTAGEM_AMOSTRA consultas.
    if (consultasDeListagem++ % LISTAGEM_AMOSTRA === 0) pedidosListados.add(res.json().length);
  }
  return res;
}

export function relatorioDemanda() {
  const res = http.get(`${BASE_URL}/relatorios/demanda`, comTag('relatorio_demanda'));
  registrarFalha(res);
  check(res, {
    'relatório: status 200': (r) => r.status === 200,
    'relatório: devolve uma lista': (r) => r.status === 200 && r.body.charAt(0) === '[',
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
  registrarFalha(res);
  if (res.status === 0) emissoesSemConfirmacao.add(1);
  const ok = check(res, {
    'emitir pedido: status 201': (r) => r.status === 201,
    'emitir pedido: pedido pendente': (r) => r.status === 201 && r.json().status === 'pendente',
  });
  if (ok) pedidosEmitidos.add(1);
  return ok ? res.json().id : null;
}

// Agenda a aplicação do pedido para daqui a 7 dias.
export function agendarPedido(pedidoId) {
  const res = http.post(
    `${BASE_URL}/pedidos/${pedidoId}/agendar`,
    JSON.stringify({ dataAplicacao: dataEmDias(7) }),
    comTag('agendar_pedido', { headers: CABECALHOS_JSON }),
  );
  registrarFalha(res);
  return check(res, {
    'agendar pedido: status 200': (r) => r.status === 200,
    'agendar pedido: pedido agendado': (r) => r.status === 200 && r.json().status === 'agendado',
  });
}
