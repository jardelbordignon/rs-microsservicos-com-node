
# Spec: Registro de Usuários

## Visão geral

Funcionalidade de registro de novos usuários no marketplace, com validação de dados, hash de senha e persistência no banco de dados.

| Item | Valor |
|------|-------|
| Serviço | `users-service` |
| Endpoint | `POST /auth/register` |
| Autenticação | Não (público) |

---

## 1. Requisitos funcionais

### 1.1 Módulo de autenticação

- Criar `AuthModule` contendo controller e service.
- O módulo deve importar o `UsersModule` para acesso à entidade User.

### 1.2 Endpoint de registro

- Rota `POST /auth/register` exposta publicamente.
- Aceita payload JSON com dados do usuário.
- Retorna status `201 Created` em caso de sucesso, com os dados do usuário criado (exceto senha).
- Retorna status `400 Bad Request` para dados inválidos.
- Retorna status `409 Conflict` para e-mail já cadastrado.

### 1.3 Validação de dados de entrada

- **E-mail**: obrigatório, deve ser um e-mail válido.
- **Senha**: obrigatória, mínimo 6 caracteres.
- **Primeiro nome**: obrigatório, máximo 100 caracteres.
- **Sobrenome**: obrigatório, máximo 100 caracteres.
- **Papel (role)**: obrigatório, deve ser "seller" ou "buyer".
- Validação deve retornar mensagens de erro claras.

### 1.4 Verificação de e-mail único

- Antes de cadastrar o usuário, verificar se o e-mail já existe no banco de dados.
- Se o e-mail já existir, retornar erro 409 (Conflict).

### 1.5 Hash de senha

- Senha do usuário **não** armazenada em texto plano.
- Usar `bcryptjs` para hash da senha com 10 salt rounds.

### 1.6 Persistência do usuário

- Usuário criado com status padrão `active`.
- Campos `createdAt` e `updatedAt` preenchidos automaticamente.

### 1.7 Resposta da API

- A resposta **nunca** deve conter o campo `password`.

---

## 2. Estrutura de dados

### 2.1 Payload de entrada (DTO de criação)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `email` | string | Sim | E-mail do usuário (válido) |
| `password` | string | Sim | Senha (mínimo 6 caracteres) |
| `firstName` | string | Sim | Primeiro nome (máximo 100 caracteres) |
| `lastName` | string | Sim | Sobrenome (máximo 100 caracteres) |
| `role` | string | Sim | Papel do usuário ("seller" ou "buyer") |

### 2.2 Resposta de sucesso (201 Created)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do usuário |
| `email` | string | E-mail do usuário |
| `firstName` | string | Primeiro nome |
| `lastName` | string | Sobrenome |
| `role` | string | Papel do usuário |
| `status` | string | Situação da conta |
| `createdAt` | timestamp | Data/hora de criação |
| `updatedAt` | timestamp | Data/hora da última atualização |

---

## 3. Diagrama de Fluxo de Registro

```
Início
  ↓
Receber requisição POST /auth/register
  ↓
Validar dados de entrada (DTO)
  ↓
Dados válidos? → Não → Retornar 400 Bad Request com erros de validação
  ↓ Sim
Verificar se e-mail já existe no banco
  ↓
E-mail existe? → Sim → Retornar 409 Conflict
  ↓ Não
Hash da senha com bcryptjs (10 rounds)
  ↓
Criar novo usuário no banco (status = active)
  ↓
Retornar 201 Created com dados do usuário (sem password)
  ↓
Fim
```

---

## 4. Critérios de aceite

### Validação de dados
- [ ] **CA-01** — Requisição sem campos obrigatórios retorna `400 Bad Request`.
- [ ] **CA-02** — E-mail com formato inválido retorna `400 Bad Request`.
- [ ] **CA-03** — Senha com menos de 6 caracteres retorna `400 Bad Request`.
- [ ] **CA-04** — Primeiro nome com mais de 100 caracteres retorna `400 Bad Request`.
- [ ] **CA-05** — Sobrenome com mais de 100 caracteres retorna `400 Bad Request`.
- [ ] **CA-06** — Role com valor diferente de "seller" ou "buyer" retorna `400 Bad Request`.
- [ ] **CA-07** — Validação retorna mensagens de erro claras.

### Verificação de e-mail único
- [ ] **CA-08** — E-mail já cadastrado retorna `409 Conflict`.

### Funcionalidade de registro
- [ ] **CA-09** — Usuário é criado com sucesso e retorna `201 Created`.
- [ ] **CA-10** — Senha armazenada no banco é um hash bcryptjs (não texto plano).
- [ ] **CA-11** — Status padrão do usuário é `active`.
- [ ] **CA-12** — Resposta de sucesso não contém o campo `password`.

---

## 5. Fora de escopo

- Confirmação de e-mail
- Autenticação (login, JWT)
- Atualização de perfil
- Exclusão de usuário
- Qualquer outro endpoint além de /auth/register

