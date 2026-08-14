# messaging-service

Infraestrutura de mensageria do marketplace usando **RabbitMQ 4 (Management)**.
É o barramento assíncrono entre `checkout-service` e `payments-service`.

## Visão geral

```
 checkout-service                                 payments-service
      │  publica "payment.order"                       ▲  publica "payment.result.*"
      │   (producer)                                   │   (producer)
      ▼                                                │
┌─────────────────────────────────────────────────────────────────┐
│                     RabbitMQ (5672)                              │
│                                                                  │
│  Exchange: "payments" (topic)                                    │
│     │                                                           │
│     ├── routing key: "payment.order"  ──► queue: payment_order  │
│     │                                              │            │
│     └── routing key: "payment.result.*" ──► queue: payment_result │
│                                                                 │
│  Queues:                                                        │
│    • payment_order        (checkout → payments)                │
│    • payment_result       (payments → checkout)                │
│    • payment_order_dlq    (dead letter de payment_order)       │
└─────────────────────────────────────────────────────────────────┘
```

## Serviços

| Componente              | Porta(s)        | Descrição                                      |
| ----------------------- | --------------- | ---------------------------------------------- |
| RabbitMQ (AMQP)         | 5672            | Protocolo de mensageria (produtores/consumidores) |
| RabbitMQ Management UI  | 15672           | Painel web de administração e monitoramento   |

## Credenciais padrão

| Campo    | Valor padrão             | Variável de ambiente        |
| -------- | ------------------------ | --------------------------- |
| Usuário  | `admin`                  | `RABBITMQ_DEFAULT_USER`     |
| Senha    | `admin`                  | `RABBITMQ_DEFAULT_PASS`     |

## Como usar

### Subir RabbitMQ (docker compose)

```bash
# Na raiz do monorepo
pnpm docker --filter=messaging-service

# Ou na pasta do app
cd apps/messaging-service
docker compose down && docker compose up -d
```

### Verificar status

```bash
docker compose ps
```

### Health check interno do container

O container já tem `healthcheck` com `rabbitmq-diagnostics ping`
(10s interval, 5s timeout, 5 retries, start_period 15s).

### Parar

```bash
docker compose down
```

### Parar e remover dados

```bash
docker compose down -v
```

## Acessos locais

| Interface / Recurso         | URL / URI                                      |
| ---------------------------- | ---------------------------------------------- |
| Management UI (Web)         | http://localhost:15672 (`admin` / `admin`)     |
| Conexão AMQP                | `amqp://admin:admin@localhost:5672`            |
| API HTTP Management         | http://localhost:15672/api                     |

## Volumes e persistência

- Dados persistidos em volume nomeado `rabbitmq_data` (via compose)
- Também mapeado como bind mount `./rabbitmq_data:/var/lib/rabbitmq` para inspeção local

## Variáveis de ambiente (opcionais)

Podem ser definidas em `.env` na pasta do `messaging-service`:

| Variável                      | Padrão  | Descrição                              |
| ----------------------------- | ------- | -------------------------------------- |
| `RABBITMQ_DEFAULT_USER`       | `admin` | Usuário default                        |
| `RABBITMQ_DEFAULT_PASS`       | `admin` | Senha default                          |
| `RABBITMQ_PORT`               | `5672`  | Porta AMQP exposta                     |
| `RABBITMQ_MANAGEMENT_PORT`    | `15672` | Porta Management UI exposta            |

## Filas / exchanges usadas pelo marketplace

| Exchange | Tipo  | Routing key         | Fila associada       | Produtor           | Consumidor         |
| -------- | ----- | ------------------- | -------------------- | ------------------ | ------------------ |
| payments | topic | `payment.order`     | `payment_order`      | checkout-service   | payments-service   |
| payments | topic | `payment.result.*`  | `payment_result`     | payments-service   | checkout-service   |

- **Dead Letter Queue:** `payment_order_dlq` (recebe mensagens de `payment_order` com erro ou rejeitadas repetidamente)

## Boas práticas

1. Sempre suba o messaging-service **antes** de checkout e payments.
2. Consumidores possuem idempotência na camada de negócio.
3. Use a Management UI (`http://localhost:15672`) para inspecionar filas, reprocessar mensagens da DLQ ou visualizar throughput.

## Troubleshooting

- **Conexão recusada:** verifique se container está `healthy` em `docker compose ps`.
- **Mensagens não chegam:** verifique routing keys e bindings na UI Management.
- **Mensagens na DLQ:** investigue rejeições no payments-service; reencaminhe manualmente após correção.
