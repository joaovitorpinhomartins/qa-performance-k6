// Limites aceitáveis (SLOs) definidos em docs/plano-de-performance.md.
// Cada operação é identificada pela tag "operacao", o que permite um limite por operação.
export const slos = {
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
  'http_req_duration{operacao:consultar_estoque}': ['p(95)<300'],
  'http_req_duration{operacao:consultar_pedidos}': ['p(95)<300'],
  'http_req_duration{operacao:relatorio_demanda}': ['p(95)<500'],
  'http_req_duration{operacao:emitir_pedido}': ['p(95)<500'],
  'http_req_duration{operacao:agendar_pedido}': ['p(95)<500'],
};
