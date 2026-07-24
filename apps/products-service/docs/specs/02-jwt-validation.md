# Spec: Validação de JWT no products-service

## Visão geral

Esta spec define a implementação da autenticação baseada em JWT no `products-service`, seguindo exatamente o padrão já adotado no `users-service`. O `products-service` não é responsável por login ou registro: ele apenas valida tokens emitidos pelo `users-service` e protege suas rotas com autenticação global.

| Item | Valor |
|------|-------|
| Serviço | `products-service` |
| Porta HTTP | `4004` |
| Objetivo | Validar tokens JWT e proteger rotas do serviço |
| Serviço emissor do token | `users-service` |
| Payload esperado | `{ sub: UUID, email: string, role: "seller" \| "buyer" }` |
| Secret JWT | Compartilhada via `JWT_SECRET` |
| Dependências | `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt` |

## 1. Requisitos funcionais

### 1.1 Módulo de autenticação

- Criar um `AuthModule` dedicado no `products-service`.
- O módulo deve concentrar os artefatos de autenticação JWT do serviço:
  - strategy de validação;
  - guard de autenticação;
  - decorator para rotas públicas.
- A organização e a abordagem devem seguir exatamente o padrão adotado no `users-service`, mantendo consistência entre os microsserviços.

### 1.2 JwtStrategy

- Criar uma `JwtStrategy` responsável por validar tokens recebidos pelo `products-service`.
- A strategy deve:
  - extrair o token do header `Authorization` no formato `Bearer <token>`;
  - validar automaticamente a assinatura do token;
  - validar automaticamente a expiração do token;
  - usar o mesmo `JWT_SECRET` compartilhado com o `users-service`;
  - considerar como válido o payload com os campos `sub`, `email` e `role`;
  - disponibilizar em `req.user` um objeto contendo:
    - `id` derivado de `sub`;
    - `email`;
    - `role`.

### 1.3 JwtAuthGuard

- Criar um `JwtAuthGuard` para proteger as rotas do `products-service`.
- O guard deve:
  - aplicar autenticação JWT por padrão em todas as rotas;
  - verificar antes se a rota ou o controller foi marcado como público;
  - permitir acesso sem token quando a rota estiver marcada como pública;
  - exigir token válido nas demais rotas.
- O `JwtAuthGuard` deve ser registrado como guard global da aplicação via `APP_GUARD`, seguindo o mesmo padrão do `users-service`.

### 1.4 Decorator @Public()

- Criar um decorator `@Public()` para marcar rotas que não exigem autenticação.
- O decorator deve ser usado como mecanismo oficial para liberar acesso sem token no `products-service`.
- A comunicação entre `@Public()` e `JwtAuthGuard` deve seguir a mesma convenção de metadata já utilizada no `users-service`.

### 1.5 Escopo do products-service

- Não criar endpoints de autenticação no `products-service`.
- Não implementar login.
- Não implementar registro.
- O serviço deve apenas aceitar tokens emitidos pelo `users-service` e validar o acesso às suas próprias rotas.

### 1.6 Tipagem do usuário autenticado

- Definir e utilizar uma tipagem para o usuário autenticado disponível em `req.user`.
- A estrutura da tipagem deve seguir o mesmo conceito usado no `api-gateway/src/@types/global.d.ts`.
- A tipagem deve refletir apenas os dados disponibilizados pelo token validado:
  - `id`;
  - `email`;
  - `role`.

## 2. Fluxo esperado de autenticação

1. Uma requisição chega ao `products-service`.
2. O guard global verifica se a rota ou controller está marcado com `@Public()`.
3. Se estiver público, a requisição segue sem autenticação.
4. Se não estiver público, o token é lido do header `Authorization`.
5. O token é validado com base no secret compartilhado e na expiração.
6. Se o token for válido, os dados do payload são convertidos para o formato esperado em `req.user`.
7. O controller ou service pode usar `req.user.id`, `req.user.email` e `req.user.role`.

## 3. Variáveis de ambiente relevantes

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `JWT_SECRET` | Sim | Secret compartilhado com o `users-service` para validação do token |

## 4. Respostas esperadas

- **401 Unauthorized** para rotas protegidas quando:
  - não houver token no header `Authorization`;
  - o token estiver expirado;
  - a assinatura do token for inválida;
  - o formato do token estiver incorreto.
- **Resposta normal da rota** quando:
  - a rota estiver marcada com `@Public()`;
  - a requisição trouxer um token válido.

## 5. Critérios de aceite

- [ ] **CA-01** Existe um `AuthModule` no `products-service` contendo os artefatos necessários para validação JWT.
- [ ] **CA-02** O padrão adotado no `products-service` é equivalente ao usado no `users-service` para `JwtStrategy`, `JwtAuthGuard` e `@Public()`.
- [ ] **CA-03** O token é lido do header `Authorization` no formato `Bearer <token>`.
- [ ] **CA-04** A assinatura do token é validada usando o `JWT_SECRET` compartilhado entre os serviços.
- [ ] **CA-05** A expiração do token é validada automaticamente.
- [ ] **CA-06** Quando o token é válido, `req.user` contém `id`, `email` e `role`.
- [ ] **CA-07** O campo `id` disponível em `req.user` corresponde ao valor de `sub` presente no payload do token.
- [ ] **CA-08** O `JwtAuthGuard` está registrado como `APP_GUARD` globalmente no `products-service`.
- [ ] **CA-09** Rotas não marcadas com `@Public()` exigem autenticação JWT.
- [ ] **CA-10** Rotas marcadas com `@Public()` podem ser acessadas sem token.
- [ ] **CA-11** Requisições para rotas protegidas sem token recebem `401 Unauthorized`.
- [ ] **CA-12** Requisições para rotas protegidas com token expirado recebem `401 Unauthorized`.
- [ ] **CA-13** Requisições para rotas protegidas com token assinado com secret inválido recebem `401 Unauthorized`.
- [ ] **CA-14** Existe tipagem explícita para o usuário autenticado no request, alinhada ao padrão do `api-gateway`.
- [ ] **CA-15** O `products-service` continua sem endpoints de login e registro após a implementação desta spec.

## 6. Fora de escopo

Esta spec não inclui:

- criação de endpoints de login;
- criação de endpoints de registro;
- emissão de tokens JWT;
- refresh token;
- `RoleGuard`;
- guard de sessão;
- definição de políticas de autorização por perfil;
- regras de negócio de produto;
- integração entre serviços para introspecção remota de token.
