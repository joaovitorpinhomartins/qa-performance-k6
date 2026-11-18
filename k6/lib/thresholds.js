// Limites aceitáveis (SLOs) definidos em docs/plano-de-performance.md.
// Cada operação é identificada pela tag "operacao", o que permite um limite por operação.
export const limitesP95 = {
  consultar_estoque: 300,
  consultar_pedidos: 300,
  relatorio_demanda: 500,
  emitir_pedido: 500,
  agendar_pedido: 500,
};

export const slos = {
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
  ...Object.fromEntries(
    Object.entries(limitesP95).map(([operacao, ms]) => [
      `http_req_duration{operacao:${operacao}}`,
      [`p(95)<${ms}`],
    ]),
  ),
};
