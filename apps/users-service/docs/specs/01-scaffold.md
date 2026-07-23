# Spec: Scaffold do users-service

## Visão geral

Microsserviço responsável pelo gerenciamento de usuários do marketplace. Esta spec define apenas o **scaffold inicial** — a estrutura base do projeto, sem endpoints, autenticação ou lógica de negócio.

| Item | Valor |
|------|-------|
| Nome do serviço | `users-service` |
| Porta HTTP | `4001` |
| Banco de dados | PostgreSQL 15 |
| Porta do banco (host) | `5433` |
| Nome do database | `users_db` |
| Stack | NestJS + PostgreSQL + pacotes do monorepo (`@repo/biome-config`, `@repo/typescript-config`) |

---

## 1. Requisitos funcionais

### 1.1 Scaffold NestJS

- Projeto NestJS criado em `apps/users-service`, integrado ao turborepo do monorepo `marketplace`.
- Seguir o padrão dos serviços existentes (`checkout-service`, `payments-service`):
  - Adapter **Fastify** (não Express).
  - Scripts: `build`, `start`, `start:dev`, `start:debug`, `start:prod`, `lint`, `docker`.
  - Linter **Biome** via `@repo/biome-config` (sem ESLint/Prettier).
  - TypeScript configurado com `tsconfig.json` e `tsconfig.build.json` alinhados aos demais serviços.
- Dependências mínimas do scaffold:
  - `@nestjs/common`, `@nestjs/core`, `@nestjs/config`, `@nestjs/platform-fastify`
  - `@nestjs/typeorm`, `typeorm`, `pg`
  - `class-validator`, `class-transformer`
  - `reflect-metadata`, `rxjs`
- Ao subir em modo desenvolvimento, o serviço deve escutar na porta definida pela variável `PORT` (padrão `4001`) e registrar log de inicialização identificando o serviço.

### 1.2 Docker Compose com PostgreSQL 15

- Arquivo `docker-compose.yml` na raiz do `users-service`.
- Serviço de banco usando imagem `postgres:15-alpine`.
- Container nomeado de forma consistente com o serviço (ex.: `users-service-db`).
- Variáveis de ambiente do container derivadas de `DB_NAME`, `DB_USER` e `DB_PASS`, com defaults compatíveis com o `.env.example`.
- Porta mapeada do host para o container: `${DB_PORT:-5433}:5432`.
- Volume persistente para dados do PostgreSQL.
- Rede dedicada ao serviço.
- Política de restart `unless-stopped`.
- Healthcheck com `pg_isready` validando usuário e database configurados.
- Script `docker` no `package.json` que executa `docker compose down && docker compose up -d`.

### 1.3 Configuração de conexão com banco de dados

- Módulo de configuração global (`ConfigModule.forRoot({ isGlobal: true })`).
- Arquivo de configuração dedicado para o TypeORM (ex.: `src/config/database.config.ts`).
- Conexão PostgreSQL parametrizada exclusivamente por variáveis de ambiente:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- Descoberta automática de entidades pelo padrão `**/*.entity{.ts,.js}`.
- Em ambiente de desenvolvimento (`NODE_ENV=development`):
  - `synchronize: true` (criação/atualização automática de schema).
  - `logging: true`.
- Em outros ambientes:
  - `synchronize: false`.
  - `logging: false`.

### 1.4 Módulo de usuário básico

- Estrutura de módulo dedicada em `src/users/` contendo:
  - `users.module.ts` — módulo NestJS registrando a entidade via `TypeOrmModule.forFeature`.
  - `entities/user.entity.ts` — entidade conforme seção 2.
- O módulo deve ser importado no `AppModule`.
- **Sem controllers** — nenhum endpoint HTTP exposto neste scaffold.
- **Sem services com lógica de negócio** — apenas a entidade e o registro no TypeORM.

### 1.5 ValidationPipe global

- Arquivo de configuração da aplicação (ex.: `src/config/app.config.ts`) aplicado no bootstrap.
- `ValidationPipe` global habilitado com:
  - `whitelist: true` — remove propriedades não decoradas.
  - `forbidNonWhitelisted: true` — rejeita propriedades extras.
  - `transform: true` — converte payloads para tipos dos DTOs.
- CORS habilitado.

### 1.6 Arquivos de ambiente

- `.env.example` documentando todas as variáveis necessárias (seção 3).
- `.env` local (não versionado) com os mesmos valores padrão para desenvolvimento.

---

## 2. Estrutura de dados

### 2.1 Entidade `User`

Tabela: `users`

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| `id` | UUID | PK, gerado automaticamente | Identificador único do usuário |
| `email` | string (varchar) | NOT NULL, UNIQUE | E-mail do usuário |
| `password` | string (varchar) | NOT NULL | Senha armazenada como hash (sem lógica de hash neste scaffold) |
| `firstName` | string (varchar) | NOT NULL | Primeiro nome |
| `lastName` | string (varchar) | NOT NULL | Sobrenome |
| `role` | enum | NOT NULL | Papel do usuário no marketplace |
| `status` | enum | NOT NULL, default `active` | Situação da conta |
| `createdAt` | timestamp | NOT NULL, gerado automaticamente | Data/hora de criação |
| `updatedAt` | timestamp | NOT NULL, atualizado automaticamente | Data/hora da última atualização |

### 2.2 Enums

**UserRole**

| Valor | Descrição |
|-------|-----------|
| `seller` | Vendedor |
| `buyer` | Comprador |

**UserStatus**

| Valor | Descrição |
|-------|-----------|
| `active` | Conta ativa (valor padrão) |
| `inactive` | Conta inativa |
| `pending` | Conta pendente de ativação |
| `blocked` | Conta bloqueada |

### 2.3 Estrutura de diretórios esperada (após implementação)

```
apps/users-service/
├── docker-compose.yml
├── .env.example
├── docs/
│   └── specs/
│       └── scaffold.md
├── src/
│   ├── config/
│   │   ├── app.config.ts
│   │   └── database.config.ts
│   ├── users/
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── users.module.ts
│   ├── app.module.ts
│   └── main.ts
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

---

## 3. Variáveis de ambiente

| Variável | Obrigatória | Default (dev) | Descrição |
|----------|-------------|---------------|-----------|
| `PORT` | Sim | `4001` | Porta HTTP do serviço |
| `NODE_ENV` | Sim | `development` | Ambiente de execução |
| `DB_HOST` | Sim | `localhost` | Host do PostgreSQL |
| `DB_PORT` | Sim | `5433` | Porta do PostgreSQL no host |
| `DB_USER` | Sim | `postgres` | Usuário do banco |
| `DB_PASS` | Sim | `postgres` | Senha do banco |
| `DB_NAME` | Sim | `users_db` | Nome do database |

---

## 4. Critérios de aceite

### Infraestrutura e projeto

- [ ] **CA-01** — O projeto existe em `apps/users-service` e é reconhecido pelo turborepo (`pnpm dev` / `turbo run start:dev` inclui o serviço).
- [ ] **CA-02** — `pnpm build` dentro do `users-service` compila sem erros.
- [ ] **CA-03** — `pnpm lint` executa o Biome sem erros no código do serviço.

### Docker e banco de dados

- [ ] **CA-04** — `pnpm docker` sobe o container PostgreSQL 15 sem erros.
- [ ] **CA-05** — O container fica healthy (healthcheck `pg_isready` passando).
- [ ] **CA-06** — É possível conectar ao banco em `localhost:5433` com database `users_db`.
- [ ] **CA-07** — Dados persistem após `docker compose down` e novo `docker compose up -d` (volume funcional).

### Aplicação e conexão

- [ ] **CA-08** — Com `.env` configurado e banco rodando, `pnpm start:dev` inicia o serviço na porta `4001`.
- [ ] **CA-09** — Log de inicialização confirma que o serviço subiu (ex.: "Users Service running on...").
- [ ] **CA-10** — TypeORM conecta ao PostgreSQL usando as variáveis `DB_*` (sem credenciais hardcoded).
- [ ] **CA-11** — Em `NODE_ENV=development`, a tabela `users` é criada automaticamente via `synchronize`.

### Entidade User

- [ ] **CA-12** — Tabela `users` contém todas as colunas definidas na seção 2.1.
- [ ] **CA-13** — Coluna `id` é UUID com geração automática.
- [ ] **CA-14** — Coluna `email` possui constraint UNIQUE.
- [ ] **CA-15** — Coluna `role` aceita apenas `seller` e `buyer`.
- [ ] **CA-16** — Coluna `status` aceita apenas `active`, `inactive`, `pending` e `blocked`, com default `active`.
- [ ] **CA-17** — Colunas `createdAt` e `updatedAt` são preenchidas/atualizadas automaticamente.

### Módulo e escopo

- [ ] **CA-18** — `UsersModule` está registrado no `AppModule`.
- [ ] **CA-19** — Não existem controllers de usuário (nenhum endpoint CRUD exposto).
- [ ] **CA-20** — `ValidationPipe` global está habilitado com `whitelist`, `forbidNonWhitelisted` e `transform`.

---

## 5. Fora de escopo

Esta spec **não** inclui:

- Endpoints HTTP (CRUD, health check dedicado, etc.)
- Autenticação e autorização (JWT, Passport, guards)
- Hash de senha (bcrypt) — o campo `password` existe na entidade, mas sem lógica de criptografia
- DTOs de entrada/saída
- Services com regras de negócio
- Integração com RabbitMQ ou outros microsserviços
- Migrations TypeORM (usa `synchronize` em dev)
- Testes automatizados
- Integração com `@repo/utils`

Esses itens serão tratados em specs futuras.
