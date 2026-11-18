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

### Load

```bash
k6 run k6/scenarios/load.js
```

Sobe até 20 usuários em 1 minuto, mantém por 5 minutos e desce em 30 segundos (cerca de 6,5 minutos no total).
Cada usuário sorteia as operações conforme a mistura do plano. O teste passa se todos os limites forem atendidos.

Além das métricas padrão, o teste registra `pedidos_emitidos`, `pedidos_listados` (amostrado) e `bytes_lista_pedidos`,
usadas para relacionar a latência com o volume de pedidos acumulados, e contadores de falha por tipo:
`falhas_sem_resposta` (tempo esgotado ou conexão recusada), `falhas_http` (respostas 4xx e 5xx) e
`emissoes_sem_confirmacao` (pedido enviado, mas resposta não recebida).

### Stress

```bash
k6 run k6/scenarios/stress.js
```

Sobe em degraus de 20, 50, 100, 200 e 300 usuários, 1 minuto cada (cerca de 5,5 minutos), com pausas curtas
entre as ações (0,3 a 0,8 s). Cada degrau recebe a tag `nivel`, e o resumo mostra, **por nível**, o p95 da latência
de três operações (consulta de estoque, lista de pedidos e emissão), a taxa de falhas, o total de requisições (vazão)
e a quantidade de pedidos acumulados (`pedidos_listados`).

É **esperado** que alguns limites sejam violados nos níveis mais altos, e o k6 termina com código de erro. O objetivo
é descobrir em qual nível isso acontece. Se mais da metade das requisições falhar, o teste é interrompido.

> O stress pode deixar a máquina lenta, porque o k6 e a aplicação disputam a mesma CPU. Feche programas pesados antes
> e, se precisar, interrompa com `Ctrl + C`.

### Volume

```bash
k6 run k6/scenarios/volume.js
```

Experimento com **1 usuário e sem concorrência**: para cada nível de pedidos acumulados (0, 1.000, 2.000, 4.000 e
8.000), o script cria os pedidos que faltam e mede 100 vezes cada operação. Como não há fila de requisições, o resultado
isola o **custo de cada operação conforme o volume de dados cresce**. O resumo traz um limite (SLO) por nível e por
operação, então dá para ver a partir de quantos pedidos cada operação deixa de cumprir o limite, além do tamanho da
resposta da lista de pedidos em cada nível. Leva alguns minutos, porque cria milhares de pedidos.

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
| `LOAD_VUS` | `20` | Usuários simultâneos no teste de load |
| `LOAD_RAMPA` | `1m` | Tempo de subida até `LOAD_VUS` |
| `LOAD_DURACAO` | `5m` | Tempo mantendo `LOAD_VUS` |
| `STRESS_NIVEIS` | `20,50,100,200,300` | Usuários simultâneos de cada degrau do stress |
| `STRESS_PASSO_S` | `60` | Duração de cada degrau, em segundos |
| `STRESS_PAUSA_MIN` / `STRESS_PAUSA_MAX` | `0.3` / `0.8` | Pausa entre ações no stress, em segundos |
| `HTTP_TIMEOUT` | `10s` | Tempo máximo de espera por uma resposta (depois disso, conta como falha) |
| `VOLUME_NIVEIS` | `0,1000,2000,4000,8000` | Pedidos acumulados em cada etapa do experimento de volume |
| `VOLUME_AMOSTRAS` | `100` | Medições de cada operação por etapa do experimento de volume |
| `LISTAGEM_AMOSTRA` | `25` | A lista de pedidos só é interpretada em 1 a cada N consultas (poupa CPU do k6) |

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

- `k6/lib/`: configuração, preparação de dados, operações (uma função por requisição), jornada (mistura de operações) e limites (SLOs)
- `k6/scenarios/`: os cenários de teste
- `docs/`: plano de performance e análise dos resultados
- `results/`: relatórios gerados localmente (não versionados)
- `.github/workflows/`: pipeline de CI

## Roteiro

- [x] Estrutura, README e plano de performance
- [x] Preparação de dados e funções comuns
- [x] Smoke
- [x] Load com limites (thresholds)
- [x] Stress (a análise do ponto de ruptura vem com os resultados)
- [x] Experimento de volume (custo de cada operação conforme os pedidos se acumulam)
- [ ] Spike e soak
- [ ] CI com relatório HTML
- [ ] Análise dos resultados
