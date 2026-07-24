# Spec: Scaffold do products-service

## Visão geral

Esta spec define o scaffold inicial do `products-service` no monorepo `marketplace`, seguindo o padrão dos microsserviços existentes e tomando como principal referência o `users-service`. O objetivo é disponibilizar a base mínima para evolução futura do catálogo de produtos, sem incluir endpoints, autenticação ou regras de negócio.

| Item | Valor |
|------|-------|
| Nome do serviço | `products-service` |
| Localização | `apps/products-service` |
| Porta HTTP | `4004` |
| Banco de dados | PostgreSQL 15 |
| Porta do banco no host | `5434` |
| Database | `products_db` |
| Stack | NestJS + TypeORM + PostgreSQL 15 |

## 1. Requisitos funcionais

### 1.1 Scaffold NestJS

- Criar o `products-service` como um projeto NestJS independente dentro do monorepo.
- Alinhar o scaffold ao padrão já usado nos demais serviços:
  - adapter Fastify;
  - scripts essenciais para build, execução em desenvolvimento, execução em produção, lint e Docker;
  - configuração compatível com o workspace usando `pnpm` e `turbo`.
- Incluir apenas as dependências necessárias para esta etapa:
  - NestJS base;
  - `@nestjs/config`;
  - `@nestjs/typeorm`;
  - `typeorm`;
  - `pg`;
  - `class-validator`;
  - `class-transformer`.
- Garantir que o serviço inicialize usando a porta definida em variável de ambiente, com default `4004`.

### 1.2 Docker Compose com PostgreSQL 15

- Criar um `docker-compose.yml` na raiz do `products-service`.
- Definir um container PostgreSQL 15 dedicado ao serviço.
- Configurar o banco com:
  - nome `products_db`;
  - porta `5434` no host;
  - volume persistente;
  - rede dedicada;
  - healthcheck para validar disponibilidade do banco.
- Manter os parâmetros do container dependentes de variáveis de ambiente, com valores padrão compatíveis com o ambiente local de desenvolvimento.

### 1.3 Configuração de banco via variáveis de ambiente

- Habilitar carregamento global de configuração da aplicação.
- Configurar a conexão do TypeORM exclusivamente por variáveis de ambiente.
- Garantir que o serviço descubra entidades automaticamente.
- Em ambiente de desenvolvimento, permitir sincronização automática de schema e logs do TypeORM.
- Fora do ambiente de desenvolvimento, desabilitar sincronização automática e logs detalhados.

### 1.4 Estrutura base do domínio

- Criar a organização de domínio dentro de `src/domain`, seguindo o padrão de módulos usado como referência no `api-gateway`.
- Criar um módulo básico de produtos, sem endpoints implementados.
- Registrar o módulo de produtos no módulo raiz da aplicação.
- Preparar controller e service apenas como parte do scaffold estrutural, sem expor operações HTTP nem conter lógica de negócio.

### 1.5 ValidationPipe global

- Habilitar `ValidationPipe` global na inicialização da aplicação.
- Aplicar as opções de segurança e transformação esperadas para os próximos incrementos:
  - `whitelist`;
  - `forbidNonWhitelisted`;
  - `transform`.
- Habilitar CORS no bootstrap da aplicação.

## 2. Estrutura de dados

### 2.1 Entidade Product

Tabela: `products`

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| `id` | UUID | chave primária, gerado automaticamente | Identificador único do produto |
| `name` | string | obrigatório, máximo de 255 caracteres | Nome do produto |
| `description` | text | obrigatório | Descrição do produto |
| `price` | decimal (10,2) | obrigatório | Preço do produto |
| `stock` | int | obrigatório, default `0` | Quantidade disponível em estoque |
| `sellerId` | UUID | obrigatório, sem chave estrangeira | Identificador do vendedor no `users-service` |
| `isActive` | boolean | obrigatório, default `true` | Indica se o produto está ativo no catálogo |
| `createdAt` | timestamp | preenchido automaticamente | Data/hora de criação |
| `updatedAt` | timestamp | atualizado automaticamente | Data/hora da última atualização |

## 3. Variáveis de ambiente necessárias

| Variável | Obrigatória | Default local | Descrição |
|----------|-------------|---------------|-----------|
| `PORT` | Sim | `4004` | Porta HTTP do `products-service` |
| `DB_HOST` | Sim | `localhost` | Host do PostgreSQL |
| `DB_PORT` | Sim | `5434` | Porta do PostgreSQL no host |
| `DB_USER` | Sim | `postgres` | Usuário do banco |
| `DB_PASS` | Sim | `postgres` | Senha do banco |
| `DB_NAME` | Sim | `products_db` | Nome do database |

## 4. Critérios de aceite

- [ ] **CA-01** O diretório `apps/products-service` existe e é reconhecido pelo workspace.
- [ ] **CA-02** O serviço possui os arquivos essenciais de scaffold: configuração Nest, configuração TypeScript, `docker-compose.yml`, `.env.example` e estrutura de `src`.
- [ ] **CA-03** O `products-service` utiliza Fastify como adapter HTTP.
- [ ] **CA-04** O serviço possui as dependências mínimas de NestJS, TypeORM, PostgreSQL, configuração e validação previstas nesta spec.
- [ ] **CA-05** O `docker-compose.yml` sobe um PostgreSQL 15 acessível pela porta `5434` no host.
- [ ] **CA-06** O banco criado pelo Docker Compose utiliza o database `products_db`.
- [ ] **CA-07** A conexão com o banco depende apenas das variáveis `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS` e `DB_NAME`.
- [ ] **CA-08** O bootstrap da aplicação habilita `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted` e `transform`.
- [ ] **CA-09** Existe um módulo básico de produtos registrado na aplicação, sem operações HTTP implementadas.
- [ ] **CA-10** A entidade `Product` existe com exatamente os campos descritos na seção 2.1.
- [ ] **CA-11** O campo `sellerId` é armazenado apenas como UUID, sem relacionamento FK no banco local.
- [ ] **CA-12** O serviço inicia por padrão na porta `4004` quando nenhuma porta é informada externamente.

## 5. Fora de escopo

Esta spec não inclui:

- criação de endpoints REST;
- autenticação e autorização;
- integração com `users-service`, `api-gateway`, RabbitMQ ou qualquer outro microsserviço;
- DTOs de entrada e saída para operações de produto;
- regras de negócio de catálogo;
- paginação, filtros, busca ou ordenação;
- testes automatizados;
- migrations.
