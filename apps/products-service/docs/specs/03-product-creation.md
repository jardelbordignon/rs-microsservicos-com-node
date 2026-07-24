# Spec: Criação de Produto no products-service

## Visão geral

Esta spec define a funcionalidade de criação de produtos no `products-service`, utilizando autenticação JWT já existente no serviço. O produto deve ser associado automaticamente ao usuário autenticado, usando o `id` presente em `req.user`, e apenas usuários com perfil `seller` podem realizar essa operação.

| Item | Valor |
|------|-------|
| Serviço | `products-service` |
| Endpoint | `POST /products` |
| Autenticação | Sim (JWT obrigatório) |
| Perfil permitido | `seller` |

---

## 1. Requisitos funcionais

### 1.1 Módulo de produtos

- Garantir que `ProductsService` e `ProductsController` estejam implementados e registrados no `ProductsModule`.
- O módulo deve continuar responsável apenas pelo domínio de produtos, sem acoplamento com login, registro ou outros domínios.

### 1.2 Endpoint de criação de produto

- Criar o endpoint `POST /products` utilizando o decorator @Endpoint.
- O endpoint deve receber os dados do produto no body da requisição.
- O endpoint deve persistir o novo produto no banco de dados.
- Em caso de sucesso, deve retornar `201 Created`.

### 1.3 Associação automática com o vendedor autenticado

- O campo `sellerId` não deve ser aceito no body da requisição.
- O `sellerId` do produto deve ser definido automaticamente com base em `req.user.id`.
- O produto criado deve ficar vinculado ao usuário autenticado que realizou a requisição.

### 1.4 Regra de autorização por papel

- Antes de criar o produto, o serviço deve verificar o valor de `req.user.role`.
- Apenas usuários com role `seller` podem criar produtos.
- Se o usuário autenticado possuir role diferente de `seller`, a requisição deve retornar `403 Forbidden`.
- Não implementar `RoleGuard`; essa validação deve ficar na camada de controller e/ou service conforme o design do serviço.

### 1.5 Campos automáticos de criação

- O campo `isActive` deve ser definido automaticamente como `true` no momento da criação.
- Os campos `createdAt` e `updatedAt` devem continuar sendo gerenciados automaticamente pela entidade e pelo banco conforme o comportamento já definido no serviço.

### 1.6 Validação de dados de entrada

- Validar os dados recebidos no payload de criação.
- A validação deve retornar mensagens de erro claras para campos ausentes, formatos inválidos e valores fora das regras definidas.
- O payload não deve aceitar propriedades extras não previstas no DTO.

---

## 2. Estrutura de dados

### 2.1 Payload de entrada (DTO de criação)

O DTO de criação não deve conter `sellerId`.

| Campo | Tipo | Obrigatório | Regras | Descrição |
|-------|------|-------------|--------|-----------|
| `name` | string | Sim | máximo 255 caracteres | Nome do produto |
| `description` | string | Sim | texto livre | Descrição do produto |
| `price` | decimal | Sim | mínimo 0.01, até 2 casas decimais | Preço do produto |
| `stock` | inteiro | Sim | mínimo 0 | Quantidade em estoque |

### 2.2 Campos definidos fora do body

| Campo | Origem | Regra |
|-------|--------|-------|
| `sellerId` | `req.user.id` | Definido automaticamente com base no token JWT |
| `isActive` | aplicação | Definido automaticamente como `true` |

### 2.3 Resposta de sucesso (201 Created)

A resposta de sucesso deve representar o produto criado, contendo os campos persistidos no banco:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do produto |
| `name` | string | Nome do produto |
| `description` | string | Descrição do produto |
| `price` | decimal | Preço do produto |
| `stock` | inteiro | Quantidade em estoque |
| `sellerId` | UUID | ID do vendedor autenticado |
| `isActive` | boolean | Status de ativação do produto |
| `createdAt` | timestamp | Data/hora de criação |
| `updatedAt` | timestamp | Data/hora da última atualização |

---

## 3. Respostas esperadas

- **201 Created**: produto criado com sucesso.
- **400 Bad Request**: payload inválido, campos obrigatórios ausentes, tipos inválidos, número decimal inválido ou valores fora das restrições.
- **401 Unauthorized**: ausência de token, token inválido ou token expirado.
- **403 Forbidden**: usuário autenticado não possui role `seller`.

---

## 4. Fluxo esperado de criação

1. Receber requisição `POST /products`.
2. Validar autenticação JWT via guard global.
3. Ler `req.user.id` e `req.user.role`.
4. Validar se o usuário autenticado possui role `seller`.
5. Validar os dados de entrada do produto.
6. Montar o produto a ser persistido usando:
   - dados do body;
   - `sellerId` obtido do token;
   - `isActive = true`.
7. Persistir o produto no banco.
8. Retornar `201 Created` com os dados do produto criado.

---

## 5. Critérios de aceite

### Endpoint e integração

- [ ] **CA-01** — Existe um endpoint `POST /products` exposto pelo `ProductsController`.
- [ ] **CA-02** — `ProductsController` e `ProductsService` estão registrados no `ProductsModule`.
- [ ] **CA-03** — O endpoint utiliza a autenticação JWT já existente no `products-service`.

### Autorização

- [ ] **CA-04** — Requisição sem token retorna `401 Unauthorized`.
- [ ] **CA-05** — Requisição com token inválido ou expirado retorna `401 Unauthorized`.
- [ ] **CA-06** — Usuário autenticado com role `buyer` recebe `403 Forbidden`.
- [ ] **CA-07** — Usuário autenticado com role `seller` pode criar produto com sucesso.

### Regras de criação

- [ ] **CA-08** — O campo `sellerId` não é recebido do body e é definido com base em `req.user.id`.
- [ ] **CA-09** — O campo `isActive` é definido automaticamente como `true` na criação.
- [ ] **CA-10** — O produto é persistido no banco com `sellerId` igual ao ID do usuário autenticado.

### Validação de entrada

- [ ] **CA-11** — Requisição sem `name` retorna `400 Bad Request`.
- [ ] **CA-12** — Requisição com `name` acima de 255 caracteres retorna `400 Bad Request`.
- [ ] **CA-13** — Requisição sem `description` retorna `400 Bad Request`.
- [ ] **CA-14** — Requisição sem `price` retorna `400 Bad Request`.
- [ ] **CA-15** — Requisição com `price` menor que `0.01` retorna `400 Bad Request`.
- [ ] **CA-16** — Requisição com `price` inválido para formato decimal de até 2 casas retorna `400 Bad Request`.
- [ ] **CA-17** — Requisição sem `stock` retorna `400 Bad Request`.
- [ ] **CA-18** — Requisição com `stock` menor que `0` retorna `400 Bad Request`.
- [ ] **CA-19** — Requisição com `stock` não inteiro retorna `400 Bad Request`.
- [ ] **CA-20** — Mensagens de erro de validação são claras e identificam o problema do payload.
- [ ] **CA-21** — Propriedades extras não previstas no DTO são rejeitadas conforme a configuração global de validação.

### Resposta

- [ ] **CA-22** — Em sucesso, a API retorna `201 Created`.
- [ ] **CA-23** — Em sucesso, a resposta contém os dados do produto persistido, incluindo `id`, `sellerId`, `isActive`, `createdAt` e `updatedAt`.

---

## 6. Fora de escopo

Esta spec não inclui:

- endpoints de consulta de produtos;
- atualização de produtos;
- exclusão de produtos;
- upload de imagens;
- categorias;
- paginação, filtros ou busca;
- validação de ownership para outras operações;
- qualquer fluxo de autenticação além do uso do JWT já existente.
