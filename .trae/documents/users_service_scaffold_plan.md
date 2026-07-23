# Plano de Desenvolvimento: Scaffold do users-service

## Conclusão da Pesquisa do Repositório
O repositório é um monorepo com Turborepo, contendo serviços como `checkout-service` e `payments-service` que usam:
- NestJS com Fastify Adapter
- PostgreSQL + TypeORM
- Biome para linting
- Docker Compose para bancos de dados locais
- Configuração centralizada via `@repo/biome-config` e `@repo/typescript-config`

O `users-service` já foi inicializado como projeto NestJS, mas ainda não implementa o scaffold completo conforme a especificação.

## Arquivos e Módulos a Editar/Criar

### 1. Arquivos na Raiz do users-service
- Criar `docker-compose.yml`
- Criar `.env` (copiar de `.env.example`)

### 2. Arquivos de Configuração
- Criar `src/config/app.config.ts`
- Criar `src/config/database.config.ts`

### 3. Módulo de Usuários
- Criar diretório `src/users/`
- Criar `src/users/users.module.ts`
- Criar `src/users/entities/user.entity.ts`
  - Incluir enums `UserRole` e `UserStatus`

### 4. Arquivos Principais
- Editar `src/main.ts`
- Editar `src/app.module.ts`
- Manter `src/app.controller.ts` e `src/app.service.ts` (opcional, mas não obrigatório pela spec)

## Passos de Modificação

1. **Criar `docker-compose.yml`**:
   - Usar imagem `postgres:15-alpine`
   - Nome do container: `users-service-db`
   - Variáveis de ambiente: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` com padrões correspondentes a `.env.example`
   - Porta host: `${DB_PORT:-5433}:5432`
   - Volume para dados: `./users_db_data`
   - Rede dedicada e healthcheck

2. **Criar arquivos de configuração**:
   - `app.config.ts`: configurar ValidationPipe e CORS
   - `database.config.ts`: conexão com PostgreSQL via variáveis de ambiente

3. **Criar módulo de usuários e entidade User**:
   - Definir enums `UserRole` (seller, buyer) e `UserStatus` (active, inactive, pending, blocked)
   - Implementar entidade User com campos id (UUID), email, password, firstName, lastName, role, status, createdAt, updatedAt

4. **Atualizar arquivos principais**:
   - `main.ts`: usar FastifyAdapter, Logger, appConfig, porta 4001
   - `app.module.ts`: importar ConfigModule, TypeOrmModule, UsersModule

5. **Criar .env local**: copiar de .env.example

## Potenciais Dependências/Considerações
- Nenhuma nova dependência precisa ser adicionada (package.json já tem tudo necessário)
- Deve seguir exatamente o padrão dos serviços existentes (checkout-service, payments-service)

## Tratamento de Riscos
- Verificar se o diretório `users_db_data` é adicionado ao .gitignore (mas spec não menciona, então vamos deixar como está)
- Garantir que as portas não colidam com outros serviços (users-service usa 4001 para app, 5433 para DB)

## Critérios de Aceitação (verificação após implementação)
- CA-01 a CA-20 conforme definido na spec `01-scaffold.md`
