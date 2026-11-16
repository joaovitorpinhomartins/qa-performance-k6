# QA Performance com k6

Testes de performance com **k6** sobre o sistema de estoque e aplicação de fertilizantes do projeto
[qa-estoque-fertilizantes](https://github.com/joaovitorpinhomartins/qa-estoque-fertilizantes).
O foco é definir limites aceitáveis, simular uma carga realista do domínio e **analisar os resultados**,
apontando gargalos, e não só gerar números.

> Em construção. Os cenários são adicionados em etapas (veja o roteiro abaixo).

## Pré-requisitos

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (desenvolvido com a v2.4.0)
- Node.js 18 ou superior, para subir a aplicação sob teste
- A aplicação do repositório [qa-estoque-fertilizantes](https://github.com/joaovitorpinhomartins/qa-estoque-fertilizantes)

## Como rodar (previsto)

1. Em outro terminal, suba a aplicação sob teste:

```bash
git clone https://github.com/joaovitorpinhomartins/qa-estoque-fertilizantes.git
cd qa-estoque-fertilizantes
npm install
npm start
```

2. Neste repositório, rode um cenário:

```bash
k6 run k6/scenarios/smoke.js
```

Por padrão os scripts apontam para `http://localhost:3000`.

## Tipos de teste

| Tipo | Pergunta que responde |
|---|---|
| Smoke | O script e a aplicação funcionam com 1 usuário? |
| Load | O sistema atende a carga esperada dentro dos limites? |
| Stress | A partir de que carga ele degrada ou falha? |
| Spike | Como reage a um pico repentino? |
| Soak (curto) | O desempenho se mantém ao longo do tempo? |

## Documentação

- [Plano de performance](docs/plano-de-performance.md): limites (SLOs), modelo de carga, hipóteses e limitações

## Estrutura

- `k6/lib/`: configuração, preparação de dados e funções comuns
- `k6/scenarios/`: os cenários de teste
- `docs/`: plano de performance e análise dos resultados
- `results/`: relatórios gerados localmente (não versionados)
- `.github/workflows/`: pipeline de CI

## Roteiro

1. Estrutura, README e plano de performance
2. Preparação de dados e funções comuns
3. Smoke
4. Load com limites (thresholds)
5. Stress e análise do ponto de ruptura
6. Spike e soak
7. CI com relatório HTML
8. Análise dos resultados
