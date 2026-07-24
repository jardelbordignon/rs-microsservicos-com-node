# Spec: Endpoints de Consulta de Usuários

## Visão geral

Implementar os endpoints essenciais de consulta de usuários no marketplace, utilizando a autenticação JWT já existente no `users-service`.

| Item | Valor |
|------|-------|
| Serviço | `users-service` |
| Endpoints | `GET /users/profile`, `GET /users/sellers`, `GET /users/:id` |
| Autenticação | Sim (JWT obrigatório, tratado pelo `JwtAuthGuard` global) |

---

## 1. Requisitos funcionais

### 1.1 Endpoint `GET /users/profile`

- Deve retornar os dados completos do usuário autenticado.
- Deve usar o identificador disponível em `req.user.id` para consultar os dados atualizados no banco de dados.
- A resposta nunca deve conter o campo `password`.
- Deve retornar status `200 OK` em caso de sucesso.

### 1.2 Endpoint `GET /users/sellers`

- Deve retornar uma lista de usuários com `role = "seller"` e `status = "active"`.
- Este endpoint será consumido pelo frontend e pelo `products-service` para listagem de vendedores.
- A resposta nunca deve conter o campo `password`.
- Deve retornar status `200 OK` em caso de sucesso.

### 1.3 Endpoint `GET /users/:id`

- Deve retornar os dados de um usuário específico a partir do ID informado na rota.
- O identificador deve ser tratado como UUID.
- Se o usuário não existir, deve retornar `404 Not Found`.
- A resposta nunca deve conter o campo `password`.
- Deve retornar status `200 OK` em caso de sucesso.

### 1.4 Regras de roteamento

- As rotas estáticas `GET /users/profile` e `GET /users/sellers` devem ser declaradas antes da rota dinâmica `GET /users/:id`.
- A ordem de declaração deve evitar conflito entre rotas estáticas e a captura indevida do segmento da URL pela rota dinâmica.

### 1.5 Estrutura de módulos e responsabilidades

- O `UsersController` deve expor os três endpoints de consulta.
- O `UsersService` deve centralizar os métodos de consulta ao banco de dados.
- O `UsersModule` deve registrar os componentes necessários para disponibilizar os endpoints.

### 1.6 Regras de autenticação

- Todos os endpoints desta spec devem permanecer protegidos pelo `JwtAuthGuard` global.
- O acesso depende de token JWT válido.
- O usuário autenticado estará disponível em `req.user` com `id`, `email` e `role`.

---

## 2. Estrutura de dados

### 2.1 Resposta de sucesso para usuário único

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do usuário |
| `email` | string | E-mail do usuário |
| `firstName` | string | Primeiro nome |
| `lastName` | string | Sobrenome |
| `role` | string | Papel do usuário (`seller` ou `buyer`) |
| `status` | string | Situação da conta |
| `createdAt` | timestamp | Data/hora de criação |
| `updatedAt` | timestamp | Data/hora da última atualização |

### 2.2 Resposta de sucesso para lista de sellers

- Deve retornar uma lista de objetos de usuário.
- Cada item da lista deve seguir a mesma estrutura da resposta de usuário único.
- Nenhum item da lista deve conter o campo `password`.

### 2.3 Resposta de erro

| Status | Quando ocorre |
|--------|---------------|
| `401 Unauthorized` | Token ausente, inválido ou expirado |
| `404 Not Found` | Usuário não encontrado no `GET /users/:id` |

---

## 3. Fluxos esperados

### 3.1 Fluxo do `GET /users/profile`

1. Requisição autenticada chega ao serviço.
2. O `JwtAuthGuard` valida o token automaticamente.
3. O endpoint utiliza `req.user.id` para consultar o usuário no banco.
4. O serviço retorna os dados atualizados do usuário.
5. A resposta é devolvida sem o campo `password`.

### 3.2 Fluxo do `GET /users/sellers`

1. Requisição autenticada chega ao serviço.
2. O `JwtAuthGuard` valida o token automaticamente.
3. O serviço consulta todos os usuários com `role = "seller"` e `status = "active"`.
4. O endpoint retorna a lista de vendedores sem o campo `password`.

### 3.3 Fluxo do `GET /users/:id`

1. Requisição autenticada chega ao serviço.
2. O `JwtAuthGuard` valida o token automaticamente.
3. O endpoint consulta o usuário pelo ID informado.
4. Se o usuário existir, retorna os dados sem o campo `password`.
5. Se o usuário não existir, retorna `404 Not Found`.

---

## 4. Respostas esperadas

### 4.1 `GET /users/profile`

- `200 OK`: retorna os dados do usuário autenticado sem `password`
- `401 Unauthorized`: token ausente ou inválido

### 4.2 `GET /users/sellers`

- `200 OK`: retorna a lista de sellers ativos sem `password`
- `401 Unauthorized`: token ausente ou inválido

### 4.3 `GET /users/:id`

- `200 OK`: retorna os dados do usuário encontrado sem `password`
- `401 Unauthorized`: token ausente ou inválido
- `404 Not Found`: usuário não encontrado

---

## 5. Critérios de aceite

### Endpoint `GET /users/profile`
- [ ] **CA-01** — Requisição autenticada retorna `200 OK` com os dados atualizados do usuário logado.
- [ ] **CA-02** — O endpoint usa o ID presente em `req.user.id` para buscar os dados no banco.
- [ ] **CA-03** — A resposta não contém o campo `password`.

### Endpoint `GET /users/sellers`
- [ ] **CA-04** — Requisição autenticada retorna `200 OK` com uma lista de sellers ativos.
- [ ] **CA-05** — Apenas usuários com `role = "seller"` e `status = "active"` são retornados.
- [ ] **CA-06** — Nenhum item da lista contém o campo `password`.

### Endpoint `GET /users/:id`
- [ ] **CA-07** — Requisição autenticada com ID existente retorna `200 OK`.
- [ ] **CA-08** — Requisição com ID inexistente retorna `404 Not Found`.
- [ ] **CA-09** — A resposta não contém o campo `password`.

### Autenticação e roteamento
- [ ] **CA-10** — Os três endpoints exigem token JWT válido via `JwtAuthGuard` global.
- [ ] **CA-11** — Requisições sem token ou com token inválido retornam `401 Unauthorized`.
- [ ] **CA-12** — As rotas `profile` e `sellers` são declaradas antes de `:id`.

### Estrutura do módulo
- [ ] **CA-13** — O `UsersController` expõe os três endpoints definidos nesta spec.
- [ ] **CA-14** — O `UsersService` contém os métodos de consulta necessários.
- [ ] **CA-15** — O `UsersModule` registra os componentes necessários para disponibilizar os endpoints.

---

## 6. Fora de escopo

- CRUD completo de usuários
- Atualização de usuário
- Exclusão de usuário
- Paginação, filtros avançados ou ordenação customizada
- Alteração de senha
- Qualquer endpoint além de `GET /users/profile`, `GET /users/sellers` e `GET /users/:id`
