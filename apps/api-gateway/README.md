# api-gateway

Gateway HTTP único de entrada do marketplace. Responsável por autenticação, proxy reverso, rate-limit,
circuit-breaker, retry, timeout e agregação de health checks dos serviços internos.

## Visão geral

```
Clientes HTTP (Frontend, Mobile, API)
            │
            ▼
    ┌─────────────────────┐
    │     api-gateway     │
    │  NestJS + Fastify   │
    │    (Porta 4001)     │
    └─────────┬───────────┘
        ┌─────┼─────────┐
        ▼     ▼         ▼
   users   products   checkout
 (4005)    (4004)     (4002)
```

## Responsabilidades

- **Proxy HTTP:** Roteia requisições para os microsserviços internos
- **Autenticação JWT:** Valida tokens nos endpoints protegidos
- **Rate Limiting:** Protege contra abuso (3 níveis: short/medium/long)
- **Resiliência:** Circuit Breaker, Retry e Timeout nas chamadas de proxy
- **Health Checks agregados:** Verifica status de todos os serviços
- **Observabilidade:** Logging estruturado, métricas HTTP e métricas de processo
- **Documentação:** API Scalar/OpenAPI auto documentada

## Porta e endereços

| Interface            | URL                                |
| -------------------- | ---------------------------------- |
| API principal        | http://localhost:4001              |
| Swagger / Scalar UI  | http://localhost:4001/doc          |
| Health (geral)       | http://localhost:4001/health       |
| Health (serviços)    | http://localhost:4001/health/services |
| Métricas Prometheus  | http://localhost:4001/metrics      |

## Pré-requisitos

- Node.js >= 18
- pnpm 11
- Microsserviços alvo rodando (users, products, checkout)
- **Opcional:** Serviços de infra (RabbitMQ, Prometheus, Grafana)

## Scripts

| Script             | Descrição                                                |
| ------------------ | -------------------------------------------------------- |
| `pnpm build`       | Build do serviço (Nest CLI)                             |
| `pnpm start:dev`   | Modo desenvolvimento (watch)                            |
| `pnpm start:debug` | Modo desenvolvimento com debug + watch                  |
| `pnpm start:prod`  | Rodar build final (`dist/main`)                         |
| `pnpm lint`        | Biome check + write                                     |
| `pnpm spec`        | Rodar testes unitários (Vitest)                         |
| `pnpm test`        | Rodar testes E2E (Vitest)                               |

## Como rodar local

1. Instale as dependências (na raiz do monorepo):

```bash
pnpm install
```

2. Suba as dependências (bancos + infra) via Turborepo (na raiz):

```bash
pnpm docker
```

3. Suba os microsserviços alvo (em paralelo ou individual):

```bash
# Individualmente, em terminais separados
pnpm dev --filter=users-service
pnpm dev --filter=products-service
pnpm dev --filter=checkout-service
```

4. Inicie o gateway em modo desenvolvimento:

```bash
# Na raiz do monorepo
pnpm dev --filter=api-gateway

# Ou na pasta do app
pnpm start:dev
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

| Variável             | Padrão    | Descrição                                    |
| -------------------- | --------- | -------------------------------------------- |
| `PORT`               | 4001      | Porta HTTP do gateway                        |
| `RATE_LIMIT_SHORT`   | 10        | Requisições por 1s (mesmo IP)                |
| `RATE_LIMIT_MEDIUM`  | 100       | Requisições por 1min (mesmo IP)              |
| `RATE_LIMIT_LONG`    | 1000      | Requisições por 15min (mesmo IP)             |
| `JWT_SECRET`         | —         | Segredo JWT (mesmo usado por users-service)  |

## Endpoints principais

| Método | Rota                    | Descrição                     | Auth |
| ------ | ----------------------- | ----------------------------- | ---- |
| GET    | `/health`               | Health do gateway             | ❌   |
| GET    | `/health/services`      | Health agregado dos serviços  | ❌   |
| GET    | `/health/ready`         | Readiness (orquestração)      | ❌   |
| GET    | `/health/live`          | Liveness                      | ❌   |
| GET    | `/metrics`              | Métricas Prometheus           | ❌   |
| GET    | `/doc`                  | Scalar OpenAPI UI             | ❌   |
| POST   | `/users/auth/register`  | Registro de usuário           | ❌   |
| POST   | `/users/auth/login`     | Login → JWT                   | ❌   |
| GET    | `/users/me`             | Usuário autenticado           | ✅   |
| *      | `/users/*`              | Proxy → users-service (4005)  | ✅   |
| *      | `/products/*`           | Proxy → products-service (4004) | ✅ |
| GET    | `/cart`                 | Proxy carrinho                | ✅   |
| POST   | `/cart/items`           | Adicionar item carrinho       | ✅   |
| POST   | `/checkout`             | Finalizar compra              | ✅   |
| GET    | `/orders`               | Listar pedidos                | ✅   |
| GET    | `/orders/:id`           | Detalhe do pedido             | ✅   |

## Testes

```bash
# Testes unitários (arquivos *.spec.ts)
pnpm spec

# Testes E2E (integração)
pnpm test
```

## Observabilidade

- **Métricas HTTP:** `http_requests_total`, `http_request_duration_seconds`
- **Métricas de processo:** prefixo `api_gateway_` (ex: `api_gateway_process_resident_memory_bytes`)
- **Scrape Prometheus:** Job `api-gateway` em `host.docker.internal:4001/metrics`

## Documentação técnica adicional

Specs do app em `docs/specs/`:

| Arquivo                                                             | Descrição                                                  |
| ------------------------------------------------------------------- | ---------------------------------------------------------- |
| [01-checkout-service-api-gateway-integration.md](./docs/specs/01-checkout-service-api-gateway-integration.md) | Integração com checkout-service |
| [02-payments-gateway-integration.md](./docs/specs/02-payments-gateway-integration.md) | Integração com payments / gateway de pagamentos  |
| [03-http-metrics-instrumentation.md](./docs/specs/03-http-metrics-instrumentation.md) | Instrumentação de métricas HTTP           |
| [04-terminus-health-checks.md](./docs/specs/04-terminus-health-checks.md) | Health checks com Terminus                          |
