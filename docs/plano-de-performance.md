# Plano de performance

## Objetivo
Verificar se a aplicação de estoque e aplicação de fertilizantes atende a limites de desempenho
definidos antes dos testes, descobrir a partir de que carga ela degrada e identificar os gargalos.

## Sistema sob teste
- Aplicação do repositório [qa-estoque-fertilizantes](https://github.com/joaovitorpinhomartins/qa-estoque-fertilizantes):
  API em Node.js, processo único, com dados em memória.
- Ambiente: máquina local. O k6 e a aplicação disputam CPU na mesma máquina, então os números
  são **relativos**: servem para comparar execuções e achar gargalos, e não como capacidade de produção.
- Cada relatório registra a máquina usada (CPU, memória) e a versão do k6.

## Modelo de carga
Mistura de operações baseada no uso do sistema (consulta de estoque pelos técnicos, emissão
de pedidos, agendamento e consulta de relatórios gerenciais). Cada usuário virtual faz uma pausa
(think time) entre as ações.

| Operação | Requisição | Peso |
|---|---|---|
| Consultar estoque | `GET /fertilizantes` | 35% |
| Consultar pedidos | `GET /pedidos` | 25% |
| Emitir pedido | `POST /pedidos` | 25% |
| Agendar pedido | `POST /pedidos/:id/agendar` | 10% |
| Relatório de demanda | `GET /relatorios/demanda` | 5% |

Os pesos são uma proposta inicial e podem ser ajustados com dados reais de uso.

## Limites aceitáveis (SLOs)

| Grupo | Critério |
|---|---|
| Consultas (estoque e pedidos) | p95 < 300 ms |
| Relatório de demanda | p95 < 500 ms |
| Emitir e agendar pedido | p95 < 500 ms |
| Falhas inesperadas | < 1% das requisições |
| Verificações (checks) | > 99% de sucesso |

Valores propostos para o projeto. Em um sistema real, seriam acordados com o negócio.

## Tipos de teste (perfis iniciais)

| Tipo | Perfil inicial | Observação |
|---|---|---|
| Smoke | 1 usuário, 30 segundos | Valida o script e a aplicação |
| Load | Sobe até 20 usuários e mantém por 5 minutos | Carga esperada, com os SLOs como critério |
| Stress | Sobe em degraus até os limites serem violados | Encontra o ponto de ruptura |
| Spike | De 10 para 150 usuários em 10 segundos | Reação a pico repentino |
| Soak (curto) | 10 usuários por 15 minutos | Estabilidade ao longo do tempo |

Os valores serão refinados depois do smoke e do primeiro load.

## Dados e estado
- No início de cada execução, o script reinicia a aplicação (`POST /test/reset`) e cria fertilizantes
  com estoque alto e várias fazendas, para o estoque não acabar durante o teste.
- Cada usuário virtual usa a própria fazenda e pivô, para não esbarrar no bloqueio de pivô.
- Os dados preparados evitam rejeições de regra de negócio (saldo insuficiente e bloqueio de pivô).
  Por isso qualquer resposta 4xx ou 5xx, timeout ou resposta fora do esperado conta como falha.
- As operações são identificadas pela tag `operacao`, o que permite um limite e uma análise por operação.
- Os usuários virtuais emitem pedidos terrestres no primeiro pivô da sua fazenda e agendam os próprios pedidos.

## Hipóteses a verificar
- **H1**: a aplicação verifica os pedidos vencidos a cada requisição, percorrendo todos os pedidos.
  A latência deve crescer com o número de pedidos acumulados.
- **H2**: `GET /pedidos` devolve a lista completa, então o tamanho da resposta e o tempo crescem com o volume.
- **H3**: o processo é único (um núcleo de CPU), então a saturação deve aparecer em poucas dezenas de usuários.

## Métricas observadas
- Duração das requisições (média, p90, p95, p99), por operação
- Taxa de falhas e de checks
- Requisições por segundo e usuários virtuais
- Evolução da latência ao longo do teste (para confirmar ou refutar H1)

## Entregáveis
- Cenários em `k6/scenarios/`
- Relatório HTML de cada execução relevante
- Documento de análise com tabela de resultados, gargalos encontrados e recomendações

## Limitações
- Ambiente local, sem isolamento entre gerador de carga e aplicação
- Dados em memória, sem banco de dados e sem rede entre camadas
- Perfil de uso estimado, não medido em produção
