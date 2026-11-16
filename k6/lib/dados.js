import http from 'k6/http';
import { fail } from 'k6';
import { BASE_URL, FAZENDAS, ESTOQUE_INICIAL, RESETAR_DADOS } from './config.js';

const CATALOGO = [
  { nome: 'Ureia', preco: 120.5 },
  { nome: 'Cloreto de Potássio', preco: 98 },
  { nome: 'MAP', preco: 210 },
];

const parametros = {
  headers: { 'Content-Type': 'application/json' },
  tags: { operacao: 'preparacao' }, // fora dos limites de cada operação
};

function postar(caminho, corpo, statusEsperado) {
  const res = http.post(`${BASE_URL}${caminho}`, JSON.stringify(corpo), parametros);
  if (res.status !== statusEsperado) {
    fail(`Preparação falhou: POST ${caminho} retornou ${res.status} (${res.body})`);
  }
  return res;
}

// Roda uma vez, antes da carga. Cria fertilizantes com estoque alto e várias fazendas.
// Cada fazenda tem dois pivôs, mas os usuários virtuais usam sempre o primeiro, para
// não esbarrar no bloqueio de pivô (regra de negócio testada no projeto funcional).
export function prepararDados() {
  const saude = http.get(`${BASE_URL}/health`, { tags: { operacao: 'preparacao' } });
  if (saude.status !== 200) {
    fail(`Aplicação indisponível em ${BASE_URL}. Suba a aplicação antes (npm start).`);
  }

  if (RESETAR_DADOS) postar('/test/reset', {}, 204);

  const sufixo = Date.now(); // evita nomes duplicados quando RESETAR_DADOS=false

  const fertilizantes = CATALOGO.map((item) => {
    const criado = postar('/fertilizantes', { nome: `${item.nome} ${sufixo}`, preco: item.preco }, 201).json();
    postar(`/fertilizantes/${criado.id}/entrada`, { quantidade: ESTOQUE_INICIAL }, 200);
    return { id: criado.id, preco: criado.preco };
  });

  const fazendas = [];
  for (let i = 1; i <= FAZENDAS; i++) {
    const criada = postar(
      '/fazendas',
      { nome: `Fazenda Carga ${sufixo}-${i}`, tecnico: `Técnico ${i}`, pivos: ['Pivô 1', 'Pivô 2'] },
      201,
    ).json();
    fazendas.push({ id: criada.id, pivoId: criada.pivos[0].id });
  }

  return { fertilizantes, fazendas };
}
