# Spec: Integração do Users Service com o API Gateway

## Visão geral

Finalizar a integração entre o `users-service` e o `api-gateway` para garantir que o fluxo de autenticação, consulta de usuários e health check funcione de ponta a ponta através do gateway.

| Item | Valor |
|------|-------|
| Serviço principal | `users-service` |
| Serviço integrador | `api-gateway` |
| Fluxo externo esperado | Requisições entram pelo gateway e são encaminhadas ao `users-service` |
| Autenticação | JWT |

---

## 1. Requisitos funcionais no users-service

### 1.1 Endpoint `GET /users/validate-token`

- Deve existir um endpoint protegido em `GET /users/validate-token`.
- O endpoint deve exigir token JWT válido.
- O endpoint deve utilizar o usuário autenticado já disponível no contexto da requisição.
- O endpoint deve retornar os dados do usuário autenticado com o seguinte formato:
  - `userId`
  - `email`
  - `role`
- O endpoint será consumido internamente pelo `api-gateway` para validação de tokens.
- A resposta não deve incluir outros dados do usuário além dos campos necessários para validação.

### 1.2 Endpoint `GET /health`

- Deve existir um endpoint público em `GET /health`.
- O endpoint não deve exigir autenticação.
- O endpoint deve retornar o payload `{ status: "ok", service: "users-service" }`.
- O endpoint será utilizado pelo health check do `api-gateway`.

### 1.3 Swagger / OpenAPI

- O `users-service` deve expor documentação automática acessível em `/doc`.
- A documentação deve usar o título `Users Service`.
- A documentação deve usar a versão `1.0`.
- A documentação deve incluir suporte a autenticação Bearer.
- A interface de documentação deve usar o Scalar, seguindo o mesmo padrão visual e funcional utilizado no `api-gateway`.
- Os endpoints públicos e protegidos devem estar refletidos corretamente na documentação.

### 1.4 Compatibilidade contratual com o gateway

- O `users-service` deve atender corretamente às rotas encaminhadas pelo `api-gateway`.
- O fluxo externo via gateway deve suportar as rotas:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /users/profile`
  - `GET /users/sellers`
- A integração deve garantir consistência entre as rotas expostas pelo gateway e as rotas efetivamente atendidas pelo `users-service`.

---

## 2. Requisitos funcionais no api-gateway

### 2.1 Configuração de serviço

- O `api-gateway` deve estar configurado com `USERS_SERVICE_URL=http://localhost:4005` no ambiente.
- A configuração deve apontar para a instância correta do `users-service`.

### 2.2 Encaminhamento de rotas

- O gateway deve encaminhar corretamente as rotas `/auth/*` para o `users-service`.
- O gateway deve encaminhar corretamente as rotas `/users/*` para o `users-service`.
- O gateway não deve alterar o contrato funcional esperado dessas rotas.

### 2.3 Repasse de cabeçalhos

- O header `Authorization` deve ser repassado do gateway para o `users-service` nas rotas protegidas.
- O token JWT recebido pelo gateway deve chegar íntegro ao `users-service`.

### 2.4 Reuso da infraestrutura existente

- A integração deve reutilizar a infraestrutura já existente de proxy, circuit breaker, retry, timeout e guards do gateway.
- Não deve haver alteração do mecanismo atual de proxy ou guards no gateway.

---

## 3. Fluxo completo esperado via gateway

### 3.1 Registro

1. O cliente envia `POST /auth/register` para o gateway.
2. O gateway encaminha a requisição ao `users-service`.
3. O `users-service` registra o usuário.
4. O cliente recebe a resposta de registro através do gateway.

### 3.2 Login

1. O cliente envia `POST /auth/login` para o gateway.
2. O gateway encaminha a requisição ao `users-service`.
3. O `users-service` autentica o usuário e retorna o token JWT.
4. O cliente recebe o token através do gateway.

### 3.3 Consulta de perfil

1. O cliente envia `GET /users/profile` para o gateway com header `Authorization`.
2. O gateway valida o token de acordo com sua infraestrutura de autenticação.
3. O gateway encaminha a requisição autenticada ao `users-service`.
4. O `users-service` retorna o perfil do usuário autenticado.
5. O cliente recebe a resposta através do gateway.

### 3.4 Listagem de sellers

1. O cliente envia `GET /users/sellers` para o gateway com header `Authorization`.
2. O gateway valida o token de acordo com sua infraestrutura de autenticação.
3. O gateway encaminha a requisição autenticada ao `users-service`.
4. O `users-service` retorna a lista de sellers ativos.
5. O cliente recebe a resposta através do gateway.

### 3.5 Validação interna de token

1. O gateway precisa validar um token JWT.
2. O gateway chama `GET /users/validate-token` no `users-service`.
3. O `users-service` valida o token usando sua proteção JWT.
4. O `users-service` retorna `userId`, `email` e `role`.
5. O gateway usa essa resposta para concluir a validação interna.

### 3.6 Health check

1. O gateway executa a verificação de saúde do `users-service`.
2. O gateway chama `GET /health` no `users-service`.
3. O `users-service` responde com `{ status: "ok", service: "users-service" }`.
4. O gateway considera o serviço saudável quando a resposta esperada for recebida com sucesso.

---

## 4. Respostas esperadas

### 4.1 `GET /users/validate-token`

- `200 OK`: retorna `{ userId, email, role }`
- `401 Unauthorized`: token ausente, inválido ou expirado

### 4.2 `GET /health`

- `200 OK`: retorna `{ status: "ok", service: "users-service" }`

### 4.3 Fluxos via gateway

- `POST /auth/register`: resposta de sucesso de registro
- `POST /auth/login`: resposta de sucesso com token JWT
- `GET /users/profile`: resposta de sucesso com perfil do usuário autenticado
- `GET /users/sellers`: resposta de sucesso com lista de sellers
- `401 Unauthorized`: quando o token estiver ausente, inválido ou expirado nas rotas protegidas

---

## 5. Critérios de aceite

### Users-service
- [ ] **CA-01** — `GET /users/validate-token` existe e exige JWT válido.
- [ ] **CA-02** — `GET /users/validate-token` retorna apenas `userId`, `email` e `role`.
- [ ] **CA-03** — `GET /health` existe, é público e retorna `{ status: "ok", service: "users-service" }`.
- [ ] **CA-04** — A documentação OpenAPI do `users-service` está acessível em `/doc`.
- [ ] **CA-05** — A documentação usa título `Users Service`, versão `1.0` e Bearer Auth.
- [ ] **CA-06** — A interface de documentação usa Scalar.

### API Gateway
- [ ] **CA-07** — O `api-gateway` está configurado com `USERS_SERVICE_URL=http://localhost:4005`.
- [ ] **CA-08** — O gateway encaminha corretamente as rotas `/auth/*` para o `users-service`.
- [ ] **CA-09** — O gateway encaminha corretamente as rotas `/users/*` para o `users-service`.
- [ ] **CA-10** — O header `Authorization` é repassado corretamente para o `users-service`.

### Fluxo ponta a ponta
- [ ] **CA-11** — `POST /auth/register` funciona de ponta a ponta via gateway.
- [ ] **CA-12** — `POST /auth/login` funciona de ponta a ponta via gateway e retorna token JWT.
- [ ] **CA-13** — `GET /users/profile` funciona de ponta a ponta via gateway com token válido.
- [ ] **CA-14** — `GET /users/sellers` funciona de ponta a ponta via gateway com token válido.
- [ ] **CA-15** — Requisições protegidas sem token ou com token inválido retornam `401 Unauthorized`.
- [ ] **CA-16** — O fluxo completo pode ser validado via `curl` ou Postman passando exclusivamente pelo gateway.

---

## 6. Fora de escopo

- Alteração da infraestrutura de proxy do gateway
- Alteração dos guards existentes do gateway
- Session management
- Refresh tokens
- Novos mecanismos de autenticação
- Mudanças de domínio fora da integração entre `users-service` e `api-gateway`
