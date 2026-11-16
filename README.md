# QA Performance com k6

Testes de performance com **k6** sobre o sistema de estoque e aplicação de fertilizantes do projeto
[qa-estoque-fertilizantes](https://github.com/joaovitorpinhomartins/qa-estoque-fertilizantes).
O foco é definir limites aceitáveis, simular uma carga realista do domínio e **analisar os resultados**,
apontando gargalos, e não só gerar números.

> Em construção. Os cenários são adicionados em etapas (veja o roteiro no final).

## Pré-requisitos

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (desenvolvido com a v2.4.0)
- Node.js 18 ou superior, para subir a aplicação sob teste
- A aplicação do repositório [qa-estoque-fertilizantes](https://github.com/joaovitorpinhomartins/qa-estoque-fertilizantes)

## Como rodar

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

Por padrão os scripts apontam para `http://localhost:3000`. O smoke roda 30 segundos com 1 usuário
e termina com um resumo das métricas e dos limites (thresholds). Se algum limite for violado,
o k6 encerra com código de erro, o que também serve de critério no CI.

> **Atenção:** a preparação dos dados reinicia a aplicação (`POST /test/reset`) e cria fertilizantes e fazendas.
> Use apenas contra a aplicação de teste, nunca contra um ambiente real.

### Configuração

Os valores abaixo podem ser trocados com `-e NOME=valor`, por exemplo
`k6 run -e FAZENDAS=50 k6/scenarios/smoke.js`.

| Variável | Padrão | Para que serve |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | Endereço da aplicação |
| `FAZENDAS` | `20` | Fazendas criadas na preparação (os usuários virtuais se distribuem entre elas) |
| `ESTOQUE_INICIAL` | `1000000` | Estoque inicial de cada fertilizante |
| `RESETAR_DADOS` | `true` | Reinicia os dados da aplicação antes do teste |
| `PAUSA_MIN` / `PAUSA_MAX` | `1` / `3` | Pausa entre ações de um usuário virtual, em segundos |

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

- `k6/lib/`: configuração, preparação de dados, operações (uma função por requisição) e limites (SLOs)
- `k6/scenarios/`: os cenários de teste
- `docs/`: plano de performance e análise dos resultados
- `results/`: relatórios gerados localmente (não versionados)
- `.github/workflows/`: pipeline de CI

## Roteiro

- [x] Estrutura, README e plano de performance
- [x] Preparação de dados e funções comuns
- [x] Smoke
- [ ] Load com limites (thresholds)
- [ ] Stress e análise do ponto de ruptura
- [ ] Spike e soak
- [ ] CI com relatório HTML
- [ ] Análise dos resultados
