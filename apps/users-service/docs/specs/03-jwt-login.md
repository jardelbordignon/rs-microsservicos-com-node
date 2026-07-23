# Spec: Login com JWT

## Visão geral

Funcionalidade de login de usuários no marketplace com autenticação baseada em JWT.

| Item | Valor |
|------|-------|
| Serviço | `users-service` |
| Endpoint | `POST /users/login` |
| Autenticação | Não (público) |

---

## 1. Requisitos funcionais

### 1.1 Endpoint de login

- Rota `POST /users/login` exposta publicamente.
- Aceita payload JSON com e-mail e senha.
- Retorna status `200 OK` em caso de sucesso, com os dados do usuário (exceto senha) e token JWT.
- Retorna status `401 Unauthorized` para credenciais inválidas ou conta inativa.

### 1.2 Validação de dados de entrada

- **E-mail**: obrigatório, deve ser um e-mail válido.
- **Senha**: obrigatória, mínimo 6 caracteres.
- Validação deve retornar mensagens de erro claras.

### 1.3 Autenticação do usuário

1. Buscar o usuário no banco de dados pelo e-mail fornecido.
2. Se o usuário não for encontrado, retornar mensagem "Credenciais inválidas".
3. Comparar a senha fornecida com o hash armazenado usando bcryptjs.
4. Se a senha não corresponder, retornar mensagem "Credenciais inválidas".
5. Verificar se o status do usuário é "active".
6. Se o status não for "active", retornar mensagem "Conta inativa".

### 1.4 Geração do token JWT

- Se todas as validações forem aprovadas, gerar um token JWT.
- Configurar o secret do JWT via variável de ambiente `JWT_SECRET`.
- Token deve expirar em 24 horas.
- Payload do token deve conter:
  - `sub`: ID do usuário (UUID)
  - `email`: e-mail do usuário
  - `role`: papel do usuário ("seller" ou "buyer")

### 1.5 Resposta da API

- A resposta **nunca** deve conter o campo `password`.
- Resposta de sucesso deve ter formato `{ user: {...}, token: "..." }`.

---

## 2. Estrutura de dados

### 2.1 Payload de entrada (DTO de login)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `email` | string | Sim | E-mail do usuário (válido) |
| `password` | string | Sim | Senha (mínimo 6 caracteres) |

### 2.2 Payload JWT

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `sub` | string | ID do usuário (UUID) |
| `email` | string | E-mail do usuário |
| `role` | string | Papel do usuário ("seller" ou "buyer") |
| `iat` | number | Timestamp de emissão (gerado automaticamente) |
| `exp` | number | Timestamp de expiração (24 horas após emissão) |

### 2.3 Resposta de sucesso (200 OK)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user` | objeto | Dados do usuário (sem password) |
| `user.id` | UUID | Identificador único do usuário |
| `user.email` | string | E-mail do usuário |
| `user.firstName` | string | Primeiro nome |
| `user.lastName` | string | Sobrenome |
| `user.role` | string | Papel do usuário |
| `user.status` | string | Situação da conta |
| `user.createdAt` | timestamp | Data/hora de criação |
| `user.updatedAt` | timestamp | Data/hora da última atualização |
| `token` | string | Token JWT |

### 2.4 Resposta de erro (401 Unauthorized)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `message` | string | Mensagem de erro: "Credenciais inválidas" ou "Conta inativa" |
| `statusCode` | number | Código de status HTTP (401) |
| `error` | string | Tipo de erro ("Unauthorized") |

---

## 3. Diagrama de Fluxo de Login

```
Início
  ↓
Receber requisição POST /users/login
  ↓
Validar dados de entrada (DTO)
  ↓
Dados válidos? → Não → Retornar 400 Bad Request com erros de validação
  ↓ Sim
Buscar usuário pelo e-mail no banco
  ↓
Usuário existe? → Não → Retornar 401 Unauthorized com "Credenciais inválidas"
  ↓ Sim
Comparar senha fornecida com hash armazenado
  ↓
Senha válida? → Não → Retornar 401 Unauthorized com "Credenciais inválidas"
  ↓ Sim
Verificar se status do usuário é "active"
  ↓
Status ativo? → Não → Retornar 401 Unauthorized com "Conta inativa"
  ↓ Sim
Gerar token JWT com expiração de 24 horas
  ↓
Retornar 200 OK com usuário (sem password) e token
  ↓
Fim
```

---

## 4. Critérios de aceite

### Validação de dados
- [ ] **CA-01** — Requisição sem campos obrigatórios retorna `400 Bad Request`.
- [ ] **CA-02** — E-mail com formato inválido retorna `400 Bad Request`.
- [ ] **CA-03** — Senha com menos de 6 caracteres retorna `400 Bad Request`.

### Autenticação
- [ ] **CA-04** — E-mail não cadastrado retorna `401 Unauthorized` com "Credenciais inválidas".
- [ ] **CA-05** — Senha incorreta retorna `401 Unauthorized` com "Credenciais inválidas".
- [ ] **CA-06** — Conta inativa retorna `401 Unauthorized` com "Conta inativa".
- [ ] **CA-07** — Login com credenciais válidas e conta ativa retorna `200 OK`.

### Token JWT
- [ ] **CA-08** — Token JWT é gerado e retornado na resposta de sucesso.
- [ ] **CA-09** — Token JWT expira em 24 horas.
- [ ] **CA-10** — Payload do token contém `sub` (ID do usuário), `email` e `role`.
- [ ] **CA-11** — Token JWT é assinado com o secret da variável de ambiente `JWT_SECRET`.

### Resposta da API
- [ ] **CA-12** — Resposta de sucesso contém os dados do usuário sem o campo `password`.
- [ ] **CA-13** — Resposta de sucesso tem o formato `{ user: {...}, token: "..." }`.

---

## 5. Fora de escopo

- Proteção de rotas (guards)
- Refresh tokens
- Sessions
- Qualquer outro mecanismo além do JWT básico
