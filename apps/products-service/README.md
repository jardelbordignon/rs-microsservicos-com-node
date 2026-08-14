# products-service

Microsserviço de catálogo e gerenciamento de produtos do marketplace.

## Visão geral

Responsável por CRUD de produtos, consulta de catálogo e informações de estoque/preço.
É chamado pelo `api-gateway` via proxy HTTP nas rotas `/products/*` e também é consultado
pelo `checkout-service` via HTTP interno (validação de itens no carrinho).

```
     api-gateway (4001)                 checkout-service (4002)
          │  /products/*                      │  (consulta interna)
          ▼                                   ▼
        ┌─────────────────────────────────────────┐
        │           products-service              │
        │          NestJS + Fastify               │
        │            (Porta 4004)                 │
        └─────────────────┬───────────────────────┘
                          │ PostgreSQL
                  ┌───────▼────────┐
                  │  products-db   │
                  │   (:5434)      │
                  └────────────────┘
```

## Porta e endereços

| Interface            | URL                                |
| -------------------- | ---------------------------------- |
| API principal        | http://localhost:4004              |
| Swagger / Scalar UI  | http://localhost:4004/doc          |
| Health               | http://localhost:4004/health       |
| Métricas Prometheus  | http://localhost:4004/metrics      |

## Principais funcionalidades

- **CRUD completo** de produtos (cadastro, consulta, atualização, remoção)
- **Listagem paginada** do catálogo
- **Filtros** por categoria, faixa de preço e busca textual
- **Validação de produtos** por parte do checkout (existência + preço)
- **Health check** (Terminus)
- **Métricas HTTP + de processo** (prom-client)

## Pré-requisitos

- Node.js >= 18
- pnpm 11
- Docker (para PostgreSQL local)

## Scripts

| Script             | Descrição                                                |
| ------------------ | -------------------------------------------------------- |
| `pnpm build`       | Build do serviço (Nest CLI)                             |
| `pnpm start:dev`   | Modo desenvolvimento (watch)                            |
| `pnpm start:debug` | Modo desenvolvimento com debug + watch                  |
| `pnpm start:prod`  | Rodar build final (`dist/main`)                         |
| `pnpm lint`        | Biome check + write                                     |
| `pnpm docker`      | Sobe banco PostgreSQL via docker-compose (down + up -d)  |

## Como rodar local

1. Instale as dependências (na raiz do monorepo):

```bash
pnpm install
```

2. Copie `.env.example` para `.env`:

```bash
cd apps/products-service
cp .env.example .env
```

3. Suba o banco PostgreSQL:

```bash
# Na raiz do monorepo
pnpm docker --filter=products-service

# Ou na pasta do app
pnpm docker
```

4. Inicie o serviço:

```bash
# Na raiz do monorepo
pnpm dev --filter=products-service

# Ou na pasta do app
pnpm start:dev
```

## Variáveis de ambiente (.env)

| Variável           | Padrão              | Descrição                              |
| ------------------ | ------------------- | -------------------------------------- |
| `PORT`             | 4004                | Porta HTTP do serviço                 |
| `NODE_ENV`         | `development`       | Ambiente de execução                   |
| `JWT_SECRET`       | —                   | Segredo JWT (igual ao api-gateway)     |
| `JWT_EXPIRES_IN`   | `7d`                | Tempo de expiração do token            |
| `DB_HOST`          | `localhost`         | Host PostgreSQL                        |
| `DB_PORT`          | `5434`              | Porta PostgreSQL                       |
| `DB_USER`          | `postgres`          | Usuário PostgreSQL                     |
| `DB_PASS`          | `postgres`          | Senha PostgreSQL                       |
| `DB_NAME`          | `products-db`       | Nome do banco                          |

## Endpoints principais

| Método | Rota              | Descrição                        | Auth |
| ------ | ----------------- | -------------------------------- | ---- |
| GET    | `/health`         | Health check                     | ❌   |
| GET    | `/metrics`        | Métricas Prometheus              | ❌   |
| GET    | `/doc`            | Scalar OpenAPI UI                | ❌   |
| GET    | `/products`       | Lista produtos (paginado/filtros)| ❌   |
| GET    | `/products/:id`   | Detalhe de um produto            | ❌   |
| POST   | `/products`       | Cria um novo produto             | ✅   |
| PATCH  | `/products/:id`   | Atualiza um produto              | ✅   |
| DELETE | `/products/:id`   | Remove um produto                | ✅   |

## Segurança

- `JwtAuthGuard` GLOBAL: endpoints protegidos por padrão
- Rotas de leitura (`GET /products`, `GET /products/:id`) são públicas para consulta de catálogo
- Rotas de escrita (`POST / PATCH / DELETE`) exigem autenticação JWT

## Observabilidade

- **Métricas HTTP:** `http_requests_total`, `http_request_duration_seconds` (via middleware)
- **Métricas de processo:** prefixo `products_service_`
  (ex: `products_service_process_resident_memory_bytes`)
- **Scrape Prometheus:** Job `products-service` em `host.docker.internal:4004/metrics`

## Documentação técnica adicional

Specs do app em `docs/specs/` (se houver).
