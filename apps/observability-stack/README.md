# Observability Stack

Infraestrutura de observabilidade do marketplace usando **Prometheus** (coleta de métricas)
e **Grafana** (visualização via dashboards).

## Visão geral

```
 5x Microsserviços NestJS
 (users, products, checkout, payments, api-gateway)
         │
         │ GET /metrics  (formato Prometheus text-based)
         │
         ▼
┌─────────────────────────────────┐
│           Prometheus            │
│    scraping interval: 15s       │
│   porta UI / API: 9090          │
│   - scrape_configs (5 jobs)     │
│   - alert.rules.yml             │
│   - retenção: 15 dias           │
└───────────────┬─────────────────┘
                │ query PromQL
                ▼
┌─────────────────────────────────┐
│            Grafana              │
│      porta UI: 4000             │
│  - Datasource: Prometheus       │
│     (http://prometheus:9090)    │
│  - Dashboards provisionados     │
│      (pasta "Marketplace")      │
└─────────────────────────────────┘
```

## Serviços

| Serviço    | Porta     | URL                               | Credenciais    |
| ---------- | --------- | --------------------------------- | -------------- |
| Prometheus | 9090      | http://localhost:9090             | —              |
| Grafana    | 4000 (UI) | http://localhost:4000             | admin / admin  |

## Pré-requisitos

- Docker + Docker Compose
- Os microsserviços NestJS **rodando** e expondo `/metrics` na porta esperada
  (o Prometheus usa `host.docker.internal` para alcançar o host a partir dos containers)

## Como usar

### Subir a stack

```bash
# Na raiz do monorepo
cd apps/observability-stack
docker compose up -d
```

### Verificar status

```bash
docker compose ps
```

Ambos os serviços (`marketplace-prometheus` e `marketplace-grafana`) devem aparecer
como `healthy` após ~30s.

### Parar a stack

```bash
docker compose down
```

### Parar e remover dados persistidos (volumes)

```bash
docker compose down -v
```

## Verificações rápidas

| Verificação                     | Endereço / Comando                                           |
| ------------------------------- | ------------------------------------------------------------ |
| Prometheus UI                   | http://localhost:9090                                        |
| Prometheus Targets (UP/DOWN)    | http://localhost:9090/targets                                |
| Prometheus health               | http://localhost:9090/-/healthy                              |
| Grafana login                   | http://localhost:4000 (`admin` / `admin`)                   |
| Grafana datasources             | Grafana → Connections → Data sources                         |
| Grafana health                  | http://localhost:4000/api/health                             |

## Jobs de scraping do Prometheus

O Prometheus está configurado com 1 scrape a cada 15s para cada serviço NestJS
rodando no host:

| Job                 | Target                          | Endpoint | Label `job`          |
| ------------------- | ------------------------------- | -------- | ---------------------- |
| users-service       | `host.docker.internal:4005`     | /metrics | users-service         |
| products-service    | `host.docker.internal:4004`     | /metrics | products-service      |
| payments-service    | `host.docker.internal:4003`     | /metrics | payments-service      |
| checkout-service    | `host.docker.internal:4002`     | /metrics | checkout-service      |
| api-gateway         | `host.docker.internal:4001`     | /metrics | api-gateway           |

> **Dica:** Se um target aparecer como DOWN:
> 1. Confirme o serviço está rodando na porta certa.
> 2. Confirme `/metrics` responde 200 e retorna formato Prometheus.
> 3. Em Linux: verifique se `extra_hosts: host.docker.internal:host-gateway`
>    existe no `docker-compose.yml` (já incluso).

## Provisionamento automático

### Datasource Prometheus

O datasource "Prometheus" é provisionado automaticamente via arquivo YAML em
`grafana/provisioning/datasources/datasource.yml`. Configurações:

- **URL:** `http://prometheus:9090` (rede interna Docker)
- **Access:** proxy (requisições passam pelo backend do Grafana)
- **Default:** sim
- **Editable:** não (configuração gerenciada por arquivo)

### Dashboards

Dashboards JSON são provisionados em `grafana/provisioning/dashboards/`
e aparecem automaticamente na pasta "Marketplace" do Grafana:

- `marketplace-overview.json` — Visão geral de saúde e negócio
- `service-details.json` — Detalhamento RED por serviço (variável `$service`)

Refresh automático do provider: a cada 30s, ou após `docker compose restart grafana`.

## Volumes persistidos

| Volume nomeado      | Serviço    | O que é salvo                                    |
| ------------------- | ---------- | ------------------------------------------------ |
| `prometheus_data`   | Prometheus | TSDB com séries temporais (ret 15 dias + métricas) |
| `grafana_data`      | Grafana    | Dashboards criados manualmente, configurações de usuário etc. |

## Alertas

Regras de alerta são carregadas do arquivo `prometheus/alert.rules.yml`
(avaliadas a cada 15s, conforme `evaluation_interval` global).

## Queries PromQL úteis

Saúde:
- `up{job="users-service"}` — UP/DOWN de um target
- `up == 0` — todos os serviços DOWN

Throughput / Latência:
- `sum(rate(http_requests_total[5m])) by (job)`
- `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))`

Métricas de negócio:
- `payments_approved_total` / `payments_rejected_total`
- `orders_created_total`
- `rabbitmq_messages_published_total`

## Documentação técnica

Specs em `docs/specs/`:

| Arquivo                                                             | Descrição                                             |
| ------------------------------------------------------------------- | ----------------------------------------------------- |
| [01-prometheus-grafana-stack.md](./docs/specs/01-prometheus-grafana-stack.md) | Spec da infra de Prometheus + Grafana       |
| [02-dashboards-metricas-negocio.md](./docs/specs/02-dashboards-metricas-negocio.md) | Spec de dashboards e métricas customizadas |
