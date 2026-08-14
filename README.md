# Marketplace MS

Monorepo de microsserviços do marketplace, construído com NestJS (Fastify), TypeORM, PostgreSQL e RabbitMQ.
Orquestrado com **pnpm + Turborepo**.

## Arquitetura Geral

```
                        ┌────────────────────┐
                        │    API Gateway     │
                        │     (4001)         │
                        └─────────┬──────────┘
                                  │ HTTP
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼────────┐ ┌────────▼────────┐ ┌───────▼─────────┐
    │  users-service   │ │ products-service │ │ checkout-service │
    │     (4005)       │ │     (4004)       │ │     (4002)       │
    └──────────────────┘ └──────────────────┘ └────────┬─────────┘
                                                        │ RabbitMQ
                                              ┌─────────▼────────┐
                                              │ payments-service │
                                              │     (4003)       │
                                              └──────────────────┘
                  Infraestrutura dedicada
          ┌─────────────────────┐  ┌──────────────────────┐
          │  Messaging Service  │  │ Observability Stack  │
          │  RabbitMQ (5672)    │  │ Prometheus + Grafana │
          └─────────────────────┘  └──────────────────────┘
```

## Apps

| App                      | Porta | Descrição                                                 | Banco de dados | Observabilidade |
| ------------------------ | ----- | --------------------------------------------------------- | -------------- | --------------- |
| `api-gateway`            | 4001  | Gateway HTTP único de entrada (proxy, auth, rate-limit)  | —              | ✅ `/metrics`   |
| `users-service`          | 4005  | Autenticação e gerenciamento de usuários                 | PostgreSQL     | ✅ `/metrics`   |
| `products-service`       | 4004  | Catálogo de produtos                                      | PostgreSQL     | ✅ `/metrics`   |
| `checkout-service`       | 4002  | Carrinho, pedidos e checkout (produtor RabbitMQ)         | PostgreSQL     | ✅ `/metrics`   |
| `payments-service`       | 4003  | Processamento de pagamentos (consumidor RabbitMQ)        | PostgreSQL     | ✅ `/metrics`   |
| `messaging-service`      | 5672  | Infra RabbitMQ + Management UI                           | —              | —               |
| `observability-stack`    | 9090  | Prometheus + Grafana (4000)                              | —              | —               |

## Stack Tecnológica

- **Runtime:** Node.js >= 18
- **Linguagem:** TypeScript 5.9
- **Framework:** NestJS 11 com adaptador Fastify
- **ORM:** TypeORM
- **Banco:** PostgreSQL
- **Mensageria:** RabbitMQ 4 (amqplib)
- **Monitoramento:** Prometheus (prom-client) + Grafana
- **Qualidade:** Biome (lint + format)
- **Testes:** Vitest (e2e + unit)
- **Build:** Nest CLI + SWC
- **Monorepo:** pnpm 11 + Turborepo 2
- **Docs:** Scalar (OpenAPI / Swagger)

## Pré-requisitos

- Node.js >= 18
- pnpm 11 (`corepack enable && corepack prepare pnpm@11.8.0 --activate`)
- Docker + Docker Compose (para bancos, RabbitMQ e observabilidade)

## Instalação

```bash
pnpm install
```

## Comandos da raiz (Turborepo)

Todos os comandos abaixo executam em paralelo nos apps/packages, com cache do Turborepo:

| Comando         | Descrição                                               |
| --------------- | ------------------------------------------------------- |
| `pnpm build`    | Builda todos os apps e packages                         |
| `pnpm dev`      | Sobe TODOS os serviços em modo watch (portas liberadas) |
| `pnpm start`    | Sobe TODOS os serviços em modo produção                |
| `pnpm lint`     | Roda Biome check + write em todos os apps               |
| `pnpm docker`   | Sobe todos os bancos/infra dos apps via docker compose |
| `pnpm check-types` | Type-check em todos os apps/packages               |

Para rodar um comando em um único app, use `--filter` do Turborepo:

```bash
# Exemplos
pnpm dev --filter=api-gateway
pnpm build --filter=payments-service
pnpm docker --filter=users-service
```

## Ordem de inicialização (desenvolvimento local)

1. **Infraestrutura** (bancos, RabbitMQ, observabilidade):

```bash
# Bancos de cada serviço e RabbitMQ
pnpm docker

# Observabilidade (Prometheus + Grafana)
cd apps/observability-stack && docker-compose up -d
```

2. **Serviços** (em terminais separados ou via Turborepo):

```bash
pnpm dev
```

Ou individualmente:

```bash
pnpm dev --filter=users-service
pnpm dev --filter=products-service
pnpm dev --filter=checkout-service
pnpm dev --filter=payments-service
pnpm dev --filter=api-gateway
```

## Mapa completo de portas

| Porta  | Serviço / Interface                 | Acesso                               |
| ------ | ------------------------------------ | ------------------------------------ |
| 4001   | api-gateway                          | http://localhost:4001                |
| 4001   | api-gateway — Swagger/Scalar         | http://localhost:4001/doc            |
| 4002   | checkout-service                     | http://localhost:4002                |
| 4002   | checkout-service — Swagger/Scalar    | http://localhost:4002/doc            |
| 4003   | payments-service                     | http://localhost:4003                |
| 4003   | payments-service — Swagger/Scalar    | http://localhost:4003/doc            |
| 4004   | products-service                     | http://localhost:4004                |
| 4004   | products-service — Swagger/Scalar    | http://localhost:4004/doc            |
| 4005   | users-service                        | http://localhost:4005                |
| 4005   | users-service — Swagger/Scalar       | http://localhost:4005/doc            |
| 4000   | Grafana UI                           | http://localhost:4000 (admin/admin)  |
| 5672   | RabbitMQ AMQP                        | amqp://admin:admin@localhost:5672    |
| 9090   | Prometheus UI / API                  | http://localhost:9090                |
| 15672  | RabbitMQ Management UI               | http://localhost:15672 (admin/admin) |

Portas de bancos PostgreSQL (via docker-compose de cada serviço):

| Porta  | Banco                | Serviço associado     |
| ------ | -------------------- | --------------------- |
| 5432   | checkout-db          | checkout-service      |
| 5433   | payments-db          | payments-service      |
| 5434   | products-db          | products-service      |
| 5435   | users-db             | users-service         |

## Endpoints públicos (sem autenticação)

Todos os serviços expõem endpoints públicos essenciais:

| Endpoint        | Descrição                                  | Autenticação |
| --------------- | ------------------------------------------ | ------------ |
| `GET /health`   | Health check liveness/readiness            | ❌ Público   |
| `GET /metrics`  | Métricas Prometheus (prom-client)          | ❌ Público   |
| `GET /doc`      | Documentação OpenAPI (Scalar)              | ❌ Público   |
| Demais rotas    | APIs de negócio                            | ✅ JWT       |

## Comunicação entre serviços

- **HTTP via api-gateway:** Clientes externos acessam apenas o gateway (4001), que faz proxy para os serviços internos.
- **Assíncrona (RabbitMQ):** `checkout-service` publica mensagens de pedido de pagamento; `payments-service` consome e publica resultados de volta.
  - Exchange: `payments`
  - Routing keys: `payment.order` (checkout → payments), `payment.result.*` (payments → checkout)

## Estrutura do monorepo

```
marketplace/
├── apps/
│   ├── api-gateway/           # Gateway HTTP de entrada
│   ├── users-service/         # Microsserviço de usuários
│   ├── products-service/      # Microsserviço de produtos
│   ├── checkout-service/      # Microsserviço de checkout/pedidos
│   ├── payments-service/      # Microsserviço de pagamentos
│   ├── messaging-service/     # Infra RabbitMQ (docker-compose)
│   └── observability-stack/   # Infra Prometheus + Grafana
├── packages/
│   ├── biome-config/          # Configuração compartilhada do Biome
│   └── utils/                 # Código/utilitários compartilhados
├── scripts/                   # Scripts utilitários da raiz
├── turbo.json                 # Configuração do pipeline Turborepo
└── pnpm-workspace.yaml        # Workspace do pnpm
```

## Pacotes compartilhados

| Package            | Descrição                                    |
| ------------------ | -------------------------------------------- |
| `@repo/biome-config` | Configuração centralizada de lint/format   |
| `@repo/utils`       | Decorators comuns (`@Endpoint`), DTOs etc |

## Links úteis (em execução local)

- **API:** http://localhost:4001
- **Prometheus (targets):** http://localhost:9090/targets
- **Grafana:** http://localhost:4000 (`admin/admin`)
- **RabbitMQ Management:** http://localhost:15672 (`admin/admin`)
