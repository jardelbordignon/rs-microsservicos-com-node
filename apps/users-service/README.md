# users-service

Microsserviço de autenticação e gerenciamento de usuários do marketplace.

## Visão geral

Responsável por registro, login com JWT, dados de perfil e manutenção de contas.
É chamado pelo `api-gateway` via proxy HTTP nas rotas `/users/*`.

```
api-gateway (4001)
    │  /users/*
    ▼
┌──────────────────┐
│  users-service   │
│ NestJS + Fastify │
│   (Porta 4005)   │
└────────┬─────────┘
         │ PostgreSQL
   ┌─────▼──────┐
   │ users-db   │
   │ (:5435)     │
   └────────────┘
```

## Porta e endereços

| Interface            | URL                                |
| -------------------- | ---------------------------------- |
| API principal        | http://localhost:4005              |
| Swagger / Scalar UI  | http://localhost:4005/doc          |
| Health               | http://localhost:4005/health       |
| Métricas Prometheus  | http://localhost:4005/metrics      |

## Principais funcionalidades

- **Registro de usuários** com hash de senha (bcryptjs)
- **Login / Autenticação JWT** (Passport + JWT strategy)
- **Perfil do usuário** (meus dados)
- **Listagem e CRUD** de usuários
- **Health check** (Terminus)
- **Métricas HTTP + de processo** (prom-client)

## Pré-requisitos

- Node.js >= 18
- pnpm 11
- Docker (para PostgreSQL local)
- Segredo JWT compartilhado com `api-gateway`

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

2. Copie `.env.example` para `.env` e ajuste os valores (`.env.example` já contém defaults de desenvolvimento):

```bash
cd apps/users-service
cp .env.example .env
```

3. Suba o banco PostgreSQL:

```bash
# Na raiz do monorepo
pnpm docker --filter=users-service

# Ou na pasta do app
pnpm docker
```

4. Inicie o serviço:

```bash
# Na raiz do monorepo
pnpm dev --filter=users-service

# Ou na pasta do app
pnpm start:dev
```

## Variáveis de ambiente (.env)

| Variável           | Padrão            | Descrição                              |
| ------------------ | ----------------- | -------------------------------------- |
| `PORT`             | 4005              | Porta HTTP do serviço                 |
| `NODE_ENV`         | `development`     | Ambiente de execução                   |
| `JWT_SECRET`       | —                 | Segredo JWT (igual ao api-gateway)     |
| `JWT_EXPIRES_IN`   | `7d`              | Tempo de expiração do token            |
| `DB_HOST`          | `localhost`       | Host PostgreSQL                        |
| `DB_PORT`          | `5435`            | Porta PostgreSQL                       |
| `DB_USER`          | `postgres`        | Usuário PostgreSQL                     |
| `DB_PASS`          | `postgres`        | Senha PostgreSQL                       |
| `DB_NAME`          | `users-db`        | Nome do banco                          |

## Endpoints principais

| Método | Rota               | Descrição                      | Auth |
| ------ | ------------------ | ------------------------------ | ---- |
| GET    | `/health`          | Health check                   | ❌   |
| GET    | `/metrics`         | Métricas Prometheus            | ❌   |
| GET    | `/doc`             | Scalar OpenAPI UI              | ❌   |
| POST   | `/auth/register`   | Registro de novo usuário       | ❌   |
| POST   | `/auth/login`      | Login → retorna JWT            | ❌   |
| GET    | `/users/me`        | Dados do usuário autenticado   | ✅   |
| GET    | `/users`           | Lista todos os usuários        | ✅   |
| GET    | `/users/:id`       | Detalhe de um usuário por ID   | ✅   |
| PATCH  | `/users/:id`       | Atualiza dados de um usuário   | ✅   |
| DELETE | `/users/:id`       | Remove um usuário              | ✅   |

## Diferenciais de segurança

- Senhas persistidas com **bcryptjs** (hash + salt)
- `JwtAuthGuard` GLOBAL: todos os endpoints são protegidos por padrão
- Endpoints públicos explicitamente marcados com decorator `@Public()`
- Throttler para proteção de rate limit em nível de rota

## Observabilidade

- **Métricas HTTP:** `http_requests_total`, `http_request_duration_seconds` (via middleware)
- **Métricas de processo:** prefixo `users_service_`
  (ex: `users_service_process_resident_memory_bytes`, `users_service_nodejs_eventloop_lag_seconds`)
- **Scrape Prometheus:** Job `users-service` em `host.docker.internal:4005/metrics`

## Documentação técnica adicional

Specs do app em `docs/specs/` (se houver).
