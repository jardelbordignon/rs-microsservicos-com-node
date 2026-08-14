# payments-service

Microsserviço de processamento de pagamentos do marketplace.
Consome pedidos de pagamento via RabbitMQ do `checkout-service`, processa via gateway fake
e publica de volta o resultado (aprovado/rejeitado).

## Visão geral

```
                checkout-service (4002)
                         │
           publica: payment.order (exchange "payments")
                         ▼
              ┌─────────────────────────┐
              │  RabbitMQ (5672)        │
              └────────────┬────────────┘
                           │ consome
                           ▼
              ┌─────────────────────────┐
              │    payments-service     │
              │   NestJS + Fastify      │
              │      (Porta 4003)       │
              └────────────┬────────────┘
                           │
               ┌───────────┼───────────┐
               ▼           ▼           ▼
      FakePayment     PostgreSQL     publica resultado
      Gateway          (:5433)        routing key:
      (aprova/rejeita)  payments-db   payment.result.*
                           │
                           ▼
              ┌─────────────────────────┐
              │  RabbitMQ (5672)        │
              └────────────┬────────────┘
                           │ consome
                           ▼
                checkout-service (atualiza
                status do pedido)
```

## Porta e endereços

| Interface            | URL                                |
| -------------------- | ---------------------------------- |
| API principal        | http://localhost:4003              |
| Swagger / Scalar UI  | http://localhost:4003/doc          |
| Health               | http://localhost:4003/health       |
| Métricas Prometheus  | http://localhost:4003/metrics      |

## Principais funcionalidades

- **Consumo assíncrono** de ordens de pagamento via RabbitMQ
- **Processamento via FakePaymentGateway:** regras determinísticas:
  - `amount > 10000` → `REJECTED` (limit_exceeded)
  - Valor com parte decimal `.99` → `REJECTED` (card_declined)
  - Demais → `APPROVED`
- **Persistência** do pagamento no banco (TypeORM/PostgreSQL)
- **Publicação de evento de resultado** apenas após persistência bem-sucedida
- **Flag de publicação** (`resultEventPublishedAt`) para garantir idempotência
- **API HTTP** para consulta de pagamentos e histórico
- **Métricas HTTP + métricas de negócio** (counters de pagamento)

## Fluxo de processamento

```
1. Message chega na queue payment_order
2. PaymentConsumerService.receivedMessage()
3. Valida / cria entidade Payment
4. Chama FakePaymentGatewayService.process()
5. Persiste resultado no banco
6. Se sucesso: publica PaymentResult na exchange "payments"
7. Marca resultEventPublishedAt (garante evento único)
8. ACK da mensagem
```

## Pré-requisitos

- Node.js >= 18
- pnpm 11
- Docker (PostgreSQL + RabbitMQ)

## Scripts

| Script             | Descrição                                                |
| ------------------ | -------------------------------------------------------- |
| `pnpm build`       | Build do serviço (Nest CLI)                             |
| `pnpm start:dev`   | Modo desenvolvimento (watch)                            |
| `pnpm start:debug` | Modo desenvolvimento com debug + watch                  |
| `pnpm start:prod`  | Rodar build final (`dist/main`)                         |
| `pnpm lint`        | Biome check + write                                     |
| `pnpm docker`      | Sobe PostgreSQL via docker-compose (down + up -d)       |

## Como rodar local

1. Instale as dependências:

```bash
pnpm install
```

2. Copie `.env.example` para `.env`:

```bash
cd apps/payments-service
cp .env.example .env
```

3. Suba banco PostgreSQL + RabbitMQ (messaging-service):

```bash
# Na raiz do monorepo
pnpm docker --filter=payments-service
pnpm docker --filter=messaging-service  # Garante RabbitMQ

# Ou na pasta do app
pnpm docker
```

4. Inicie o payments-service:

```bash
pnpm dev --filter=payments-service
```

5. (Opcional) Para fluxo completo, inicie checkout-service:

```bash
pnpm dev --filter=checkout-service
```

## Variáveis de ambiente (.env)

| Variável                   | Padrão                          | Descrição                                   |
| -------------------------- | ------------------------------- | ------------------------------------------- |
| `PORT`                     | 4003                            | Porta HTTP do serviço                       |
| `NODE_ENV`                 | `development`                   | Ambiente de execução                        |
| `JWT_SECRET`               | —                               | Segredo JWT                                 |
| `JWT_EXPIRES_IN`           | `7d`                            | Expiração do token                          |
| `DB_HOST`                  | `localhost`                     | Host PostgreSQL                             |
| `DB_PORT`                  | `5433`                          | Porta PostgreSQL                            |
| `DB_USER`                  | `postgres`                      | Usuário PostgreSQL                          |
| `DB_PASS`                  | `postgres`                      | Senha PostgreSQL                            |
| `DB_NAME`                  | `payments-db`                   | Nome do banco                               |
| `RABBITMQ_URL`             | `amqp://admin:admin@localhost`  | URI de conexão ao RabbitMQ                  |
| `RABBITMQ_QUEUE_PAYMENT_ORDER`  | `payment_order`             | Fila de entrada de pedidos para pagamento   |
| `RABBITMQ_QUEUE_PAYMENT_RESULT` | `payment_result`            | Fila de saída (exchange routing)            |
| `RABBITMQ_DLQ`             | `payment_order_dlq`             | Dead Letter Queue (mensagens com falha)     |

## Endpoints principais

| Método | Rota                 | Descrição                        | Auth |
| ------ | -------------------- | -------------------------------- | ---- |
| GET    | `/health`            | Health check                     | ❌   |
| GET    | `/metrics`           | Métricas Prometheus              | ❌   |
| GET    | `/doc`               | Scalar OpenAPI UI                | ❌   |
| GET    | `/payments`          | Lista todos os pagamentos        | ✅   |
| GET    | `/payments/:id`      | Detalhe de um pagamento          | ✅   |
| GET    | `/payments/order/:orderId` | Busca por ID de pedido      | ✅   |

## Mapeamento de status

| Resultado do pagamento | Status do Payment | Evento publicado → checkout atualiza Order |
| ---------------------- | ----------------- | ------------------------------------------- |
| `approved`             | `APPROVED`        | Order → `APPROVED`                          |
| `rejected`             | `REJECTED`        | Order → `PAYMENT_REJECTED`                  |

## Métricas de negócio customizadas

| Métrica                        | Tipo    | Labels   | Descrição                                          |
| ------------------------------ | ------- | -------- | ---------------------------------------------------- |
| `payments_processed_total`     | Counter | —        | Total de pagamentos processados (aprovados + rejeitados) |
| `payments_approved_total`     | Counter | —        | Total de pagamentos aprovados                       |
| `payments_rejected_total`     | Counter | `reason` | Total de pagamentos rejeitados (reason: limit_exceeded / card_declined) |

## Observabilidade

- **Métricas HTTP:** `http_requests_total`, `http_request_duration_seconds`
- **Métricas de processo:** prefixo `payments_service_`
- **Métricas de negócio:** counters acima
- **Scrape Prometheus:** Job `payments-service` em `host.docker.internal:4003/metrics`

## Hard constraints (regras de engenharia)

1. Publicação de eventos de pagamento só ocorre **após persistência bem-sucedida no DB**.
2. Flag `resultEventPublishedAt` garante publicação única (idempotência).
3. Falhas no processamento enviam para DLQ (`payment_order_dlq`) para auditoria.

## Documentação técnica adicional

Consulte specs do checkout-service e api-gateway para contexto do fluxo completo.
