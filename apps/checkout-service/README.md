# checkout-service

Microsserviço responsável por carrinho de compras, criação e consulta de pedidos (checkout).
Publica pedidos no RabbitMQ para o `payments-service` processar pagamentos de forma assíncrona.

## Visão geral

```
  api-gateway (4001)
         │  /cart, /checkout, /orders
         ▼
  ┌──────────────────────┐      HTTP consulta produtos
  │   checkout-service   │ ────────────────────────────────► products-service (4004)
  │   NestJS + Fastify   │
  │     (Porta 4002)     │
  └──────────┬───────────┘
             │ PostgreSQL                    │ RabbitMQ
     ┌───────▼────────┐             ┌────────▼─────────┐
     │   checkout-db  │             │  Exchange:       │
     │    (:5432)      │             │  "payments"      │
     └────────────────┘             │  routing key:    │
         ▲                          │  "payment.order" │
         │  payment.result.*        │                  │
         └──────────────────────────┤ ◄────────────────┘
                                    └──────────────────┘
         (consome resultados de pagamento do payments-service)
```

## Porta e endereços

| Interface            | URL                                |
| -------------------- | ---------------------------------- |
| API principal        | http://localhost:4002              |
| Swagger / Scalar UI  | http://localhost:4002/doc          |
| Health               | http://localhost:4002/health       |
| Métricas Prometheus  | http://localhost:4002/metrics      |

## Principais funcionalidades

- **Gerenciamento de carrinho:** adicionar/remover itens, consultar carrinho do usuário
- **Checkout:** validação do carrinho + produtos, criação do pedido, publicação no RabbitMQ
- **Consulta de pedidos:** listagem e detalhe por ID
- **RabbitMQ:** publica `payment.order` e consome `payment.result.*`
- **Atualização de status do pedido** a partir do evento de resultado de pagamento
- **Health check composto:** Terminus + RabbitMQ health indicator
- **Métricas HTTP + métricas de negócio:** (módulo `metrics/`)

## Fluxo de checkout

```
1. Usuário adiciona/remove itens no carrinho (/cart)
2. Usuário chama POST /checkout
3. Valida: carrinho não-vazio, produtos existem no products-service
4. Cria Order com status PENDING_PAYMENT no DB
5. Publica mensagem PaymentOrder na exchange "payments" (routing key: payment.order)
6. payments-service processa e publica PaymentResult
7. checkout-service consome e atualiza status do pedido
```

## Pré-requisitos

- Node.js >= 18
- pnpm 11
- Docker (PostgreSQL + RabbitMQ)
- `products-service` rodando para validação de itens no checkout

## Scripts

| Script             | Descrição                                                |
| ------------------ | -------------------------------------------------------- |
| `pnpm build`       | Build do serviço (Nest CLI)                             |
| `pnpm start:dev`   | Modo desenvolvimento (watch)                            |
| `pnpm start:debug` | Modo desenvolvimento com debug + watch                  |
| `pnpm start:prod`  | Rodar build final (`dist/main`)                         |
| `pnpm lint`        | Biome check + write                                     |
| `pnpm docker`      | Sobe PostgreSQL + RabbitMQ via docker-compose           |

## Como rodar local

1. Instale as dependências:

```bash
pnpm install
```

2. Copie `.env.example` para `.env`:

```bash
cd apps/checkout-service
cp .env.example .env
```

3. Suba banco PostgreSQL + RabbitMQ (messaging-service também serve):

```bash
# Na raiz do monorepo
pnpm docker --filter=checkout-service
pnpm docker --filter=messaging-service  # Garante RabbitMQ

# Ou na pasta do app
pnpm docker
```

4. Suba o `products-service` (requisitado no fluxo de checkout):

```bash
pnpm dev --filter=products-service
```

5. Suba `payments-service` (para consumir os pedidos publicados):

```bash
pnpm dev --filter=payments-service
```

6. Inicie o checkout-service:

```bash
pnpm dev --filter=checkout-service
```

## Variáveis de ambiente (.env)

| Variável                   | Padrão                          | Descrição                             |
| -------------------------- | ------------------------------- | ------------------------------------- |
| `PORT`                     | 4002                            | Porta HTTP do serviço                |
| `NODE_ENV`                 | `development`                   | Ambiente de execução                  |
| `JWT_SECRET`               | —                               | Segredo JWT                           |
| `JWT_EXPIRES_IN`           | `7d`                            | Expiração do token                    |
| `DB_HOST`                  | `localhost`                     | Host PostgreSQL                       |
| `DB_PORT`                  | `5432`                          | Porta PostgreSQL                      |
| `DB_USER`                  | `postgres`                      | Usuário PostgreSQL                    |
| `DB_PASS`                  | `postgres`                      | Senha PostgreSQL                      |
| `DB_NAME`                  | `checkout-db`                   | Nome do banco                         |
| `RABBITMQ_URL`             | `amqp://admin:admin@localhost`  | URI de conexão ao RabbitMQ            |
| `RABBITMQ_QUEUE_PAYMENT_ORDER`  | `payment_order`             | Fila de pedidos para pagamentos       |
| `RABBITMQ_QUEUE_PAYMENT_RESULT` | `payment_result`            | Fila de resultados de pagamento       |
| `PRODUCTS_SERVICE_URL`     | `http://localhost:4004`         | Base URL do products-service          |

## Endpoints principais

| Método | Rota                  | Descrição                                 | Auth |
| ------ | --------------------- | ----------------------------------------- | ---- |
| GET    | `/health`             | Health (Terminus + RabbitMQ indicator)    | ❌   |
| GET    | `/metrics`            | Métricas Prometheus                       | ❌   |
| GET    | `/doc`                | Scalar OpenAPI UI                         | ❌   |
| GET    | `/cart`               | Consulta carrinho do usuário autenticado  | ✅   |
| POST   | `/cart/items`         | Adiciona item ao carrinho                 | ✅   |
| DELETE | `/cart/items/:productId` | Remove item do carrinho               | ✅   |
| DELETE | `/cart`               | Limpa carrinho                            | ✅   |
| POST   | `/checkout`           | Finaliza checkout → cria pedido → publish | ✅ |
| GET    | `/orders`             | Lista pedidos do usuário                  | ✅   |
| GET    | `/orders/:id`         | Detalhe de um pedido                      | ✅   |

## Métricas de negócio customizadas

Além das métricas HTTP padrão, o serviço expõe:

| Métrica                              | Tipo    | Labels    | Descrição                                       |
| ------------------------------------ | ------- | --------- | ------------------------------------------------- |
| `orders_created_total`               | Counter | —         | Total de pedidos criados via checkout            |
| `rabbitmq_messages_published_total`  | Counter | `queue`   | Total de mensagens publicadas no RabbitMQ        |

## Observabilidade

- **Métricas HTTP:** `http_requests_total`, `http_request_duration_seconds`
- **Métricas de processo:** prefixo `checkout_service_`
- **Métricas de negócio:** counters customizados (acima)
- **Scrape Prometheus:** Job `checkout-service` em `host.docker.internal:4002/metrics`

## Idempotência

O consumidor de resultados de pagamento garante idempotência: mesmo que a mesma mensagem
chegue mais de uma vez, o status do pedido é atualizado apenas na primeira vez.

## Documentação técnica adicional

Specs do app em `docs/specs/`:

| Arquivo                                                               | Descrição                                           |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| [01-checkout-domain-entities-and-jwt.md](./docs/specs/01-checkout-domain-entities-and-jwt.md) | Entidades de domínio e JWT      |
| [02-cart-management.md](./docs/specs/02-cart-management.md)          | Gerenciamento de carrinho                           |
| [03-order-checkout-and-orders-queries.md](./docs/specs/03-order-checkout-and-orders-queries.md) | Checkout e queries de pedidos |
| [04-http-metrics-instrumentation.md](./docs/specs/04-http-metrics-instrumentation.md) | Instrumentação métricas HTTP       |
| [05-terminus-health-checks.md](./docs/specs/05-terminus-health-checks.md) | Health checks com Terminus             |
